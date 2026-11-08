// Basey-Logo als SVG-Text: Ring mit Kugel in der Öffnung (Entwurf aus dem Artifact „Basey Logo“).
// Ohne Imports, damit auch scripts/generate-icons.mjs und vite.config.ts die Datei laden können.

/** Varianten des App-Icons; die erste ist Standard (Manifest, Startbildschirm) */
export const LOGO_VARIANTS = ['charcoal', 'taupe', 'graphite', 'stone'] as const;
export type LogoVariant = (typeof LOGO_VARIANTS)[number];
export const DEFAULT_LOGO_VARIANT: LogoVariant = 'charcoal';

export const LOGO_VARIANT_LABELS: Record<LogoVariant, string> = {
  charcoal: 'Charcoal Satin',
  taupe: 'Taupe Silk',
  graphite: 'Graphite Mesh',
  stone: 'Stone Grip',
};

interface LogoColors {
  /** Fläche hinter dem Ring */
  tile: string;
  /** Ring: Grundton, Körper, Lichtkante unten, Glanz oben */
  base: string;
  mid: string;
  rim: string;
  shine: string;
  texture: 'none' | 'mesh' | 'speckle';
}

export const LOGO_COLORS: Record<LogoVariant, LogoColors> = {
  charcoal: {
    tile: '#BEA98E',
    base: '#050505',
    mid: '#2C2C2C',
    rim: '#BEA98E',
    shine: '#77716A',
    texture: 'none',
  },
  taupe: {
    tile: '#0C0C0C',
    base: '#7E6C55',
    mid: '#BEA98E',
    rim: '#E8D9C2',
    shine: '#F4EBDD',
    texture: 'none',
  },
  graphite: {
    tile: '#141414',
    base: '#1C1C1C',
    mid: '#4A4A4A',
    rim: '#BEA98E',
    shine: '#A3A3A3',
    texture: 'mesh',
  },
  stone: {
    tile: '#2C2C2C',
    base: '#9C9285',
    mid: '#D9D2C7',
    rim: '#BEA98E',
    shine: '#FAF7F2',
    texture: 'speckle',
  },
};

export function isLogoVariant(value: unknown): value is LogoVariant {
  return typeof value === 'string' && (LOGO_VARIANTS as readonly string[]).includes(value);
}

/** Mittelpunkt des Rings im 220er-Raster (Drehpunkt der Animation) */
export const LOGO_CENTER = 110;
const ARC = 'M152.4 73.6 A60 60 0 1 1 60.9 81.6';
const SPACE = 'filterUnits="userSpaceOnUse" x="-400" y="-400" width="1020" height="1020"';

export interface LogoSvgOptions {
  /** Präfix für IDs (Masken, Filter); muss je Dokument eindeutig sein */
  id?: string;
  /** `rounded` = App-Icon, `square` = vollflächig (maskable/Apple), `none` = nur Ring und Kugel */
  shape?: 'rounded' | 'square' | 'none';
  /** Größe des Motivs (1 = wie im Entwurf), z. B. kleiner für die sichere Zone */
  scale?: number;
  /** Feste Pixelgröße; ohne füllt das SVG seinen Container */
  size?: number;
  /** Text für Screenreader; ohne ist das Logo nur Schmuck */
  label?: string;
}

/**
 * Logo als SVG-Text (220 × 220). Ring und Kugel tragen die Klassen `logo-ring` und `logo-ball`
 * für die Startanimation.
 */
export function logoSvg(variant: LogoVariant, options: LogoSvgOptions = {}): string {
  const { id = 'logo', shape = 'rounded', scale = 1, size, label } = options;
  const c = LOGO_COLORS[variant];
  const arc = (attrs: string) => `<path d="${ARC}" fill="none" stroke-linecap="round" ${attrs}/>`;
  const texture =
    c.texture === 'mesh'
      ? `<rect x="-100" y="-100" width="420" height="420" fill="url(#${id}-mesh)" opacity="0.55"/>`
      : c.texture === 'speckle'
        ? `<rect width="220" height="220" filter="url(#${id}-sp0)"/><rect width="220" height="220" filter="url(#${id}-sp1)"/>`
        : '';
  const textureDefs =
    c.texture === 'mesh'
      ? `<pattern id="${id}-mesh" width="2.8" height="2.8" patternUnits="userSpaceOnUse" patternTransform="rotate(28)"><circle cx="0.7" cy="0.7" r="0.48" fill="#000"/><circle cx="2.1" cy="2.1" r="0.48" fill="#000"/></pattern>`
      : c.texture === 'speckle'
        ? `<filter id="${id}-sp0" ${SPACE}><feTurbulence type="fractalNoise" baseFrequency="1.5" numOctaves="2" seed="7"/><feColorMatrix type="matrix" values="0 0 0 0 0.12  0 0 0 0 0.12  0 0 0 0 0.12  12 0 0 0 -8.6"/></filter><filter id="${id}-sp1" ${SPACE}><feTurbulence type="fractalNoise" baseFrequency="1.5" numOctaves="2" seed="19"/><feColorMatrix type="matrix" values="0 0 0 0 0.55  0 0 0 0 0.47  0 0 0 0 0.37  12 0 0 0 -8.2"/></filter>`
        : '';
  const background =
    shape === 'rounded'
      ? `<rect width="220" height="220" rx="50" fill="${c.tile}"/>`
      : shape === 'square'
        ? `<rect width="220" height="220" fill="${c.tile}"/>`
        : '';
  const motif =
    scale === 1
      ? ''
      : ` transform="translate(${LOGO_CENTER} ${LOGO_CENTER}) scale(${scale}) translate(-${LOGO_CENTER} -${LOGO_CENTER})"`;
  const sizeAttrs = size ? ` width="${size}" height="${size}"` : '';
  const a11y = label ? ` role="img" aria-label="${label}"` : ' aria-hidden="true"';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220"${sizeAttrs}${a11y}>` +
    `<defs>` +
    `<mask id="${id}-m" maskUnits="userSpaceOnUse" x="-400" y="-400" width="1020" height="1020">${arc('stroke="#fff" stroke-width="38"')}</mask>` +
    `<filter id="${id}-b1" ${SPACE}><feGaussianBlur stdDeviation="3"/></filter>` +
    `<filter id="${id}-b2" ${SPACE}><feGaussianBlur stdDeviation="5.1"/></filter>` +
    `<filter id="${id}-gr" ${SPACE}><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3"/><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0.9 0 0 0 -0.35"/></filter>` +
    textureDefs +
    `<radialGradient id="${id}-bg" cx="0.5" cy="0.5" fx="0.33" fy="0.28" r="0.62"><stop offset="0" stop-color="${c.shine}"/><stop offset="0.45" stop-color="${c.mid}"/><stop offset="1" stop-color="${c.base}"/></radialGradient>` +
    `<filter id="${id}-bs" filterUnits="userSpaceOnUse" x="66" y="6" width="88" height="88"><feGaussianBlur stdDeviation="3.8"/></filter>` +
    `</defs>` +
    background +
    `<g${motif}>` +
    `<g class="logo-ring">` +
    arc(
      'stroke="#000" stroke-width="38" opacity="0.5" transform="translate(2.5 6.1)" filter="url(#' +
        id +
        '-b2)"',
    ) +
    `<g mask="url(#${id}-m)">` +
    arc(`stroke="${c.base}" stroke-width="38"`) +
    arc(
      `stroke="${c.mid}" stroke-width="27.4" transform="translate(-2.3 -3)" filter="url(#${id}-b1)"`,
    ) +
    arc(
      `stroke="${c.rim}" stroke-width="5.3" opacity="0.55" transform="translate(11.4 12.9)" filter="url(#${id}-b1)"`,
    ) +
    arc(
      `stroke="${c.shine}" stroke-width="9.1" opacity="0.9" transform="translate(-6.5 -8.4)" filter="url(#${id}-b2)"`,
    ) +
    texture +
    `<rect width="220" height="220" filter="url(#${id}-gr)" opacity="0.1"/>` +
    `</g></g>` +
    `<g class="logo-ball">` +
    `<circle cx="112.2" cy="55" r="11" fill="#000" opacity="0.4" filter="url(#${id}-bs)"/>` +
    `<circle cx="110" cy="50" r="11" fill="url(#${id}-bg)"/>` +
    `</g></g></svg>`
  );
}

/** Logo als Daten-URL (z. B. für Canvas oder `<link rel="icon">`) */
export function logoDataUrl(variant: LogoVariant, options: LogoSvgOptions = {}): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(logoSvg(variant, options))}`;
}
