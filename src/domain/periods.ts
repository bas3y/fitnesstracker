import type { DayKey } from '../db/types';
import { dayKey, shiftDay } from './daily';
import { monthRange, weekRange, type DayRange } from './endurance';
import { parseDayKey } from './stats';

export const CALENDAR_PERIODS = ['week', 'month', 'year'] as const;
export type CalendarPeriod = (typeof CALENDAR_PERIODS)[number];

export const CALENDAR_PERIOD_LABELS: Record<CalendarPeriod, string> = {
  week: 'Woche',
  month: 'Monat',
  year: 'Jahr',
};

/** Kalenderwoche (Mo–So), -monat bzw. -jahr, in dem `day` liegt */
export function periodRange(period: CalendarPeriod, day: DayKey): DayRange {
  if (period === 'week') return weekRange(day);
  if (period === 'month') return monthRange(day);
  const year = day.slice(0, 4);
  return { from: `${year}-01-01`, to: `${year}-12-31` };
}

/** Zeitraum davor bzw. danach (`steps` negativ = zurück) */
export function shiftPeriod(period: CalendarPeriod, range: DayRange, steps: number): DayRange {
  if (period === 'week') return periodRange(period, shiftDay(range.from, 7 * steps));
  const date = parseDayKey(range.from);
  if (period === 'month') date.setMonth(date.getMonth() + steps);
  else date.setFullYear(date.getFullYear() + steps);
  return periodRange(period, dayKey(date));
}

/** Tage von `from` bis `to`, beide eingeschlossen */
export function daysBetween(from: DayKey, to: DayKey): number {
  const ms = parseDayKey(to).getTime() - parseDayKey(from).getTime();
  return Math.round(ms / 86_400_000) + 1;
}

export function inRange(day: DayKey, { from, to }: DayRange): boolean {
  return day >= from && day <= to;
}

/**
 * Vergleichszeitraum: der vorige Zeitraum. Läuft `range` noch, nur bis zum gleichen Tag
 * (z. B. Montag bis Mittwoch der Vorwoche), damit ein halber Zeitraum nicht gegen einen ganzen steht.
 */
export function comparisonRange(period: CalendarPeriod, range: DayRange, today: DayKey): DayRange {
  const previous = shiftPeriod(period, range, -1);
  if (!inRange(today, range)) return previous;
  const elapsed = daysBetween(range.from, today);
  const to = shiftDay(previous.from, elapsed - 1);
  return { from: previous.from, to: to < previous.to ? to : previous.to };
}

/** Bis heute begrenzt (laufender Zeitraum) */
export function untilToday(range: DayRange, today: DayKey): DayRange {
  return range.to > today ? { from: range.from, to: today } : range;
}

const MONTH_FORMAT: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };

function shortDate(day: DayKey, withYear: boolean): string {
  return parseDayKey(day).toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
  });
}

/** Kalenderwoche nach ISO 8601 */
export function isoWeek(day: DayKey): number {
  const thursdayOf = (date: Date) => {
    const thursday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    thursday.setDate(thursday.getDate() + 3 - ((thursday.getDay() + 6) % 7));
    return thursday;
  };
  const thursday = thursdayOf(parseDayKey(day));
  const first = thursdayOf(new Date(thursday.getFullYear(), 0, 4));
  return 1 + Math.round((thursday.getTime() - first.getTime()) / (7 * 86_400_000));
}

/** z. B. „KW 45: 2.–8. Nov. 2026“, „November 2026“, „2026“ */
export function formatPeriod(period: CalendarPeriod, range: DayRange): string {
  if (period === 'year') return range.from.slice(0, 4);
  if (period === 'month') return parseDayKey(range.from).toLocaleDateString('de-DE', MONTH_FORMAT);
  return `KW ${isoWeek(range.from)}: ${formatDayRange(range)}`;
}

/** z. B. „2.–8. Nov. 2026“ oder „28. Okt. – 3. Nov. 2026“ */
export function formatDayRange({ from, to }: DayRange): string {
  if (from === to) return shortDate(from, true);
  const sameYear = from.slice(0, 4) === to.slice(0, 4);
  if (sameYear && from.slice(0, 7) === to.slice(0, 7)) {
    return `${parseDayKey(from).getDate()}.–${shortDate(to, true)}`;
  }
  return `${shortDate(from, !sameYear)} – ${shortDate(to, true)}`;
}
