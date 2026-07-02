import sharp from 'sharp';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LOGO_PATH = join(__dirname, '..', 'public', 'logo.png');
const OUTPUT_DIR = join(__dirname, '..', 'public', 'icons');

const SIZES = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-180-apple.png', size: 180 },
  { name: 'icon-192-maskable.png', size: 192, maskable: true },
];

async function generateIcons() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  for (const { name, size, maskable } of SIZES) {
    const outputPath = join(OUTPUT_DIR, name);

    if (maskable) {
      const resizedSize = Math.floor(size * 0.8);
      const padding = Math.floor((size - resizedSize) / 2);

      await sharp(LOGO_PATH)
        .resize(resizedSize, resizedSize)
        .extend({
          top: padding,
          bottom: padding,
          left: padding,
          right: padding,
          background: { r: 255, g: 255, b: 255, alpha: 0 },
        })
        .toFile(outputPath);
    } else {
      await sharp(LOGO_PATH)
        .resize(size, size)
        .toFile(outputPath);
    }

    console.log(`✓ Generated ${name} (${size}×${size})`);
  }

  console.log('\n✨ All PWA icons generated successfully!');
}

generateIcons().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});