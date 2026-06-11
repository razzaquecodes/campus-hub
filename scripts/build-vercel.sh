#!/bin/bash
# Build script for Vercel deployment
# This script separates the landing page from the Expo app

set -e

echo "=== Campus Hub Vercel Build ==="

# Step 1: Export Expo app to /app directory
echo "Step 1: Exporting Expo app to /app..."
npx expo export --platform web --output-dir app

# Step 2: Create dist directory and copy Expo app to /dist/app
echo "Step 2: Setting up Expo app at /dist/app..."
mkdir -p dist/app
cp -r app/* dist/app/

# Step 3: Copy the custom landing page to dist root
# This ensures / serves the landing page, not the Expo app
echo "Step 3: Copying custom landing page to dist root..."
cp index.html dist/

# Step 4: Copy Expo app PWA manifest and service worker to app directory
# The Expo export doesn't include these, so we need to add them
echo "Step 4: Setting up PWA assets for /app..."
cp manifest.webmanifest dist/app/manifest.webmanifest 2>/dev/null || true
cp sw.js dist/app/sw.js 2>/dev/null || true

# Step 5: Update Expo app HTML to reference manifest from /app/ path
# The exported HTML references /manifest.json (root), but since the app is at /app/,
# we need to update it to /app/manifest.json so PWA installation works correctly
echo "Step 5: Updating Expo app manifest references..."
for file in dist/app/*.html; do
  if [ -f "$file" ]; then
    # Replace /manifest.json with /app/manifest.json
    sed -i 's|href="/manifest.json"|href="/app/manifest.json"|g' "$file"
    # Replace /sw.js with /app/sw.js
    sed -i "s|register('/sw.js')|register('/app/sw.js')|g" "$file"
    sed -i 's|register("/sw.js")|register("/app/sw.js")|g' "$file"
  fi
done

# Step 6: Copy static assets to dist root (for landing page)
echo "Step 6: Copying static assets..."
if [ -f "apple-touch-icon.png" ]; then
  cp apple-touch-icon.png dist/
fi

# Step 7: Also copy icons to /app/ for PWA
echo "Step 7: Copying PWA icons..."
cp icon-*.png dist/app/ 2>/dev/null || true
cp maskable-*.png dist/app/ 2>/dev/null || true

echo "=== Build complete ==="
echo "Landing page: / (served from dist/index.html)"
echo "Expo app: /app/ (served from dist/app/)"