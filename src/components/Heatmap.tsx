import { useLayoutEffect, useRef } from 'react';
import { formatDayKey, heatLevel, heatmapWeeks, parseDayKey } from '../domain/stats';

const LEVEL_CLASSES = [
  'bg-slate-100 dark:bg-slate-700',
  'bg-emerald-200 dark:bg-emerald-900',
  'bg-emerald-400 dark:bg-emerald-700',
  'bg-emerald-600 dark:bg-emerald-500',
  'bg-emerald-800 dark:bg-emerald-300',
];
const WEEKDAY_LABELS = ['Mo', '', 'Mi', '', 'Fr', '', ''];
const CELL = 'h-4 w-4 shrink-0';

/**
 * Jahresansicht wie bei GitHub: scrollbar, damit die Felder antippbar bleiben, Start bei heute.
 * `values` = Wert je lokalem Tag (`YYYY-MM-DD`), die Farbe folgt `heatLevel`.
 */
export function Heatmap({
  values,
  now,
  weekCount = 53,
  selectedKey,
  onSelect,
  describe,
  level = heatLevel,
}: {
  values: ReadonlyMap<string, number>;
  now: Date;
  weekCount?: number;
  selectedKey?: string | null;
  onSelect?: (key: string) => void;
  /** Text für Screenreader, z. B. „5 Sätze“ */
  describe: (value: number) => string;
  /** Farbstufe 0–4 je Wert; Standard nach Anzahl der Sätze */
  level?: (value: number) => 0 | 1 | 2 | 3 | 4;
}) {
  const weeks = heatmapWeeks(values, now, weekCount);
  const scroller = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (scroller.current) scroller.current.scrollLeft = scroller.current.scrollWidth;
  }, []);

  return (
    <div className="flex gap-[3px]">
      <div aria-hidden="true" className="flex shrink-0 flex-col gap-[3px] pt-5">
        {WEEKDAY_LABELS.map((label, index) => (
          <span
            key={index}
            className="h-4 text-[10px] leading-4 text-slate-500 dark:text-slate-400"
          >
            {label}
          </span>
        ))}
      </div>
      <div ref={scroller} data-testid="heatmap" className="min-w-0 overflow-x-auto pr-1 pb-2">
        <div className="flex w-max gap-[3px]">
          {weeks.map((days, weekIndex) => {
            const newMonth = days.find((day) => day?.isFirstOfMonth);
            return (
              <div key={weekIndex} className="flex w-4 shrink-0 flex-col gap-[3px]">
                <span
                  aria-hidden="true"
                  className="h-4 text-[10px] leading-4 whitespace-nowrap text-slate-500 dark:text-slate-400"
                >
                  {newMonth &&
                    parseDayKey(newMonth.key).toLocaleDateString('de-DE', { month: 'short' })}
                </span>
                {days.map((day, dayIndex) =>
                  day ? (
                    <button
                      key={day.key}
                      type="button"
                      aria-label={`${formatDayKey(day.key)}: ${describe(day.value)}`}
                      aria-pressed={day.key === selectedKey}
                      className={`${CELL} rounded-[3px] ${LEVEL_CLASSES[level(day.value)]} ${
                        day.key === selectedKey ? 'outline-2 outline-slate-500' : ''
                      }`}
                      onClick={() => onSelect?.(day.key)}
                    />
                  ) : (
                    <span key={dayIndex} className={CELL} />
                  ),
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
