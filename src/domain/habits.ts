import type {
  DayKey,
  Habit,
  HabitCheck,
  HabitFrequency,
  HabitGroup,
  HabitKind,
  HabitPause,
} from '../db/types';
import { dayKey, shiftDay } from './daily';
import { formatDecimal } from './format';
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

export const HABIT_KIND_LABELS: Record<HabitKind, string> = {
  check: 'Abhaken',
  count: 'Zählen',
  items: 'Unterpunkte',
  quit: 'Aufhören',
};

export const HABIT_KIND_HINTS: Record<HabitKind, string> = {
  check: 'Einmal am Tag abhaken, z. B. Meditieren',
  count: 'Menge bis zum Ziel hochzählen, z. B. 10 Seiten lesen',
  items: 'Mehrere Punkte mit Menge, z. B. Supplements',
  quit: 'Nur Rückfälle eintragen, z. B. Zigaretten oder Snus',
};

export type HabitSchedule = Pick<Habit, 'frequency' | 'timesPerWeek' | 'weekdays'> &
  Partial<Pick<Habit, 'pauses'>>;

/** Bei `weekly` steht die Gewohnheit jeden Tag zur Wahl, das Ziel gilt für die Woche */
export function isHabitDue(habit: HabitSchedule, date: DayKey): boolean {
  return habit.frequency !== 'weekdays' || habit.weekdays.includes(parseDayKey(date).getDay());
}

/** Pausierte Tage zählen weder für noch gegen eine Serie */
export function isPausedOn(habit: Pick<Habit, 'pauses'>, date: DayKey): boolean {
  return habit.pauses.some((pause) => date >= pause.from && (pause.to === null || date < pause.to));
}

/** Steht in der Checkliste: nicht archiviert, nicht pausiert, laut Rhythmus fällig */
export function isHabitShownOn(
  habit: HabitSchedule & Pick<Habit, 'pauses' | 'archivedAt'>,
  date: DayKey,
): boolean {
  return habit.archivedAt === null && !isPausedOn(habit, date) && isHabitDue(habit, date);
}

export function isPaused(habit: Pick<Habit, 'pauses'>): boolean {
  return habit.pauses.some((pause) => pause.to === null);
}

/** Pause beginnt an `date`; eine laufende Pause bleibt unverändert */
export function startPause(pauses: readonly HabitPause[], date: DayKey): HabitPause[] {
  if (pauses.some((pause) => pause.to === null)) return [...pauses];
  return [...pauses, { from: date, to: null }];
}

/** Ab `date` läuft die Gewohnheit wieder; eine am selben Tag begonnene Pause entfällt ganz */
export function endPause(pauses: readonly HabitPause[], date: DayKey): HabitPause[] {
  return pauses.flatMap((pause) => {
    if (pause.to !== null) return [pause];
    return pause.from >= date ? [] : [{ ...pause, to: date }];
  });
}

// ---------- Mengen ----------

export type HabitEntry = Pick<HabitCheck, 'date' | 'itemId' | 'amount'>;
export type HabitRules = HabitSchedule & Pick<Habit, 'kind' | 'target' | 'items'>;

export function dayAmount(
  entries: readonly HabitEntry[],
  date: DayKey,
  itemId: string | null = null,
): number {
  return entries.find((entry) => entry.date === date && entry.itemId === itemId)?.amount ?? 0;
}

/** Ein Tipp erledigt das Ziel → als Haken anzeigen statt mit Plus-Taste */
export function isSingleTap({ target, step }: { target: number; step: number }): boolean {
  return step >= target;
}

/** `quit`: Tag innerhalb des Limits (ohne Eintrag immer) */
export function isHabitDoneOn(
  habit: HabitRules,
  entries: readonly HabitEntry[],
  date: DayKey,
): boolean {
  switch (habit.kind) {
    case 'check':
      return dayAmount(entries, date) > 0;
    case 'count':
      return dayAmount(entries, date) >= habit.target;
    case 'items':
      return (
        habit.items.length > 0 &&
        habit.items.every((item) => dayAmount(entries, date, item.id) >= item.target)
      );
    case 'quit':
      return dayAmount(entries, date) <= habit.target;
  }
}

/** Erledigte Unterpunkte an einem Tag (für den Fortschritt „2 von 3“) */
export function itemsDone(habit: HabitRules, entries: readonly HabitEntry[], date: DayKey) {
  return habit.items.filter((item) => dayAmount(entries, date, item.id) >= item.target).length;
}

/** Tage, an denen die Gewohnheit erledigt war; bei `quit` leer (dort zählt `quitStreak`) */
export function doneDates(habit: HabitRules, entries: readonly HabitEntry[]): DayKey[] {
  if (habit.kind === 'quit') return [];
  const days = [...new Set(entries.map((entry) => entry.date))];
  return days.filter((day) => isHabitDoneOn(habit, entries, day)).sort();
}

export function formatHabitAmount(amount: number, unit: string): string {
  const value = formatDecimal(amount, 2);
  return unit ? `${value} ${unit}` : value;
}

/** Ziel als Text, z. B. „10 Seiten“ oder „höchstens 5 Zigaretten“ */
export function formatHabitTarget(habit: Pick<Habit, 'kind' | 'target' | 'unit' | 'items'>) {
  switch (habit.kind) {
    case 'check':
      return null;
    case 'count':
      return formatHabitAmount(habit.target, habit.unit);
    case 'items':
      return habit.items.length === 1 ? '1 Unterpunkt' : `${habit.items.length} Unterpunkte`;
    case 'quit':
      return habit.target === 0
        ? 'Ganz aufhören'
        : `Höchstens ${formatHabitAmount(habit.target, habit.unit)} am Tag`;
  }
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
  const paused = (day: DayKey) =>
    habit.pauses ? isPausedOn({ pauses: habit.pauses }, day) : false;
  if (habit.frequency === 'weekly') {
    if (!first) return { current: 0, best: 0, unit: 'weeks' };
    const days = [...done];
    const reached = (week: DayKey) => checksInWeek(days, week) >= habit.timesPerWeek;
    // Eine Woche mit Pause zählt nur, wenn das Ziel trotzdem erreicht wurde
    const weeks = periodsBetween(weekStart(first), weekStart(today), 7).filter(
      (week) => reached(week) || !periodsBetween(week, shiftDay(week, 6), 1).some(paused),
    );
    return { ...countRuns(weeks, reached), unit: 'weeks' };
  }
  if (!first) return { current: 0, best: 0, unit: 'days' };
  const dueDays = periodsBetween(first, today, 1).filter(
    (day) => isHabitDue(habit, day) && (done.has(day) || !paused(day)),
  );
  // Steht heute nichts an, ist der letzte fällige Tag abgeschlossen und darf die Serie brechen
  if (dueDays.at(-1) !== today) dueDays.push(today);
  return {
    ...countRuns(dueDays, (day) => done.has(day) && isHabitDue(habit, day)),
    unit: 'days',
  };
}

/**
 * Aufhören/Reduzieren: Tage ab `startDate` (sonst ab dem ersten Eintrag) innerhalb des Limits.
 * Anders als bei `habitStreak` bricht ein heutiger Rückfall über das Limit die Serie sofort.
 */
export function quitStreak(
  habit: Pick<Habit, 'target' | 'startDate' | 'pauses'>,
  entries: readonly HabitEntry[],
  today: DayKey,
): HabitStreak {
  let current = 0;
  let best = 0;
  for (const day of quitStreakDays(habit, entries, today)) {
    current = day.value;
    best = Math.max(best, current);
  }
  return { current, best, unit: 'days' };
}

/** Serie (Tage am Stück im Limit) am Ende jedes Tages wie bei `quitStreak` */
export function quitStreakDays(
  habit: Pick<Habit, 'target' | 'startDate' | 'pauses'>,
  entries: readonly HabitEntry[],
  today: DayKey,
): DayValue[] {
  const own = entries.filter((entry) => entry.itemId === null && entry.date <= today);
  const start = habit.startDate ?? own.map((entry) => entry.date).sort()[0] ?? today;
  const overLimit = new Set(
    own.filter((entry) => entry.amount > habit.target).map((entry) => entry.date),
  );
  let current = 0;
  return periodsBetween(start, today, 1).map((day) => {
    if (overLimit.has(day)) current = 0;
    else if (!isPausedOn(habit, day)) current += 1;
    return { date: day, value: current };
  });
}

/** Summe über die Woche (Mo–So) von `date`; nur die Gewohnheit selbst, keine Unterpunkte */
export function amountInWeek(entries: readonly HabitEntry[], date: DayKey): number {
  const start = weekStart(date);
  const end = shiftDay(start, 6);
  return entries
    .filter((entry) => entry.itemId === null && entry.date >= start && entry.date <= end)
    .reduce((sum, entry) => sum + entry.amount, 0);
}

// ---------- Verlauf ----------

/** Stand eines Tages wie in der Checkliste: angezeigte Gewohnheiten ohne Aufhören */
export function habitDayProgress(
  items: readonly HabitHistoryItem[],
  date: DayKey,
): { done: number; total: number } {
  const tasks = items.filter(({ habit }) => habit.kind !== 'quit' && isHabitShownOn(habit, date));
  const done = tasks.filter(({ habit, entries }) => isHabitDoneOn(habit, entries, date)).length;
  return { done, total: tasks.length };
}

export interface HabitHistoryItem {
  habit: Pick<
    Habit,
    | 'kind'
    | 'target'
    | 'items'
    | 'frequency'
    | 'timesPerWeek'
    | 'weekdays'
    | 'pauses'
    | 'startDate'
    | 'createdAt'
    | 'archivedAt'
  >;
  entries: readonly HabitEntry[];
}

export interface DayValue {
  date: DayKey;
  value: number;
}

function localDay(timestamp: string): DayKey {
  return dayKey(new Date(timestamp));
}

/** Anteil erledigter Gewohnheiten je Tag in % (ohne Aufhören); Tage ohne fällige Gewohnheit fehlen */
export function habitCompletion(
  items: readonly HabitHistoryItem[],
  from: DayKey | null,
  today: DayKey,
): DayValue[] {
  const tasks = items.filter(({ habit }) => habit.kind !== 'quit');
  const first = tasks.map(({ habit }) => localDay(habit.createdAt)).sort()[0];
  if (!first) return [];
  const start = from && from > first ? from : first;
  return periodsBetween(start, today, 1).flatMap((day) => {
    const due = tasks.filter(
      ({ habit }) =>
        localDay(habit.createdAt) <= day &&
        (habit.archivedAt === null || day < localDay(habit.archivedAt)) &&
        !isPausedOn(habit, day) &&
        isHabitDue(habit, day),
    );
    if (due.length === 0) return [];
    const done = due.filter(({ habit, entries }) => isHabitDoneOn(habit, entries, day)).length;
    return [{ date: day, value: Math.round((done / due.length) * 100) }];
  });
}

/** Aufhören: Menge je Tag ab Startdatum (auch 0), pausierte Tage fehlen */
export function quitAmounts(
  { habit, entries }: HabitHistoryItem,
  from: DayKey | null,
  today: DayKey,
): DayValue[] {
  const first = habit.startDate ?? localDay(habit.createdAt);
  const start = from && from > first ? from : first;
  return periodsBetween(start, today, 1)
    .filter((day) => !isPausedOn(habit, day))
    .map((day) => ({ date: day, value: dayAmount(entries, day) }));
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
