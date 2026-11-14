import { createContext, use, useSyncExternalStore } from 'react';

/** In welcher Spalte einer `SplitView` eine Seite steht (`null` = allein) */
export type SplitPane = 'list' | 'detail' | null;

export const PaneContext = createContext<SplitPane>(null);

export function useSplitPane(): SplitPane {
  return use(PaneContext);
}

/**
 * Breiten des Seiteninhalts (seit 22c). Handy hoch bleibt `max-w-md`, ab `sm` (Handy quer, Tablet,
 * Desktop) wird der Inhalt breiter. `wide` für Seiten mit Raster (Startseite, Kacheln, Statistik,
 * Liste mit Detail): Platz für 4 bzw. ab `lg` 6 Felder (siehe `WIDGET_FIELDS`).
 * Seitenabstand mindestens 1 rem, im Querformat auch neben der Notch.
 */
export type PageWidth = 'normal' | 'wide';

const SIDE_PADDING =
  'pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]';

export const PAGE_WIDTH: Record<PageWidth, string> = {
  normal: `mx-auto w-full max-w-md sm:max-w-2xl ${SIDE_PADDING}`,
  wide: `mx-auto w-full max-w-md sm:max-w-3xl lg:max-w-6xl ${SIDE_PADDING}`,
};

/**
 * Vollbild-Auswahl (Übungen, Lebensmittel): am Handy und Tablet hoch ganzer Bildschirm, ab `lg`
 * großes Fenster in der Mitte (22c, Variante F1) über `PICKER_SCRIM`. Das Fenster scrollt selbst.
 */
export const PICKER_DIALOG =
  'fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-page outline-none lg:inset-auto lg:top-1/2 lg:left-1/2 lg:h-[min(85dvh,56rem)] lg:w-[min(42rem,calc(100vw-4rem))] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-3xl lg:shadow-2xl';
export const PICKER_SCRIM = 'anim-fade-in fixed inset-0 z-50 hidden bg-scrim lg:block';

/** Liste mit Detail daneben (L1) ab dieser Breite */
export const LARGE_SCREEN_QUERY = '(min-width: 64rem)';

function subscribe(query: string) {
  return (onChange: () => void) => {
    if (typeof window.matchMedia !== 'function') return () => {};
    const list = window.matchMedia(query);
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  };
}

const subscribers = new Map<string, (onChange: () => void) => () => void>();

/** Ob die Media-Query gerade zutrifft (aktualisiert sich beim Drehen/Größe ändern) */
export function useMediaQuery(query: string): boolean {
  let subscriber = subscribers.get(query);
  if (!subscriber) {
    subscriber = subscribe(query);
    subscribers.set(query, subscriber);
  }
  return useSyncExternalStore(
    subscriber,
    () => typeof window.matchMedia === 'function' && window.matchMedia(query).matches,
    () => false,
  );
}

export function useLargeScreen(): boolean {
  return useMediaQuery(LARGE_SCREEN_QUERY);
}
