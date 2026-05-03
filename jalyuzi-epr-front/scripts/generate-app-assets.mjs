import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const assetsDir = join(root, 'assets');
mkdirSync(assetsDir, { recursive: true });

const sourcePwa = join(root, 'public', 'pwa-512x512.png');
const sourceMaskable = join(root, 'public', 'pwa-maskable-512x512.png');

const TEAL = { r: 15, g: 118, b: 110, alpha: 1 };

// 1) Asosiy icon: 1024x1024 (pwa-512 -> 1024 ga lanczos bilan upscale)
await sharp(sourcePwa)
  .resize(1024, 1024, { kernel: sharp.kernel.lanczos3 })
  .png()
  .toFile(join(assetsDir, 'icon.png'));

// 2) Adaptive icon foreground: 1024x1024, ichida logo (66% safe zone) + transparent fon
//    pwa-maskable allaqachon to'g'ri padding bilan ishlangan, undan foydalanamiz
await sharp(sourceMaskable)
  .resize(1024, 1024, { kernel: sharp.kernel.lanczos3 })
  .png()
  .toFile(join(assetsDir, 'icon-foreground.png'));

// 3) Adaptive icon background: 1024x1024 sof teal rang
await sharp({
  create: {
    width: 1024,
    height: 1024,
    channels: 4,
    background: TEAL,
  },
})
  .png()
  .toFile(join(assetsDir, 'icon-background.png'));

// 4) Splash screen: 2732x2732 teal fon + markazda kichik logo (~600px)
const splashSize = 2732;
const logoSize = 720;
const logoBuffer = await sharp(sourcePwa)
  .resize(logoSize, logoSize, { kernel: sharp.kernel.lanczos3 })
  .toBuffer();

await sharp({
  create: {
    width: splashSize,
    height: splashSize,
    channels: 4,
    background: TEAL,
  },
})
  .composite([
    {
      input: logoBuffer,
      top: Math.round((splashSize - logoSize) / 2),
      left: Math.round((splashSize - logoSize) / 2),
    },
  ])
  .png()
  .toFile(join(assetsDir, 'splash.png'));

// 5) Splash dark variant — bizda bitta brand rang, dark uchun ham bir xil
await sharp({
  create: {
    width: splashSize,
    height: splashSize,
    channels: 4,
    background: TEAL,
  },
})
  .composite([
    {
      input: logoBuffer,
      top: Math.round((splashSize - logoSize) / 2),
      left: Math.round((splashSize - logoSize) / 2),
    },
  ])
  .png()
  .toFile(join(assetsDir, 'splash-dark.png'));

console.log('OK: assets/ ichida icon.png, icon-foreground.png, icon-background.png, splash.png, splash-dark.png yaratildi');
