// Erzeugt Favicon und PWA-Icons in public/ aus dem Basey-Logo (src/brand/logo.ts), nur beim Entwickeln nötig
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { DEFAULT_LOGO_VARIANT, LOGO_VARIANTS, logoSvg } from '../src/brand/logo.ts';
import {
  SPLASH_ART_AREA,
  SPLASH_ART_SCALE,
  SPLASH_PALETTES,
  splashArtworkSvg,
  splashImageFile,
} from '../src/brand/splashHtml.ts';

const out = (name) => fileURLToPath(new URL(`../public/${name}`, import.meta.url));

async function png(svg, size, name) {
  // SVG ist 420 px groß: Dichte so wählen, dass ohne Hochskalieren gerendert wird
  const density = Math.ceil((72 * size * 2) / 420);
  await sharp(Buffer.from(svg), { density }).resize(size, size).png().toFile(out(name));
}

const variant = DEFAULT_LOGO_VARIANT;
await writeFile(out('favicon.svg'), logoSvg(variant, { id: 'fav' }));
await png(logoSvg(variant), 192, 'pwa-192x192.png');
await png(logoSvg(variant), 512, 'pwa-512x512.png');
// Maskable: vollflächig; der Schriftzug (60 % Breite) liegt schon in der sicheren Zone (80 %-Kreis)
await png(logoSvg(variant, { shape: 'square' }), 512, 'maskable-512x512.png');
// iOS rundet die Ecken selbst; je Variante eins, damit „Zum Home-Bildschirm“ die gewählte nimmt
await png(logoSvg(variant, { shape: 'square' }), 180, 'apple-touch-icon.png');
for (const other of LOGO_VARIANTS) {
  await png(logoSvg(other, { shape: 'square' }), 180, `apple-touch-icon-${other}.png`);
}

// Ladebildschirm: Artwork je Palette vorrendern (das SVG mit Filtern zu rastern kostet auf dem Handy > 1 s)
for (const palette of SPLASH_PALETTES) {
  const width = SPLASH_ART_AREA.width * SPLASH_ART_SCALE;
  const height = SPLASH_ART_AREA.height * SPLASH_ART_SCALE;
  await sharp(Buffer.from(splashArtworkSvg(palette)), { density: 72 * SPLASH_ART_SCALE })
    .resize(width, height)
    .webp({ quality: 78, effort: 6 })
    .toFile(out(splashImageFile(palette)));
}
console.log('Icons und Ladebildschirme erzeugt.');
