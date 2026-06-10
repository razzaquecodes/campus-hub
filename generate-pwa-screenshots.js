const fs = require('fs');
const path = require('path');

const INPUT_ICON = path.join(__dirname, 'assets/images/icon.png');
const PUBLIC_DIR = path.join(__dirname, 'public');

async function generate() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.warn('sharp not installed — copying icon as screenshot fallback');
    fs.copyFileSync(INPUT_ICON, path.join(PUBLIC_DIR, 'screenshot-mobile.png'));
    fs.copyFileSync(INPUT_ICON, path.join(PUBLIC_DIR, 'screenshot-desktop.png'));
    return;
  }

  const mobileIcon = await sharp(INPUT_ICON).resize(220, 220).png().toBuffer();
  const desktopIcon = await sharp(INPUT_ICON).resize(180, 180).png().toBuffer();

  await sharp({
    create: {
      width: 390,
      height: 844,
      channels: 4,
      background: { r: 10, g: 10, b: 11, alpha: 1 },
    },
  })
    .composite([{ input: mobileIcon, top: 200, left: 85 }])
    .png()
    .toFile(path.join(PUBLIC_DIR, 'screenshot-mobile.png'));

  await sharp({
    create: {
      width: 1280,
      height: 720,
      channels: 4,
      background: { r: 10, g: 10, b: 11, alpha: 1 },
    },
  })
    .composite([{ input: desktopIcon, top: 270, left: 550 }])
    .png()
    .toFile(path.join(PUBLIC_DIR, 'screenshot-desktop.png'));

  console.log('PWA screenshots generated.');
}

generate();
