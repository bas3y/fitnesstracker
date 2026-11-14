import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon } from './icons';
import { PAGE_WIDTH, type PageWidth } from './pageLayout';

/**
 * Mitlaufender Kopf (22b, Variante B): Erscheint, sobald die Überschrift aus dem Bild ist – mit
 * Seitenname, Zurück und der Kopf-Aktion (z. B. Anpassen-Stift). Der Name ist nur Optik, die
 * Überschrift (`h1`) bleibt für Screenreader die der Seite.
 */
export function CompactHeader({
  title,
  backTo,
  backState,
  action,
  width = 'normal',
  inPane = false,
}: {
  title: string;
  backTo?: string;
  backState?: unknown;
  action?: ReactNode;
  /** Wie die Seite, damit die Aktion über ihrem Platz bleibt */
  width?: PageWidth;
  /**
   * Detail neben einer Liste (`SplitView`): nur über der eigenen Spalte. Klebt oben, ohne Höhe
   * (kein Springen des Inhalts), die Leiste hängt darunter.
   */
  inPane?: boolean;
}) {
  const bar = (
    <div
      data-testid="compact-header"
      // Rechts der Seitenleiste (`--nav-left`, ab `xl`)
      className={`anim-fade-in z-30 border-b border-line bg-surface/90 backdrop-blur ${
        inPane
          ? 'absolute inset-x-0 top-0'
          : 'fixed top-0 right-0 left-(--nav-left) pt-[env(safe-area-inset-top)]'
      }`}
    >
      <div className={`${inPane ? 'px-4' : PAGE_WIDTH[width]} flex h-14 items-center gap-2`}>
        {backTo && (
          <Link
            to={backTo}
            state={backState}
            aria-label="Zurück"
            className="-ml-2 flex h-11 w-9 shrink-0 items-center justify-center text-primary-text"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </Link>
        )}
        <p aria-hidden="true" className="min-w-0 flex-1 truncate text-[1.0625rem] font-semibold">
          {title}
        </p>
        {action}
      </div>
    </div>
  );
  return inPane ? <div className="sticky top-0 z-30 -mx-4 h-0">{bar}</div> : bar;
}
