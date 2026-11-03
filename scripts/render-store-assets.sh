#!/usr/bin/env bash
# Renders the Chrome Web Store screenshots and promo tile into store/ using
# headless Chrome. The extension APIs are stubbed by store/templates/chrome-stub.js.
set -euo pipefail
cd "$(dirname "$0")/.."

CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
build="$PWD/dist/render"

rm -rf "$build"
mkdir -p "$build"
cp -R src options icons store/templates "$build/"
# Load the API stub before the settings page's own scripts.
sed -i '' 's#<script src="../src/shared.js"></script>#<script src="../templates/chrome-stub.js"></script>&#' \
  "$build/options/options.html"

render() { # template, output, width, height
  "$CHROME" --headless=new --hide-scrollbars --force-device-scale-factor=1 \
    --allow-file-access-from-files --user-data-dir="$build/profile" \
    --virtual-time-budget=3000 --window-size="$3,$4" \
    --screenshot="$PWD/store/$2" "file://$build/templates/$1" >/dev/null 2>&1
  echo "store/$2"
}

render screenshot-highlight.html screenshot-1-highlight.png 1280 800
render screenshot-settings.html screenshot-2-settings.png 1280 800
render screenshot-code.html screenshot-3-code.png 1280 800
render promo-small.html promo-small-440x280.png 440 280
