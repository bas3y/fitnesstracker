import type { ReactNode } from 'react';
import { Outlet, useMatch } from 'react-router-dom';
import { PaneContext, useLargeScreen } from './pageLayout';

/**
 * Liste mit Detail daneben (22c, Variante L1) als Eltern-Route: Auf großen Bildschirmen steht die
 * Liste links (eigener Scrollbereich, bleibt stehen) und die Detailseite (`<Outlet />`) rechts.
 * Sonst wie bisher: auf dem Listenpfad die Liste, auf `detailPattern` nur das Detail.
 * Seiten in den Spalten erkennen das über `useSplitPane()` (`Page` blendet z. B. „Zurück“ aus).
 */
export function SplitView({
  list,
  detailPattern,
  emptyText,
}: {
  list: ReactNode;
  /** Pfad der Detailseite, z. B. `/training/history/:id` */
  detailPattern: string;
  /** Rechts, solange nichts gewählt ist */
  emptyText: string;
}) {
  const large = useLargeScreen();
  const detail = useMatch(detailPattern) !== null;
  if (!large) return detail ? <Outlet /> : <>{list}</>;
  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-[22rem_minmax(0,1fr)] items-start">
      <PaneContext value="list">
        <div
          data-testid="split-list"
          className="sticky top-0 max-h-[calc(100dvh-var(--nav-bottom))] overflow-y-auto overscroll-contain"
        >
          {list}
        </div>
      </PaneContext>
      <PaneContext value="detail">
        <div data-testid="split-detail" className="min-w-0">
          {detail ? (
            <Outlet />
          ) : (
            <div className="flex min-h-[60dvh] items-center justify-center p-8 text-center text-muted">
              {emptyText}
            </div>
          )}
        </div>
      </PaneContext>
    </div>
  );
}
