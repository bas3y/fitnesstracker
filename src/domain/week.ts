import type { DayKey, Timestamp } from '../db/types';
import { dayKey, shiftDay } from './daily';
import { weekRange } from './endurance';

export interface WeekDay {
  date: DayKey;
  /** An dem Tag gab es ein Training (Kraft oder Ausdauer) */
  trained: boolean;
}

export interface WeekTrainings {
  /** Trainings der Woche: Krafttrainings (je Workout) + Ausdauer-Einheiten */
  count: number;
  /** Montag bis Sonntag */
  days: WeekDay[];
}

/** Trainings der Kalenderwoche (Mo–So) von `today`, wie die Trainingsserie sie zählt */
export function weekTrainings(
  strength: readonly { workoutId: string; startedAt: Timestamp }[],
  endurance: readonly { startedAt: Timestamp }[],
  today: DayKey,
): WeekTrainings {
  const { from, to } = weekRange(today);
  const inWeek = (date: DayKey) => date >= from && date <= to;
  const workouts = new Map<string, DayKey>();
  for (const { workoutId, startedAt } of strength) {
    if (!workouts.has(workoutId)) workouts.set(workoutId, dayKey(new Date(startedAt)));
  }
  const dates = [
    ...workouts.values(),
    ...endurance.map(({ startedAt }) => dayKey(new Date(startedAt))),
  ].filter(inWeek);
  const trained = new Set(dates);
  return {
    count: dates.length,
    days: Array.from({ length: 7 }, (_, index) => {
      const date = shiftDay(from, index);
      return { date, trained: trained.has(date) };
    }),
  };
}

export interface DayValuePoint {
  date: DayKey;
  value: number;
}

/** Die letzten `count` Tage bis heute (ältester zuerst), fehlende Tage mit 0 */
export function lastDays(
  values: readonly { date: DayKey; value: number | null }[],
  today: DayKey,
  count = 7,
): DayValuePoint[] {
  const byDate = new Map(values.map(({ date, value }) => [date, value ?? 0]));
  return Array.from({ length: count }, (_, index) => {
    const date = shiftDay(today, index - count + 1);
    return { date, value: byDate.get(date) ?? 0 };
  });
}
