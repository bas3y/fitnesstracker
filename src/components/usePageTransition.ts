import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motionAllowed } from './motion';

/**
 * Blendet den Seiteninhalt beim Wechsel der Seite kurz ein. Nur Deckkraft (kein `transform`),
 * sonst würden feste Leisten der Seite während der Animation mitwandern.
 * Nur der Pfad zählt: Wechsel von Tag, Zeitraum oder Filter (`?…`) bleiben ruhig.
 */
export function usePageTransition() {
  const ref = useRef<HTMLElement>(null);
  const { pathname } = useLocation();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!motionAllowed()) return;
    ref.current?.animate?.([{ opacity: 0 }, { opacity: 1 }], {
      duration: 180,
      easing: 'ease-out',
    });
  }, [pathname]);

  return ref;
}
