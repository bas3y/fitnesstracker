/**
 * Seit 22b scrollt nicht mehr die ganze Seite, sondern nur der Inhaltsbereich im `Layout`
 * (`data-scroll-root`). Die Navigation liegt außerhalb und kann sich so nicht mehr verschieben
 * (iPhone: Leiste stand mitten im Bild). Ohne Layout (Tests, Fehlerseite) gilt das Dokument.
 */
export const SCROLL_ROOT_ATTRIBUTE = 'data-scroll-root';

export function scrollRoot(): HTMLElement {
  return (
    document.querySelector<HTMLElement>(`[${SCROLL_ROOT_ATTRIBUTE}]`) ??
    (document.scrollingElement as HTMLElement | null) ??
    document.documentElement
  );
}

/** Sperrt das Scrollen der Seite (z. B. hinter einer Vollbild-Auswahl); gibt das Entsperren zurück */
export function lockScroll(): () => void {
  const root = scrollRoot();
  const previous = root.style.overflow;
  root.style.overflow = 'hidden';
  return () => {
    root.style.overflow = previous;
  };
}
