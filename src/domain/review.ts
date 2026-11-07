import type { DailyLog, DayKey, EnduranceSession, EnduranceSport, MealEntry } from '../db/types';
import { shiftDay } from './daily';
import { sessionDay, sessionTotals, type DayRange, type SessionTotals } from './endurance';
import { newEffortRecords } from './enduranceStats';
import { habitCompletion, type HabitHistoryItem } from './habits';
import { dayNutrients, nutritionDay } from './nutrition';
import { inRange } from './periods';
import { countRecordsBetween, parseDayKey, type StatsSession } from './stats';
import { exerciseKind, sessionVolumeKg } from './strength';
import { toDateInput } from './workout';

export type ReviewEnduranceSession = Pick<
  EnduranceSession,
  | 'id'
  | 'sport'
  | 'startedAt'
  | 'durationSeconds'
  | 'distanceMeters'
  | 'elevationGainMeters'
  | 'trackSummary'
>;

type ReviewMealEntry = Pick<MealEntry, 'date' | 'meal' | 'grams' | 'nutrients' | 'createdAt'>;

export interface ReviewInput {
  /** Alle beendeten Workouts (für Rekorde auch die früheren) */
  strength: StatsSession[];
  /** Alle Einheiten (für Bestzeiten auch die früheren) */
  endurance: readonly ReviewEnduranceSession[];
  logs: readonly DailyLog[];
  habits: readonly HabitHistoryItem[];
  /** Mindestens die Einträge im Zeitraum */
  meals: readonly ReviewMealEntry[];
  bodyWeightKg: number | null;
}

export interface ReviewSummary {
  strength: { workouts: number; sets: number; volumeKg: number; records: number };
  endurance: SessionTotals & {
    elevationGainMeters: number;
    /** Neue Bestzeiten über eine Strecke */
    records: number;
    /** Meiste Zeit zuerst */
    bySport: { sport: EnduranceSport; totals: SessionTotals }[];
  };
  /** Tage mit Kraft- oder Ausdauertraining */
  trainingDays: number;
  /** Ø je Tag mit Eintrag; `null` = keine Einträge */
  daily: {
    steps: number | null;
    sleepSeconds: number | null;
    waterMl: number | null;
    mood: number | null;
    energy: number | null;
    restingHeartRate: number | null;
    /** Letztes Gewicht im Zeitraum */
    weightKg: number | null;
  };
  /** Ø erledigte Gewohnheiten in % je Tag mit fälligen Gewohnheiten */
  habitCompletion: number | null;
  nutrition: {
    /** Tage mit Mahlzeiten oder Protein */
    days: number;
    /** Ø je Tag mit Mahlzeiten */
    kcal: number | null;
    /** Ø je Tag mit Mahlzeiten oder Protein */
    protein: number | null;
  };
}

const average = (values: readonly number[]): number | null =>
  values.length === 0 ? null : values.reduce((sum, value) => sum + value, 0) / values.length;

/** 0 zählt wie in den Verläufen als nicht erfasst */
function averageOf(logs: readonly DailyLog[], pick: (log: DailyLog) => number | null) {
  return average(logs.map(pick).filter((value): value is number => value !== null && value > 0));
}

const startOfDay = (day: DayKey) => parseDayKey(day).getTime();

/** Kennzahlen aller Bereiche in einem Zeitraum (Tage lokal, beide Grenzen eingeschlossen) */
export function reviewSummary(input: ReviewInput, range: DayRange, today: DayKey): ReviewSummary {
  const inside = (day: DayKey) => inRange(day, range);
  const strength = input.strength.filter((session) => inside(toDateInput(session.startedAt)));
  const endurance = input.endurance.filter((session) => inside(sessionDay(session)));
  const logs = input.logs.filter((log) => inside(log.date));

  const sports = [...new Set(endurance.map((session) => session.sport))];
  const bySport = sports
    .map((sport) => ({
      sport,
      totals: sessionTotals(endurance.filter((session) => session.sport === sport)),
    }))
    .sort((a, b) => b.totals.durationSeconds - a.totals.durationSeconds);
  const earlierOrInside = input.endurance.filter((session) => sessionDay(session) <= range.to);

  const trainingDays = new Set([
    ...strength.map((session) => toDateInput(session.startedAt)),
    ...endurance.map(sessionDay),
  ]);

  const end = range.to < today ? range.to : today;
  const completion =
    end < range.from
      ? []
      : habitCompletion(input.habits, range.from, end).filter((day) => inside(day.date));

  const mealsByDay = new Map<DayKey, ReviewMealEntry[]>();
  for (const entry of input.meals) {
    if (!inside(entry.date)) continue;
    mealsByDay.set(entry.date, [...(mealsByDay.get(entry.date) ?? []), entry]);
  }
  const quickProtein = new Map(
    logs.flatMap((log) => (log.proteinGrams ? [[log.date, log.proteinGrams] as const] : [])),
  );
  const nutritionDays = [...new Set([...mealsByDay.keys(), ...quickProtein.keys()])];

  return {
    strength: {
      workouts: new Set(strength.map((session) => session.workoutId)).size,
      sets: strength.reduce((sum, { sets }) => sum + sets.filter((set) => !set.isWarmup).length, 0),
      volumeKg: strength.reduce(
        (sum, { sets, exercise }) =>
          sum + sessionVolumeKg(sets, exerciseKind(exercise, input.bodyWeightKg)),
        0,
      ),
      records: countRecordsBetween(
        input.strength,
        input.bodyWeightKg,
        startOfDay(range.from),
        startOfDay(shiftDay(range.to, 1)),
      ),
    },
    endurance: {
      ...sessionTotals(endurance),
      elevationGainMeters: endurance.reduce(
        (sum, session) => sum + (session.elevationGainMeters ?? 0),
        0,
      ),
      records: newEffortRecords(
        earlierOrInside,
        endurance.map((session) => session.id),
      ).length,
      bySport,
    },
    trainingDays: trainingDays.size,
    daily: {
      steps: averageOf(logs, (log) => log.steps),
      sleepSeconds: averageOf(logs, (log) => log.sleepSeconds),
      waterMl: averageOf(logs, (log) => log.waterMl),
      mood: averageOf(logs, (log) => log.mood),
      energy: averageOf(logs, (log) => log.energy),
      restingHeartRate: averageOf(logs, (log) => log.restingHeartRate),
      weightKg: logs.findLast((log) => log.weightKg !== null)?.weightKg ?? null,
    },
    habitCompletion: average(completion.map((day) => day.value)),
    nutrition: {
      days: nutritionDays.length,
      kcal: average([...mealsByDay.values()].map((entries) => nutritionDay(entries).total.kcal)),
      protein: average(
        nutritionDays.map(
          (day) => dayNutrients(mealsByDay.get(day) ?? [], quickProtein.get(day) ?? 0).protein,
        ),
      ),
    },
  };
}

/** Unterschied zum Vergleichszeitraum; `null`, wenn einer der Werte fehlt */
export function reviewDelta(current: number | null, previous: number | null): number | null {
  return current === null || previous === null ? null : current - previous;
}

/** Hat der Zeitraum überhaupt Einträge? */
export function hasReviewData(summary: ReviewSummary): boolean {
  const { daily } = summary;
  return (
    summary.trainingDays > 0 ||
    Object.values(daily).some((value) => value !== null) ||
    summary.habitCompletion !== null ||
    summary.nutrition.days > 0
  );
}
