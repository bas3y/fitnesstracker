// Artworks hinter dem Schriftzug (Entwürfe aus dem Artifact „Basey Logo“, Poster-Raster): ein
// breites, weich beleuchtetes Band mit Struktur. Nur .ts-Imports mit Endung, damit auch
// scripts/generate-icons.mjs und vite.config.ts die Datei direkt laden können.
import { WORDMARK_NAME } from './wordmark.ts';

/** Charakter des Bands: Form, Licht und Oberfläche */
export type ArtStyle = 'silk' | 'mesh' | 'speckle' | 'satin';

export interface Artwork {
  /** Fläche hinter dem Band */
  background: string;
  /** Band: Grundton, Körper, Lichtkante unten, Glanz oben */
  base: string;
  mid: string;
  rim: string;
  shine: string;
  style: ArtStyle;
  /** Farbe des Schriftzugs auf dem Band */
  text: string;
}

/** Raster der Artworks (wie die Poster im Entwurf) */
export const ART_SIZE = 420;

/** Form je Charakter; das Band läuft immer durch die Mitte (unter dem Schriftzug) */
const BANDS: Record<ArtStyle, { d: string; width: number }> = {
  silk: { d: 'M -60 330 C 60 120, 170 330, 260 190 S 390 70, 480 130', width: 210 },
  mesh: { d: 'M -60 360 C 70 140, 190 390, 290 210 S 390 -30, 480 30', width: 200 },
  speckle: { d: 'M 40 -60 C 0 150, 170 130, 230 220 S 380 280, 480 220', width: 240 },
  satin: { d: 'M -50 110 C 120 80, 150 280, 260 260 S 400 130, 480 210', width: 180 },
};

/** Breite des Schriftzugs im Verhältnis zum Artwork */
const WORDMARK_SHARE = 0.6;

function rgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255].map(
    (channel) => Math.round((channel / 255) * 100) / 100,
  ) as [number, number, number];
}

export interface ArtworkSvgOptions {
  /** Präfix für IDs (Masken, Filter); muss je Dokument eindeutig sein */
  id?: string;
  /** `rounded` = App-Icon, `square` = vollflächig, `cover` = füllt den Container (schneidet zu) */
  shape?: 'rounded' | 'square' | 'cover';
  /** Schriftzug „Basey“ auf dem Band */
  wordmark?: boolean;
  /** Feste Pixelgröße; ohne füllt das SVG seinen Container */
  size?: number;
  /** Text für Screenreader; ohne ist die Grafik nur Schmuck */
  label?: string;
  /** Ausschnitt im 420er-Raster (Standard 0 0 420 420), z. B. größer fürs Vorrendern des Ladebildschirms */
  area?: ArtArea;
}

export interface ArtArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Artwork als SVG-Text (420 × 420) */
export function artworkSvg(art: Artwork, options: ArtworkSvgOptions = {}): string {
  const {
    id = 'art',
    shape = 'square',
    wordmark = false,
    size,
    label,
    area = { x: 0, y: 0, width: ART_SIZE, height: ART_SIZE },
  } = options;
  const band = BANDS[art.style];
  const w = band.width;
  const space = `filterUnits="userSpaceOnUse" x="-400" y="-400" width="1220" height="1220"`;
  const stroke = (attrs: string) =>
    `<path d="${band.d}" fill="none" stroke-linecap="round" ${attrs}/>`;
  const round = (value: number) => Math.round(value * 10) / 10;
  const shift = (x: number, y: number) => `transform="translate(${round(x * w)} ${round(y * w)})"`;

  const [dr, dg, db] = rgb(art.background);
  const [lr, lg, lb] = rgb(art.base);
  const textureDefs =
    art.style === 'mesh'
      ? `<pattern id="${id}-mesh" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(28)"><circle cx="2.5" cy="2.5" r="1.72" fill="#000"/><circle cx="7.5" cy="7.5" r="1.72" fill="#000"/></pattern>`
      : art.style === 'speckle'
        ? `<filter id="${id}-sp0" ${space}><feTurbulence type="fractalNoise" baseFrequency="0.37" numOctaves="2" seed="7"/><feColorMatrix type="matrix" values="0 0 0 0 ${dr}  0 0 0 0 ${dg}  0 0 0 0 ${db}  12 0 0 0 -8.6"/></filter>` +
          `<filter id="${id}-sp1" ${space}><feTurbulence type="fractalNoise" baseFrequency="0.37" numOctaves="2" seed="19"/><feColorMatrix type="matrix" values="0 0 0 0 ${lr}  0 0 0 0 ${lg}  0 0 0 0 ${lb}  12 0 0 0 -8.2"/></filter>`
        : '';
  const texture =
    art.style === 'mesh'
      ? `<rect x="-100" y="-100" width="620" height="620" fill="url(#${id}-mesh)" opacity="0.55"/>`
      : art.style === 'speckle'
        ? `<rect width="420" height="420" filter="url(#${id}-sp0)"/><rect width="420" height="420" filter="url(#${id}-sp1)"/>`
        : '';
  // Satin glänzt stärker, Seide ist weicher
  const shineOpacity = art.style === 'satin' ? 1 : art.style === 'silk' ? 0.8 : 0.9;

  const bandSvg =
    `<g mask="url(#${id}-m)">` +
    stroke(`stroke="${art.base}" stroke-width="${w}"`) +
    stroke(
      `stroke="${art.mid}" stroke-width="${round(w * 0.72)}" ${shift(-0.06, -0.08)} filter="url(#${id}-b1)"`,
    ) +
    stroke(
      `stroke="${art.rim}" stroke-width="${round(w * 0.14)}" opacity="0.55" ${shift(0.3, 0.34)} filter="url(#${id}-b1)"`,
    ) +
    stroke(
      `stroke="${art.shine}" stroke-width="${round(w * 0.24)}" opacity="${shineOpacity}" ${shift(-0.17, -0.22)} filter="url(#${id}-b2)"`,
    ) +
    texture +
    `<rect width="420" height="420" filter="url(#${id}-gr)" opacity="0.1"/>` +
    `</g>`;

  const scale = (ART_SIZE * WORDMARK_SHARE) / WORDMARK_NAME.width;
  const x = round((ART_SIZE - WORDMARK_NAME.width * scale) / 2);
  // Großbuchstabenhöhe (72,8) mittig, die Unterlänge des „y“ hängt darunter
  const y = round(ART_SIZE / 2 - (72.8 * scale) / 2);
  const text = wordmark
    ? `<path class="art-wordmark" fill="${art.text}" transform="translate(${x} ${y}) scale(${round(scale * 1000) / 1000})" d="${WORDMARK_NAME.d}"/>`
    : '';

  const clip = shape === 'rounded' ? ` clip-path="url(#${id}-clip)"` : '';
  const clipDefs =
    shape === 'rounded'
      ? `<clipPath id="${id}-clip"><rect width="420" height="420" rx="95"/></clipPath>`
      : '';
  const sizeAttrs = size ? ` width="${size}" height="${size}"` : '';
  const aspect = shape === 'cover' ? ' preserveAspectRatio="xMidYMid slice"' : '';
  const a11y = label ? ` role="img" aria-label="${label}"` : ' aria-hidden="true"';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${area.x} ${area.y} ${area.width} ${area.height}"${sizeAttrs}${aspect}${a11y}>` +
    `<defs>` +
    `<mask id="${id}-m" maskUnits="userSpaceOnUse" x="-400" y="-400" width="1220" height="1220">${stroke(`stroke="#fff" stroke-width="${w}"`)}</mask>` +
    `<filter id="${id}-b1" ${space}><feGaussianBlur stdDeviation="${round(w * 0.08)}"/></filter>` +
    `<filter id="${id}-b2" ${space}><feGaussianBlur stdDeviation="${round(w * 0.1333)}"/></filter>` +
    `<filter id="${id}-gr" ${space}><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3"/><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0.9 0 0 0 -0.35"/></filter>` +
    textureDefs +
    clipDefs +
    `</defs>` +
    `<g${clip}>` +
    `<rect x="-420" y="-420" width="1260" height="1260" fill="${art.background}"/>` +
    bandSvg +
    text +
    `</g></svg>`
  );
}

/** Ladebildschirm je Farbpalette: Farben der Palette, Charakter passend zur Farbe */
export const PALETTE_ARTWORKS = {
  // Standard: Taupe wie Seide, warm und ruhig
  basey: {
    background: '#14110e',
    base: '#6f5b43',
    mid: '#bea98e',
    rim: '#e8d9c2',
    shine: '#f4ebdd',
    style: 'silk',
    text: '#14110e',
  },
  // Grün: natürlich, gesprenkelt wie Stein
  green: {
    background: '#012418',
    base: '#0b6e4f',
    mid: '#50c878',
    rim: '#d1f2eb',
    shine: '#c8f5dc',
    style: 'speckle',
    text: '#012418',
  },
  // Rot: Energie, glänzender Satin
  red: {
    background: '#2a070b',
    base: '#5e0a13',
    mid: '#b51a2b',
    rim: '#fbe4e3',
    shine: '#ff8f8f',
    style: 'satin',
    text: '#ffffff',
  },
  // Blau: technisch, feines Mesh
  blue: {
    background: '#00061a',
    base: '#0a2f73',
    mid: '#0f52ba',
    rim: '#a6c5d7',
    shine: '#d6e6f3',
    style: 'mesh',
    text: '#ffffff',
  },
  // Violett: weich wie Seide
  violet: {
    background: '#1f1131',
    base: '#4a2a73',
    mid: '#8a5cb8',
    rim: '#e6c7e6',
    shine: '#f0dcf0',
    style: 'silk',
    text: '#ffffff',
  },
} as const satisfies Record<string, Artwork>;

export type ArtworkPalette = keyof typeof PALETTE_ARTWORKS;
export const DEFAULT_ARTWORK_PALETTE: ArtworkPalette = 'basey';
