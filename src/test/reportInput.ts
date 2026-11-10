import { ZERO_NUTRIENTS } from '../domain/nutrition';
import type { ReviewEnduranceSession, ReviewHabit, ReviewInput } from '../domain/review';
import type { StatsExercise, StatsSession, StatsSet } from '../domain/stats';
import { dailyLogOf } from './dailyLog';

/** Testdaten für Rückblick und Berichte (Stand 7.11.2026) */
export const REPORT_TODAY = '2026-11-07';

export const BENCH: StatsExercise = {
  id: 'bench',
  name: 'Bankdrücken',
  category: 'strength',
  primaryMuscles: ['chest'],
  secondaryMuscles: ['triceps'],
  equipment: 'barbell',
  isTimed: false,
};

export const SQUAT: StatsExercise = {
  ...BENCH,
  id: 'squat',
  name: 'Kniebeuge',
  primaryMuscles: ['quads'],
  secondaryMuscles: [],
};

export const statsSet = (values: Partial<StatsSet> = {}): StatsSet => ({
  weight: 100,
  level: null,
  eccentricWeight: null,
  eccentricLevel: null,
  reps: 5,
  durationSeconds: null,
  isWarmup: false,
  workoutExerciseId: 'item',
  completedAt: null,
  ...values,
});

export const strengthSession = (
  day: string,
  sets: StatsSet[],
  exercise: StatsExercise = BENCH,
): StatsSession => ({
  workoutId: `w-${day}`,
  startedAt: new Date(`${day}T18:00:00`).toISOString(),
  exercise,
  sets,
});

export const enduranceSession = (
  day: string,
  values: Partial<ReviewEnduranceSession> = {},
): ReviewEnduranceSession => ({
  id: `run-${day}`,
  sport: 'run',
  startedAt: new Date(`${day}T07:00:00`).toISOString(),
  durationSeconds: 1800,
  distanceMeters: 5000,
  elevationGainMeters: 20,
  trackSummary: null,
  ...values,
});

const habit: ReviewHabit['habit'] = {
  id: 'read',
  name: 'Lesen',
  icon: 'book',
  unit: 'Seiten',
  kind: 'count',
  target: 10,
  items: [],
  frequency: 'daily',
  timesPerWeek: 1,
  weekdays: [],
  pauses: [],
  startDate: null,
  createdAt: new Date('2026-10-01T08:00:00').toISOString(),
  archivedAt: null,
};

export function sampleReportInput(): ReviewInput {
  return {
    strength: [
      strengthSession('2026-10-20', [statsSet({ weight: 90 })]),
      strengthSession('2026-10-21', [statsSet({ weight: 100 })], SQUAT),
      strengthSession('2026-11-02', [
        statsSet({ weight: 95 }),
        statsSet({ isWarmup: true, weight: 50 }),
      ]),
      strengthSession('2026-11-02', [statsSet({ weight: 110 })], SQUAT),
      strengthSession('2026-11-05', [statsSet({ weight: 100 }), statsSet({ weight: 100 })]),
    ],
    endurance: [
      enduranceSession('2026-10-15', {
        trackSummary: { bestEfforts: [{ meters: 5000, seconds: 1700 }], heartRateSeconds: [] },
      }),
      enduranceSession('2026-11-03', {
        trackSummary: { bestEfforts: [{ meters: 5000, seconds: 1650 }], heartRateSeconds: [] },
      }),
      enduranceSession('2026-11-05', {
        sport: 'ride',
        durationSeconds: 3600,
        distanceMeters: 30_000,
      }),
    ],
    logs: [
      dailyLogOf('2026-10-31', { weightKg: 82 }),
      dailyLogOf('2026-11-01', { steps: 8000, weightKg: 81.5, sleepSeconds: 7 * 3600 }),
      dailyLogOf('2026-11-02', { steps: 12_000, proteinGrams: 30 }),
      dailyLogOf('2026-11-04', { weightKg: 81, sleepSeconds: 8 * 3600 }),
    ],
    habits: [
      {
        habit,
        entries: [
          { date: '2026-10-10', itemId: null, amount: 40 },
          { date: '2026-11-02', itemId: null, amount: 20 },
        ],
      },
    ],
    meals: [
      {
        date: '2026-11-01',
        meal: 'lunch',
        grams: 100,
        nutrients: { ...ZERO_NUTRIENTS, kcal: 2000, protein: 100 },
        createdAt: '2026-11-01T12:00:00.000Z',
      },
    ],
    bodyWeightKg: 80,
    journal: [{ kind: 'day', date: '2026-11-01', rating: null }],
    readingLogs: [{ bookId: 'b1', date: '2026-11-01', pages: 25 }],
    books: [{ status: 'finished', finishedOn: '2026-11-03' }],
    timerSessions: [{ kind: 'focus', date: '2026-11-02', durationSeconds: 3000 }],
  };
}
