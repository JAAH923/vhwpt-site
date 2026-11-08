<?php
// vhwpt.com: the booking form's endpoint (/api/inquiry.php), ported from donovanhunter.com's.
// It is not called contact.php because cPanel firewalls often challenge that name.
//
// Validates the answers, emails them to Bruce through Resend (from a verified sending domain,
// reply-to the visitor when they gave an email), and keeps a private copy of every request
// outside the web root, so nothing is lost if the email fails. Settings live in
// ~/private/vhwpt-contact.php, never in the web root:
//   <?php return ['resend_key' => '...', 'from' => 'Valencia Health & Wellness <book@verified.domain>',
//                 'to' => 'info@vhwpt.com', 'turnstile_secret' => '...'];
// With a Turnstile secret set, every request must carry a valid Cloudflare Turnstile token.
//
// The option ids below mirror src/components/BookingForm.astro and the service ids in
// src/data/site.ts; change them together. The form asks which service, not what is wrong,
// so a request should carry no medical details (T-883).
declare(strict_types=1);

header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

const CONTACT = 'call 1-954-299-6536 or email info@vhwpt.com';

const BOOKINGS = [
  'pt'       => 'PT evaluation',
  'wellness' => 'Wellness screening',
  'unsure'   => 'Not sure yet',
];
const SERVICES = [
  'rehab'    => 'Rehabilitation & Recovery',
  'balance'  => 'Balance & Fall Prevention',
  'senior'   => 'Senior Fitness',
  'training' => 'Personal Training',
  'weight'   => 'Weight Loss & Nutrition',
  'youth'    => 'Youth Sports Conditioning',
  'prenatal' => 'Pre & Postnatal Fitness',
  'virtual'  => 'Virtual Training',
  'holistic' => 'Holistic & Corporate Wellness',
  'unsure'   => 'Not sure yet',
];
const PLACES = [
  'home'     => 'At home',
  'facility' => 'At a care facility',
  'video'    => 'Over video',
];
const TIMINGS = [
  'week'      => 'This week',
  'weeks'     => 'In the next few weeks',
  'exploring' => 'Just looking into it',
];
const SOURCES = [
  'search' => 'A search engine',
  'ai'     => 'An AI assistant (ChatGPT, Claude, Gemini)',
  'doctor' => 'A doctor or other referral',
  'friend' => 'A friend or family member',
  'social' => 'Social media',
  'other'  => 'Something else',
];

// The private folder sits beside the web root (~/private next to ~/public_html). Look two and
// three levels up, so the site can live in public_html or in a folder inside it.
$private = dirname(__DIR__, 2) . '/private';
foreach ([2, 3] as $up) {
  if (is_file(dirname(__DIR__, $up) . '/private/vhwpt-contact.php')) { $private = dirname(__DIR__, $up) . '/private'; break; }
}
$isJson = stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false;

function finish(bool $ok, string $msg, int $code, bool $isJson): void {
  if ($isJson) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code($code);
    echo json_encode(['ok' => $ok, 'error' => $msg]);
  } else {                                          // a plain form post lands back on /book
    header('Location: /book?sent=' . ($ok ? '1' : '0') . '#call', true, 303);
  }
  exit;
}
function clean($v, int $max): string {
  if (!is_string($v)) return '';
  $v = preg_replace('/[^\P{C}\n]/u', '', $v) ?? '';  // drop control characters, keep line breaks
  return trim(mb_substr($v, 0, $max));
}
function oneLine(string $v): string { return trim(preg_replace('/\s+/u', ' ', $v) ?? ''); }

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  header('Allow: POST');
  header('Content-Type: application/json; charset=utf-8');
  http_response_code(405);
  echo json_encode(['ok' => false, 'error' => 'POST only']);
  exit;
}

$in = $isJson ? (json_decode((string) file_get_contents('php://input'), true) ?: []) : $_POST;

// Bots: a hidden field people never see, and a form filled faster than a person can read it.
// Both get a quiet "ok" so they learn nothing.
if (clean($in['website'] ?? '', 200) !== '') finish(true, '', 200, $isJson);
if (isset($in['t']) && (int) $in['t'] > 0 && (int) $in['t'] < 4000) finish(true, '', 200, $isJson);

// At most 5 requests an hour from one address.
$ip   = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rlf  = sys_get_temp_dir() . '/vhwpt-contact-' . hash('sha256', $ip);
$now  = time();
$hits = array_filter(array_map('intval', is_file($rlf) ? (array) json_decode((string) file_get_contents($rlf), true) : []),
                     fn($t) => $t > $now - 3600);
if (count($hits) >= 5) finish(false, 'Too many requests from here in the last hour. Please ' . CONTACT . '.', 429, $isJson);
$hits[] = $now;
@file_put_contents($rlf, json_encode(array_values($hits)), LOCK_EX);

// CAPTCHA: Cloudflare Turnstile. Required whenever a secret is configured.
$cfgFile = $private . '/vhwpt-contact.php';
$cfg = is_file($cfgFile) ? require $cfgFile : null;
if (is_array($cfg) && !empty($cfg['turnstile_secret'])) {
  $token = is_string($in['turnstile'] ?? null) ? $in['turnstile'] : '';
  $ok = false;
  if ($token !== '') {
    $ch = curl_init('https://challenges.cloudflare.com/turnstile/v0/siteverify');
    curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10,
      CURLOPT_POSTFIELDS => http_build_query(['secret' => $cfg['turnstile_secret'], 'response' => $token, 'remoteip' => $ip])]);
    $res = json_decode((string) curl_exec($ch), true);
    $ok = is_array($res) && !empty($res['success']);
  }
  if (!$ok) finish(false, 'Please complete the quick check and send again.', 403, $isJson);
}

$pick = fn(array $map, $v) => (is_string($v) && isset($map[$v])) ? $map[$v] : '';
$booking = $pick(BOOKINGS, $in['booking'] ?? null);
$chosen = [];
foreach ((array) ($in['services'] ?? []) as $s) { $l = $pick(SERVICES, $s); if ($l !== '' && !in_array($l, $chosen, true)) $chosen[] = $l; }
$place  = $pick(PLACES, $in['place'] ?? null);
$timing = $pick(TIMINGS, $in['timing'] ?? null);
$heard  = $pick(SOURCES, $in['heard'] ?? null);
$note   = clean($in['note'] ?? '', 2000);
$name   = oneLine(clean($in['name'] ?? '', 100));
$email  = filter_var(trim((string) ($in['email'] ?? '')), FILTER_VALIDATE_EMAIL) ?: '';
$phone  = oneLine(clean($in['phone'] ?? '', 30));
$city   = oneLine(clean($in['city'] ?? '', 80));
$phoneOk = strlen(preg_replace('/\D/', '', $phone) ?? '') >= 10;

if ($booking === '' || $name === '' || ($email === '' && !$phoneOk)) {
  finish(false, 'A few answers are missing. Please check what you are booking, your name, and a phone number or email.', 400, $isJson);
}

$rows = [
  'Booking'        => $booking,
  'Help with'      => $chosen ? implode(', ', $chosen) : '(not answered)',
  'Where'          => $place !== '' ? $place : '(not answered)',
  'City'           => $city !== '' ? $city : '(not given)',
  'Wants to start' => $timing !== '' ? $timing : '(not answered)',
  'Heard about Bruce from' => $heard !== '' ? $heard : '(not answered)',
  'Note'           => $note !== '' ? $note : '(none)',
  'Name'           => $name,
  'Phone'          => $phone !== '' ? $phone : '(not given)',
  'Email'          => $email !== '' ? $email : '(not given)',
];

// Keep a private copy first, so a request survives even if the email does not go out.
if (!is_dir($private)) @mkdir($private, 0700, true);
$log = $private . '/vhwpt-inquiries.jsonl';
$entry = ['at' => gmdate('c'), 'answers' => $rows, 'emailed' => null];

$subject = 'Booking request from ' . $name . ': ' . $booking;
$replyHint = $email !== '' ? 'Reply to this email to answer ' . $name . ' directly.' : $name . ' left no email; call them back.';
$text = "A new booking request from vhwpt.com. $replyHint\n\n";
$html = '<div style="font-family:-apple-system,BlinkMacSystemFont,Helvetica,Arial,sans-serif;color:#18181b;line-height:1.5;font-size:15px">'
      . '<p style="margin:0 0 16px;color:#52525b">A new booking request from vhwpt.com. ' . htmlspecialchars($replyHint) . '</p>';
foreach ($rows as $k => $v) {
  $text .= $k . ":\n" . $v . "\n\n";
  $html .= '<p style="margin:0 0 4px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#52525b">' . htmlspecialchars($k) . '</p>'
         . '<p style="margin:0 0 16px;white-space:pre-wrap">' . htmlspecialchars($v) . '</p>';
}
$html .= '</div>';

$sent = false;
if (is_array($cfg) && !empty($cfg['resend_key']) && !empty($cfg['from']) && !empty($cfg['to'])) {
  $mail = ['from' => $cfg['from'], 'to' => [$cfg['to']], 'subject' => $subject, 'text' => $text, 'html' => $html];
  if ($email !== '') $mail['reply_to'] = $email;
  $ch = curl_init('https://api.resend.com/emails');
  curl_setopt_array($ch, [
    CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15,
    CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $cfg['resend_key'], 'Content-Type: application/json'],
    CURLOPT_POSTFIELDS => json_encode($mail),
  ]);
  curl_exec($ch);
  $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
  $sent = $code >= 200 && $code < 300;
}
$entry['emailed'] = $sent;
$new = !is_file($log);
@file_put_contents($log, json_encode($entry, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n", FILE_APPEND | LOCK_EX);
if ($new) @chmod($log, 0600);

if (!$sent) finish(false, "Your answers were saved, but the email didn’t go out. Please also " . CONTACT . '.', 502, $isJson);
finish(true, '', 200, $isJson);
