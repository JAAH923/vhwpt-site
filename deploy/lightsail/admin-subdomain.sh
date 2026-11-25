#!/usr/bin/env bash
# Puts Bruce's admin area on admin.vhwpt.com, in steps that can each be checked and undone.
# Run on the server, from this folder in the repo checkout (after deploy.sh has put the branch there):
#
#   sudo bash admin-subdomain.sh status           what is installed, what DNS says. Changes nothing.
#   sudo bash admin-subdomain.sh install          Caddy site block + login-failure lockout. Safe BEFORE DNS.
#   sudo bash admin-subdomain.sh redirect on      send www.vhwpt.com/admin to admin.vhwpt.com. Refuses until
#                                                 admin.vhwpt.com answers over the public internet.
#   sudo bash admin-subdomain.sh redirect off     back to serving /admin on www (instant undo)
#
# Nothing here touches DNS or Cloudflare, and no password or key is read or printed.
# See "Admin area" in README.md for the whole plan.
set -euo pipefail

HERE=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
CADDY_SITE=/etc/caddy/sites/vhwpt.caddy
FLAG_DIR=/etc/caddy/flags
FLAG=$FLAG_DIR/vhwpt-admin-redirect.caddy
BANNED=/etc/caddy/private/vhwpt-admin-banned.caddy
AUTH=/etc/caddy/private/vhwpt-admin-auth.caddy
HOST=admin.vhwpt.com
ORIGIN_IP=3.226.58.165

say() { printf '%s\n' "$*"; }
die() { printf 'STOP: %s\n' "$*" >&2; exit 1; }
[[ $EUID -eq 0 ]] || die "run with sudo"

validate() { caddy validate --adapter caddyfile --config /etc/caddy/Caddyfile >/dev/null 2>&1; }

# What the public internet says about admin.vhwpt.com. Cloudflare answers with its own addresses when
# the record is proxied (what we want); the server's own address means grey cloud, which would not work
# here because the Origin Certificate is not trusted by browsers.
dns_state() {
  local ips; ips=$(getent ahostsv4 "$HOST" 2>/dev/null | awk '{print $1}' | sort -u | paste -sd' ' || true)
  if [[ -z "$ips" ]]; then echo "none"; return; fi
  if [[ "$ips" == "$ORIGIN_IP" ]]; then echo "direct ($ips): grey cloud, will not work with the Origin Certificate"; return; fi
  echo "answers ($ips)"
}

# The real test: ask for the page the way Bruce's browser will, without --resolve and without -k.
# 401 with a Basic challenge means DNS, Cloudflare, TLS, Caddy and the password gate are all in place.
live_check() {
  local head; head=$(curl -sS -m 15 -I "https://$HOST/admin/" 2>&1 || true)
  grep -q '^HTTP/[0-9.]* 401' <<<"$head" && grep -qi '^www-authenticate: *basic' <<<"$head"
}

# The same page straight at Caddy on this server, before DNS exists. -k because the Origin Certificate is
# only trusted by Cloudflare. Expect: 401 for /admin/, 302 for /, 302 to www for anything else.
local_check() {
  local ok=0 code loc
  code=$(curl -sk -m 10 -o /dev/null -w '%{http_code}' --resolve "$HOST:443:127.0.0.1" "https://$HOST/admin/") || true
  say "  GET /admin/ with no password: $code (want 401)"; [[ $code == 401 ]] || ok=1
  code=$(curl -sk -m 10 -o /dev/null -w '%{http_code} %{redirect_url}' --resolve "$HOST:443:127.0.0.1" "https://$HOST/") || true
  say "  GET /: $code (want 302 to /admin/)"; [[ $code == "302 https://$HOST/admin/" ]] || ok=1
  code=$(curl -sk -m 10 -o /dev/null -w '%{http_code} %{redirect_url}' --resolve "$HOST:443:127.0.0.1" "https://$HOST/banner/") || true
  say "  GET /banner/: $code (want 302 to www)"; [[ $code == "302 https://www.vhwpt.com/banner/" ]] || ok=1
  code=$(curl -sk -m 10 -o /dev/null -w '%{http_code}' --resolve "$HOST:443:127.0.0.1" "https://$HOST/api/admin-signups.php") || true
  say "  GET /api/admin-signups.php with no password: $code (want 302 to www, never 200)"; [[ $code == 302 ]] || ok=1
  return $ok
}

cmd_status() {
  say "Caddy site file: $(grep -q "^$HOST {" "$CADDY_SITE" 2>/dev/null && echo 'has the admin.vhwpt.com block' || echo 'no admin.vhwpt.com block yet')"
  say "Password file:   $([[ -f $AUTH ]] && echo present || echo MISSING)"
  say "Ban list:        $([[ -f $BANNED ]] && sed 's/@banned client_ip //' "$BANNED" | sed 's/192.0.2.1/(nobody)/' || echo 'not installed')"
  say "Lockout jail:    $(fail2ban-client status vhwpt-admin 2>/dev/null | grep -E 'Currently (failed|banned)' | tr -s ' \t' ' ' | paste -sd',' || echo 'not running')"
  say "Redirect flag:   $([[ -f $FLAG ]] && echo 'ON (www/admin sends to admin.vhwpt.com)' || echo 'off (www/admin served as before)')"
  say "DNS:             $(dns_state)"
}

cmd_install() {
  [[ -f $AUTH ]] || die "$AUTH is missing. The admin password must exist first (README.md, Admin area)."
  [[ -f /etc/caddy/certs/vhwpt.crt && -f /etc/caddy/certs/vhwpt.key ]] || die "the Origin Certificate is missing from /etc/caddy/certs"
  command -v fail2ban-client >/dev/null || die "fail2ban is not installed"

  local stamp; stamp=$(date +%Y%m%d-%H%M%S)
  install -d -m 755 "$FLAG_DIR"
  install -m 755 -o root -g root "$HERE/bin/vhwpt-admin-ban" /usr/local/sbin/vhwpt-admin-ban
  install -d -m 750 /var/lib/vhwpt-admin
  if [[ ! -f $BANNED ]]; then
    echo '@banned client_ip 192.0.2.1' > "$BANNED"; chown root:caddy "$BANNED"; chmod 640 "$BANNED"
  fi

  cp -p "$CADDY_SITE" "/etc/caddy/vhwpt.caddy.bak.$stamp"
  install -m 644 "$HERE/sites/vhwpt.caddy" "$CADDY_SITE"
  if ! validate; then
    cp -p "/etc/caddy/vhwpt.caddy.bak.$stamp" "$CADDY_SITE"
    die "Caddy rejected the new site file; the old one is back and nothing was reloaded"
  fi
  systemctl reload caddy
  say "Caddy reloaded with the admin.vhwpt.com block (backup: /etc/caddy/vhwpt.caddy.bak.$stamp)."

  # fail2ban last: it needs the log file Caddy has just started writing.
  install -m 644 "$HERE/fail2ban/filter.d/vhwpt-admin.conf" /etc/fail2ban/filter.d/vhwpt-admin.conf
  install -m 644 "$HERE/fail2ban/action.d/vhwpt-admin-caddy.conf" /etc/fail2ban/action.d/vhwpt-admin-caddy.conf
  install -m 644 "$HERE/fail2ban/jail.d/vhwpt-admin.conf" /etc/fail2ban/jail.d/vhwpt-admin.conf
  [[ -f /var/log/caddy/vhwpt-admin.log ]] || { touch /var/log/caddy/vhwpt-admin.log; chown caddy:caddy /var/log/caddy/vhwpt-admin.log; chmod 640 /var/log/caddy/vhwpt-admin.log; }
  fail2ban-client -t >/dev/null || die "fail2ban rejects its configuration; the three vhwpt-admin files are installed, check them"
  systemctl reload fail2ban || systemctl restart fail2ban
  sleep 2
  say "fail2ban jail: $(fail2ban-client status vhwpt-admin 2>&1 | head -3 | tr '\n' ' ')"

  say "Checking the new block directly on this server (no DNS needed):"
  if local_check; then say "All four checks passed."; else say "A check above did not match. Look before going on (journalctl -u caddy)."; fi
  say "DNS today: $(dns_state)"
  say "Next: once Brendan's admin record is live, run: sudo bash admin-subdomain.sh redirect on"
}

cmd_redirect() {
  case "${1:-}" in
    on)
      grep -q "^$HOST {" "$CADDY_SITE" || die "run 'install' first"
      say "DNS: $(dns_state)"
      if ! live_check; then
        die "https://$HOST/admin/ does not answer 401 from the public internet yet (DNS not live, grey cloud, or Cloudflare not serving it). Redirect NOT turned on; /admin on www is unchanged."
      fi
      say "https://$HOST/admin/ answers 401 with a password prompt: the new address works."
      # 302, not 301/308: browsers keep a permanent redirect for good. After a week of it working, change
      # the 302 below to 308 in this script, and rerun 'redirect on'.
      printf 'redir * https://%s{uri} 302\n' "$HOST" > "$FLAG"
      if ! validate; then rm -f "$FLAG"; die "Caddy rejected the redirect; removed it"; fi
      systemctl reload caddy
      local loc; loc=$(curl -sS -m 15 -o /dev/null -w '%{http_code} %{redirect_url}' "https://www.vhwpt.com/admin/signups?form=class" || true)
      say "https://www.vhwpt.com/admin/signups?form=class now gives: $loc"
      ;;
    off)
      rm -f "$FLAG"; validate || die "Caddy rejects its config after removing the flag; check /etc/caddy"
      systemctl reload caddy
      say "Redirect off: www.vhwpt.com/admin is served as before."
      ;;
    *) die "usage: redirect on|off" ;;
  esac
}

case "${1:-}" in
  status)   cmd_status ;;
  install)  cmd_install ;;
  redirect) shift; cmd_redirect "$@" ;;
  *) sed -n '2,13p' "${BASH_SOURCE[0]}"; exit 2 ;;
esac
