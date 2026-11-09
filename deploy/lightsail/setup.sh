#!/usr/bin/env bash
# Base setup for Bruce's AWS Lightsail server (3.226.58.165, Ubuntu 24.04, `ssh bruce-lightsail`).
# One server for vhwpt.com and whatever comes next (landing pages, small apps), so nothing
# here is vhwpt-only except the last section. Safe to run again: every step checks first.
#
#   scp -r deploy/lightsail bruce-lightsail:lightsail && ssh bruce-lightsail 'sudo bash lightsail/setup.sh'
#
# Layout it creates:
#   /etc/caddy/Caddyfile          global options, imports /etc/caddy/sites/*.caddy
#   /etc/caddy/sites/<name>.caddy one file per site or app
#   /srv/sites/<name>/            static and PHP sites: repo/, releases/, current -> releases/<id>,
#                                 private/ (server-only settings and logs, never in the web root)
#   /srv/apps/<name>/             apps that run their own process, behind Caddy's reverse_proxy
#
# Caddy serves everything (HTTPS by itself). PHP 8.3-FPM runs only the scripts a site file
# hands it. Node 22 builds sites from GitHub. ufw allows SSH, HTTP and HTTPS; Lightsail's own
# firewall (Networking tab) must allow 80 and 443 too.
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo "run with sudo" >&2; exit 1; }
here="$(cd "$(dirname "$0")" && pwd)"
owner="${SUDO_USER:-ubuntu}"
export DEBIAN_FRONTEND=noninteractive

echo "== packages"
apt_opts=(-yq -o Dpkg::Options::=--force-confdef -o Dpkg::Options::=--force-confold)
apt-get update -q
apt-get "${apt_opts[@]}" upgrade
apt-get "${apt_opts[@]}" install ca-certificates curl gnupg git rsync ufw fail2ban unattended-upgrades \
  debian-keyring debian-archive-keyring apt-transport-https

install -d -m 0755 /etc/apt/keyrings
if [[ ! -f /etc/apt/sources.list.d/caddy-stable.list ]]; then
  curl -fsSL https://dl.cloudsmith.io/public/caddy/stable/gpg.key \
    | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -fsSL https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt \
    > /etc/apt/sources.list.d/caddy-stable.list
fi
if [[ ! -f /etc/apt/sources.list.d/nodesource.list ]]; then
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
    | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" \
    > /etc/apt/sources.list.d/nodesource.list
fi
if [[ ! -f /etc/apt/sources.list.d/tailscale.list ]]; then
  curl -fsSL https://pkgs.tailscale.com/stable/ubuntu/noble.noarmor.gpg \
    > /usr/share/keyrings/tailscale-archive-keyring.gpg
  curl -fsSL https://pkgs.tailscale.com/stable/ubuntu/noble.tailscale-keyring.list \
    > /etc/apt/sources.list.d/tailscale.list
fi
apt-get update -q
apt-get "${apt_opts[@]}" install caddy nodejs php8.3-fpm php8.3-curl php8.3-mbstring tailscale
systemctl enable --now tailscaled   # join once by hand: sudo tailscale up --hostname=bruce-lightsail

echo "== php"
cat > /etc/php/8.3/fpm/conf.d/99-server.ini <<'INI'
expose_php = Off
display_errors = Off
log_errors = On
INI
usermod -aG www-data caddy          # Caddy talks to the PHP-FPM socket (owned by www-data)
systemctl enable --now php8.3-fpm
systemctl restart php8.3-fpm

echo "== caddy"
install -d -m 0755 /etc/caddy/sites
install -m 0644 "$here/Caddyfile" /etc/caddy/Caddyfile
for f in "$here"/sites/*.caddy; do install -m 0644 "$f" /etc/caddy/sites/; done
caddy validate --adapter caddyfile --config /etc/caddy/Caddyfile >/dev/null
systemctl enable caddy
systemctl restart caddy             # restart, not reload, so the www-data group applies

echo "== firewall"
ufw allow OpenSSH >/dev/null
ufw allow 80/tcp >/dev/null
ufw allow 443/tcp >/dev/null
ufw --force enable >/dev/null
systemctl enable --now fail2ban    # Ubuntu's default jail watches sshd

echo "== folders"
install -d -m 0755 -o "$owner" -g "$owner" /srv/sites /srv/apps

echo "== vhwpt.com"
site=/srv/sites/vhwpt
install -d -m 0755 -o "$owner" -g "$owner" "$site" "$site/releases"
install -d -m 0700 -o www-data -g www-data "$site/private"   # booking form settings + inquiry log
[[ -d "$site/repo/.git" ]] || sudo -u "$owner" git clone -q https://github.com/JAAH923/vhwpt-site.git "$site/repo"
install -m 0755 -o "$owner" -g "$owner" "$here/deploy-vhwpt.sh" "$site/deploy.sh"

echo
echo "done. Caddy $(caddy version | cut -d' ' -f1), Node $(node -v), PHP $(php -r 'echo PHP_VERSION;')"
[[ -f /var/run/reboot-required ]] && echo "a reboot is pending (sudo reboot)" || true
