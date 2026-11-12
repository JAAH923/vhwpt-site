<?php
// vhwpt.com: the event sign-up's endpoint (/api/event.php), for the iPad pages /event and /event2.
// Written beside inquiry.php on purpose, not folded into it: a screen handed around a booth
// shares one network address and fills the form quickly, which inquiry.php's "5 an hour" limit
// and "filled too fast" check would silently throw away.
//
// Validates the sign-up, saves it in a small SQLite database outside the web root
// (private/vhwpt-signups.sqlite), emails Bruce through Resend, and appends a backup line to
// private/vhwpt-event-signups.jsonl. The email uses the same settings file as the booking form,
// private/vhwpt-contact.php (resend_key, from, to). The database needs PHP's pdo_sqlite; without
// it the backup file is still written. The sign-up counts as saved if the database, the backup
// file or the email worked, so a visitor is never shown an error for a problem only Bruce can
// fix; a row with emailed = 0 means the email did not go out. No CAPTCHA on purpose: it would
// slow the hand-off, and the pages are unlisted. The guards are a hidden field bots fill in, and
// a generous per-address limit.
//
// Sign-ups from any address other than vhwpt.com (today the test address on Bruce's server) are
// marked test = 1 and get "[TEST]" on the email subject, so they never mix with real ones.
//
// The database is where the sign-ups live. The resend_* columns stay empty until the sign-ups are
// pushed to Resend as contacts (a later step; see deploy/lightsail/README.md).
//
// Two forms post here. /event (src/components/EventSignup.astro) is for facility owners and other
// therapists: it sends a role and topics. /event2 (src/components/EventSignupPeople.astro) is for
// regular people: it sends "form": "people" and the services they are curious about. The ids and
// the consent wording below mirror those components, and the ids mirror the service ids in
// src/data/site.ts and inquiry.php; change them together. Neither form has a free-text box, so a
// sign-up carries no patient or resident details (T-883).
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
];
// The wording of the tick box, kept with each row so we know what each person agreed to.
const CONSENT = [
  'pros'   => 'It’s OK for Bruce to contact me by phone, text or email.',
  'people' => 'It’s OK for Bruce to contact me by phone, text or email about my sign-up.',
];

// One row per sign-up. Times are UTC, ISO 8601.
const DB_SCHEMA = 'CREATE TABLE IF NOT EXISTS signups (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at        TEXT    NOT NULL,
  form              TEXT    NOT NULL,            -- "pros" (/event) or "people" (/event2)
  event             TEXT,                        -- the ?e= tag on the page address
  host              TEXT,                        -- the address it was filled in on
  test              INTEGER NOT NULL DEFAULT 0,  -- 1 when it was not filled in on vhwpt.com
  name              TEXT    NOT NULL,
  organization      TEXT,                        -- facility or practice (/event only)
  role              TEXT,                        -- who they are (/event only)
  topics            TEXT,                        -- JSON list: topics (/event) or services (/event2)
  phone             TEXT,
  email             TEXT,
  consent_text      TEXT    NOT NULL,            -- the wording they ticked
  emailed           INTEGER NOT NULL DEFAULT 0,  -- 1 when the email to Bruce went out
  resend_contact_id TEXT,                        -- set when pushed to Resend
  resend_pushed_at  TEXT,
  resend_error      TEXT
)';

// The private folder sits beside the web root (~/private next to ~/public_html), or beside the
// releases on Bruce's server (/srv/sites/vhwpt/private, with this file in releases/<id>/api). Look
// two and three levels up for a folder that exists. The settings file does not have to be in it
// yet, so sign-ups are saved even before the email is set up.
$private = dirname(__DIR__, 2) . '/private';
foreach ([2, 3] as $up) {
  if (is_dir(dirname(__DIR__, $up) . '/private')) { $private = dirname(__DIR__, $up) . '/private'; break; }
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
function orNull(string $v): ?string { return $v !== '' ? $v : null; }

// Opens the database, creating it and its table on first use. null when SQLite is not there or
// the file cannot be opened; the caller carries on with the backup file.
function db_open(string $dir): ?PDO {
  if (!extension_loaded('pdo_sqlite')) return null;
  $file = $dir . '/vhwpt-signups.sqlite';
  try {
    $new = !is_file($file);
    $db = new PDO('sqlite:' . $file, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $db->exec('PRAGMA busy_timeout = 5000');
    $db->exec(DB_SCHEMA);
    if ($new) @chmod($file, 0600);
    return $db;
  } catch (Throwable $e) {
    error_log('vhwpt event signups db: ' . $e->getMessage());
    return null;
  }
}

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

$people = ($in['form'] ?? '') === 'people';   // /event2; otherwise the facility-owner and therapist form
$role   = (is_string($in['role'] ?? null) && isset(ROLES[$in['role']])) ? ROLES[$in['role']] : '';
$org    = oneLine(clean($in['org'] ?? '', 120));
$name   = oneLine(clean($in['name'] ?? '', 100));
$email  = filter_var(trim((string) ($in['email'] ?? '')), FILTER_VALIDATE_EMAIL) ?: '';
$phone  = oneLine(clean($in['phone'] ?? '', 30));
$phoneOk = strlen(preg_replace('/\D/', '', $phone) ?? '') >= 10;
$consent = ($in['consent'] ?? false) === true;
$event  = substr(preg_replace('/[^a-z0-9-]/', '', strtolower(is_string($in['event'] ?? null) ? $in['event'] : '')) ?? '', 0, 40);
$chosen = [];
foreach ((array) ($in[$people ? 'interests' : 'topics'] ?? []) as $t) {
  $map = $people ? SERVICES : TOPICS;
  $l = (is_string($t) && isset($map[$t])) ? $map[$t] : '';
  if ($l !== '' && !in_array($l, $chosen, true)) $chosen[] = $l;
}

if ((!$people && $role === '') || $name === '' || ($email === '' && !$phoneOk) || !$consent) {
  finish(false, $people
    ? 'A few answers are missing. Please check your name, a phone number or email, and the OK to be contacted.'
    : 'A few answers are missing. Please check who you are, your name, a phone number or email, and the OK to be contacted.', 400);
}

// Real sign-ups come from vhwpt.com; anything else (the test address on Bruce's server) is a test.
$host = strtolower(preg_replace('/:\d+$/', '', (string) ($_SERVER['HTTP_HOST'] ?? '')) ?? '');
$test = !preg_match('/(^|\.)vhwpt\.com$/', $host);

$rows = $people ? [
  'Name'          => $name,
  'Phone'         => $phone !== '' ? $phone : '(not given)',
  'Email'         => $email !== '' ? $email : '(not given)',
  'Curious about' => $chosen ? implode(', ', $chosen) : '(not answered)',
  'Event'         => $event !== '' ? $event : '(not tagged)',
  'OK to contact' => 'Yes, by phone, text or email',
] : [
  'Name'          => $name,
  'Facility or practice' => $org !== '' ? $org : '(not given)',
  'Is'            => $role,
  'Wants to talk about' => $chosen ? implode(', ', $chosen) : '(not answered)',
  'Phone'         => $phone !== '' ? $phone : '(not given)',
  'Email'         => $email !== '' ? $email : '(not given)',
  'Event'         => $event !== '' ? $event : '(not tagged)',
  'OK to contact' => 'Yes, by phone, text or email',
];
if ($test) $rows['Test'] = 'Filled in on ' . ($host !== '' ? $host : 'an unknown address') . ', not vhwpt.com';

// Save first, so the sign-up survives even if the email does not go out.
if (!is_dir($private)) @mkdir($private, 0700, true);
$db = db_open($private);
$dbId = null;
if ($db) {
  try {
    $st = $db->prepare('INSERT INTO signups (created_at, form, event, host, test, name, organization, role, topics, phone, email, consent_text)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $st->execute([
      gmdate('c'), $people ? 'people' : 'pros', orNull($event), orNull($host), $test ? 1 : 0, $name,
      $people ? null : orNull($org), $people ? null : $role,
      json_encode($chosen, JSON_UNESCAPED_UNICODE), orNull($phone), orNull($email), CONSENT[$people ? 'people' : 'pros'],
    ]);
    $dbId = (int) $db->lastInsertId();
  } catch (Throwable $e) {
    error_log('vhwpt event signups insert: ' . $e->getMessage());
  }
}

$subject = ($test ? '[TEST] ' : '') . 'Event sign-up: ' . $name . ($people ? '' : ($org !== '' ? ', ' . $org : '') . ' (' . $role . ')') . ($event !== '' ? ' [' . $event . ']' : '');
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
if ($sent && $db && $dbId !== null) {
  try { $db->prepare('UPDATE signups SET emailed = 1 WHERE id = ?')->execute([$dbId]); }
  catch (Throwable $e) { error_log('vhwpt event signups update: ' . $e->getMessage()); }
}

// The backup file: one line per sign-up, always written, in case the database is unavailable.
$log = $private . '/vhwpt-event-signups.jsonl';
$entry = ['at' => gmdate('c'), 'form' => $people ? 'people' : 'pros', 'host' => $host, 'test' => $test, 'answers' => $rows, 'emailed' => $sent, 'db_id' => $dbId];
$new = !is_file($log);
$filed = @file_put_contents($log, json_encode($entry, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n", FILE_APPEND | LOCK_EX) !== false;
if ($new && $filed) @chmod($log, 0600);

if ($dbId === null && !$filed && !$sent) finish(false, 'That didn’t go through. Please ask Bruce to take your details, or ' . CONTACT . '.', 502);
finish(true, '', 200);
