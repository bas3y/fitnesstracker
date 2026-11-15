import { useLayoutEffect, useRef, useState } from 'react';
import { canTweenNumberText, COUNT_UP_MS, easeOutCubic, tweenNumberText } from '../domain/motion';
import { motionAllowed } from './motion';

/**
 * Angezeigter Wert, dessen Zahlen beim Ändern hochzählen statt zu springen (22d, G3). Beim Öffnen
 * steht sofort der richtige Wert da; Texte anderer Form („–“ → „1.200“) wechseln direkt.
 */
export function CountUpText({ text }: { text: string }) {
  const [frame, setFrame] = useState<string | null>(null);
  const shown = useRef(text);
  const target = useRef(text);

  useLayoutEffect(() => {
    if (target.current === text) return;
    const from = shown.current;
    target.current = text;
    if (!motionAllowed() || !canTweenNumberText(from, text)) {
      shown.current = text;
      setFrame(null);
      return;
    }
    let id = 0;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / COUNT_UP_MS);
      const value = tweenNumberText(from, text, easeOutCubic(progress));
      shown.current = value;
      setFrame(progress < 1 ? value : null);
      if (progress < 1) id = requestAnimationFrame(step);
    };
    shown.current = from;
    setFrame(from);
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [text]);

  return frame ?? text;
}
