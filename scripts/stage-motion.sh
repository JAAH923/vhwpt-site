#!/usr/bin/env bash
# Copies the hero motion directions (design/directions/motion-*.html and the shared
# engine in design/directions/motion/) into public/hero-motion/, so the Pages preview
# serves them next to the viewer at public/hero-motion/index.html (hand-written; this
# script leaves it alone). Re-run after changing a motion page and commit both copies.
set -euo pipefail
cd "$(dirname "$0")/.."

src=design/directions
out=public/hero-motion
mkdir -p "$out/lib"
cp "$src/motion/body.js" "$src/motion/base.css" "$out/lib/"

for x in a b c d e; do
  perl -pe '
    s{\.\./\.\./public/assets/}{../assets/}g;
    s{href="motion/base\.css"}{href="lib/base.css"};
    s{from "\./motion/body\.js"}{from "./lib/body.js"};
  ' "$src/motion-$x.html" > "$out/$x.html"
  grep -q 'name="robots" content="noindex' "$out/$x.html" || { echo "motion-$x.html lost its noindex tag" >&2; exit 1; }
done
echo "Staged motion A to E in $out"
