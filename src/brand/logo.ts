// Basey-Logo als SVG-Text: Schriftzug „Basey“ auf einem Artwork (Entwurf aus dem Artifact
// „Basey Logo“, Poster-Raster). Nur .ts-Imports mit Endung, damit auch scripts/generate-icons.mjs
// und vite.config.ts die Datei laden können.
import { artworkSvg, type Artwork } from './artwork.ts';

/** Varianten des App-Icons; die erste ist Standard (Manifest, Startbildschirm) */
export const LOGO_VARIANTS = ['charcoal', 'taupe'] as const;
export type LogoVariant = (typeof LOGO_VARIANTS)[number];
export const DEFAULT_LOGO_VARIANT: LogoVariant = 'charcoal';

export const LOGO_VARIANT_LABELS: Record<LogoVariant, string> = {
  charcoal: 'Charcoal Satin',
  taupe: 'Taupe Silk',
};

/** Beide mit dem glänzenden Satin-Verlauf, einmal dunkel, einmal Taupe */
export const LOGO_ARTWORKS: Record<LogoVariant, Artwork> = {
  charcoal: {
    background: '#0c0c0c',
    base: '#050505',
    mid: '#2c2c2c',
    rim: '#bea98e',
    shine: '#77716a',
    style: 'satin',
    text: '#ffffff',
  },
  taupe: {
    background: '#0c0c0c',
    base: '#7e6c55',
    mid: '#bea98e',
    rim: '#e8d9c2',
    shine: '#f4ebdd',
    style: 'satin',
    text: '#0c0c0c',
  },
};

export function isLogoVariant(value: unknown): value is LogoVariant {
  return typeof value === 'string' && (LOGO_VARIANTS as readonly string[]).includes(value);
}

/** Frühere Varianten (Graphite Mesh, Stone Grip) werden zum Standard */
export function toLogoVariant(value: unknown): LogoVariant {
  return isLogoVariant(value) ? value : DEFAULT_LOGO_VARIANT;
}

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

/** Logo als SVG-Text (420 × 420): Artwork der Variante mit Schriftzug */
export function logoSvg(variant: LogoVariant, options: LogoSvgOptions = {}): string {
  const { id = 'logo', shape = 'rounded', size, label } = options;
  return artworkSvg(LOGO_ARTWORKS[variant], { id, shape, size, label, wordmark: true });
}

/** Logo als Daten-URL (z. B. für Canvas oder `<link rel="icon">`) */
export function logoDataUrl(variant: LogoVariant, options: LogoSvgOptions = {}): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(logoSvg(variant, options))}`;
}
