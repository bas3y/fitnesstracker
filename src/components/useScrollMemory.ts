import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { scrollRoot } from './scrollRoot';

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
 * Gescrollt wird der Inhaltsbereich (`scrollRoot()`), nicht das Fenster.
 */
export function useScrollMemory(): void {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  const current = useRef<string | null>(null);

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    const root = scrollRoot();
    const onScroll = () => {
      if (current.current) positions.set(current.current, root.scrollTop);
    };
    root.addEventListener('scroll', onScroll, { passive: true });
    return () => root.removeEventListener('scroll', onScroll);
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
    scrollRoot().scrollTop = 0;
  }, [pathname, navigationType]);
}

/** Scrollt wiederholt zur Höhe, bis sie erreicht ist; Antippen/Scrollen durch den Nutzer bricht ab */
function restoreScroll(y: number): () => void {
  const root = scrollRoot();
  let frame = 0;
  const started = performance.now();
  const stop = () => {
    cancelAnimationFrame(frame);
    window.removeEventListener('touchstart', stop);
    window.removeEventListener('wheel', stop);
  };
  const step = () => {
    root.scrollTop = y;
    if (Math.abs(root.scrollTop - y) < 2 || performance.now() - started > RESTORE_MS) return stop();
    frame = requestAnimationFrame(step);
  };
  window.addEventListener('touchstart', stop, { passive: true });
  window.addEventListener('wheel', stop, { passive: true });
  step();
  return stop;
}
