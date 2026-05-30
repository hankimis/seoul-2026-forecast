#!/usr/bin/env bash
# Rebuild the paper: re-render the model GIFs → extract static figures → compile PDF.
# Run from anywhere; paths are relative to this script.
set -euo pipefail
cd "$(dirname "$0")/.."   # repo root

echo "→ refreshing model outputs"
node national.mjs >/dev/null

echo "→ re-rendering GIFs (vhs)"
for t in docs/demo.tape docs/seats.tape docs/probs.tape docs/method.tape docs/tornado.tape docs/map.tape; do
  vhs "$t" >/dev/null 2>&1 || echo "  (skip $t)"
done

echo "→ extracting static figures from GIFs"
mkdir -p paper/figs
declare -a figs=(map probs seats method tornado)
for g in "${figs[@]}"; do
  ffmpeg -y -sseof -1.5 -i "docs/$g.gif" -update 1 -frames:v 1 "paper/figs/$g.png" >/dev/null 2>&1
done

echo "→ compiling PDF (typst)"
typst compile paper/paper.typ paper/paper.pdf

echo "✓ paper/paper.pdf"
