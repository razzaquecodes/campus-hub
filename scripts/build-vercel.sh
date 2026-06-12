#!/bin/bash
# Build script for Vercel deployment
# This script separates the landing page from the Expo app

set -e

echo "=== Campus Hub Vercel Build ==="
echo "Current directory: $(pwd)"

# Use a temporary directory for Expo export to avoid having app/ in repo root
# Vercel will prioritize app/ at root over vercel.json outputDirectory
EXPO_OUTPUT_DIR=".expo-output"

# Step 1: Clean up any existing build artifacts
echo "Step 1: Cleaning up old build artifacts..."
rm -rf dist app "$EXPO_OUTPUT_DIR"

# Step 2: Export Expo app to temp directory
echo "Step 2: Exporting Expo app to temp directory..."
npx expo export --platform web --output-dir "$EXPO_OUTPUT_DIR"

# Step 3: Create dist directory and copy Expo app to /dist/app
echo "Step 3: Setting up Expo app at /dist/app..."
mkdir -p dist/app
cp -r "$EXPO_OUTPUT_DIR"/* dist/app/
rm -rf "$EXPO_OUTPUT_DIR"  # Clean up temp directory

# Step 4: Copy the custom landing page to dist root
# This ensures / serves the landing page, not the Expo app
echo "Step 4: Copying custom landing page to dist root..."
cp index.html dist/

# Step 5: Copy Expo app PWA manifest and service worker to app directory
# The Expo export doesn't include these, so we need to add them
echo "Step 5: Setting up PWA assets for /app..."
cp manifest.webmanifest dist/app/manifest.webmanifest 2>/dev/null || true
cp sw.js dist/app/sw.js 2>/dev/null || true

# Step 6: Update Expo app HTML to reference manifest from /app/ path
# The exported HTML references /manifest.json (root), but since the app is at /app/,
# we need to update it to /app/manifest.json so PWA installation works correctly
echo "Step 6: Updating Expo app manifest references..."
for file in dist/app/*.html; do
  if [ -f "$file" ]; then
    # Replace /manifest.json with /app/manifest.json
    sed -i 's|href="/manifest.json"|href="/app/manifest.json"|g' "$file"
    # Replace /sw.js with /app/sw.js
    sed -i "s|register('/sw.js')|register('/app/sw.js')|g" "$file"
    sed -i 's|register("/sw.js")|register("/app/sw.js")|g' "$file"
  fi
done

# Step 7: Copy static assets to dist root (for landing page)
echo "Step 7: Copying static assets..."
if [ -f "apple-touch-icon.png" ]; then
  cp apple-touch-icon.png dist/
fi

# Step 8: Also copy icons to /app/ for PWA
echo "Step 8: Copying PWA icons..."
cp icon-*.png dist/app/ 2>/dev/null || true
cp maskable-*.png dist/app/ 2>/dev/null || true

# Verify build output
echo "=== Build Verification ==="
echo "Landing page at dist/index.html:"
head -5 dist/index.html
echo ""
echo "Expo app at dist/app/index.html:"
head -5 dist/app/index.html

echo "=== Build complete ==="
echo "Landing page: / (served from dist/index.html)"
echo "Expo app: /app/ (served from dist/app/)"
echo ""
echo "IMPORTANT: Do NOT commit the app directory - it should only exist in dist"
