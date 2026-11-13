import { useEffect, useRef, useState } from 'react';

/** Höhe des mitlaufenden Kopfs ohne Safe-Area (h-14) */
const BAR_PX = 56;

/**
 * `true`, sobald das Element (Seitenkopf) oben aus dem Bild gescrollt ist. Beobachtet wird gegen
 * den Bildschirm, das funktioniert auch im Scrollbereich des Layouts.
 */
export function useScrolledPast<T extends Element>() {
  const ref = useRef<T>(null);
  const [past, setPast] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) setPast(!entry.isIntersecting && entry.boundingClientRect.top < BAR_PX);
      },
      { rootMargin: `-${BAR_PX}px 0px 0px 0px` },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, past] as const;
}
