const sharp = require('sharp');
const toIco = require('to-ico');
const fs = require('fs');
const path = require('path');

async function convertSvgToIco() {
  const svgPath = path.join(__dirname, 'assets', 'owl-icon.svg');
  const icoPath = path.join(__dirname, 'assets', 'icon.ico');

  console.log('Converting SVG to ICO...');

  try {
    // Generate PNG buffers at different sizes
    const sizes = [16, 32, 48, 64, 128, 256];
    const pngBuffers = await Promise.all(
      sizes.map(size =>
        sharp(svgPath)
          .resize(size, size)
          .png()
          .toBuffer()
      )
    );

    // Convert to ICO
    const icoBuffer = await toIco(pngBuffers);

    // Write to file
    fs.writeFileSync(icoPath, icoBuffer);

    console.log('✓ Icon converted successfully!');
    console.log(`  Output: ${icoPath}`);
    console.log(`  Sizes: ${sizes.join('x, ')}x`);
  } catch (error) {
    console.error('Error converting icon:', error);
    process.exit(1);
  }
}

convertSvgToIco();
