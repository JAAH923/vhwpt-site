#!/usr/bin/env bash
# Builds Bruce's site from GitHub and serves it at https://review.donovanhunter.com/vhwpt/,
# the review copy on pho-gate (Caddy block: deploy/Caddyfile.vhwpt.conf). Run on pho-gate:
#
#   /opt/pho/sites/vhwpt-review/repo/deploy/pho-gate.sh [branch]     # default: develop
#
# Every build lands in releases/<utc time>-<sha>. `current` (what Caddy serves) moves to
# it only after the key pages exist, so a broken build never goes live. The last five
# releases are kept. To roll back:
#   ln -sfn /opt/pho/sites/vhwpt-review/releases/<older> /opt/pho/sites/vhwpt-review/current
#
# The build uses the /vhwpt base. vhwpt.com itself builds with no base (plain `pnpm build`).
# pho-gate has no PHP, so api/inquiry.php is not run here (Caddy answers 404), and the
# booking form only sends from vhwpt.com anyway.

# Everything runs inside main(), so bash has read the whole file before the checkout
# below can change it.
main() {
  set -euo pipefail
  local branch="${1:-develop}"
  local home=/opt/pho/sites/vhwpt-review
  local url=https://review.donovanhunter.com base=/vhwpt
  export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

  cd "$home/repo"
  git fetch --quiet --prune origin
  git checkout --quiet --force --detach "origin/$branch"
  local sha; sha=$(git rev-parse --short HEAD)
  echo "building $branch at $sha"

  corepack pnpm@10 install --frozen-lockfile --reporter=silent
  rm -rf dist
  corepack pnpm@10 exec astro build --site "$url" --base "$base"

  local f
  for f in index.html services/index.html about/index.html book/index.html; do
    [[ -s "dist/$f" ]] || { echo "dist/$f is missing; the live copy was not changed" >&2; exit 1; }
  done

  local out; out="$home/releases/$(date -u +%Y%m%d-%H%M%S)-$sha"
  mkdir -p "$home/releases"
  cp -a dist "$out"
  ln -sfn "$out" "$home/current.next"
  mv -Tf "$home/current.next" "$home/current"
  ls -1dt "$home"/releases/* | tail -n +6 | xargs -r rm -rf

  local code; code=$(curl -s -o /dev/null -w '%{http_code}' "$url$base/")
  echo "live: $url$base/ ($branch at $sha), HTTP $code"
  [[ "$code" == 200 ]]
}
main "$@"
