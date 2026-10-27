// Erzeugt die PWA-Icons in public/ aus public/favicon.svg (nur beim Entwickeln nötig)
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const BACKGROUND = '#0f172a';
const source = await readFile(new URL('../public/favicon.svg', import.meta.url));
const out = (name) => fileURLToPath(new URL(`../public/${name}`, import.meta.url));

async function plain(size, name) {
  await sharp(source, { density: 384 }).resize(size, size).png().toFile(out(name));
}

// Maskable/Apple: vollflächiger Hintergrund, Motiv in der sicheren Zone (80 %)
async function padded(size, name, scale) {
  const inner = Math.round(size * scale);
  const icon = await sharp(source, { density: 384 }).resize(inner, inner).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: BACKGROUND } })
    .composite([{ input: icon, gravity: 'center' }])
    .png()
    .toFile(out(name));
}

await plain(192, 'pwa-192x192.png');
await plain(512, 'pwa-512x512.png');
await padded(512, 'maskable-512x512.png', 0.8);
await padded(180, 'apple-touch-icon.png', 0.9);
console.log('Icons erzeugt.');
