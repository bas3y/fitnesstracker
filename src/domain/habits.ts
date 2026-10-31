import type { DayKey, Habit, HabitFrequency, HabitGroup } from '../db/types';
import { dayKey, shiftDay } from './daily';
import { formatWeekdays } from './plans';
import { parseDayKey } from './stats';

export const HABIT_FREQUENCY_LABELS: Record<HabitFrequency, string> = {
  daily: 'Täglich',
  weekly: 'Pro Woche',
  weekdays: 'Wochentage',
};

export const HABIT_GROUP_LABELS: Record<HabitGroup, string> = {
  morning: 'Morgen',
  evening: 'Abend',
  other: 'Sonstiges',
};

/** Überschriften der Checklisten */
export const HABIT_GROUP_TITLES: Record<HabitGroup, string> = {
  morning: 'Morgenroutine',
  evening: 'Abendroutine',
  other: 'Gewohnheiten',
};

/** Auswahl im Formular; als Emoji offline auf jedem Gerät verfügbar */
export const HABIT_ICONS = [
  '⭐',
  '💧',
  '🥗',
  '🍎',
  '💊',
  '🏃',
  '🧘',
  '🤸',
  '🚶',
  '📚',
  '✍️',
  '🧠',
  '😴',
  '🛏️',
  '🪥',
  '🚿',
  '📵',
  '🚭',
  '🌞',
  '🧹',
] as const;

export type HabitSchedule = Pick<Habit, 'frequency' | 'timesPerWeek' | 'weekdays'>;

/** Bei `weekly` steht die Gewohnheit jeden Tag zur Wahl, das Ziel gilt für die Woche */
export function isHabitDue(habit: HabitSchedule, date: DayKey): boolean {
  return habit.frequency !== 'weekdays' || habit.weekdays.includes(parseDayKey(date).getDay());
}

export function formatHabitFrequency(habit: HabitSchedule): string {
  switch (habit.frequency) {
    case 'daily':
      return 'Täglich';
    case 'weekly':
      return `${habit.timesPerWeek}× pro Woche`;
    case 'weekdays':
      return formatWeekdays(habit.weekdays);
  }
}

// ---------- Wochen ----------

/** Montag der Woche */
export function weekStart(date: DayKey): DayKey {
  return shiftDay(date, -((parseDayKey(date).getDay() + 6) % 7));
}

/** Erledigte Tage in der Woche von `date` */
export function checksInWeek(dates: readonly DayKey[], date: DayKey): number {
  const start = weekStart(date);
  const end = shiftDay(start, 6);
  return dates.filter((day) => day >= start && day <= end).length;
}

// ---------- Streaks ----------

export interface HabitStreak {
  current: number;
  best: number;
  /** `weeks` bei „x-mal pro Woche“, sonst Tage, an denen die Gewohnheit anstand */
  unit: 'days' | 'weeks';
}

/**
 * `isDone` beantwortet für jeden Zeitraum, ob er geschafft ist. Der letzte Zeitraum (`today`) läuft
 * noch: Geschafft zählt er mit, offen unterbricht er die Serie nicht.
 */
function countRuns(periods: DayKey[], isDone: (period: DayKey) => boolean) {
  let current = 0;
  let best = 0;
  periods.forEach((period, index) => {
    if (isDone(period)) {
      current += 1;
      best = Math.max(best, current);
    } else if (index < periods.length - 1) {
      current = 0;
    }
  });
  return { current, best };
}

function periodsBetween(first: DayKey, last: DayKey, stepDays: number): DayKey[] {
  const periods: DayKey[] = [];
  for (let period = first; period <= last; period = shiftDay(period, stepDays)) {
    periods.push(period);
  }
  return periods;
}

/**
 * Wertet die Tage nach dem aktuellen Rhythmus aus. Spätere Tage als `today` zählen nicht,
 * erledigte Tage außerhalb des Rhythmus (Wochentage geändert) ebenfalls nicht.
 */
export function habitStreak(
  habit: HabitSchedule,
  dates: readonly DayKey[],
  today: DayKey,
): HabitStreak {
  const done = new Set(dates.filter((date) => date <= today));
  const first = [...done].sort()[0];
  if (habit.frequency === 'weekly') {
    if (!first) return { current: 0, best: 0, unit: 'weeks' };
    const weeks = periodsBetween(weekStart(first), weekStart(today), 7);
    const days = [...done];
    const reached = (week: DayKey) => checksInWeek(days, week) >= habit.timesPerWeek;
    return { ...countRuns(weeks, reached), unit: 'weeks' };
  }
  if (!first) return { current: 0, best: 0, unit: 'days' };
  const dueDays = periodsBetween(first, today, 1).filter((day) => isHabitDue(habit, day));
  // Steht heute nichts an, ist der letzte fällige Tag abgeschlossen und darf die Serie brechen
  if (dueDays.at(-1) !== today) dueDays.push(today);
  return {
    ...countRuns(dueDays, (day) => done.has(day) && isHabitDue(habit, day)),
    unit: 'days',
  };
}

export function formatStreak(count: number, unit: HabitStreak['unit']): string {
  if (unit === 'weeks') return count === 1 ? '1 Woche' : `${count} Wochen`;
  return count === 1 ? '1 Tag' : `${count} Tage`;
}

// ---------- Kalender ----------

/** Monat als `YYYY-MM` */
export type MonthKey = string;

export function monthOf(date: DayKey): MonthKey {
  return date.slice(0, 7);
}

export function shiftMonth(month: MonthKey, months: number): MonthKey {
  const date = parseDayKey(`${month}-01`);
  date.setMonth(date.getMonth() + months);
  return monthOf(dayKey(date));
}

export function formatMonth(month: MonthKey): string {
  return parseDayKey(`${month}-01`).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
}

/** Zeilen = Wochen (Mo–So); `null` = Tag eines Nachbarmonats */
export function monthWeeks(month: MonthKey): Array<Array<DayKey | null>> {
  const first = `${month}-01`;
  const weeks: Array<Array<DayKey | null>> = [];
  for (let monday = weekStart(first); monthOf(monday) <= month; monday = shiftDay(monday, 7)) {
    const week = Array.from({ length: 7 }, (_, index) => shiftDay(monday, index));
    weeks.push(week.map((day) => (monthOf(day) === month ? day : null)));
  }
  return weeks;
}
