import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgPath = path.resolve('public/favicon.svg');
const sizes = [192, 512];

async function generateIcons() {
  if (!fs.existsSync(svgPath)) {
    console.error(`SVG not found at ${svgPath}`);
    process.exit(1);
  }

  for (const size of sizes) {
    const outPath = path.resolve(`public/pwa-${size}x${size}.png`);
    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log(`Generated ${outPath}`);
  }
}

generateIcons().catch(console.error);
