// Basey-Logo als SVG-Text: Schriftzug „Basey“ auf einem Artwork (Entwurf aus dem Artifact
// „Basey Logo“, Poster-Raster). Nur .ts-Imports mit Endung, damit auch scripts/generate-icons.mjs
// und vite.config.ts die Datei laden können.
import { artworkSvg, type Artwork } from './artwork.ts';

/** Das eine App-Logo „Charcoal Satin“ (seit 22b keine Auswahl mehr) */
export const LOGO_NAME = 'Charcoal Satin';

/** Glänzender Satin-Verlauf auf Schwarz */
export const LOGO_ARTWORK: Artwork = {
  background: '#0c0c0c',
  base: '#050505',
  mid: '#2c2c2c',
  rim: '#bea98e',
  shine: '#77716a',
  style: 'satin',
  text: '#ffffff',
};

export interface LogoSvgOptions {
  /** Präfix für IDs (Masken, Filter); muss je Dokument eindeutig sein */
  id?: string;
  /** `rounded` = App-Icon, `square` = vollflächig (maskable/Apple) */
  shape?: 'rounded' | 'square';
  /** Feste Pixelgröße; ohne füllt das SVG seinen Container */
  size?: number;
  /** Text für Screenreader; ohne ist das Logo nur Schmuck */
  label?: string;
}

/** Logo als SVG-Text (420 × 420): Artwork mit Schriftzug */
export function logoSvg(options: LogoSvgOptions = {}): string {
  const { id = 'logo', shape = 'rounded', size, label } = options;
  return artworkSvg(LOGO_ARTWORK, { id, shape, size, label, wordmark: true });
}

/** Logo als Daten-URL (z. B. für Canvas oder `<link rel="icon">`) */
export function logoDataUrl(options: LogoSvgOptions = {}): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(logoSvg(options))}`;
}
