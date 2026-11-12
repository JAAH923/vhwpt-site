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
`public/_redirects`), and only `/api/inquiry.php` and `/api/event.php` run as PHP.

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

The columns `resend_contact_id`, `resend_pushed_at` and `resend_error` are for a later step:
pushing sign-ups to Resend as contacts. That step would take rows with `test = 0`, an email and
`resend_pushed_at is null`, add each to a Resend audience, and fill those columns in. Two things
to settle first. People who left only a phone number can't be added. And the tick box today only
covers Bruce contacting them (about their sign-up, on `/event2`), so a mailing list needs new
wording; `consent_text` keeps what each person actually ticked.

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
