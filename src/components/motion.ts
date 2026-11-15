import { useEffect, useRef, useState } from 'react';
import { LEAVE_MS, nextLeavingIds } from '../domain/motion';

/**
 * Animationen (seit 22d): an, solange weder „Bewegung reduzieren“ (System) noch der Schalter
 * „Animationen“ (`Settings.animations`, Einstellungen → Darstellung) aus ist. Der Schalter setzt
 * `data-motion="off"` am `<html>` (das Script in `index.html` liest ihn vor dem ersten Rendern aus
 * `localStorage`), `index.css` schaltet dann alle Animationen und Übergänge ab.
 */
export const MOTION_STORAGE_KEY = 'motion';

/** Ob gerade animiert werden darf; ohne `matchMedia` (Tests) nie */
export function motionAllowed(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  if (document.documentElement.dataset.motion === 'off') return false;
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function applyMotion(enabled: boolean): void {
  try {
    localStorage.setItem(MOTION_STORAGE_KEY, enabled ? 'on' : 'off');
  } catch {
    // privater Modus: gilt dann nur für diese Sitzung
  }
  if (enabled) delete document.documentElement.dataset.motion;
  else document.documentElement.dataset.motion = 'off';
}

export function useApplyMotion(enabled: boolean | undefined): void {
  useEffect(() => {
    if (enabled !== undefined) applyMotion(enabled);
  }, [enabled]);
}

/** Ob sich der Wert seit dem ersten Rendern geändert hat (Animation nur nach Änderungen) */
export function useChangedSinceMount<T>(value: T): boolean {
  const [initial] = useState(value);
  const [changed, setChanged] = useState(false);
  if (!changed && !Object.is(value, initial)) setChanged(true);
  return changed;
}

/** Kurz `true`, nachdem `reached` von nein auf ja gewechselt hat (nicht beim Öffnen) */
export function useJustReached(reached: boolean, durationMs = 1100): boolean {
  const [previous, setPrevious] = useState(reached);
  const [active, setActive] = useState(false);
  if (previous !== reached) {
    setPrevious(reached);
    setActive(reached && motionAllowed());
  }
  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setActive(false), durationMs);
    return () => clearTimeout(timer);
  }, [active, durationMs]);
  return active;
}

/** Spielt eine Animation (Web Animations API) ab, wenn sich `value` ändert – nicht beim Öffnen */
export function useAnimateOnChange<T extends Element>(
  value: unknown,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions,
) {
  const ref = useRef<T>(null);
  const previous = useRef(value);
  useEffect(() => {
    if (Object.is(previous.current, value)) return;
    previous.current = value;
    if (motionAllowed()) ref.current?.animate?.(keyframes, options);
  }, [value, keyframes, options]);
  return ref;
}

const NONE: ReadonlySet<string> = new Set();

/**
 * Abgehakte Zeilen bleiben kurz in der offenen Liste und gleiten hinaus (`anim-leave`), bevor sie
 * in „erledigt“ wandern. `scope` (z. B. der Tag) wechselt die Liste ohne Animation.
 */
export function useLeavingIds(openIds: readonly string[], scope: string): ReadonlySet<string> {
  const [state, setState] = useState({ open: openIds, scope, leaving: NONE });
  let current = state;
  if (state.scope !== scope) {
    current = { open: openIds, scope, leaving: NONE };
    setState(current);
  } else if (state.open.join('\n') !== openIds.join('\n')) {
    const leaving = motionAllowed() ? nextLeavingIds(state.open, openIds, state.leaving) : NONE;
    current = { open: openIds, scope, leaving: leaving.size === 0 ? NONE : leaving };
    setState(current);
  }
  const { leaving } = current;
  useEffect(() => {
    if (leaving.size === 0) return;
    const timer = setTimeout(
      () => setState((previous) => ({ ...previous, leaving: NONE })),
      LEAVE_MS,
    );
    return () => clearTimeout(timer);
  }, [leaving]);
  return leaving;
}
