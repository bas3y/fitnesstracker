import { useState } from 'react';
import { setHabitChecked, type HabitWithChecks } from '../../db/habits';
import type { DayKey } from '../../db/types';
import { formatDayKey } from '../../domain/stats';
import { formatMonth, isHabitDue, monthOf, monthWeeks, shiftMonth } from '../../domain/habits';
import { WEEKDAYS } from '../../domain/plans';

const monthButton =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl font-semibold active:bg-slate-100 disabled:opacity-40 dark:active:bg-slate-700';

/** Monatsansicht; Antippen trägt einen Tag nach oder nimmt ihn zurück */
export function HabitCalendar({ item, today }: { item: HabitWithChecks; today: DayKey }) {
  const { habit, dates } = item;
  const currentMonth = monthOf(today);
  const [month, setMonth] = useState(currentMonth);

  return (
    <div className="-mx-2">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          aria-label="Vorheriger Monat"
          className={monthButton}
          onClick={() => setMonth(shiftMonth(month, -1))}
        >
          ‹
        </button>
        <h3 className="font-semibold">{formatMonth(month)}</h3>
        <button
          type="button"
          aria-label="Nächster Monat"
          className={monthButton}
          disabled={month >= currentMonth}
          onClick={() => setMonth(shiftMonth(month, 1))}
        >
          ›
        </button>
      </div>
      <div aria-hidden="true" className="grid grid-cols-7 text-center text-xs text-slate-500">
        {WEEKDAYS.map(({ label }) => (
          <span key={label} className="py-1">
            {label}
          </span>
        ))}
      </div>
      <div role="group" aria-label="Kalender" className="grid grid-cols-7">
        {monthWeeks(month)
          .flat()
          .map((day, index) =>
            day ? (
              <DayCell
                key={day}
                day={day}
                checked={dates.includes(day)}
                isDue={isHabitDue(habit, day)}
                today={today}
                onChange={(checked) => void setHabitChecked(habit.id, day, checked)}
              />
            ) : (
              <span key={index} />
            ),
          )}
      </div>
    </div>
  );
}

function DayCell({
  day,
  checked,
  isDue,
  today,
  onChange,
}: {
  day: DayKey;
  checked: boolean;
  isDue: boolean;
  today: DayKey;
  onChange: (checked: boolean) => void;
}) {
  // Erledigte Tage bleiben änderbar, auch wenn die Wochentage inzwischen andere sind
  const disabled = day > today || (!isDue && !checked);
  const state = checked
    ? 'bg-emerald-700 text-white'
    : disabled
      ? 'text-slate-300 dark:text-slate-600'
      : 'bg-slate-100 dark:bg-slate-700';

  return (
    <button
      type="button"
      aria-label={formatDayKey(day)}
      aria-pressed={checked}
      disabled={disabled}
      className="flex aspect-square min-h-11 items-center justify-center p-0.5"
      onClick={() => onChange(!checked)}
    >
      <span
        className={`flex h-full w-full items-center justify-center rounded-lg text-sm tabular-nums ${state} ${
          day === today ? 'outline-2 outline-slate-500' : ''
        }`}
      >
        {Number(day.slice(8))}
      </span>
    </button>
  );
}
