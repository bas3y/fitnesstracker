import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/** Gemerkte Scrollhöhe je Seite (Pfad), solange die App offen ist */
const positions = new Map<string, number>();
/** Zuletzt besuchte Seiten (Pfade), um „Zurück“-Links zu erkennen */
const trail: string[] = [];
const RESTORE_MS = 1500;

/**
 * Scrollhöhe beim Zurückgehen wiederherstellen, neue Seiten oben beginnen.
 * „Zurück“ = Browser-Zurück oder ein Link auf die vorherige Seite (z. B. `useBackTo`, „Fertig“).
 * Wechsel nur der Parameter (`?date=…`, Filter) lassen die Scrollhöhe in Ruhe.
 * Seiten laden ihre Daten nach: Wiederherstellen wird kurz wiederholt, bis die Seite hoch genug ist.
 */
export function useScrollMemory(): void {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  const current = useRef<string | null>(null);

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    const onScroll = () => {
      if (current.current) positions.set(current.current, window.scrollY);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useLayoutEffect(() => {
    const previous = current.current;
    current.current = pathname;
    if (previous === pathname) return;
    if (previous === null) {
      trail.push(pathname);
      return;
    }
    if (navigationType === 'REPLACE') {
      trail[trail.length - 1] = pathname;
      return;
    }
    const back = navigationType === 'POP' || trail.at(-2) === pathname;
    if (back) {
      if (trail.at(-2) === pathname) trail.pop();
      else trail.push(pathname);
      return restoreScroll(positions.get(pathname) ?? 0);
    }
    trail.push(pathname);
    if (trail.length > 50) trail.shift();
    window.scrollTo(0, 0);
  }, [pathname, navigationType]);
}

/** Scrollt wiederholt zur Höhe, bis sie erreicht ist; Antippen/Scrollen durch den Nutzer bricht ab */
function restoreScroll(y: number): () => void {
  let frame = 0;
  const started = performance.now();
  const stop = () => {
    cancelAnimationFrame(frame);
    window.removeEventListener('touchstart', stop);
    window.removeEventListener('wheel', stop);
  };
  const step = () => {
    window.scrollTo(0, y);
    if (Math.abs(window.scrollY - y) < 2 || performance.now() - started > RESTORE_MS) return stop();
    frame = requestAnimationFrame(step);
  };
  window.addEventListener('touchstart', stop, { passive: true });
  window.addEventListener('wheel', stop, { passive: true });
  step();
  return stop;
}
