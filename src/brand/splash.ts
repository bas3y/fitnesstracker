import { DEFAULT_LOGO_VARIANT, isLogoVariant, type LogoVariant } from './logo';

/**
 * Mindestdauer des Ladebildschirms ab Seitenstart: Animation (siehe `SPLASH_CSS`, ca. 1,5 s) plus
 * kurzes Stehenbleiben des fertigen Logos – auch wenn die App schon früher bereit ist
 */
export const SPLASH_ANIMATION_MS = 2200;
const FADE_MS = 400;

/** Spiegel in localStorage, damit `index.html` die Logo-Variante vor dem Laden der App kennt */
export const LOGO_STORAGE_KEY = 'logo';

/** Zuletzt gewählte Variante (ohne Datenbank, z. B. fürs Teilen-Bild) */
export function storedLogoVariant(): LogoVariant {
  try {
    const value = localStorage.getItem(LOGO_STORAGE_KEY);
    if (isLogoVariant(value)) return value;
  } catch {
    // z. B. privater Modus
  }
  return DEFAULT_LOGO_VARIANT;
}

/** Merkt die Variante für den nächsten Start; iPhone: Icon für „Zum Home-Bildschirm“ */
export function applyLogoVariant(variant: LogoVariant): void {
  try {
    localStorage.setItem(LOGO_STORAGE_KEY, variant);
  } catch {
    // z. B. privater Modus
  }
  const file =
    variant === DEFAULT_LOGO_VARIANT ? 'apple-touch-icon.png' : `apple-touch-icon-${variant}.png`;
  document
    .querySelector('link[rel="apple-touch-icon"]')
    ?.setAttribute('href', `${import.meta.env.BASE_URL}${file}`);
}

const reducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

let hiding = false;

/** Blendet den Ladebildschirm aus, sobald die App bereit ist (frühestens nach der Animation) */
export function hideSplash(): void {
  const splash = document.getElementById('splash');
  if (!splash || hiding) return;
  hiding = true;
  const wait = reducedMotion() ? 0 : Math.max(0, SPLASH_ANIMATION_MS - performance.now());
  window.setTimeout(() => {
    splash.classList.add('splash-hidden');
    window.setTimeout(() => splash.remove(), reducedMotion() ? 0 : FADE_MS);
  }, wait);
}
