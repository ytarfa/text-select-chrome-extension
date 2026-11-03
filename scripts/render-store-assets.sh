#!/usr/bin/env bash
# Renders the Chrome Web Store screenshots and promo tile into store/, and the
# README banners into docs/, using headless Chrome. The extension APIs are stubbed by store/templates/chrome-stub.js.
set -euo pipefail
cd "$(dirname "$0")/.."

CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
build="$PWD/dist/render"

rm -rf "$build"
mkdir -p "$build" docs
cp -R src options icons store/templates "$build/"
# Load the API stub before the settings page's own scripts.
sed -i '' 's#<script src="../src/shared.js"></script>#<script src="../templates/chrome-stub.js"></script>&#' \
  "$build/options/options.html"

render() { # template[?query], output path, width, height
  "$CHROME" --headless=new --hide-scrollbars --force-device-scale-factor=1 \
    --allow-file-access-from-files --user-data-dir="$build/profile" \
    --virtual-time-budget=3000 --window-size="$3,$4" \
    --screenshot="$PWD/$2" "file://$build/templates/$1" >/dev/null 2>&1
  echo "$2"
}

render screenshot-highlight.html store/screenshot-1-highlight.png 1280 800
render screenshot-settings.html store/screenshot-2-settings.png 1280 800
render screenshot-code.html store/screenshot-3-code.png 1280 800
render promo-small.html store/promo-small-440x280.png 440 280
render readme-banner.html docs/banner-light.png 1280 560
render "readme-banner.html?dark" docs/banner-dark.png 1280 560
