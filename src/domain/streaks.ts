import type { IconName } from '../components/iconPaths';
import type { DailyLog, DayKey, MealEntry, NutritionGoals, Supplement } from '../db/types';
import { dayKey, shiftDay } from './daily';
import { sessionDay } from './endurance';
import type { GoalData, GoalEnduranceSession } from './goals';
import {
  checksInWeek,
  doneDates,
  habitStreak,
  isHabitDoneOn,
  quitStreak,
  weekStart,
  type DayValue,
} from './habits';
import { entryNutrients, goalForDay } from './nutrition';
import type { StatsSession } from './stats';
import { isSupplementDueOn, type IntakeEntry, type TrainingDays } from './supplements';

export type StreakUnit = 'days' | 'weeks';

export interface Streak {
  current: number;
  best: number;
  unit: StreakUnit;
  /** Heute (bzw. in dieser Woche) schon geschafft */
  todayDone: boolean;
}

// ---------- Grundlagen ----------

/** Serie am Ende jedes Zeitraums (0 = unterbrochen) */
export function runSeries(
  periods: readonly DayKey[],
  isDone: (period: DayKey) => boolean,
): DayValue[] {
  let current = 0;
  return periods.map((date) => {
    current = isDone(date) ? current + 1 : 0;
    return { date, value: current };
  });
}

/** Der letzte Zeitraum läuft noch: geschafft zählt er mit, offen unterbricht er nichts */
export function summarizeRuns(series: readonly DayValue[], unit: StreakUnit): Streak {
  const last = series.at(-1);
  const todayDone = (last?.value ?? 0) > 0;
  return {
    current: todayDone ? last!.value : (series.at(-2)?.value ?? 0),
    best: series.reduce((max, point) => Math.max(max, point.value), 0),
    unit,
    todayDone,
  };
}

/** Erster Tag, an dem eine Serie die Länge erreicht hat */
export function runReachedOn(series: readonly DayValue[], length: number): DayKey | null {
  return series.find((point) => point.value >= length)?.date ?? null;
}

/**
 * Tage vom ersten erledigten bis heute. `skip` = Tag zählt weder für noch gegen die Serie
 * (z. B. nichts fällig); heute bleibt immer als laufender letzter Tag drin.
 */
export function daySeries(
  done: ReadonlySet<DayKey>,
  today: DayKey,
  skip?: (day: DayKey) => boolean,
): DayValue[] {
  let first: DayKey | null = null;
  for (const day of done) if (day <= today && (first === null || day < first)) first = day;
  if (first === null) return [];
  const days: DayKey[] = [];
  for (let day = first; day <= today; day = shiftDay(day, 1)) {
    if (day === today || done.has(day) || !skip?.(day)) days.push(day);
  }
  return runSeries(days, (day) => done.has(day));
}

/** Je Training ein Tag (Krafttraining je Workout, Ausdauer je Einheit), aufsteigend */
export function trainingDates(
  strength: readonly Pick<StatsSession, 'workoutId' | 'startedAt'>[],
  endurance: readonly Pick<GoalEnduranceSession, 'startedAt'>[],
): DayKey[] {
  const workouts = new Map<string, DayKey>();
  for (const { workoutId, startedAt } of strength) {
    if (!workouts.has(workoutId)) workouts.set(workoutId, dayKey(new Date(startedAt)));
  }
  return [...workouts.values(), ...endurance.map(sessionDay)].sort();
}

/**
 * Wochen (Mo–So) mit mindestens `target` Trainings. Das Datum eines Werts ist der Tag, an dem die
 * Woche geschafft war (sonst ihr Montag).
 */
export function weekSeries(dates: readonly DayKey[], target: number, today: DayKey): DayValue[] {
  const past = dates.filter((date) => date <= today);
  if (past.length === 0) return [];
  const byWeek = new Map<DayKey, DayKey[]>();
  for (const date of past) {
    const week = weekStart(date);
    byWeek.set(week, [...(byWeek.get(week) ?? []), date]);
  }
  const weeks: DayKey[] = [];
  for (let week = weekStart(past[0]!); week <= today; week = shiftDay(week, 7)) weeks.push(week);
  const reachedOn = (week: DayKey) => [...(byWeek.get(week) ?? [])].sort()[target - 1] ?? null;
  return runSeries(weeks, (week) => reachedOn(week) !== null).map((point) => ({
    date: reachedOn(point.date) ?? point.date,
    value: point.value,
  }));
}

// ---------- Tage mit erreichtem Ziel ----------

type DailyGoalLog = GoalData['logs'][number];
export type QuickProtein = Pick<DailyLog, 'date' | 'proteinGrams'>;

export type DailyGoalArea = 'steps' | 'water' | 'sleep';

/** Tage mit erreichtem Tagesziel (aktuelle Einstellungen) */
export function dailyGoalDays(
  logs: readonly DailyGoalLog[],
  goals: GoalData['dailyGoals'],
  area: DailyGoalArea,
): Set<DayKey> {
  const reached = (log: DailyGoalLog) => {
    switch (area) {
      case 'steps':
        return (log.steps ?? 0) >= goals.stepsGoal;
      case 'water':
        return (log.waterMl ?? 0) >= goals.waterGoalMl;
      case 'sleep':
        return (log.sleepSeconds ?? 0) >= goals.sleepGoalSeconds;
    }
  };
  return new Set(logs.filter(reached).map((log) => log.date));
}

export type StreakMeal = Pick<MealEntry, 'date' | 'grams' | 'nutrients'>;

/** Tage, an denen das Protein-Ziel (Trainings- bzw. Ruhetag) erreicht war */
export function proteinGoalDays(
  meals: readonly StreakMeal[],
  logs: readonly QuickProtein[],
  trainingDays: TrainingDays,
  goals: NutritionGoals,
): Set<DayKey> {
  const protein = new Map<DayKey, number>();
  const add = (date: DayKey, grams: number) => protein.set(date, (protein.get(date) ?? 0) + grams);
  for (const meal of meals) add(meal.date, entryNutrients(meal).protein);
  for (const log of logs) if (log.proteinGrams) add(log.date, log.proteinGrams);
  const days = new Set<DayKey>();
  for (const [date, grams] of protein) {
    const goal = goalForDay(goals, trainingDays.has(date)).protein;
    if (goal > 0 && grams >= goal - 1e-9) days.add(date);
  }
  return days;
}

export interface StreakSupplement {
  supplement: Pick<
    Supplement,
    'doses' | 'schedule' | 'weekdays' | 'trainingKind' | 'createdAt' | 'archivedAt'
  >;
  intakes: readonly Pick<IntakeEntry, 'doseId' | 'date'>[];
}

/**
 * Supplements: `done` = alle fälligen Einnahmen genommen, `due` = etwas war fällig
 * (Tage ohne fällige Einnahme zählen weder für noch gegen die Serie)
 */
export function supplementDays(
  items: readonly StreakSupplement[],
  trainingDays: TrainingDays,
  today: DayKey,
): { done: Set<DayKey>; due: Set<DayKey> } {
  const done = new Set<DayKey>();
  const due = new Set<DayKey>();
  const ranges = items
    .filter(({ supplement }) => supplement.doses.length > 0)
    .map((item) => ({
      ...item,
      from: dayKey(new Date(item.supplement.createdAt)),
      // Am Tag der Archivierung zählt es nicht mehr
      to: item.supplement.archivedAt
        ? shiftDay(dayKey(new Date(item.supplement.archivedAt)), -1)
        : today,
      taken: new Set(item.intakes.map((intake) => `${intake.date}|${intake.doseId}`)),
    }));
  const first = ranges.map((range) => range.from).sort()[0];
  if (!first) return { done, due };
  for (let day = first; day <= today; day = shiftDay(day, 1)) {
    let dueToday = false;
    let complete = true;
    for (const { supplement, from, to, taken } of ranges) {
      if (day < from || day > to || !isSupplementDueOn(supplement, day, trainingDays)) continue;
      dueToday = true;
      if (supplement.doses.some((dose) => !taken.has(`${day}|${dose.id}`))) complete = false;
    }
    if (!dueToday) continue;
    due.add(day);
    if (complete) done.add(day);
  }
  return { done, due };
}

// ---------- Übersicht ----------

export const STREAK_AREAS = [
  'training',
  'steps',
  'water',
  'sleep',
  'protein',
  'supplements',
  'journal',
  'meditation',
  'focus',
  'reading',
  'habit',
] as const;
export type StreakArea = (typeof STREAK_AREAS)[number];

export const STREAK_AREA_LABELS: Record<
  Exclude<StreakArea, 'habit'>,
  { name: string; icon: IconName }
> = {
  training: { name: 'Training', icon: 'flame' },
  steps: { name: 'Schrittziel', icon: 'footprints' },
  water: { name: 'Wasserziel', icon: 'drop' },
  sleep: { name: 'Schlafziel', icon: 'moon' },
  protein: { name: 'Proteinziel', icon: 'egg' },
  supplements: { name: 'Supplements', icon: 'pill' },
  journal: { name: 'Journal', icon: 'journal' },
  meditation: { name: 'Meditation', icon: 'yoga' },
  focus: { name: 'Fokus', icon: 'timer' },
  reading: { name: 'Lesen', icon: 'bookOpen' },
};

export interface StreakItem extends Streak {
  /** Eindeutig, bei Gewohnheiten `habit:<id>` */
  key: string;
  area: StreakArea;
  name: string;
  icon: IconName;
  /** Nur Gewohnheiten */
  habitId: string | null;
}

/** Alles für Serien und Abzeichen */
export interface MotivationData extends GoalData {
  /** Tage mit Journal-Eintrag (nicht Wochenreflexion) */
  journalDays: readonly DayKey[];
  /** Tage mit schnell erfasstem Protein (aus den Tageseinträgen) */
  quickProtein: readonly QuickProtein[];
  meals: readonly StreakMeal[];
  supplements: readonly StreakSupplement[];
  trainingDays: TrainingDays;
  nutritionGoals: NutritionGoals;
  trainingWeekTarget: number;
  bodyWeightKg: number | null;
  /** Tage der Fortschrittsfotos (je Foto einer) */
  photoDays: readonly DayKey[];
}

/** Serie je Bereich am Ende jedes Tages bzw. jeder Woche (für Übersicht und Abzeichen) */
export function areaSeries(
  area: Exclude<StreakArea, 'habit'>,
  data: MotivationData,
  today: DayKey,
): DayValue[] {
  const timerDays = (kind: 'focus' | 'meditation') =>
    new Set(data.timerSessions.filter((s) => s.kind === kind).map((s) => s.date));
  switch (area) {
    case 'training':
      return weekSeries(
        trainingDates(data.strength, data.endurance),
        data.trainingWeekTarget,
        today,
      );
    case 'steps':
    case 'water':
    case 'sleep':
      return daySeries(dailyGoalDays(data.logs, data.dailyGoals, area), today);
    case 'protein':
      return daySeries(
        proteinGoalDays(data.meals, data.quickProtein, data.trainingDays, data.nutritionGoals),
        today,
      );
    case 'supplements': {
      const { done, due } = supplementDays(data.supplements, data.trainingDays, today);
      return daySeries(done, today, (day) => !due.has(day));
    }
    case 'journal':
      return daySeries(new Set(data.journalDays), today);
    case 'meditation':
    case 'focus':
      return daySeries(timerDays(area), today);
    case 'reading':
      return daySeries(new Set(data.reading.map((log) => log.date)), today);
  }
}

/** Serie einer Gewohnheit wie auf ihrer Seite (Aufhören: Tage im Limit) */
export function habitItemStreak(
  { habit, entries }: GoalData['habits'][number],
  today: DayKey,
): Streak {
  if (habit.kind === 'quit') {
    return {
      ...quitStreak(habit, entries, today),
      todayDone: isHabitDoneOn(habit, entries, today),
    };
  }
  const dates = doneDates(habit, entries);
  const streak = habitStreak(habit, dates, today);
  const todayDone =
    habit.frequency === 'weekly'
      ? checksInWeek(dates, today) >= habit.timesPerWeek
      : isHabitDoneOn(habit, entries, today);
  return { ...streak, todayDone };
}

/**
 * Alle Serien, laufende zuerst (längste oben). Bereiche ohne je geschaffte Serie fehlen,
 * archivierte Gewohnheiten ebenso.
 */
export function streakOverview(data: MotivationData, today: DayKey): StreakItem[] {
  const areas = STREAK_AREAS.filter((area) => area !== 'habit').map((area): StreakItem => {
    const unit: StreakUnit = area === 'training' ? 'weeks' : 'days';
    return {
      ...summarizeRuns(areaSeries(area, data, today), unit),
      key: area,
      area,
      ...STREAK_AREA_LABELS[area],
      habitId: null,
    };
  });
  const habits = data.habits
    .filter(({ habit }) => habit.archivedAt === null)
    .map((item): StreakItem => ({
      ...habitItemStreak(item, today),
      key: `habit:${item.habit.id}`,
      area: 'habit',
      name: item.habit.name,
      icon: item.habit.icon,
      habitId: item.habit.id,
    }));
  const order = (item: StreakItem) => STREAK_AREAS.indexOf(item.area);
  return [...areas, ...habits]
    .filter((item) => item.best > 0)
    .sort(
      (a, b) =>
        Number(b.current > 0) - Number(a.current > 0) ||
        inDays(b) - inDays(a) ||
        b.best - a.best ||
        order(a) - order(b),
    );
}

/** Wochen zählen beim Sortieren wie 7 Tage */
function inDays(item: Streak): number {
  return item.unit === 'weeks' ? item.current * 7 : item.current;
}
