import { WORDMARK_NAME, WORDMARK_TAGLINE } from './wordmark.ts';

/** Größe des Untertitels im Verhältnis zum Namen (wie im Entwurf: 22 px zu 112 px) */
const TAGLINE_SCALE = 0.2;
const GAP = 10;

export interface WordmarkOptions {
  /** Farbe des Namens; Standard `currentColor` */
  color?: string;
  /** Farbe des Untertitels; ohne = kein Untertitel */
  taglineColor?: string;
  label?: string;
}

/** Schriftzug „Basey“ (optional mit „Fitness & Lifestyle“) als SVG-Text */
export function wordmarkSvg(options: WordmarkOptions = {}): string {
  const { color = 'currentColor', taglineColor, label = 'Basey' } = options;
  const taglineY = WORDMARK_NAME.height + GAP;
  const height = taglineColor
    ? taglineY + WORDMARK_TAGLINE.height * TAGLINE_SCALE
    : WORDMARK_NAME.height;
  const tagline = taglineColor
    ? `<path transform="translate(2 ${taglineY}) scale(${TAGLINE_SCALE})" fill="${taglineColor}" d="${WORDMARK_TAGLINE.d}"/>`
    : '';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WORDMARK_NAME.width} ${height}" role="img" aria-label="${label}">` +
    `<path class="wordmark-name" fill="${color}" d="${WORDMARK_NAME.d}"/>` +
    tagline +
    `</svg>`
  );
}

/** Seitenverhältnis (Breite / Höhe) des Schriftzugs */
export function wordmarkAspect(withTagline: boolean): number {
  const height = withTagline
    ? WORDMARK_NAME.height + GAP + WORDMARK_TAGLINE.height * TAGLINE_SCALE
    : WORDMARK_NAME.height;
  return WORDMARK_NAME.width / height;
}
