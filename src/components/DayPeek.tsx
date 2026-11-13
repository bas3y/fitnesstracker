import type { ReactNode } from 'react';

/**
 * Antipp-Vorschau eines Tages (22b, Variante B): Zeile unter Balken/Punkten mit Tag, Wert und
 * großen Knöpfen. Wird angesagt, wenn sich der Tag ändert. Bewusst ohne Widget-Bezug, damit sie
 * später in der Schnellansicht (32b) wiederverwendet werden kann.
 */
export function DayPeek({
  day,
  value,
  children,
}: {
  /** z. B. „Heute“ oder „Mi., 11. Nov.“ */
  day: string;
  value: ReactNode;
  /** Knöpfe/Links für diesen Tag */
  children?: ReactNode;
}) {
  return (
    <div data-testid="day-peek" className="mt-3 flex flex-col gap-2 border-t border-line pt-3">
      <div aria-live="polite" className="flex items-baseline justify-between gap-3">
        <span className="font-semibold">{day}</span>
        <span className="min-w-0 text-right text-sm text-muted tabular-nums">{value}</span>
      </div>
      {children && <div className="flex gap-2 *:flex-1">{children}</div>}
    </div>
  );
}
