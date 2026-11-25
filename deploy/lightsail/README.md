# Bruce's Lightsail server

One AWS Lightsail server ($24/month, Ubuntu 24.04, 2 vCPU, 4 GB, 80 GB) for vhwpt.com and
whatever comes next: landing pages and small apps. Static IP **3.226.58.165**. Justin connects
with `ssh bruce-lightsail` (user `ubuntu`, his own key). In the AWS console his IAM user
`justin` can manage Lightsail and nothing else.

Set up 2026-11-09 with [`setup.sh`](setup.sh), which can be run again safely:

```sh
scp -r deploy/lightsail bruce-lightsail:lightsail && ssh bruce-lightsail 'sudo bash lightsail/setup.sh'
```

| Piece | Where |
|---|---|
| Caddy 2 (web server, HTTPS) | `/etc/caddy/Caddyfile` imports `/etc/caddy/sites/*.caddy`, one file per site or app |
| PHP 8.3-FPM | Runs only what a site file hands it (today: vhwpt's booking form and event sign-up) |
| Node 22 + pnpm (corepack) | Builds sites from GitHub on the server |
| Sites | `/srv/sites/<name>/`: `repo/`, `releases/`, `current` → the live release, `private/` (server-only) |
| Apps | `/srv/apps/<name>/`, each listening on localhost behind `reverse_proxy` |
| Firewall | ufw allows 22, 80, 443; fail2ban watches SSH; security updates install automatically |
| Tailscale | `bruce-lightsail` on Justin's tailnet, tagged `tag:client` so it can't reach his other devices |
| Monitoring | pho-status (status.freshphocus.com) "Bruce" tile: CPU, RAM, disk, load, Caddy/PHP/Tailscale/fail2ban/ssh, failed systemd units, pending reboot and updates, over Tailscale with pho-gate's key (accepted only from pho-gate's tailnet address). The site has its own uptime check there. |

## vhwpt.com

```sh
ssh bruce-lightsail /srv/sites/vhwpt/deploy.sh          # build main and put it live
ssh bruce-lightsail /srv/sites/vhwpt/deploy.sh develop  # or any branch
```

[`deploy-vhwpt.sh`](deploy-vhwpt.sh) builds from GitHub, checks the key pages exist, then
switches `current` and reloads PHP-FPM (which otherwise keeps running the previous release's PHP
files). It keeps five releases; its header shows how to roll back. Caddy's rules
are in [`sites/vhwpt.caddy`](sites/vhwpt.caddy): the old WordPress URLs redirect (same map as
`public/_redirects`), `/qr` (the event banner's QR code) redirects to the home page with a
temporary 302 so the printed code can be pointed somewhere else later by changing that one
line, `/b` is a short link to the unlisted `/banner/` page, and only `/api/inquiry.php` and
`/api/event.php` run as PHP.

vhwpt.com has been live on this server since 2026-11-12. **http://3.226.58.165/** stays up as a test address, marked noindex.

The booking form reads its settings from `/srv/sites/vhwpt/private/vhwpt-contact.php`
(owner `www-data`, mode 600). Only Justin puts that file there; it is never in this repo.
The form keeps its copy of every request in the same folder.

## Event sign-ups database

The event pages (`/event` for facility owners and therapists, `/event2` for regular people)
post to `/api/event.php`, which saves each sign-up in a SQLite database,
`/srv/sites/vhwpt/private/vhwpt-signups.sqlite` (owner `www-data`, mode 600), table `signups`.
It also appends a backup line to `private/vhwpt-event-signups.jsonl` and emails Bruce when
`vhwpt-contact.php` is there. Needs `php8.3-sqlite3` (installed by `setup.sh`).

If a sign-up fails, PHP writes the reason to `/var/log/php8.3-fpm.log`.

Only vhwpt.com sends. This test address (3.226.58.165) sends too: its rows are `test = 1`
and its emails say `[TEST]`, so they never mix with real sign-ups. Filter with `test = 0`.

```sh
# the latest sign-ups
ssh bruce-lightsail "sudo -u www-data sqlite3 -header -column /srv/sites/vhwpt/private/vhwpt-signups.sqlite \
  'select id, created_at, form, event, test, name, organization, role, phone, email, emailed from signups order by id desc limit 20'"

# everything real, as a CSV
ssh bruce-lightsail "sudo -u www-data sqlite3 -header -csv /srv/sites/vhwpt/private/vhwpt-signups.sqlite \
  'select * from signups where test = 0'" > signups.csv
```

Class registrations (/events/<slug>/signup) are `form = 'class'`. The view `class_participants`
lists the real ones per event (name, phone, email, address, coming, screening, interests, signed_at):

```sh
ssh bruce-lightsail "sudo -u www-data sqlite3 -header -csv /srv/sites/vhwpt/private/vhwpt-signups.sqlite \
  \"select * from class_participants where event = 'meadows-2026-12-17'\"" > meadows-2026-12-17.csv
```

Class sign-ups are not sent to Resend for now (`CLASS_TO_RESEND` in event.php): Bruce's free Resend
plan allows 3 segments and all 3 are used. The database is the participant list.

The columns `resend_contact_id`, `resend_pushed_at` and `resend_error` are for a later step:
pushing sign-ups to Resend as contacts. That step would take rows with `test = 0`, an email and
`resend_pushed_at is null`, add each to a Resend audience, and fill those columns in. Two things
to settle first. People who left only a phone number can't be added. And the tick box today only
covers Bruce contacting them (about their sign-up, on `/event2`), so a mailing list needs new
wording; `consent_text` keeps what each person actually ticked.

## Admin area

**https://www.vhwpt.com/admin** is Bruce's private area, behind one password (Caddy `basic_auth`,
user `bruce`). Today it links to **/admin/signups**, every event and class sign-up from the database
above, filterable by event, with a CSV download for Excel (`public/api/admin-signups.php`, read
only). It only works over HTTPS on www.vhwpt.com; the test address answers 404.

The password hash is kept out of the repo, in `/etc/caddy/private/vhwpt-admin-auth.caddy`
(root, 600). To set or change the password:

```sh
ssh bruce-lightsail 'sudo install -d -m 700 /etc/caddy/private && h=$(caddy hash-password --plaintext "NEW PASSWORD") \
  && printf "basic_auth {\n\tbruce %s\n}\n" "$h" | sudo tee /etc/caddy/private/vhwpt-admin-auth.caddy >/dev/null \
  && sudo chmod 600 /etc/caddy/private/vhwpt-admin-auth.caddy \
  && sudo install -m 644 /srv/sites/vhwpt/repo/deploy/lightsail/sites/vhwpt.caddy /etc/caddy/sites/ \
  && sudo caddy validate --adapter caddyfile --config /etc/caddy/Caddyfile && sudo systemctl reload caddy'
```

### admin.vhwpt.com

The same admin area, on its own address. Nothing about the pages changes: the sign-ups list, the CSV
and the menu keep their `/admin/...` addresses, so `https://admin.vhwpt.com/` goes to `/admin/` and
`https://admin.vhwpt.com/admin/signups` is the list. The code is the same code, served by a second
Caddy site block (`sites/vhwpt.caddy`, the `vhwpt_admin_area` snippet shared by both addresses).

| Piece | How |
|---|---|
| Address | `admin.vhwpt.com`, an A record to `3.226.58.165`, **proxied (orange cloud)**. Brendan Meehan owns the Cloudflare zone, so he adds it. |
| Certificate | The Origin Certificate already in `/etc/caddy/certs` covers `*.vhwpt.com`. Caddy does no ACME and nothing waits on DNS to get a certificate. It must be **proxied**: with a grey cloud, browsers would see the Origin Certificate, which only Cloudflare trusts. |
| Password | The same one gate as `/admin` today: `basic_auth` from `/etc/caddy/private/vhwpt-admin-auth.caddy`. No new secret. It uses no cookies; the browser remembers the password per address, so Bruce signs in once on the new address. |
| Lockout | fail2ban jail `vhwpt-admin`: 6 wrong passwords in 10 minutes bans that address for an hour (doubling for repeat offenders, up to a week). Because the site is behind Cloudflare, the ban goes into Caddy (`bin/vhwpt-admin-ban` writes `/etc/caddy/private/vhwpt-admin-banned.caddy`, banned addresses get 429), not the firewall. Only requests that carried a password and still got 401 count, never the browser's first prompt. Own log: `/var/log/caddy/vhwpt-admin.log`, kept a week, holds addresses (the visit log still holds none). |
| Everything else on the subdomain | Fonts, styles and the logo are served (public files). The menu's links to the banner and event pages, and any other address, redirect to the same path on `www.vhwpt.com`. The PHP files are never served. |
| Old address | `www.vhwpt.com/admin` keeps working until the switch below, then redirects to the subdomain (same path and query). |

Not used, and why: **Turnstile** needs a login page and a session cookie, and Caddy's password prompt
has neither, so it would mean building a login system for one person. **Tailscale or an address
allowlist** would lock Bruce out from his phone and from changing addresses. **Cloudflare Access**
(free) would be a good second gate but needs Brendan to set it up and gives Bruce a second login;
ask only if the password plus lockout is judged not enough.

#### Order of work

1. **Anytime, before DNS** (nothing public changes; the new block has no traffic until the record exists):
   `ssh bruce-lightsail 'cd /srv/sites/vhwpt/repo && git fetch -q origin && git checkout -q --detach origin/main && sudo bash deploy/lightsail/admin-subdomain.sh install'`
   (after this branch is merged to `main`; to try it earlier use the branch name instead of `main`).
   It backs up the old site file, validates before reloading, installs the lockout, and tests the
   block locally with `--resolve`. `sudo bash admin-subdomain.sh status` shows where things stand.
2. **Brendan adds the A record** `admin` → `3.226.58.165`, proxied. (Needs Justin's go-ahead before anything is sent to Brendan.)
3. **Check from outside**, as Bruce's browser would: `curl -I https://admin.vhwpt.com/admin/` answers `401` with `www-authenticate: Basic`. Open it, sign in, open the sign-ups list and download the CSV.
4. **Switch the old address**: `sudo bash admin-subdomain.sh redirect on`. It refuses unless step 3 passes. It redirects with a temporary 302 first. Undo at any time with `redirect off`. After a quiet week, change `302` to `308` in the script and run `redirect on` again.
5. Tell Bruce the new address once; his old bookmark keeps working through the redirect.

Why redirect rather than keep both: two addresses means two places a password can be typed and two
sets of saved logins, and the old `/admin` on the public site is the one search engines and scanners
look for. One address is easier to protect, log and lock down. The redirect keeps old bookmarks and
any link already sent to Bruce working, and `redirect off` is instant if anything is wrong.

Rolling back everything: `redirect off`, then put the saved `/etc/caddy/vhwpt.caddy.bak.<time>` back as
`/etc/caddy/sites/vhwpt.caddy`, validate and reload Caddy, and delete
`/etc/fail2ban/jail.d/vhwpt-admin.conf` and reload fail2ban.

## Traffic: how people arrive

Caddy keeps a **visit log** for vhwpt.com, and [`traffic-report.py`](traffic-report.py) turns it into
a summary of how people arrive (a QR code, a search, typing the address, another site) and which page
they land on. It needs no script on the pages, no cookies and no third-party service.

**What is recorded.** For each page load: the time, the page, the site they came from (the host only,
never the full address) and the browser name. **Not** recorded: IP addresses, cookies, form contents.
Images, styles, the API and the banner page are left out. Files are in `/var/log/caddy/vhwpt-visits.log`,
rotated at 20 MiB, with 90 days kept and older files deleted. The log shows page loads, not people: a
reload counts twice.

**Install** (once; the log folder already exists and belongs to Caddy):

```
ssh bruce-lightsail
cd /srv/sites/vhwpt/repo && git fetch origin
git show origin/<branch>:deploy/lightsail/sites/vhwpt.caddy | sudo tee /etc/caddy/sites/vhwpt.caddy >/dev/null
git show origin/<branch>:deploy/lightsail/traffic-report.py | sudo tee /srv/sites/vhwpt/traffic-report.py >/dev/null
sudo caddy validate --config /etc/caddy/Caddyfile && sudo systemctl reload caddy
```

**Read it** (it needs `sudo`, because the log is readable only by Caddy and root):

```
ssh bruce-lightsail 'sudo python3 /srv/sites/vhwpt/traffic-report.py --days 7'
ssh bruce-lightsail 'sudo python3 /srv/sites/vhwpt/traffic-report.py --since 2026-11-20 --until 2026-11-22'
ssh bruce-lightsail 'sudo python3 /srv/sites/vhwpt/traffic-report.py --days 30 --json'   # for another program
```

An **entry** is the first page of a visit: a page load whose referring site is empty or not ours.
Clicks between our own pages are not entries. Each entry is counted one way:

| Arrived by | How it is told |
|---|---|
| **qr / tagged** | The address has `?src=<tag>`. Every QR code we make has its own tag, and the tag is shown in the report. The banner's `/qr` is `src=banner`. |
| **organic** | The referrer is a search engine (Google, Bing, DuckDuckGo, Yahoo, Ecosia, Brave, ...). |
| **ai** | The referrer is an AI assistant (ChatGPT, Perplexity, Claude, Gemini, Copilot, ...). |
| **social**, **email** | Facebook, Instagram, X, LinkedIn, YouTube and so on; Gmail and other webmail. |
| **referral** | Any other site, with its host shown. |
| **direct** | No referrer and no tag: typed the address, a bookmark, or an app that hides where the visit came from. |

The report also counts **scans**: requests for `/qr` and `/qr/<name>`, which is the QR code itself before
it redirects. And it shows, for each landing page, how people got there, so a QR code that points at the
event form (`/event/`) appears there separately from the home page.

**Adding a QR code** (for example one for the event sign-up):

1. Pick a short name, say `heart-walk`, and a tag, `qr-heart-walk`. Keep the tag unique to that code.
2. In `sites/vhwpt.caddy`, next to the `/qr` lines, add:
   ```
   @qr_heart_walk path /qr/heart-walk /qr/heart-walk/
   redir @qr_heart_walk /event/?e=heart-walk&src=qr-heart-walk 302
   ```
   (`e=` also tags the sign-ups with the event; leave it off for a plain landing page.) Install the file
   and reload Caddy as above.
3. Make the QR code for `https://www.vhwpt.com/qr/heart-walk`. It stays small, and where it lands can be
   changed later without reprinting.
4. In the report, `qr-heart-walk` shows under **qr / tagged**, `/qr/heart-walk` under scans, and `/event/`
   under entry pages.

Without a Caddy change, any address with `?src=qr-<name>` on the end is counted the same way, but a
longer address makes a denser QR code.

What it cannot tell you: who a person is, whether two visits are the same person, or what someone
searched for (search engines do not pass it on).

## Adding another site or app

1. A static or PHP site goes in `/srv/sites/<name>/`. An app goes in `/srv/apps/<name>/`, run by
   systemd or Docker and listening on `127.0.0.1:<port>`.
2. Add `deploy/lightsail/sites/<name>.caddy` with its hostname and either `root` + `file_server`
   or `reverse_proxy 127.0.0.1:<port>`. Install it to `/etc/caddy/sites/`, then run
   `sudo caddy validate --config /etc/caddy/Caddyfile && sudo systemctl reload caddy`.
3. Point the domain's DNS at 3.226.58.165. Caddy gets the certificate by itself, unless the
   domain is proxied by Cloudflare (see the certificate step below).

## Moving vhwpt.com here (cutover)

**Done 2026-11-12:** vhwpt.com and www now point here (proxied by Cloudflare, SSL mode Full
(strict)) and Caddy serves them with the Origin Certificate. The steps below are kept as the
record and for the next server. The old WordPress site is still on a cPanel host at
108.170.32.242. **That host also runs Bruce's email** (`MX mail.vhwpt.com`, info@vhwpt.com).
Moving the website does not move email. Keep the mail records and the old hosting until
email has a new home. To roll back the website, point the A records back at 108.170.32.242.

1. **Lightsail firewall.** In the instance's Networking tab, allow HTTPS (443). HTTP (80) and
   SSH are open by default. Turn on automatic snapshots too.
2. **Booking form settings.** Copy `~/private/vhwpt-contact.php` from the old host to
   `/srv/sites/vhwpt/private/` here, then run `sudo chown www-data: …` and `sudo chmod 600 …`.
   The form's email also needs Resend's DNS records for the sending domain (T-900).
3. **Decide what goes live.** `main` is behind `develop`. Merge `develop` into `main`, then
   run `deploy.sh` with no branch.
4. **Certificate behind Cloudflare.** Make the key and a CSR on the server, so the key never
   leaves it, in `/etc/caddy/certs/` (folder `750 root:caddy`, key `640`). In Cloudflare, create an
   Origin Certificate for `vhwpt.com, *.vhwpt.com` from that CSR ("Use my private key and CSR"),
   and save it as `/etc/caddy/certs/vhwpt.crt` (`644`). Check that the certificate, key and CSR
   give the same `openssl ... -pubkey | md5sum`. The two Caddy blocks use
   `tls /etc/caddy/certs/vhwpt.crt /etc/caddy/certs/vhwpt.key`. Set Cloudflare SSL/TLS to
   **Full (strict)**.
5. **Caddy.** The `www.vhwpt.com` and `vhwpt.com` blocks in `sites/vhwpt.caddy` are on. Install
   the file, validate, then reload. Check with
   `curl -k --resolve www.vhwpt.com:443:3.226.58.165 https://www.vhwpt.com/`.
6. **DNS.** In Cloudflare, point the `vhwpt.com` and `www` A records at 3.226.58.165 (still
   proxied) and remove their AAAA records. **Leave `mail`, MX, SPF, DMARC and the Google
   verification record alone.** To roll back, point the A records back at 108.170.32.242.
7. **After.** Check every page and the old URLs. Send a test booking. Check
   `public/sitemap.xml` lists every page. Watch Search Console.
   Update `CLAUDE.md` ("Merges to `main` deploy by themselves") to the real deploy step.
   Once the new site has run for a while, take a full cPanel backup (files and database)
   before anyone cancels the old hosting.
