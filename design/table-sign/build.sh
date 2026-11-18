#!/usr/bin/env bash
# Rebuilds the table sign files (the QR sign and the logo-only sign) the /banner page links to. Needs macOS (sips) and Google Chrome.
#   design/table-sign/build.sh            writes to public/banner/
#   design/table-sign/build.sh /some/dir  writes somewhere else (to look at a change first)
# It writes a letter-size PDF (Chrome prints it, so the type and the QR stay vector and the fonts
# are embedded), a 300 dpi PNG of the page, and a small preview PNG for the page.
set -euo pipefail
cd "$(dirname "$0")"
OUT="${1:-../../public/banner}"
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
[[ -x "$CH" ]] || { echo "Google Chrome is needed to print the PDF" >&2; exit 1; }
mkdir -p "$OUT"
chrome() { "$CH" --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files --virtual-time-budget=4000 "$@" >/dev/null 2>&1; }

build() { # build <html file> <output name>
  local src="$1" name="$2"
  chrome --no-pdf-header-footer --print-to-pdf="$OUT/$name.pdf" "file://$PWD/$src"
  # 8.5 x 11 in at 96 css px per inch is 816 x 1056; scale 3.125 gives 2550 x 3300 (300 dpi)
  chrome --window-size=816,1056 --force-device-scale-factor=3.125 --screenshot="$OUT/$name.png" "file://$PWD/$src"
  sips --resampleWidth 800 "$OUT/$name.png" --out "$OUT/$name-preview.png" >/dev/null
  echo "built $name"
  ls -la "$OUT"/$name*
}

build sign.html valencia-table-sign-letter   # logo, "Let's stay in touch." and the sign-up QR
build logo.html valencia-logo-sign-letter    # just the logo
