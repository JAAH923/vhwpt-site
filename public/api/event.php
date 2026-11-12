<?php
// vhwpt.com: the event sign-up's endpoint (/api/event.php), for the iPad page at /event.
// Written beside inquiry.php on purpose, not folded into it: a screen handed around a booth
// shares one network address and fills the form quickly, which inquiry.php's "5 an hour" limit
// and "filled too fast" check would silently throw away.
//
// Validates the sign-up, keeps a private copy outside the web root FIRST (so nothing is lost if
// the email fails), then emails Bruce through Resend. It uses the same settings file as the
// booking form, ~/private/vhwpt-contact.php (resend_key, from, to). No CAPTCHA on purpose: it would
// slow the hand-off, and the page is unlisted. The guards are a hidden field bots fill in, and
// a generous per-address limit. The sign-up counts as saved if the private copy or the email
// worked, so a visitor is never shown an error for a problem only Bruce can fix; a line with
// "emailed": false in vhwpt-event-signups.jsonl means the email did not go out.
//
// The role and topic ids below mirror src/components/EventSignup.astro; change them together.
// The people at these events are facility owners and other therapists, so the form asks who they
// are and what they would like to talk about, with no free-text box: a sign-up carries no patient
// or resident details (T-883).
declare(strict_types=1);

header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Content-Type: application/json; charset=utf-8');

const CONTACT = 'call 1-954-299-6536 or email info@vhwpt.com';
const PER_HOUR = 90;   // sign-ups per address per hour; a whole booth shares one address

const ROLES = [
  'facility'  => 'Owns or runs a facility',
  'therapist' => 'Therapist or therapy assistant',
  'other'     => 'Something else',
];
const TOPICS = [
  'facility-pt'       => 'Physical therapy for their residents or patients',
  'facility-wellness' => 'Wellness and fitness for their residents',
  'work'              => 'Working with Bruce',
  'refer'             => 'Referring patients to Bruce',
  'connect'           => 'Just connecting',
];

// The private folder sits beside the web root (~/private next to ~/public_html). Look two and
// three levels up, so the site can live in public_html or in a folder inside it.
$private = dirname(__DIR__, 2) . '/private';
foreach ([2, 3] as $up) {
  if (is_file(dirname(__DIR__, $up) . '/private/vhwpt-contact.php')) { $private = dirname(__DIR__, $up) . '/private'; break; }
}

function finish(bool $ok, string $msg, int $code): void {
  http_response_code($code);
  echo json_encode(['ok' => $ok, 'error' => $msg]);
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
  finish(false, 'POST only', 405);
}

$in = json_decode((string) file_get_contents('php://input'), true);
if (!is_array($in)) $in = $_POST;

// Bots: a hidden field people never see. A quiet "ok" so they learn nothing.
if (clean($in['website'] ?? '', 200) !== '') finish(true, '', 200);

// At most PER_HOUR sign-ups an hour from one address.
$ip   = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rlf  = sys_get_temp_dir() . '/vhwpt-event-' . hash('sha256', $ip);
$now  = time();
$hits = array_filter(array_map('intval', is_file($rlf) ? (array) json_decode((string) file_get_contents($rlf), true) : []),
                     fn($t) => $t > $now - 3600);
if (count($hits) >= PER_HOUR) finish(false, 'Too many sign-ups from here in the last hour. Please ask Bruce to take your details, or ' . CONTACT . '.', 429);
$hits[] = $now;
@file_put_contents($rlf, json_encode(array_values($hits)), LOCK_EX);

$role   = (is_string($in['role'] ?? null) && isset(ROLES[$in['role']])) ? ROLES[$in['role']] : '';
$org    = oneLine(clean($in['org'] ?? '', 120));
$name   = oneLine(clean($in['name'] ?? '', 100));
$email  = filter_var(trim((string) ($in['email'] ?? '')), FILTER_VALIDATE_EMAIL) ?: '';
$phone  = oneLine(clean($in['phone'] ?? '', 30));
$phoneOk = strlen(preg_replace('/\D/', '', $phone) ?? '') >= 10;
$consent = ($in['consent'] ?? false) === true;
$event  = substr(preg_replace('/[^a-z0-9-]/', '', strtolower(is_string($in['event'] ?? null) ? $in['event'] : '')) ?? '', 0, 40);
$chosen = [];
foreach ((array) ($in['topics'] ?? []) as $t) {
  $l = (is_string($t) && isset(TOPICS[$t])) ? TOPICS[$t] : '';
  if ($l !== '' && !in_array($l, $chosen, true)) $chosen[] = $l;
}

if ($role === '' || $name === '' || ($email === '' && !$phoneOk) || !$consent) {
  finish(false, 'A few answers are missing. Please check who you are, your name, a phone number or email, and the OK to be contacted.', 400);
}

$rows = [
  'Name'          => $name,
  'Facility or practice' => $org !== '' ? $org : '(not given)',
  'Is'            => $role,
  'Wants to talk about' => $chosen ? implode(', ', $chosen) : '(not answered)',
  'Phone'         => $phone !== '' ? $phone : '(not given)',
  'Email'         => $email !== '' ? $email : '(not given)',
  'Event'         => $event !== '' ? $event : '(not tagged)',
  'OK to contact' => 'Yes, by phone, text or email',
];

// Keep a private copy first.
if (!is_dir($private)) @mkdir($private, 0700, true);
$log = $private . '/vhwpt-event-signups.jsonl';
$entry = ['at' => gmdate('c'), 'answers' => $rows, 'emailed' => null];

$subject = 'Event sign-up: ' . $name . ($org !== '' ? ', ' . $org : '') . ' (' . $role . ')' . ($event !== '' ? ' [' . $event . ']' : '');
$replyHint = $email !== '' ? 'Reply to this email to answer ' . $name . ' directly.' : $name . ' left no email; call them back.';
$text = "A new sign-up from the event page on vhwpt.com. $replyHint\n\n";
$html = '<div style="font-family:-apple-system,BlinkMacSystemFont,Helvetica,Arial,sans-serif;color:#18181b;line-height:1.5;font-size:15px">'
      . '<p style="margin:0 0 16px;color:#52525b">A new sign-up from the event page on vhwpt.com. ' . htmlspecialchars($replyHint) . '</p>';
foreach ($rows as $k => $v) {
  $text .= $k . ":\n" . $v . "\n\n";
  $html .= '<p style="margin:0 0 4px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#52525b">' . htmlspecialchars($k) . '</p>'
         . '<p style="margin:0 0 16px;white-space:pre-wrap">' . htmlspecialchars($v) . '</p>';
}
$html .= '</div>';

$cfgFile = $private . '/vhwpt-contact.php';
$cfg = is_file($cfgFile) ? require $cfgFile : null;
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
$saved = @file_put_contents($log, json_encode($entry, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n", FILE_APPEND | LOCK_EX) !== false;
if ($new && $saved) @chmod($log, 0600);

if (!$saved && !$sent) finish(false, 'That didn’t go through. Please ask Bruce to take your details, or ' . CONTACT . '.', 502);
finish(true, '', 200);
