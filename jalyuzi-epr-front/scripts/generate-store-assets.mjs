// Play Store uchun grafik resurslarni yaratuvchi skript.
// `npm run android:store-assets` orqali ishga tushiriladi.
//
// Natija: jalyuzi-epr-front/store-assets/ papkasida:
//   - icon-512.png       (Play Store ilova ikoni, 512x512 PNG-32)
//   - feature-graphic.png (Play Store banner, 1024x500 PNG)
//
// Bu fayllarni Play Console'da App content -> Store listing bo'limida yuklang.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'store-assets');
mkdirSync(outDir, { recursive: true });

const sourcePwa = join(root, 'public', 'pwa-512x512.png');
const sourceMaskable = join(root, 'public', 'pwa-maskable-512x512.png');

const TEAL = { r: 15, g: 118, b: 110, alpha: 1 };
const TEAL_LIGHT = { r: 20, g: 184, b: 166, alpha: 1 };

// 1) Play Store ilova ikoni: 512x512 PNG-32
//    Maskable versiyani ishlatamiz (yaxshi padding bilan)
await sharp(sourceMaskable)
  .resize(512, 512, { kernel: sharp.kernel.lanczos3 })
  .png()
  .toFile(join(outDir, 'icon-512.png'));

// 2) Feature graphic: 1024x500 banner
//    Chap tomonda logo, o'ng tomonda matn (gradient fon)
const bannerWidth = 1024;
const bannerHeight = 500;
const logoSize = 320;

// Gradient fon SVG orqali
const gradientSvg = `
<svg width="${bannerWidth}" height="${bannerHeight}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgb(${TEAL.r}, ${TEAL.g}, ${TEAL.b})" />
      <stop offset="100%" stop-color="rgb(${TEAL_LIGHT.r}, ${TEAL_LIGHT.g}, ${TEAL_LIGHT.b})" />
    </linearGradient>
  </defs>
  <rect width="${bannerWidth}" height="${bannerHeight}" fill="url(#bg)"/>
  <text x="380" y="220" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="white">
    Jalyuzi ERP
  </text>
  <text x="380" y="280" font-family="Arial, sans-serif" font-size="32" fill="rgba(255,255,255,0.85)">
    Savdo va zaxira nazorati
  </text>
  <text x="380" y="340" font-family="Arial, sans-serif" font-size="24" fill="rgba(255,255,255,0.7)">
    POS · Ombor · Mijozlar · Hisobotlar
  </text>
</svg>
`;

const logoBuffer = await sharp(sourcePwa)
  .resize(logoSize, logoSize, { kernel: sharp.kernel.lanczos3 })
  .toBuffer();

await sharp(Buffer.from(gradientSvg))
  .composite([
    {
      input: logoBuffer,
      left: 50,
      top: Math.round((bannerHeight - logoSize) / 2),
    },
  ])
  .png()
  .toFile(join(outDir, 'feature-graphic.png'));

console.log('OK: store-assets/ ichida yaratildi:');
console.log('  - icon-512.png         (Play Store app icon)');
console.log('  - feature-graphic.png  (Play Store banner)');
console.log('');
console.log('Keyingi: bu fayllarni Play Console -> Main store listing -> Graphics bo\'limiga yuklang.');
