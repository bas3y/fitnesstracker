import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

export function Page({
  title,
  backTo,
  backState,
  action,
  children,
}: {
  title: string;
  /** Unterseiten: Ziel des Zurück-Links */
  backTo?: string;
  /** Reicht die Herkunft an die übergeordnete Seite weiter (siehe `useBackTo`) */
  backState?: unknown;
  /** Schaltfläche rechts neben der Überschrift (z. B. „Anpassen“) */
  action?: ReactNode;
  children: ReactNode;
}) {
  const heading = (
    <h1 className="min-w-0 flex-1 text-[1.75rem] leading-tight font-bold tracking-tight text-balance">
      {title}
    </h1>
  );
  return (
    <div className="mx-auto max-w-md px-4 pt-[calc(1.25rem+env(safe-area-inset-top))]">
      {backTo && (
        <Link
          to={backTo}
          state={backState}
          className="-ml-3 inline-flex min-h-11 items-center gap-0.5 px-2 text-[0.9375rem] font-medium text-primary-text"
        >
          <ChevronLeftIcon className="h-5 w-5" />
          Zurück
        </Link>
      )}
      <div className="mb-4 flex items-center gap-3">
        {heading}
        {action}
      </div>
      {children}
    </div>
  );
}

/** Farbblock aus der Palette (Variante C), siehe `.tone-*` in `src/index.css` */
export type CardTone = 'hero' | 'accent' | 'soft';

export function Card({
  title,
  tone,
  children,
}: {
  title?: string;
  tone?: CardTone;
  children: ReactNode;
}) {
  return (
    <section className={`mb-4 rounded-2xl bg-surface ${tone ? `tone-${tone} p-5` : 'p-4'}`}>
      {title && <h2 className="mb-3 text-[1.0625rem] font-semibold">{title}</h2>}
      {children}
    </section>
  );
}

export function PlaceholderPage({
  title,
  text,
  children,
}: {
  title: string;
  text: string;
  children?: ReactNode;
}) {
  return (
    <Page title={title}>
      <Card>
        <p className="text-muted">{text}</p>
      </Card>
      {children}
    </Page>
  );
}

/**
 * Große, tippbare Zeile mit Pfeil – für Verweise auf Unterseiten.
 * `handle` = Griff zum Sortieren, `action` = Schaltfläche am Zeilenende (z. B. Löschen).
 */
export function LinkRow({
  to,
  state,
  label,
  hint,
  handle,
  action,
}: {
  to: string;
  state?: unknown;
  label: string;
  hint?: string;
  handle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-2 flex min-h-14 items-center rounded-2xl bg-surface">
      {handle}
      <Link
        to={to}
        state={state}
        className="flex min-h-14 min-w-0 flex-1 items-center justify-between gap-3 rounded-2xl px-4 py-3 active:bg-pressed"
      >
        <span className="min-w-0">
          <span className="block font-medium">{label}</span>
          {hint && <span className="block text-sm text-muted">{hint}</span>}
        </span>
        <ChevronRightIcon className="h-5 w-5 shrink-0 text-faint" />
      </Link>
      {action}
    </div>
  );
}
