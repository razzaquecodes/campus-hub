const fs = require('fs');
const path = require('path');
const sharp = require('sharp'); // Install via: npm i sharp

const INPUT_ICON = path.join(__dirname, 'assets/images/icon.png');
const PUBLIC_DIR = path.join(__dirname, 'public');
const APP_DIR = path.join(__dirname, 'app');

if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}
if (!fs.existsSync(APP_DIR)) {
  fs.mkdirSync(APP_DIR, { recursive: true });
}

async function generate() {
  if (!fs.existsSync(INPUT_ICON)) {
    console.error('Source icon not found at ' + INPUT_ICON);
    return;
  }

  // Generate icons for public/ directory (served directly)
  await sharp(INPUT_ICON).resize(192, 192).toFile(path.join(PUBLIC_DIR, 'icon-192.png'));
  await sharp(INPUT_ICON).resize(512, 512).toFile(path.join(PUBLIC_DIR, 'icon-512.png'));
  await sharp(INPUT_ICON).resize(512, 512).toFile(path.join(PUBLIC_DIR, 'maskable-icon-512.png'));
  await sharp(INPUT_ICON).resize(180, 180).toFile(path.join(PUBLIC_DIR, 'apple-touch-icon.png'));

  // Copy icons to app/ directory (Expo export output, served from /app/)
  await sharp(INPUT_ICON).resize(192, 192).toFile(path.join(APP_DIR, 'icon-192.png'));
  await sharp(INPUT_ICON).resize(512, 512).toFile(path.join(APP_DIR, 'icon-512.png'));
  await sharp(INPUT_ICON).resize(512, 512).toFile(path.join(APP_DIR, 'maskable-icon-512.png'));
  await sharp(INPUT_ICON).resize(180, 180).toFile(path.join(APP_DIR, 'apple-touch-icon.png'));

  // Also copy favicon.png to app/ (Expo expects favicon.ico but we use PNG)
  const faviconSrc = path.join(__dirname, 'assets/images/favicon.png');
  if (fs.existsSync(faviconSrc)) {
    fs.copyFileSync(faviconSrc, path.join(APP_DIR, 'favicon.png'));
  }

  // Copy all assets/images to app/assets/images (for landing page icons)
  const assetsDir = path.join(__dirname, 'assets/images');
  const appAssetsDir = path.join(APP_DIR, 'assets/images');
  if (fs.existsSync(assetsDir)) {
    if (!fs.existsSync(appAssetsDir)) {
      fs.mkdirSync(appAssetsDir, { recursive: true });
    }
    const assetFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith('.png'));
    assetFiles.forEach(file => {
      fs.copyFileSync(path.join(assetsDir, file), path.join(appAssetsDir, file));
    });
    console.log('Copied ' + assetFiles.length + ' assets to app/assets/images/');
  }

  console.log('PWA icons generated successfully for both public/ and app/ directories.');
}
generate();
