import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '../../components/icons';
import { setHabitDone, type HabitWithChecks } from '../../db/habits';
import type { DayKey } from '../../db/types';
import { formatDayKey } from '../../domain/stats';
import {
  dayAmount,
  formatHabitAmount,
  formatMonth,
  isHabitDue,
  isPausedOn,
  monthOf,
  monthWeeks,
  shiftMonth,
} from '../../domain/habits';
import { WEEKDAYS } from '../../domain/plans';

const monthButton =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl font-semibold active:bg-subtle disabled:opacity-40';

/**
 * Monatsansicht; Antippen trägt einen Tag nach oder nimmt ihn zurück. Bei „Aufhören“ nur Anzeige
 * (Akzent = im Limit, Hervorhebung = darüber), Mengen werden auf der Alltag-Seite eingetragen.
 */
export function HabitCalendar({ item, today }: { item: HabitWithChecks; today: DayKey }) {
  const { habit, dates, entries } = item;
  const currentMonth = monthOf(today);
  const [month, setMonth] = useState(currentMonth);

  const cell = (day: DayKey) => {
    const paused = isPausedOn(habit, day);
    if (habit.kind === 'quit') {
      const amount = dayAmount(entries, day);
      const counted = day <= today && day >= (habit.startDate ?? today);
      return (
        <DayCell
          key={day}
          day={day}
          today={today}
          state={!counted || paused ? 'off' : amount > habit.target ? 'warn' : 'done'}
          detail={
            paused ? 'pausiert' : amount > 0 ? formatHabitAmount(amount, habit.unit) : undefined
          }
        />
      );
    }
    const checked = dates.includes(day);
    // Erledigte Tage bleiben änderbar, auch wenn die Wochentage inzwischen andere sind
    const disabled = day > today || (!isHabitDue(habit, day) && !checked);
    return (
      <DayCell
        key={day}
        day={day}
        today={today}
        state={checked ? 'done' : disabled ? 'off' : 'open'}
        detail={paused ? 'pausiert' : undefined}
        pressed={checked}
        onClick={disabled ? undefined : () => void setHabitDone(habit, day, !checked)}
      />
    );
  };

  return (
    <div className="-mx-2">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          aria-label="Vorheriger Monat"
          className={monthButton}
          onClick={() => setMonth(shiftMonth(month, -1))}
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <h3 className="font-semibold">{formatMonth(month)}</h3>
        <button
          type="button"
          aria-label="Nächster Monat"
          className={monthButton}
          disabled={month >= currentMonth}
          onClick={() => setMonth(shiftMonth(month, 1))}
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>
      <div aria-hidden="true" className="grid grid-cols-7 text-center text-xs text-muted">
        {WEEKDAYS.map(({ label }) => (
          <span key={label} className="py-1">
            {label}
          </span>
        ))}
      </div>
      <div role="group" aria-label="Kalender" className="grid grid-cols-7">
        {monthWeeks(month)
          .flat()
          .map((day, index) => (day ? cell(day) : <span key={index} />))}
      </div>
    </div>
  );
}

const STATE_CLASSES = {
  done: 'bg-primary text-on-primary',
  warn: 'bg-mark text-surface',
  open: 'bg-subtle',
  off: 'text-faint',
};

function DayCell({
  day,
  today,
  state,
  detail,
  pressed,
  onClick,
}: {
  day: DayKey;
  today: DayKey;
  state: keyof typeof STATE_CLASSES;
  detail?: string;
  /** Nur bei antippbaren Tagen */
  pressed?: boolean;
  onClick?: () => void;
}) {
  const label = [formatDayKey(day), detail].filter(Boolean).join(', ');
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      disabled={!onClick}
      className="flex aspect-square min-h-11 items-center justify-center p-0.5"
      onClick={onClick}
    >
      <span
        className={`flex h-full w-full items-center justify-center rounded-lg text-sm tabular-nums ${STATE_CLASSES[state]} ${
          day === today ? 'outline-2 outline-muted' : ''
        } ${detail === 'pausiert' ? 'opacity-50' : ''}`}
      >
        {Number(day.slice(8))}
      </span>
    </button>
  );
}
