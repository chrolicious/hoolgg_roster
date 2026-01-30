const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function convertSvgToPng() {
  const svgPath = path.join(__dirname, 'assets', 'owl-icon.svg');
  const pngPath = path.join(__dirname, '..', 'static', 'hoolio-logo.png');

  console.log('Converting SVG logo to PNG...');

  try {
    // Generate PNG at 300x300 for the UI logo
    await sharp(svgPath)
      .resize(300, 300)
      .png()
      .toFile(pngPath);

    console.log('✓ Logo converted successfully!');
    console.log(`  Output: ${pngPath}`);
  } catch (error) {
    console.error('Error converting logo:', error);
    process.exit(1);
  }
}

convertSvgToPng();
