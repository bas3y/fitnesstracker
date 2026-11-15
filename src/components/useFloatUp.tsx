import { useCallback, useState } from 'react';
import { motionAllowed } from './motion';

const FLOAT_MS = 900;
let nextId = 1;

/**
 * Betrag schwebt nach einem Schnell-Eintrag kurz über dem Knopf auf (22d, Q1). `floats` gehört
 * in den Knopf (der dafür `relative` braucht), `float('+250 ml')` startet es.
 */
export function useFloatUp() {
  const [items, setItems] = useState<{ id: number; text: string }[]>([]);
  const float = useCallback((text: string) => {
    if (!motionAllowed()) return;
    const id = nextId++;
    setItems((list) => [...list, { id, text }]);
    setTimeout(() => setItems((list) => list.filter((item) => item.id !== id)), FLOAT_MS);
  }, []);
  const floats = items.map(({ id, text }) => (
    <span
      key={id}
      aria-hidden="true"
      className="anim-float-up pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 text-sm font-bold whitespace-nowrap text-primary-text"
    >
      {text}
    </span>
  ));
  return { float, floats };
}
