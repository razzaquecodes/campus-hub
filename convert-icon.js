const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputJpg = '/Users/razzaque/.gemini/antigravity/brain/1975ab50-739f-462a-a79e-b1415795c354/media__1781283217870.jpg';
const outputPng = path.join(__dirname, 'app/assets/images/icon.png');

async function convert() {
  try {
    await sharp(inputJpg)
      .resize(1024, 1024, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(outputPng);
    console.log('Successfully converted uploaded JPG to ' + outputPng);
  } catch (err) {
    console.error('Error converting image:', err);
  }
}
convert();
