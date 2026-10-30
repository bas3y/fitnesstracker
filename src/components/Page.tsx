import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function Page({
  title,
  backTo,
  children,
}: {
  title: string;
  /** Unterseiten: Ziel des Zurück-Links */
  backTo?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-md px-4 pt-[calc(1.5rem+env(safe-area-inset-top))]">
      {backTo && (
        <Link
          to={backTo}
          className="-ml-2 mb-1 inline-flex min-h-11 items-center px-2 text-sm font-medium text-emerald-700 dark:text-emerald-400"
        >
          ‹ Zurück
        </Link>
      )}
      <h1 className="mb-4 text-2xl font-bold">{title}</h1>
      {children}
    </div>
  );
}

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="mb-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
      {title && <h2 className="mb-3 text-lg font-semibold">{title}</h2>}
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
        <p className="text-slate-600 dark:text-slate-400">{text}</p>
      </Card>
      {children}
    </Page>
  );
}

/** Große, tippbare Zeile mit Pfeil – für Verweise auf Unterseiten; `handle` = Griff zum Sortieren */
export function LinkRow({
  to,
  label,
  hint,
  handle,
}: {
  to: string;
  label: string;
  hint?: string;
  handle?: ReactNode;
}) {
  return (
    <div className="mb-2 flex min-h-14 items-center rounded-2xl bg-white shadow-sm dark:bg-slate-800">
      {handle}
      <Link
        to={to}
        className="flex min-h-14 min-w-0 flex-1 items-center justify-between gap-3 rounded-2xl px-4 py-3 active:bg-slate-50 dark:active:bg-slate-700"
      >
        <span className="min-w-0">
          <span className="block font-medium">{label}</span>
          {hint && <span className="block text-sm text-slate-500 dark:text-slate-400">{hint}</span>}
        </span>
        <span aria-hidden="true" className="text-xl text-slate-400">
          ›
        </span>
      </Link>
    </div>
  );
}
