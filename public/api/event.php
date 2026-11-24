<?php
// vhwpt.com: the event sign-up's endpoint (/api/event.php), for the iPad pages /signup/partners and /signup/clients.
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
// The database is where the sign-ups live. A second, optional tick box asks to be emailed news and
// event invites. Only those sign-ups, and only with an email, become Resend contacts: after the
// visitor has their answer, each one is added to a segment per form (SEGMENTS below; test
// sign-ups go to their own), and the contact id or the error lands in the resend_* columns. The
// first tick box only covers Bruce contacting them, so it never adds anyone to a list.
//
// Class sign-ups (/events/*, form "class") are the exception: their contact OK covers email "about
// these classes", so everyone who gives an email is added to "Class sign-ups · All" (invites to
// future classes), and those who ticked "Count me in" also to a segment for that one event,
// "Class · <event> · Coming" (e.g. "Class · meadows-2026-12-17 · Coming"). Bruce sends reminders
// to that segment as a Resend broadcast.
//
// Two forms post here. /signup/partners (src/components/EventSignup.astro) is for facility owners and other
// therapists: it sends a role and topics. /signup/clients (src/components/EventSignupPeople.astro) is for
// regular people: it sends "form": "people" and the services they are curious about. The ids and
// the consent wording below mirror those components, and the ids mirror the service ids in
// src/data/site.ts and inquiry.php; change them together. Neither form has a free-text box, so a
// sign-up carries no patient or resident details (T-883).
//
// A third form, /meadows (src/components/EventSignupClass.astro), is the digital copy of Bruce's paper
// sign-up for his class and free fall-risk screening at The Meadows of Crystal Lake. It sends
// "form": "class" and asks what the paper asks and nothing more: the free screening (yes or no),
// whether they are coming to the next class, the classes they are interested in, name, phone,
// address or unit, email, the contact OK, and the participation acknowledgment and release, signed
// by typing their name. The wording they agreed to, the typed signature and the date are kept in
// the details column, so each row stands in for a signed paper sheet.
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
// The classes on the /meadows paper sheet. Mirrored in src/components/EventSignupClass.astro.
const CLASSES = [
  'balance' => 'Balance & Fall Prevention',
  'chair'   => 'Chair Exercise',
  'bone'    => 'Bone Health & Strength',
];
// The wording of the tick box, kept with each row so we know what each person agreed to.
const CONSENT = [
  'pros'   => 'It’s OK for Bruce to contact me by phone, text or email.',
  'people' => 'It’s OK for Bruce to contact me by phone, text or email about my sign-up.',
  'class'  => 'I agree that Valencia Health & Wellness, LLC may contact me by phone or email about these classes, my screening, and general health questions.',
];
// The /meadows participation acknowledgment and release, word for word from the paper sheet.
// Mirrored in src/components/EventSignupClass.astro; change them together.
const WAIVER = 'Participation. I understand that these classes and the screening are wellness and exercise services, not physical therapy treatment, and that taking part does not create a patient relationship. Exercise carries a risk of injury, including falls, muscle strain, and, rarely, a serious medical event. I am taking part voluntarily. I will talk with my doctor about any health concern before I exercise, and I will stop and tell the instructor if I feel pain, dizziness, or unwell. '
             . 'Release. I release Valencia Health & Wellness, LLC and Dr. Bruce Valencia from claims for injury or loss arising from my participation, including claims based on negligence, to the fullest extent Florida law allows.';
const NEWS = 'Also email me news and event invites from Valencia Health & Wellness. Optional; unsubscribe anytime.';
// Resend segments for those who ticked NEWS, by name. Each is created the first time it is needed,
// and its id is kept in private/resend-segments.json.
const SEGMENTS = [
  'pros'   => 'Event sign-ups · Facilities & therapists',
  'people' => 'Event sign-ups · Potential clients',
  'test'   => 'Event sign-ups · Test',
];

// One row per sign-up. Times are UTC, ISO 8601.
const DB_SCHEMA = 'CREATE TABLE IF NOT EXISTS signups (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at        TEXT    NOT NULL,
  form              TEXT    NOT NULL,            -- "pros" (/signup/partners), "people" (/signup/clients) or "class" (/meadows)
  event             TEXT,                        -- the ?e= tag on the page address
  host              TEXT,                        -- the address it was filled in on
  test              INTEGER NOT NULL DEFAULT 0,  -- 1 when it was not filled in on vhwpt.com
  name              TEXT    NOT NULL,
  organization      TEXT,                        -- facility or practice (/signup/partners only)
  role              TEXT,                        -- who they are (/signup/partners only)
  topics            TEXT,                        -- JSON list: topics (/signup/partners), services (/signup/clients) or classes (/meadows)
  phone             TEXT,
  email             TEXT,
  address           TEXT,                        -- address or unit (/meadows only)
  details           TEXT,                        -- JSON (/meadows only): screening, attending, the release they signed, typed signature, date
  consent_text      TEXT    NOT NULL,            -- the wording they ticked
  emailed           INTEGER NOT NULL DEFAULT 0,  -- 1 when the email to Bruce went out
  news_optin        INTEGER NOT NULL DEFAULT 0,  -- 1 when they ticked NEWS and gave an email
  news_text         TEXT,                        -- the NEWS wording they ticked
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
    // Databases made before the news tick box get its columns.
    $cols = array_column($db->query('PRAGMA table_info(signups)')->fetchAll(PDO::FETCH_ASSOC), 'name');
    if (!in_array('news_optin', $cols, true)) $db->exec('ALTER TABLE signups ADD COLUMN news_optin INTEGER NOT NULL DEFAULT 0');
    if (!in_array('news_text', $cols, true))  $db->exec('ALTER TABLE signups ADD COLUMN news_text TEXT');
    // and before /meadows, its two.
    if (!in_array('address', $cols, true))    $db->exec('ALTER TABLE signups ADD COLUMN address TEXT');
    if (!in_array('details', $cols, true))    $db->exec('ALTER TABLE signups ADD COLUMN details TEXT');
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

$kind   = in_array($in['form'] ?? '', ['people', 'class'], true) ? $in['form'] : 'pros';
$people = $kind !== 'pros';   // /signup/clients or /meadows; otherwise the facility-owner and therapist form
$class  = $kind === 'class';  // /meadows: the class and free screening sheet
$role   = (is_string($in['role'] ?? null) && isset(ROLES[$in['role']])) ? ROLES[$in['role']] : '';
$org    = oneLine(clean($in['org'] ?? '', 120));
$name   = oneLine(clean($in['name'] ?? '', 100));
$email  = filter_var(trim((string) ($in['email'] ?? '')), FILTER_VALIDATE_EMAIL) ?: '';
$phone  = oneLine(clean($in['phone'] ?? '', 30));
$phoneOk = strlen(preg_replace('/\D/', '', $phone) ?? '') >= 10;
$consent = ($in['consent'] ?? false) === true;
$news   = ($in['news'] ?? false) === true && $email !== '';   // a list needs an email
$event  = substr(preg_replace('/[^a-z0-9-]/', '', strtolower(is_string($in['event'] ?? null) ? $in['event'] : '')) ?? '', 0, 40);
$address   = $class ? oneLine(clean($in['address'] ?? '', 160)) : '';
$screening = $class && ($in['screening'] ?? false) === true;
$attending = $class && ($in['attending'] ?? false) === true;
$waiver    = $class && ($in['waiver'] ?? false) === true;
$signature = $class ? oneLine(clean($in['signature'] ?? '', 100)) : '';
$classDate = $class ? oneLine(clean($in['class_date'] ?? '', 60)) : '';
$chosen = [];
foreach ((array) ($in[$class ? 'classes' : ($people ? 'interests' : 'topics')] ?? []) as $t) {
  $map = $class ? CLASSES : ($people ? SERVICES : TOPICS);
  $l = (is_string($t) && isset($map[$t])) ? $map[$t] : '';
  if ($l !== '' && !in_array($l, $chosen, true)) $chosen[] = $l;
}

// /meadows: an email that was typed but is not a real address is turned back, not quietly dropped,
// and so is one whose domain cannot receive mail (gmail.con). The DNS check only runs when the
// server can look anything up, so a DNS outage never blocks a sign-up.
if ($class) {
  $typed = trim((string) ($in['email'] ?? ''));
  $domain = strtolower((string) substr(strrchr($typed, '@') ?: '', 1));
  if ($typed !== '' && ($email === '' || ($domain !== '' && !mail_domain_ok($domain)))) {
    finish(false, 'That email address doesn’t look right. Please check it, or leave it empty and give a phone number.', 400);
  }
}
function mail_domain_ok(string $domain): bool {
  if (checkdnsrr($domain, 'MX') || checkdnsrr($domain, 'A')) return true;
  return !(checkdnsrr('gmail.com', 'MX'));   // no DNS on the server at all: let it through
}
if ($class && ($name === '' || ($email === '' && !$phoneOk) || !$consent || !$waiver || $signature === '')) {
  finish(false, 'A few answers are missing. Please check your name, a phone number or email, both tick boxes, and your name as your signature.', 400);
}
if ((!$people && $role === '') || $name === '' || ($email === '' && !$phoneOk) || !$consent) {
  finish(false, $people
    ? 'A few answers are missing. Please check your name, a phone number or email, and the OK to be contacted.'
    : 'A few answers are missing. Please check who you are, your name, a phone number or email, and the OK to be contacted.', 400);
}

// Real sign-ups come from vhwpt.com; anything else (the test address on Bruce's server) is a test.
$host = strtolower(preg_replace('/:\d+$/', '', (string) ($_SERVER['HTTP_HOST'] ?? '')) ?? '');
$test = !preg_match('/(^|\.)vhwpt\.com$/', $host);

$details = null;
if ($class) {
  $details = [
    'screening'  => $screening,
    'attending'  => $attending,
    'class'      => $classDate,
    'release'    => WAIVER,
    'signature'  => $signature,
    'signed_on'  => gmdate('Y-m-d'),
  ];
}
$rows = $class ? [
  'Name'            => $name,
  'Free screening'  => $screening ? 'YES, wants the free fall-risk screening. Please call.' : 'No',
  'Next class'      => $attending ? 'Coming' . ($classDate !== '' ? ': ' . $classDate : '') : 'Not this time',
  'Interested in'   => $chosen ? implode(', ', $chosen) : '(not answered)',
  'Phone'           => $phone !== '' ? $phone : '(not given)',
  'Email'           => $email !== '' ? $email : '(not given)',
  'Address / Unit'  => $address !== '' ? $address : '(not given)',
  'Event'           => $event !== '' ? $event : '(not tagged)',
  'OK to contact'   => 'Yes, by phone or email',
  'Release'         => 'Agreed and signed "' . $signature . '" on ' . gmdate('Y-m-d') . ' (UTC)',
] : ($people ? [
  'Name'          => $name,
  'Phone'         => $phone !== '' ? $phone : '(not given)',
  'Email'         => $email !== '' ? $email : '(not given)',
  'Curious about' => $chosen ? implode(', ', $chosen) : '(not answered)',
  'Event'         => $event !== '' ? $event : '(not tagged)',
  'OK to contact' => 'Yes, by phone, text or email',
  'Email list'    => $news ? 'Yes, news and event invites' : 'No',
] : [
  'Name'          => $name,
  'Facility or practice' => $org !== '' ? $org : '(not given)',
  'Is'            => $role,
  'Wants to talk about' => $chosen ? implode(', ', $chosen) : '(not answered)',
  'Phone'         => $phone !== '' ? $phone : '(not given)',
  'Email'         => $email !== '' ? $email : '(not given)',
  'Event'         => $event !== '' ? $event : '(not tagged)',
  'OK to contact' => 'Yes, by phone, text or email',
  'Email list'    => $news ? 'Yes, news and event invites' : 'No',
]);
if ($test) $rows['Test'] = 'Filled in on ' . ($host !== '' ? $host : 'an unknown address') . ', not vhwpt.com';

// Save first, so the sign-up survives even if the email does not go out.
if (!is_dir($private)) @mkdir($private, 0700, true);
$db = db_open($private);
$dbId = null;
if ($db) {
  try {
    $st = $db->prepare('INSERT INTO signups (created_at, form, event, host, test, name, organization, role, topics, phone, email, address, details, consent_text, news_optin, news_text)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $st->execute([
      gmdate('c'), $kind, orNull($event), orNull($host), $test ? 1 : 0, $name,
      $people ? null : orNull($org), $people ? null : $role,
      json_encode($chosen, JSON_UNESCAPED_UNICODE), orNull($phone), orNull($email),
      orNull($address), $details !== null ? json_encode($details, JSON_UNESCAPED_UNICODE) : null, CONSENT[$kind],
      $news ? 1 : 0, $news ? NEWS : null,
    ]);
    $dbId = (int) $db->lastInsertId();
  } catch (Throwable $e) {
    error_log('vhwpt event signups insert: ' . $e->getMessage());
  }
}

$subject = ($test ? '[TEST] ' : '') . ($class ? 'Class sign-up' . ($screening ? ' + FREE SCREENING' : '') . ': ' . $name . ($event !== '' ? ' [' . $event . ']' : '') : 'Event sign-up: ' . $name . ($people ? '' : ($org !== '' ? ', ' . $org : '') . ' (' . $role . ')') . ($event !== '' ? ' [' . $event . ']' : ''));
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
$entry = ['at' => gmdate('c'), 'form' => $kind, 'host' => $host, 'test' => $test, 'answers' => $rows, 'details' => $details, 'emailed' => $sent, 'db_id' => $dbId];
$new = !is_file($log);
$filed = @file_put_contents($log, json_encode($entry, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n", FILE_APPEND | LOCK_EX) !== false;
if ($new && $filed) @chmod($log, 0600);

if ($dbId === null && !$filed && !$sent) {
  error_log('vhwpt event signups: nothing could be saved. private=' . $private . ' db=' . ($db ? 'open' : 'unavailable')
          . ' file=' . (error_get_last()['message'] ?? 'no error recorded'));
  finish(false, 'That didn’t go through. Please ask Bruce to take your details, or ' . CONTACT . '.', 502);
}
// Which Resend segments this sign-up joins (by key in SEGMENTS, or by full name).
$segments = [];
if ($email !== '') {
  if ($class) {
    $segments[] = $test ? 'test' : 'Class sign-ups · All';
    if ($attending && !$test) $segments[] = 'Class · ' . ($event !== '' ? $event : 'untagged') . ' · Coming';
  } elseif ($news) {
    $segments[] = $test ? 'test' : ($kind === 'pros' ? 'pros' : 'people');
  }
}
if (!$segments || !is_array($cfg) || empty($cfg['resend_key'])) finish(true, '', 200);

// The visitor gets their answer now; the contact is added after, so a slow Resend never holds up
// the next person at the booth.
http_response_code(200);
echo json_encode(['ok' => true, 'error' => '']);
if (function_exists('fastcgi_finish_request')) fastcgi_finish_request();

$contactId = null;
$errs = [];
foreach ($segments as $which) {
  [$cid, $err] = resend_add_contact($cfg['resend_key'], $private, $which, $email, $name);
  if ($cid !== null) $contactId = $cid;
  if ($err !== null) $errs[] = $err;
}
$pushErr = $errs ? implode('; ', $errs) : null;
if ($pushErr !== null) error_log('vhwpt event signups resend: ' . $pushErr);
if ($db && $dbId !== null) {
  try {
    $db->prepare('UPDATE signups SET resend_contact_id = ?, resend_pushed_at = ?, resend_error = ? WHERE id = ?')
       ->execute([$contactId, $contactId !== null ? gmdate('c') : null, $pushErr, $dbId]);
  } catch (Throwable $e) { error_log('vhwpt event signups update: ' . $e->getMessage()); }
}
exit;

// One Resend API call: [HTTP status, decoded body].
function resend(string $key, string $method, string $path, ?array $body = null): array {
  $ch = curl_init('https://api.resend.com' . $path);
  $opts = [CURLOPT_CUSTOMREQUEST => $method, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10,
           CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $key, 'Content-Type: application/json']];
  if ($body !== null) $opts[CURLOPT_POSTFIELDS] = json_encode($body, JSON_UNESCAPED_UNICODE);
  curl_setopt_array($ch, $opts);
  $raw = curl_exec($ch);
  $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
  $j = is_string($raw) ? json_decode($raw, true) : null;
  return [$code, is_array($j) ? $j : []];
}
function ok(int $code): bool { return $code >= 200 && $code < 300; }

// The segment's id, found by name or created, and remembered in private/resend-segments.json.
function resend_segment(string $key, string $private, string $which): ?string {
  $cache = $private . '/resend-segments.json';
  $ids = is_file($cache) ? (array) json_decode((string) file_get_contents($cache), true) : [];
  if (!empty($ids[$which])) return (string) $ids[$which];
  $name = SEGMENTS[$which] ?? $which;
  [$c, $j] = resend($key, 'GET', '/segments');
  $id = null;
  if (ok($c)) foreach ((array) ($j['data'] ?? []) as $sg) if (($sg['name'] ?? '') === $name) { $id = (string) $sg['id']; break; }
  if ($id === null) {
    [$c, $j] = resend($key, 'POST', '/segments', ['name' => $name]);
    if (!ok($c) || empty($j['id'])) return null;
    $id = (string) $j['id'];
  }
  $ids[$which] = $id;
  if (@file_put_contents($cache, json_encode($ids, JSON_UNESCAPED_UNICODE), LOCK_EX) !== false) @chmod($cache, 0600);
  return $id;
}

// Adds the person as a Resend contact in the segment: [contact id, null] or [null, error].
// Someone already in Resend (an earlier sign-up) is added to the segment as they are; their
// unsubscribe choice is left alone.
function resend_add_contact(string $key, string $private, string $which, string $email, string $name): array {
  $seg = resend_segment($key, $private, $which);
  if ($seg === null) return [null, 'could not find or create the segment "' . (SEGMENTS[$which] ?? $which) . '"'];
  $parts = preg_split('/\s+/u', $name, 2) ?: [$name];
  [$c, $j] = resend($key, 'POST', '/contacts', [
    'email' => $email, 'first_name' => $parts[0], 'last_name' => $parts[1] ?? '',
    'unsubscribed' => false, 'segments' => [['id' => $seg]],
  ]);
  if (ok($c) && !empty($j['id'])) return [(string) $j['id'], null];
  $createErr = 'create ' . $c . ': ' . (string) ($j['message'] ?? 'no message');
  [$c, $j] = resend($key, 'GET', '/contacts/' . rawurlencode($email));
  if (!ok($c) || empty($j['id'])) return [null, $createErr];
  $id = (string) $j['id'];
  [$c, $j] = resend($key, 'POST', '/contacts/' . rawurlencode($id) . '/segments/' . rawurlencode($seg));
  return ok($c) ? [$id, null] : [null, 'add to segment ' . $c . ': ' . (string) ($j['message'] ?? 'no message')];
}
