#!/usr/bin/env bash
# Publishes play.vhwpt.com (the play/ folder of the vhwpt-site repo) on Bruce's Lightsail server
# (Caddy file: deploy/lightsail/sites/play.caddy). setup.sh installs this as
# /srv/sites/play/deploy.sh. From any machine with the SSH alias:
#
#   ssh bruce-lightsail /srv/sites/play/deploy.sh [branch]      # default: main
#
# It reads the branch from vhwpt's clone with git archive, so vhwpt's checkout never moves.
# Each publish lands in releases/<utc time>-<sha>; `current` moves only after the pages exist.
# The last five releases are kept. To roll back:
#   ln -sfn /srv/sites/play/releases/<older> /srv/sites/play/current

main() {
  set -euo pipefail
  local branch="${1:-main}"
  local home=/srv/sites/play repo=/srv/sites/vhwpt/repo

  git -C "$repo" fetch --quiet --prune origin
  local sha; sha=$(git -C "$repo" rev-parse --short "origin/$branch")
  echo "publishing play/ from $branch at $sha"

  local out; out="$home/releases/$(date -u +%Y%m%d-%H%M%S)-$sha"
  mkdir -p "$out"
  git -C "$repo" archive "origin/$branch" play | tar -x -C "$out" --strip-components=1

  local f
  for f in index.html wheel/index.html; do
    [[ -s "$out/$f" ]] || { echo "$f is missing on $branch; the live copy was not changed" >&2; rm -rf "$out"; exit 1; }
  done

  ln -sfn "$out" "$home/current.next"
  mv -Tf "$home/current.next" "$home/current"
  ls -1dt "$home"/releases/* | tail -n +6 | xargs -r rm -rf

  local code; code=$(curl -sk -o /dev/null -w '%{http_code}' --resolve play.vhwpt.com:443:127.0.0.1 https://play.vhwpt.com/wheel/)
  echo "live: $out ($branch at $sha), HTTP $code"
  [[ "$code" == 200 ]]
}
main "$@"
