import type { ReactNode } from 'react';

/** Aufklappbare Karte (z. B. Anleitungen, übersprungene Einträge) */
export function Details({ summary, children }: { summary: string; children: ReactNode }) {
  return (
    <details className="mb-4 rounded-xl bg-white p-3 shadow-sm dark:bg-slate-800">
      <summary className="flex min-h-11 cursor-pointer items-center font-medium">{summary}</summary>
      <div className="mt-2">{children}</div>
    </details>
  );
}
