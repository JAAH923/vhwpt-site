<?php
// vhwpt.com/admin/signups: Bruce's list of event and class sign-ups, behind the admin password.
//
// Caddy serves this only under /admin/ (deploy/lightsail/sites/vhwpt.caddy), after its password
// check, and passes the signed-in user as ADMIN_USER. Anything else, including a direct request
// for /api/admin-signups.php, gets a 404 here too, so the list can never show without the password.
//
// Reads private/vhwpt-signups.sqlite (written by event.php). Read only: nothing here changes a row.
// /admin/signups shows a table; /admin/signups.csv downloads the same rows. Filters: ?event=,
// ?form=, and ?tests=1 to include test rows.
declare(strict_types=1);

header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('X-Robots-Tag: noindex, nofollow');

$uri = (string) parse_url((string) ($_SERVER['REQUEST_URI'] ?? ''), PHP_URL_PATH);
if ((string) getenv('ADMIN_USER') === '' || !str_starts_with($uri, '/admin/')) {
  http_response_code(404);
  exit;
}

$private = dirname(__DIR__, 2) . '/private';
foreach ([2, 3] as $up) {
  if (is_dir(dirname(__DIR__, $up) . '/private')) { $private = dirname(__DIR__, $up) . '/private'; break; }
}
$file = $private . '/vhwpt-signups.sqlite';

$h = fn($v) => htmlspecialchars((string) $v, ENT_QUOTES);
$FORMS = ['class' => 'Class sign-up', 'people' => 'Event: clients', 'pros' => 'Event: partners'];

$rows = [];
$events = [];
$error = '';
if (!is_file($file) || !extension_loaded('pdo_sqlite')) {
  $error = 'No sign-ups yet.';
} else {
  try {
    $db = new PDO('sqlite:' . $file, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::SQLITE_ATTR_OPEN_FLAGS => PDO::SQLITE_OPEN_READONLY]);
    $cols = array_column($db->query('PRAGMA table_info(signups)')->fetchAll(PDO::FETCH_ASSOC), 'name');
    $has = fn($c) => in_array($c, $cols, true);
    $events = $db->query("SELECT event, COUNT(*) n FROM signups WHERE test = 0 AND event IS NOT NULL GROUP BY event ORDER BY MAX(id) DESC")->fetchAll(PDO::FETCH_ASSOC);
    $where = [];
    $args = [];
    if (($_GET['tests'] ?? '') !== '1') $where[] = 'test = 0';
    $ev = (string) ($_GET['event'] ?? '');
    if ($ev !== '') { $where[] = 'event = ?'; $args[] = $ev; }
    $fm = (string) ($_GET['form'] ?? '');
    if (isset($FORMS[$fm])) { $where[] = 'form = ?'; $args[] = $fm; }
    $sql = 'SELECT id, created_at, form, event, test, name, organization, role, topics, phone, email, '
         . ($has('address') ? 'address, details, ' : 'NULL address, NULL details, ')
         . 'emailed, ' . ($has('resend_contact_id') ? 'resend_contact_id, resend_error' : 'NULL resend_contact_id, NULL resend_error')
         . ' FROM signups' . ($where ? ' WHERE ' . implode(' AND ', $where) : '') . ' ORDER BY id DESC LIMIT 2000';
    $st = $db->prepare($sql);
    $st->execute($args);
    $rows = $st->fetchAll(PDO::FETCH_ASSOC);
  } catch (Throwable $e) {
    error_log('vhwpt admin signups: ' . $e->getMessage());
    $error = 'The sign-ups could not be read. Justin can check /var/log/php8.3-fpm.log.';
  }
}

// One flat record per row, shared by the table and the CSV.
$tz = new DateTimeZone('America/New_York');
$flat = [];
foreach ($rows as $r) {
  $d = json_decode((string) ($r['details'] ?? ''), true) ?: [];
  $topics = json_decode((string) ($r['topics'] ?? ''), true) ?: [];
  try { $when = (new DateTime((string) $r['created_at']))->setTimezone($tz)->format('M j, Y g:i A'); }
  catch (Throwable $e) { $when = (string) $r['created_at']; }
  $flat[] = [
    'When'           => $when,
    'Event'          => (string) ($r['event'] ?? ''),
    'Form'           => $FORMS[$r['form']] ?? (string) $r['form'],
    'Name'           => (string) $r['name'],
    'Phone'          => (string) ($r['phone'] ?? ''),
    'Email'          => (string) ($r['email'] ?? ''),
    'Address / Unit' => (string) ($r['address'] ?? ''),
    'Coming'         => $r['form'] === 'class' ? (!empty($d['attending']) ? 'Yes' : 'No') : '',
    'Free screening' => $r['form'] === 'class' ? (!empty($d['screening']) ? 'YES, call' : 'No') : '',
    'Interested in'  => implode(', ', array_map('strval', (array) $topics)),
    'Facility / role'=> trim(($r['organization'] ?? '') . (($r['organization'] ?? '') && ($r['role'] ?? '') ? ', ' : '') . ($r['role'] ?? '')),
    'Signed release' => !empty($d['signature']) ? $d['signature'] . ' (' . ($d['signed_on'] ?? '') . ')' : '',
    'Emailed to Bruce' => $r['emailed'] ? 'Yes' : 'No',
    'In Resend'      => $r['resend_contact_id'] ? 'Yes' : ($r['resend_error'] ? 'Error' : ''),
    'Test'           => $r['test'] ? 'Test' : '',
  ];
}

if (str_ends_with($uri, '.csv')) {
  header('Content-Type: text/csv; charset=utf-8');
  header('Content-Disposition: attachment; filename="vhwpt-signups' . ($ev !== '' ? '-' . preg_replace('/[^a-z0-9-]/', '', $ev) : '') . '-' . date('Y-m-d') . '.csv"');
  $out = fopen('php://output', 'w');
  fwrite($out, "\xEF\xBB\xBF"); // so Excel reads the accents
  fputcsv($out, $flat ? array_keys($flat[0]) : ['No sign-ups']);
  foreach ($flat as $f) fputcsv($out, array_map(fn($v) => preg_match('/^[=+\-@]/', $v) ? "'" . $v : $v, $f));
  exit;
}

header('Content-Type: text/html; charset=utf-8');
$qs = $_GET;
$csvHref = '/admin/signups.csv' . ($qs ? '?' . http_build_query($qs) : '');
$screenings = count(array_filter($flat, fn($f) => $f['Free screening'] === 'YES, call'));
$coming = count(array_filter($flat, fn($f) => $f['Coming'] === 'Yes'));
?><!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Sign-ups | Admin | Valencia Health &amp; Wellness</title>
<link rel="icon" type="image/png" href="/assets/brand/valencia-health-wellness-icon.png">
<style>
  :root { --ink:#18181b; --grey:#52525b; --hair:#e4e4e7; --whisper:#f4f4f5; --crimson:#b91c1c; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 16px/1.45 -apple-system, BlinkMacSystemFont, "Inter", Helvetica, Arial, sans-serif; color: var(--ink); background: #fff; }
  header, main { padding: 20px 16px; max-width: 1400px; margin: 0 auto; }
  a { color: var(--ink); }
  .crumb { font-size: 14px; color: var(--grey); }
  h1 { font-size: 30px; margin: 4px 0 12px; }
  form.filters { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
  select, .btn { font: inherit; padding: 10px 14px; border-radius: 999px; border: 1px solid var(--hair); background: #fff; color: var(--ink); text-decoration: none; }
  .btn-primary { background: var(--crimson); color: #fff; border-color: var(--crimson); font-weight: 700; }
  .stats { display: flex; flex-wrap: wrap; gap: 10px; margin: 16px 0; }
  .stat { background: var(--whisper); border-radius: 12px; padding: 10px 14px; }
  .stat b { font-size: 22px; display: block; }
  .tablewrap { overflow-x: auto; border: 1px solid var(--hair); border-radius: 12px; }
  table { border-collapse: collapse; width: 100%; font-size: 14px; }
  th, td { text-align: left; padding: 9px 12px; border-bottom: 1px solid var(--hair); vertical-align: top; white-space: nowrap; }
  th { background: var(--whisper); position: sticky; top: 0; }
  td.wrap { white-space: normal; min-width: 180px; }
  .yes { color: var(--crimson); font-weight: 700; }
  .empty { padding: 24px; color: var(--grey); }
</style>
</head>
<body>
<header>
  <a class="crumb" href="/admin/">Admin</a>
  <h1>Sign-ups</h1>
  <form class="filters" method="get" action="/admin/signups">
    <select name="event" onchange="this.form.submit()" aria-label="Event">
      <option value="">All events</option>
      <?php foreach ($events as $e): ?>
        <option value="<?= $h($e['event']) ?>" <?= $ev === $e['event'] ? 'selected' : '' ?>><?= $h($e['event']) ?> (<?= (int) $e['n'] ?>)</option>
      <?php endforeach; ?>
    </select>
    <select name="form" onchange="this.form.submit()" aria-label="Form">
      <option value="">All forms</option>
      <?php foreach ($FORMS as $k => $v): ?>
        <option value="<?= $h($k) ?>" <?= $fm === $k ? 'selected' : '' ?>><?= $h($v) ?></option>
      <?php endforeach; ?>
    </select>
    <label><input type="checkbox" name="tests" value="1" <?= ($_GET['tests'] ?? '') === '1' ? 'checked' : '' ?> onchange="this.form.submit()"> Show tests</label>
    <a class="btn btn-primary" href="<?= $h($csvHref) ?>">Download for Excel (CSV)</a>
  </form>
  <div class="stats">
    <div class="stat"><b><?= count($flat) ?></b>sign-ups</div>
    <div class="stat"><b><?= $coming ?></b>coming to the class</div>
    <div class="stat"><b><?= $screenings ?></b>want a free screening</div>
  </div>
</header>
<main>
  <div class="tablewrap">
  <?php if ($error !== '' || !$flat): ?>
    <p class="empty"><?= $h($error !== '' ? $error : 'No sign-ups match.') ?></p>
  <?php else: ?>
    <table>
      <thead><tr><?php foreach (array_keys($flat[0]) as $k): ?><th><?= $h($k) ?></th><?php endforeach; ?></tr></thead>
      <tbody>
      <?php foreach ($flat as $f): ?>
        <tr>
          <?php foreach ($f as $k => $v): ?>
            <td class="<?= in_array($k, ['Interested in', 'Address / Unit'], true) ? 'wrap' : '' ?><?= $v === 'YES, call' ? ' yes' : '' ?>"><?php
              if ($k === 'Phone' && $v !== '') echo '<a href="tel:' . $h(preg_replace('/[^\d+]/', '', $v)) . '">' . $h($v) . '</a>';
              elseif ($k === 'Email' && $v !== '') echo '<a href="mailto:' . $h($v) . '">' . $h($v) . '</a>';
              else echo $h($v);
            ?></td>
          <?php endforeach; ?>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  <?php endif; ?>
  </div>
</main>
</body>
</html>
