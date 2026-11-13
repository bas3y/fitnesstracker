/**
 * Mindestdauer des Ladebildschirms ab Seitenstart: Animation (siehe `SPLASH_CSS`, ca. 1,25 s) plus
 * kurzes Stehenbleiben des Schriftzugs – auch wenn die App schon früher bereit ist
 */
export const SPLASH_ANIMATION_MS = 1900;
const FADE_MS = 400;

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
    // App unter dem ausblendenden Ladebildschirm zeigen (`SPLASH_ACTIVE_CLASS` in splashHtml.ts)
    document.documentElement.classList.remove('splash-on');
    splash.classList.add('splash-hidden');
    window.setTimeout(() => splash.remove(), reducedMotion() ? 0 : FADE_MS);
  }, wait);
}
