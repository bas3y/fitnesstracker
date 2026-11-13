import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon } from './icons';

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
}: {
  title: string;
  backTo?: string;
  backState?: unknown;
  action?: ReactNode;
}) {
  return (
    <div
      data-testid="compact-header"
      className="anim-fade-in fixed inset-x-0 top-0 z-30 border-b border-line bg-surface/90 pt-[env(safe-area-inset-top)] backdrop-blur"
    >
      <div className="mx-auto flex h-14 max-w-md items-center gap-2 px-4">
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
}
