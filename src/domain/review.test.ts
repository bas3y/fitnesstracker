import { dailyLogOf } from '../test/dailyLog';
import { ZERO_NUTRIENTS } from './nutrition';
import { periodRange } from './periods';
import {
  hasReviewData,
  reviewDelta,
  reviewSummary,
  type ReviewEnduranceSession,
  type ReviewHabit,
  type ReviewInput,
} from './review';
import type { StatsSession, StatsSet } from './stats';

const TODAY = '2026-11-07';
const NOVEMBER = periodRange('month', TODAY);
const OCTOBER = periodRange('month', '2026-10-01');

const set = (values: Partial<StatsSet> = {}): StatsSet => ({
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

const workout = (day: string, sets: StatsSet[]): StatsSession => ({
  workoutId: `w-${day}`,
  startedAt: new Date(`${day}T18:00:00`).toISOString(),
  exercise: {
    id: 'bench',
    name: 'Bankdrücken',
    category: 'strength',
    primaryMuscles: ['chest'],
    secondaryMuscles: [],
    equipment: 'barbell',
    isTimed: false,
  },
  sets,
});

const run = (
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
  id: 'meditate',
  name: 'Meditieren',
  icon: '🧘',
  unit: '',
  kind: 'check',
  target: 1,
  items: [],
  frequency: 'daily',
  timesPerWeek: 1,
  weekdays: [],
  pauses: [],
  startDate: null,
  createdAt: new Date('2026-11-05T08:00:00').toISOString(),
  archivedAt: null,
};

const meal = (date: string, kcal: number, protein: number) => ({
  date,
  meal: 'lunch' as const,
  grams: 100,
  nutrients: { ...ZERO_NUTRIENTS, kcal, protein },
  createdAt: `${date}T12:00:00.000Z`,
});

const input: ReviewInput = {
  strength: [
    workout('2026-10-20', [set({ weight: 90 })]),
    workout('2026-11-02', [set({ weight: 95 }), set({ isWarmup: true, weight: 50 })]),
    workout('2026-11-05', [set({ weight: 100 }), set({ weight: 100 })]),
  ],
  endurance: [
    run('2026-10-15', {
      trackSummary: { bestEfforts: [{ meters: 5000, seconds: 1700 }], heartRateSeconds: [] },
    }),
    run('2026-11-03', {
      trackSummary: { bestEfforts: [{ meters: 5000, seconds: 1650 }], heartRateSeconds: [] },
    }),
    run('2026-11-05', { sport: 'ride', durationSeconds: 3600, distanceMeters: 30_000 }),
  ],
  logs: [
    dailyLogOf('2026-10-31', { weightKg: 82 }),
    dailyLogOf('2026-11-01', { steps: 8000, weightKg: 81.5, sleepSeconds: 7 * 3600 }),
    dailyLogOf('2026-11-02', { steps: 12_000, waterMl: 0, proteinGrams: 30 }),
    dailyLogOf('2026-11-04', { weightKg: 81 }),
  ],
  habits: [
    {
      habit,
      entries: [{ date: '2026-11-05', itemId: null, amount: 1 }],
    },
    {
      habit: { ...habit, id: 'read', name: 'Lesen', icon: '📚', unit: 'Seiten', kind: 'count' },
      entries: [
        { date: '2026-10-10', itemId: null, amount: 40 },
        { date: '2026-11-02', itemId: null, amount: 20 },
        { date: '2026-11-03', itemId: null, amount: 30 },
      ],
    },
    {
      habit: { ...habit, id: 'smoke', name: 'Rauchen', kind: 'quit', target: 0 },
      entries: [{ date: '2026-10-12', itemId: null, amount: 3 }],
    },
    {
      habit: { ...habit, id: 'old', kind: 'count', archivedAt: '2026-01-01T00:00:00.000Z' },
      entries: [],
    },
  ],
  meals: [meal('2026-11-01', 2000, 100), meal('2026-11-01', 500, 20), meal('2026-11-03', 1500, 80)],
  bodyWeightKg: 80,
  journal: [
    { kind: 'day', date: '2026-10-30', rating: null },
    { kind: 'day', date: '2026-11-01', rating: null },
    { kind: 'day', date: '2026-11-04', rating: null },
    // Wochen ab Montag 2.11. und 26.10. (Montag liegt im Oktober)
    { kind: 'week', date: '2026-11-02', rating: 4 },
    { kind: 'week', date: '2026-10-26', rating: 2 },
  ],
  readingLogs: [
    { bookId: 'b1', date: '2026-10-31', pages: 30 },
    { bookId: 'b1', date: '2026-11-01', pages: 25 },
    { bookId: 'b2', date: '2026-11-06', pages: 15 },
  ],
  books: [
    { status: 'finished', finishedOn: '2026-11-03' },
    { status: 'finished', finishedOn: '2026-10-01' },
    { status: 'abandoned', finishedOn: '2026-11-04' },
    { status: 'reading', finishedOn: null },
  ],
};

describe('reviewSummary', () => {
  const november = reviewSummary(input, NOVEMBER, TODAY);

  it('fasst das Krafttraining zusammen (ohne Aufwärmsätze, mit Rekorden)', () => {
    expect(november.strength).toMatchObject({ workouts: 2, sets: 3, volumeKg: 95 * 5 + 2 * 500 });
    expect(november.strength.records).toBeGreaterThan(0);
    // Die allererste Einheit hat nichts zum Vergleichen
    expect(reviewSummary(input, OCTOBER, TODAY).strength.records).toBe(0);
    expect(november.trainingDays).toBe(3);
  });

  it('fasst die Ausdauer je Sportart zusammen, neue Bestzeiten nur gegen frühere', () => {
    expect(november.endurance).toMatchObject({
      count: 2,
      durationSeconds: 5400,
      distanceMeters: 35_000,
      elevationGainMeters: 40,
      records: 1,
    });
    expect(november.endurance.bySport.map(({ sport }) => sport)).toEqual(['ride', 'run']);
    expect(reviewSummary(input, OCTOBER, TODAY).endurance.records).toBe(0);
  });

  it('mittelt Alltagswerte über Tage mit Eintrag und nimmt das letzte Gewicht', () => {
    expect(november.daily).toMatchObject({
      steps: 10_000,
      sleepSeconds: 7 * 3600,
      waterMl: null,
      weightKg: 81,
    });
    expect(reviewSummary(input, OCTOBER, TODAY).daily.weightKg).toBe(82);
  });

  it('wertet Gewohnheiten nur bis heute aus', () => {
    // Abhaken: 5.–7.11. fällig, erledigt nur am 5.; Lesen (Tagesziel 1): 2. und 3.11.
    // ab dem 5.11. (angelegt) zählen beide: 5.: 1 von 2, 6.: 0 von 2, 7.: 0 von 2
    expect(november.habitCompletion).toBeCloseTo(50 / 3);
    expect(reviewSummary(input, OCTOBER, TODAY).habitCompletion).toBeNull();
  });

  it('summiert Gewohnheiten mit Menge und Rückfälle, archivierte nur mit Einträgen', () => {
    expect(november.habitTotals).toEqual([
      { habitId: 'read', name: 'Lesen', icon: '📚', unit: 'Seiten', kind: 'count', amount: 50 },
      { habitId: 'smoke', name: 'Rauchen', icon: '🧘', unit: '', kind: 'quit', amount: 0 },
    ]);
    const october = reviewSummary(input, OCTOBER, TODAY).habitTotals;
    expect(october.map((item) => item.amount)).toEqual([40, 3]);
  });

  it('mittelt die Ernährung, Protein auch ohne Mahlzeiten', () => {
    expect(november.nutrition).toEqual({ days: 3, kcal: 2000, protein: (120 + 30 + 80) / 3 });
  });

  it('zählt Journal, Wochenreflexionen und Lesen im Zeitraum', () => {
    expect(november.growth).toEqual({
      journalDays: 2,
      reflections: 1,
      weekRating: 4,
      pages: 40,
      books: 1,
    });
    expect(reviewSummary(input, OCTOBER, TODAY).growth).toEqual({
      journalDays: 1,
      reflections: 1,
      weekRating: 2,
      pages: 30,
      books: 1,
    });
  });

  it('erkennt leere Zeiträume', () => {
    expect(hasReviewData(november)).toBe(true);
    expect(hasReviewData(reviewSummary(input, periodRange('year', '2020-01-01'), TODAY))).toBe(
      false,
    );
  });
});

describe('reviewDelta', () => {
  it('rechnet nur mit beiden Werten', () => {
    expect(reviewDelta(5, 3)).toBe(2);
    expect(reviewDelta(null, 3)).toBeNull();
    expect(reviewDelta(2, null)).toBeNull();
  });
});
