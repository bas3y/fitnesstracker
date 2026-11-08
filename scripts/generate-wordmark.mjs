// Erzeugt src/brand/wordmark.ts: Schriftzug „Basey“ und „Fitness & Lifestyle“ als SVG-Pfade
// (Inter Tight, SIL Open Font License). Die App lädt so keine Schrift. Nur beim Entwickeln nötig.
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const cache = fileURLToPath(new URL('./.cache/wordmark/', import.meta.url));
const pkg = `${cache}package/`;
if (!existsSync(`${pkg}files/inter-tight-latin-700-normal.woff`)) {
  mkdirSync(cache, { recursive: true });
  execSync('npm pack @fontsource/inter-tight@5.3.0 opentype.js@2.0.0 --silent', { cwd: cache });
  execSync('tar -xzf fontsource-inter-tight-5.3.0.tgz', { cwd: cache });
  execSync('tar -xzf opentype.js-2.0.0.tgz', { cwd: cache });
}
const { parse } = await import(
  new URL('./.cache/wordmark/package/dist/opentype.mjs', import.meta.url)
);

function font(weight) {
  const data = readFileSync(`${pkg}files/inter-tight-latin-${weight}-normal.woff`);
  return parse(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
}

/** Text als Pfad mit Laufweite in em; Ursprung oben links an der Kontur */
function textPath(text, weight, size, tracking) {
  const f = font(weight);
  const paths = [];
  let x = 0;
  let previous = null;
  // Zeichenweise statt `stringToGlyphs` (opentype.js kennt nicht alle Ersetzungstabellen der Schrift)
  for (const char of text) {
    const glyph = f.charToGlyph(char);
    if (previous) x += (f.getKerningValue(previous, glyph) / f.unitsPerEm) * size;
    paths.push(glyph.getPath(x, 0, size));
    x += (glyph.advanceWidth / f.unitsPerEm) * size + tracking * size;
    previous = glyph;
  }
  const boxes = paths.map((path) => path.getBoundingBox());
  const minX = Math.min(...boxes.map((b) => b.x1));
  const minY = Math.min(...boxes.map((b) => b.y1));
  const maxX = Math.max(...boxes.map((b) => b.x2));
  const maxY = Math.max(...boxes.map((b) => b.y2));
  const round = (n) => Math.round(n * 10) / 10;
  const d = paths
    .map((path) => {
      for (const cmd of path.commands) {
        for (const [kx, ky] of [
          ['x', 'y'],
          ['x1', 'y1'],
          ['x2', 'y2'],
        ]) {
          if (cmd[kx] !== undefined) {
            cmd[kx] = round(cmd[kx] - minX);
            cmd[ky] = round(cmd[ky] - minY);
          }
        }
      }
      return path.toPathData(1);
    })
    .join('');
  return { d, width: round(maxX - minX), height: round(maxY - minY) };
}

const name = textPath('Basey', 700, 100, -0.045);
const tagline = textPath('Fitness & Lifestyle', 500, 100, 0.01);

const out = `// Erzeugt von scripts/generate-wordmark.mjs (Inter Tight, SIL Open Font License) – nicht von Hand ändern
/** Schriftzug „Basey“ (fett, Schriftgröße 100) */
export const WORDMARK_NAME = ${JSON.stringify(name)} as const;
/** Untertitel „Fitness & Lifestyle“ (Schriftgröße 100) */
export const WORDMARK_TAGLINE = ${JSON.stringify(tagline)} as const;
`;
mkdirSync(new URL('../src/brand/', import.meta.url), { recursive: true });
writeFileSync(new URL('../src/brand/wordmark.ts', import.meta.url), out);
console.log('Wortmarke erzeugt:', name.width, '×', name.height);
