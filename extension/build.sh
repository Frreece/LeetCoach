#!/usr/bin/env bash
# Extension build script — copies src files to dist/ with config substituted

set -e

API_URL="${API_URL:-YOUR_API_GATEWAY_URL}"
USER_POOL_ID="${USER_POOL_ID:-YOUR_USER_POOL_ID}"
CLIENT_ID="${CLIENT_ID:-YOUR_CLIENT_ID}"

DIST="dist"
rm -rf "$DIST" && mkdir -p "$DIST/icons"

# Substitute config values
sed \
  -e "s|YOUR_API_GATEWAY_URL|$API_URL|g" \
  -e "s|YOUR_USER_POOL_ID|$USER_POOL_ID|g" \
  -e "s|YOUR_CLIENT_ID|$CLIENT_ID|g" \
  src/background.js > "$DIST/background.js"

cp src/content.js  "$DIST/content.js"
cp src/injected.js "$DIST/injected.js"
cp src/popup.js    "$DIST/popup.js"
cp src/popup.html  "$DIST/popup.html"
cp manifest.json   "$DIST/manifest.json"

# Copy icons (placeholder PNGs if not present)
for size in 16 48 128; do
  if [ -f "icons/icon${size}.png" ]; then
    cp "icons/icon${size}.png" "$DIST/icons/icon${size}.png"
  fi
done

echo "✅ Extension built to $DIST/"
echo "   → Load $DIST/ as an unpacked extension in chrome://extensions"
