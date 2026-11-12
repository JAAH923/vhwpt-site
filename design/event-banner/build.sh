#!/usr/bin/env bash
# Rebuilds the banner files the /banner page links to. Needs macOS (sips) and Google Chrome.
#   design/event-banner/build.sh            writes to public/banner/
#   design/event-banner/build.sh /some/dir  writes somewhere else (to look at a change first)
# Per version it writes: a print PDF with 0.125" bleed (33.25 x 81.25), a PDF at the exact
# 33 x 81 trim, and a small preview PNG. Chrome prints the PDFs, so the type and the QR stay
# vector and the fonts are embedded.
set -euo pipefail
cd "$(dirname "$0")"
OUT="${1:-../../public/banner}"
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
[[ -x "$CH" ]] || { echo "Google Chrome is needed to print the PDFs" >&2; exit 1; }
mkdir -p "$OUT"
chrome() { "$CH" --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files "$@" >/dev/null 2>&1; }

for pair in a:white-walking b:white-comes-to-you c:dark-walking; do
  k="${pair%%:*}"; name="valencia-banner-${pair##*:}"
  chrome --no-pdf-header-footer --print-to-pdf="$OUT/$name-33x81-bleed.pdf" "file://$PWD/banner.html?v=$k"
  chrome --no-pdf-header-footer --print-to-pdf="$OUT/$name-33x81-exact.pdf" "file://$PWD/banner.html?v=$k&nobleed=1"
  chrome --window-size=3168,7776 --force-device-scale-factor=1 --screenshot="$OUT/$name-full.png" "file://$PWD/banner.html?v=$k&nobleed=1"
  sips --resampleWidth 800 "$OUT/$name-full.png" --out "$OUT/$name-preview.png" >/dev/null
  rm -f "$OUT/$name-full.png"
  echo "built $name"
done
ls -la "$OUT"
