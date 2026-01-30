const sharp = require('sharp');
const toIco = require('to-ico');
const fs = require('fs');
const path = require('path');

async function convertOwlImage() {
  const owlPngPath = path.join(__dirname, 'assets', 'owl.png');
  const pngLogoPath = path.join(__dirname, '..', 'static', 'hoolio-logo.png');
  const icoPath = path.join(__dirname, 'assets', 'icon.ico');

  console.log('Converting owl.png...');

  try {
    // 1. Convert to PNG for UI logo (300x300)
    await sharp(owlPngPath)
      .resize(300, 300, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(pngLogoPath);

    console.log('✓ UI Logo converted successfully!');
    console.log(`  Output: ${pngLogoPath}`);

    // 2. Convert to ICO for window icon (multiple sizes)
    const sizes = [16, 32, 48, 64, 128, 256];
    const pngBuffers = await Promise.all(
      sizes.map(size =>
        sharp(owlPngPath)
          .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer()
      )
    );

    const icoBuffer = await toIco(pngBuffers);
    fs.writeFileSync(icoPath, icoBuffer);

    console.log('✓ Window Icon converted successfully!');
    console.log(`  Output: ${icoPath}`);
    console.log(`  Sizes: ${sizes.join('x, ')}x`);

    console.log('\n✓ All conversions complete! Refresh the app to see changes.');
  } catch (error) {
    console.error('Error converting owl image:', error);
    process.exit(1);
  }
}

convertOwlImage();
