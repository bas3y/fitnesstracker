import type { PlanDay, PlanExercise, PlanSchedule } from '../db/types';
import { formatClock } from './workout';

/** Wochentage in Anzeigereihenfolge (Mo–So), Werte wie `Date.getDay()` */
export const WEEKDAYS = [
  { value: 1, label: 'Mo' },
  { value: 2, label: 'Di' },
  { value: 3, label: 'Mi' },
  { value: 4, label: 'Do' },
  { value: 5, label: 'Fr' },
  { value: 6, label: 'Sa' },
  { value: 0, label: 'So' },
] as const;

export function formatWeekdays(weekdays: readonly number[]): string {
  return WEEKDAYS.filter(({ value }) => weekdays.includes(value))
    .map(({ label }) => label)
    .join(', ');
}

export const PLAN_SCHEDULE_LABELS: Record<PlanSchedule, string> = {
  rotation: 'Rotation',
  weekdays: 'Wochentage',
};

/** Planziel einer Übung, z. B. `3 × 8–12`, `5 × 5`, `3 × 0:45` */
export function formatPlanTarget(
  target: Pick<PlanExercise, 'targetSets' | 'repMin' | 'repMax' | 'targetDurationSeconds'>,
  isTimed: boolean,
): string {
  if (isTimed) {
    const duration = target.targetDurationSeconds;
    return `${target.targetSets} × ${duration === null ? '–' : formatClock(duration)}`;
  }
  return `${target.targetSets} × ${formatRepRange(target)}`;
}

export function formatRepRange({ repMin, repMax }: { repMin: number; repMax: number }): string {
  return repMin === repMax ? String(repMin) : `${repMin}–${repMax}`;
}

export type PlanDayReason =
  /** Nächstes Training in der Reihenfolge */
  | 'rotation'
  /** Noch nie nach diesem Plan trainiert */
  | 'start'
  /** Heute laut Wochenplan dran */
  | 'today'
  /** Heute nichts (mehr) geplant – nächstes Training in der Reihenfolge */
  | 'offSchedule';

export interface PlanDaySuggestion<T> {
  day: T;
  reason: PlanDayReason;
  /** Zuletzt nach diesem Plan absolviertes Training */
  lastDay: T | null;
}

/**
 * Vorschlag fürs heutige Training. Rotation: das Training nach dem zuletzt absolvierten.
 * Wochentage: das heute geplante, das heute noch nicht absolviert wurde; sonst weiter wie bei der
 * Rotation (damit ein verpasstes Training nachgeholt werden kann). Ein Wochenplan, in dem kein
 * Training einen Wochentag hat, verhält sich wie eine Rotation.
 */
export function suggestPlanDay<T extends Pick<PlanDay, 'id' | 'weekdays'>>({
  days,
  schedule,
  lastDayId,
  weekday,
  trainedTodayIds = [],
}: {
  /** Trainings des Plans in ihrer Reihenfolge */
  days: readonly T[];
  schedule: PlanSchedule;
  lastDayId: string | null;
  /** Wochentag von heute wie `Date.getDay()` */
  weekday: number;
  trainedTodayIds?: readonly string[];
}): PlanDaySuggestion<T> | null {
  if (days.length === 0) return null;
  const lastIndex = days.findIndex((day) => day.id === lastDayId);
  const lastDay = days[lastIndex] ?? null;
  const next = days[(lastIndex + 1) % days.length]!;

  if (schedule === 'weekdays' && days.some((day) => day.weekdays.length > 0)) {
    const today = days.find(
      (day) => day.weekdays.includes(weekday) && !trainedTodayIds.includes(day.id),
    );
    return today
      ? { day: today, reason: 'today', lastDay }
      : { day: next, reason: 'offSchedule', lastDay };
  }
  return { day: next, reason: lastDay ? 'rotation' : 'start', lastDay };
}
