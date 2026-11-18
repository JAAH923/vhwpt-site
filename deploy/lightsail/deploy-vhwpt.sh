#!/usr/bin/env bash
# Builds vhwpt.com from GitHub and serves it from Bruce's Lightsail server
# (Caddy file: deploy/lightsail/sites/vhwpt.caddy). setup.sh installs this as
# /srv/sites/vhwpt/deploy.sh. From any machine with the SSH alias:
#
#   ssh bruce-lightsail /srv/sites/vhwpt/deploy.sh [branch]      # default: main
#
# Every build lands in releases/<utc time>-<sha>. `current` (what Caddy serves) moves to it
# only after the key pages exist, so a broken build never goes live. The last five releases
# are kept. To roll back:
#   ln -sfn /srv/sites/vhwpt/releases/<older> /srv/sites/vhwpt/current
#
# The booking form (api/inquiry.php) reads its settings from /srv/sites/vhwpt/private/
# vhwpt-contact.php, which only Justin puts there. It is never in the repo or a release.

# Everything runs inside main(), so bash has read the whole file before the checkout
# below can change anything.
main() {
  set -euo pipefail
  local branch="${1:-main}"
  local home=/srv/sites/vhwpt
  export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

  cd "$home/repo"
  git fetch --quiet --prune origin
  git checkout --quiet --force --detach "origin/$branch"
  local sha; sha=$(git rev-parse --short HEAD)
  echo "building $branch at $sha"

  corepack pnpm@10 install --frozen-lockfile --reporter=silent
  rm -rf dist
  corepack pnpm@10 exec astro build --site https://www.vhwpt.com

  local f
  for f in index.html services/index.html about/index.html book/index.html api/inquiry.php; do
    [[ -s "dist/$f" ]] || { echo "dist/$f is missing; the live copy was not changed" >&2; exit 1; }
  done
  rm -f dist/_redirects     # Caddy does the redirects

  local out; out="$home/releases/$(date -u +%Y%m%d-%H%M%S)-$sha"
  cp -a dist "$out"
  ln -sfn "$out" "$home/current.next"
  mv -Tf "$home/current.next" "$home/current"
  # PHP-FPM remembers compiled scripts by the "current" path, so without this it keeps running
  # the previous release's PHP files (the booking form, the event sign-up) after the switch.
  # A graceful reload clears that.
  sudo -n systemctl reload php8.3-fpm 2>/dev/null \
    || echo "note: could not reload php8.3-fpm; PHP may serve the previous release until it is reloaded" >&2
  ls -1dt "$home"/releases/* | tail -n +6 | xargs -r rm -rf

  local code; code=$(curl -s -o /dev/null -w '%{http_code}' -H 'Host: 3.226.58.165' http://127.0.0.1/)
  echo "live: $out ($branch at $sha), HTTP $code"
  [[ "$code" == 200 ]]
}
main "$@"
