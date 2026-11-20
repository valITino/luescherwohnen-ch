// Erzeugt Favicons, App-Icons und das Vorschaubild (Open Graph) aus dem Logo-Kit.
//
//   apps/web/public/favicon.svg         Kopie aus packages/ui/src/brand/favicon.svg
//   apps/web/public/favicon.ico         32 px (PNG im ICO-Container)
//   apps/web/public/icon-192.png        Manifest
//   apps/web/public/icon-512.png        Manifest und strukturierte Daten (Logo)
//   apps/web/public/apple-touch-icon.png  180 px, ohne Transparenz
//   apps/web/public/og/luescher.png     1200 × 630, mit Logo, Slogan und Hero-Foto
//
// Das Vorschaubild rendert Chromium (Playwright) mit den selbst gehosteten Schriften.
// Aufruf: pnpm assets   (PW_CHROMIUM_PATH setzen, falls Playwrights Chromium fehlt)
import { chromium } from '@playwright/test';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const brand = resolve(root, 'packages/ui/src/brand');
const pub = resolve(root, 'apps/web/public');
mkdirSync(resolve(pub, 'og'), { recursive: true });

const faviconSvg = readFileSync(resolve(brand, 'favicon.svg'));
copyFileSync(resolve(brand, 'favicon.svg'), resolve(pub, 'favicon.svg'));

/** Quadratisches PNG aus dem Favicon. `fullBleed`: ohne runde Ecken (iOS rundet selbst). */
async function icon(size, { fullBleed = false } = {}) {
  let svg = faviconSvg.toString();
  if (fullBleed) svg = svg.replace(/rx="[^"]*"/, 'rx="0"');
  return sharp(Buffer.from(svg), { density: 512 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toBuffer();
}

writeFileSync(resolve(pub, 'icon-192.png'), await icon(192));
writeFileSync(resolve(pub, 'icon-512.png'), await icon(512));
writeFileSync(resolve(pub, 'apple-touch-icon.png'), await icon(180, { fullBleed: true }));

// favicon.ico: ein Bild (32 px, PNG) im ICO-Container. Moderne Browser lesen PNG in ICO.
const png32 = await icon(32);
const header = Buffer.alloc(6 + 16);
header.writeUInt16LE(0, 0); // reserviert
header.writeUInt16LE(1, 2); // Typ: Icon
header.writeUInt16LE(1, 4); // Anzahl Bilder
header.writeUInt8(32, 6); // Breite
header.writeUInt8(32, 7); // Höhe
header.writeUInt8(0, 8); // Palette
header.writeUInt8(0, 9); // reserviert
header.writeUInt16LE(1, 10); // Farbebenen
header.writeUInt16LE(32, 12); // Bit pro Pixel
header.writeUInt32LE(png32.length, 14); // Grösse der Bilddaten
header.writeUInt32LE(22, 18); // Versatz der Bilddaten
writeFileSync(resolve(pub, 'favicon.ico'), Buffer.concat([header, png32]));

// ---------------------------------------------------------------- Vorschaubild 1200 × 630

const require = createRequire(resolve(root, 'packages/ui/package.json'));
// Als data-URL eingebettet: Eine Seite aus setContent() darf keine file:-Adressen laden.
const manrope = readFileSync(
  require.resolve('@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2'),
).toString('base64');
const photo = await sharp(resolve(root, 'apps/web/src/assets/photos/hero-liege.jpg'))
  .resize(520, 520)
  .jpeg({ quality: 88 })
  .toBuffer();
const logo = readFileSync(resolve(brand, 'logo-dark.svg')).toString('base64');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: 'Manrope'; src: url('data:font/woff2;base64,${manrope}') format('woff2'); font-weight: 200 800; }
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; overflow: hidden; background: #f6f3ec; font-family: 'Manrope', sans-serif; color: #272727; }
.glow { position: absolute; inset: 0; background: radial-gradient(60% 70% at 78% 50%, #e9eed9 0%, rgba(233,238,217,0) 70%); }
.logo { position: absolute; left: 72px; top: 64px; height: 64px; }
h1 { position: absolute; left: 72px; top: 196px; width: 470px; font-size: 72px; font-weight: 650; line-height: 0.95; letter-spacing: -0.045em; text-transform: uppercase; }
p { position: absolute; left: 72px; bottom: 64px; font-size: 26px; font-weight: 500; letter-spacing: -0.01em; color: #5c574d; }
.pill { display: inline-block; margin-right: 10px; padding: 8px 18px; border-radius: 999px; background: #9cb703; color: #1d2100; font-size: 18px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; vertical-align: middle; }
.orb { position: absolute; right: 72px; top: 55px; width: 520px; height: 520px; border-radius: 50%; overflow: hidden; box-shadow: 0 0 0 1px #6e8200, 0 0 0 14px rgba(156,183,3,0.14); }
.orb img { width: 100%; height: 100%; object-fit: cover; }
</style></head><body>
<div class="glow"></div>
<img class="logo" src="data:image/svg+xml;base64,${logo}" alt="">
<h1>Wohnen heisst leben.</h1>
<p><span class="pill">Baden</span> Einrichten seit 1946</p>
<div class="orb"><img src="data:image/jpeg;base64,${photo.toString('base64')}" alt=""></div>
</body></html>`;

const browser = await chromium.launch(
  process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
);
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const shot = await page.screenshot({ type: 'png' });
  writeFileSync(
    resolve(pub, 'og/luescher.png'),
    await sharp(shot).png({ compressionLevel: 9, palette: false }).toBuffer(),
  );
} finally {
  await browser.close();
}

console.log('Favicons, App-Icons und Vorschaubild geschrieben (apps/web/public).');
