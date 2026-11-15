import type { ReactNode } from 'react';
import { Icon } from './icons';

/**
 * Aufklappbare Karte (z. B. Anleitungen, übersprungene Einträge). Seit 22d dreht sich der Pfeil
 * weich, der Inhalt blendet ein (`.details-body` in `index.css`).
 */
export function Details({ summary, children }: { summary: string; children: ReactNode }) {
  return (
    <details className="group mb-4 rounded-xl bg-surface p-3">
      <summary className="flex min-h-11 cursor-pointer items-center gap-2 font-medium">
        <span className="min-w-0 flex-1">{summary}</span>
        <Icon
          name="chevronDown"
          className="h-4 w-4 text-faint group-open:rotate-180 motion-safe:transition-[rotate] motion-safe:duration-200"
        />
      </summary>
      <div className="details-body mt-2">{children}</div>
    </details>
  );
}
