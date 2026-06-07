const fs = require('fs');
const path = require('path');
const sharp = require('sharp'); // Install via: npm i sharp

const INPUT_ICON = path.join(__dirname, 'assets/images/icon.png');
const PUBLIC_DIR = path.join(__dirname, 'public');

if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR);
}

async function generate() {
  if (!fs.existsSync(INPUT_ICON)) {
    console.error(`Source icon not found at ${INPUT_ICON}`);
    return;
  }
  
  await sharp(INPUT_ICON).resize(192, 192).toFile(path.join(PUBLIC_DIR, 'icon-192.png'));
  await sharp(INPUT_ICON).resize(512, 512).toFile(path.join(PUBLIC_DIR, 'icon-512.png'));
  await sharp(INPUT_ICON).resize(512, 512).toFile(path.join(PUBLIC_DIR, 'maskable-icon-512.png'));
  await sharp(INPUT_ICON).resize(180, 180).toFile(path.join(PUBLIC_DIR, 'apple-touch-icon.png'));
  
  console.log('✅ PWA icons generated successfully.');
}
generate();