#!/usr/bin/env bash
# Rebuilds the banner files the /banner page links to. Needs macOS (sips) and Google Chrome.
#   design/event-banner/build.sh            writes to public/banner/
#   design/event-banner/build.sh /some/dir  writes somewhere else (to look at a change first)
# Per version (six: two headlines for each of three audiences) it writes: a print PDF with 0.125" bleed (33.25 x 81.25), a PDF at the exact
# 33 x 81 trim, a 100 dpi PNG of the trim, and a small preview PNG. Chrome prints the PDFs, so the type and the QR stay
# vector and the fonts are embedded.
set -euo pipefail
cd "$(dirname "$0")"
OUT="${1:-../../public/banner}"
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
[[ -x "$CH" ]] || { echo "Google Chrome is needed to print the PDFs" >&2; exit 1; }
mkdir -p "$OUT"
chrome() { "$CH" --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files "$@" >/dev/null 2>&1; }

# the version ids are the ?v= names in banner.html; each is one file name on the /banner page
for id in patients-steady patients-care therapists-together therapists-next-step facilities-walking facilities-on-site; do
  name="valencia-banner-$id"
  # every line of text must fit: banner.html sets data-fit on <body>, and this stops the build if not
  fit=$("$CH" --headless=new --disable-gpu --allow-file-access-from-files --virtual-time-budget=4000 --dump-dom "file://$PWD/banner.html?v=$id" 2>/dev/null | grep -o 'data-fit="[^"]*"' || true)
  [[ "$fit" == 'data-fit="ok"' ]] || { echo "$id: text does not fit: $fit" >&2; exit 1; }
  chrome --no-pdf-header-footer --print-to-pdf="$OUT/$name-33x81-bleed.pdf" "file://$PWD/banner.html?v=$id"
  chrome --no-pdf-header-footer --print-to-pdf="$OUT/$name-33x81-exact.pdf" "file://$PWD/banner.html?v=$id&nobleed=1"
  # the image: 33 x 81 in at 100 dpi (3300 x 8100 px), and a small preview of it for the page
  chrome --window-size=3168,7776 --force-device-scale-factor=1.041667 --screenshot="$OUT/$name-33x81.png" "file://$PWD/banner.html?v=$id&nobleed=1"
  sips --resampleWidth 800 "$OUT/$name-33x81.png" --out "$OUT/$name-preview.png" >/dev/null
  echo "built $name"
done
ls -la "$OUT"
