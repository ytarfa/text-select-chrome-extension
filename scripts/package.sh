#!/usr/bin/env bash
# Builds the zip to upload to the Chrome Web Store.
set -euo pipefail
cd "$(dirname "$0")/.."

version=$(sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' manifest.json)
out="dist/text-select-highlighter-$version.zip"

mkdir -p dist
rm -f "$out"
zip -qr "$out" manifest.json src options icons -x 'icons/icon.svg' '*.DS_Store'
echo "$out"
