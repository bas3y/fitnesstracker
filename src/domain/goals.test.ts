import { emptyGoalInput, goalInputSchema, type GoalInput } from '../db/schemas';
import type { Goal } from '../db/types';
import {
  effortSeconds,
  formatDaysLeft,
  formatGoalValue,
  goalName,
  goalProgress,
  goalTitle,
  lowerIsBetter,
  sortGoalsByDeadline,
  strengthMetricsFor,
  type GoalData,
  type GoalEnduranceSession,
} from './goals';
import type { StatsSession, StatsSet } from './stats';

const TODAY = '2026-11-07'; // Samstag
const UNITS = { weightUnit: 'kg', distanceUnit: 'km' } as const;

function goal(input: Partial<GoalInput> & Pick<GoalInput, 'kind'>): Goal {
  const values = goalInputSchema.parse({ ...emptyGoalInput(input.kind, '2026-10-01'), ...input });
  return {
    ...values,
    id: `goal-${Math.random()}`,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    deletedAt: null,
  };
}

const set = (values: Partial<StatsSet> = {}): StatsSet => ({
  weight: 100,
  level: null,
  eccentricWeight: null,
  eccentricLevel: null,
  reps: 5,
  durationSeconds: null,
  isWarmup: false,
  workoutExerciseId: 'item',
  completedAt: '2026-10-01T10:00:00.000Z',
  ...values,
});

const strength = (day: string, sets: StatsSet[], exerciseId = 'bench'): StatsSession => ({
  workoutId: `w-${day}`,
  startedAt: new Date(`${day}T18:00:00`).toISOString(),
  exercise: {
    id: exerciseId,
    name: exerciseId === 'bench' ? 'Bankdrücken' : 'Klimmzüge',
    category: 'strength',
    primaryMuscles: ['chest'],
    secondaryMuscles: [],
    equipment: exerciseId === 'bench' ? 'barbell' : 'bodyweight',
    isTimed: false,
  },
  sets,
});

const run = (day: string, values: Partial<GoalEnduranceSession> = {}): GoalEnduranceSession => ({
  id: `run-${day}`,
  sport: 'run',
  startedAt: new Date(`${day}T07:00:00`).toISOString(),
  durationSeconds: 3000,
  distanceMeters: 10_000,
  trackSummary: null,
  ...values,
});

const EMPTY: GoalData = { strength: [], endurance: [], weights: [] };

describe('goalInputSchema', () => {
  it('verlangt je Art die Pflichtfelder', () => {
    const base = emptyGoalInput('strength', TODAY);
    expect(goalInputSchema.safeParse({ ...base, target: 100 }).error?.issues[0]?.message).toBe(
      'Bitte eine Übung wählen',
    );
    expect(goalInputSchema.safeParse({ ...base, exerciseId: 'x' }).success).toBe(false);
    const effort = emptyGoalInput('effort', TODAY);
    expect(goalInputSchema.safeParse({ ...effort, target: 3000, effortMeters: 3000 }).success).toBe(
      false,
    );
    expect(
      goalInputSchema.safeParse({ ...emptyGoalInput('bodyWeight', TODAY), target: 80 }).success,
    ).toBe(false);
    const custom = { ...emptyGoalInput('total', TODAY), target: 10, period: 'custom' as const };
    expect(goalInputSchema.safeParse(custom).error?.issues[0]?.message).toContain('Ende');
    expect(
      goalInputSchema.safeParse({ ...custom, deadline: '2026-11-01' }).error?.issues[0]?.message,
    ).toContain('vor dem Beginn');
  });

  it('leert Felder, die zur Art nicht passen', () => {
    const result = goalInputSchema.parse({
      ...emptyGoalInput('total', TODAY),
      target: 12.4,
      deadline: '2026-12-31',
      sport: 'run',
      exerciseId: 'bench',
      minReps: 5,
    });
    expect(result).toMatchObject({
      target: 12,
      deadline: null,
      sport: null,
      exerciseId: null,
      minReps: null,
      totalMetric: 'trainings',
    });
    const strengthGoal = goalInputSchema.parse({
      ...emptyGoalInput('strength', TODAY),
      exerciseId: 'bench',
      strengthMetric: 'oneRepMax',
      minReps: 5,
      target: 120,
    });
    expect(strengthGoal.minReps).toBeNull();
  });
});

describe('Kraftziele', () => {
  const benchGoal = (values: Partial<GoalInput> = {}) =>
    goal({
      kind: 'strength',
      exerciseId: 'bench',
      strengthMetric: 'weight',
      target: 100,
      startDate: '2026-10-15',
      ...values,
    });

  it('schlägt Kennzahlen passend zur Übung vor', () => {
    expect(strengthMetricsFor({ isTimed: true, equipment: 'none' })).toEqual(['duration']);
    expect(strengthMetricsFor({ isTimed: false, equipment: 'bodyweight' })).toEqual([
      'reps',
      'weight',
    ]);
    expect(strengthMetricsFor({ isTimed: false, equipment: 'barbell' })[0]).toBe('weight');
  });

  it('misst vom Bestwert vor dem Anlegen bis zum Ziel', () => {
    const data: GoalData = {
      ...EMPTY,
      strength: [
        strength('2026-10-01', [set({ weight: 80 })]),
        strength('2026-10-20', [set({ weight: 90 }), set({ weight: 95, isWarmup: true })]),
      ],
    };
    const progress = goalProgress(benchGoal(), data, TODAY);
    expect(progress).toMatchObject({
      status: 'active',
      current: 90,
      baseline: 80,
      percent: 50,
      achievedOn: null,
    });
  });

  it('ohne frühere Werte zählt der Anteil am Ziel', () => {
    const data = { ...EMPTY, strength: [strength('2026-10-20', [set({ weight: 85 })])] };
    expect(goalProgress(benchGoal(), data, TODAY)).toMatchObject({ baseline: null, percent: 85 });
  });

  it('zählt beim Gewicht nur Sätze mit genug Wiederholungen, Stufen nie', () => {
    const data: GoalData = {
      ...EMPTY,
      strength: [
        strength('2026-10-20', [
          set({ weight: 105, reps: 3 }),
          set({ weight: 100, reps: 5 }),
          set({ weight: null, level: 120, reps: 8 }),
        ]),
      ],
    };
    expect(goalProgress(benchGoal({ minReps: 5 }), data, TODAY)).toMatchObject({
      current: 100,
      status: 'achieved',
      achievedOn: '2026-10-20',
      percent: 100,
    });
    expect(goalProgress(benchGoal({ minReps: 6 }), data, TODAY).current).toBeNull();
  });

  it('wertet 1RM und Wiederholungen aus', () => {
    const data: GoalData = {
      ...EMPTY,
      strength: [
        strength('2026-10-20', [set({ weight: 100, reps: 3 })]),
        strength('2026-10-21', [set({ weight: 0, reps: 12 })], 'pullup'),
      ],
    };
    const oneRm = goal({
      kind: 'strength',
      exerciseId: 'bench',
      strengthMetric: 'oneRepMax',
      target: 120,
    });
    expect(goalProgress(oneRm, data, TODAY).current).toBeCloseTo(110);
    const reps = goal({
      kind: 'strength',
      exerciseId: 'pullup',
      strengthMetric: 'reps',
      target: 15,
    });
    expect(goalProgress(reps, data, TODAY)).toMatchObject({ current: 12, percent: 80 });
  });

  it('verpasst das Zieldatum und zählt die Tage bis dahin', () => {
    const data = { ...EMPTY, strength: [strength('2026-10-20', [set({ weight: 90 })])] };
    expect(goalProgress(benchGoal({ deadline: '2026-11-01' }), data, TODAY).status).toBe('missed');
    expect(goalProgress(benchGoal({ deadline: '2026-11-10' }), data, TODAY).daysLeft).toBe(3);
    expect(goalProgress(benchGoal({ deadline: TODAY }), data, TODAY).daysLeft).toBe(0);
    expect(formatDaysLeft(0)).toBe('Heute ist der letzte Tag');
    expect(formatDaysLeft(3)).toBe('Noch 3 Tage');
  });

  it('ignoriert Einheiten nach heute', () => {
    const data = { ...EMPTY, strength: [strength('2026-11-20', [set({ weight: 120 })])] };
    expect(goalProgress(benchGoal(), data, TODAY).current).toBeNull();
  });
});

describe('Bestzeit-Ziele', () => {
  it('nimmt die Zeit aus dem Verlauf, sonst die hochgerechnete Ø-Pace', () => {
    const withTrack = run('2026-10-01', {
      distanceMeters: 12_000,
      trackSummary: { bestEfforts: [{ meters: 10_000, seconds: 2900 }], heartRateSeconds: [] },
    });
    expect(effortSeconds(withTrack, 10_000)).toBe(2900);
    expect(
      effortSeconds(run('2026-10-01', { distanceMeters: 10_500, durationSeconds: 3150 }), 10_000),
    ).toBe(3000);
    expect(effortSeconds(run('2026-10-01', { distanceMeters: 9000 }), 10_000)).toBeNull();
  });

  it('misst rückwärts: weniger ist besser', () => {
    const target = goal({
      kind: 'effort',
      sport: 'run',
      effortMeters: 10_000,
      target: 2700,
      startDate: '2026-10-15',
    });
    const data: GoalData = {
      ...EMPTY,
      endurance: [
        run('2026-10-01', { durationSeconds: 3300 }),
        run('2026-10-20', { durationSeconds: 3000 }),
        run('2026-10-21', { sport: 'ride', durationSeconds: 1000 }),
      ],
    };
    expect(lowerIsBetter(target)).toBe(true);
    expect(goalProgress(target, data, TODAY)).toMatchObject({
      current: 3000,
      baseline: 3300,
      percent: 50,
      status: 'active',
    });
  });
});

describe('Gewichtsziele', () => {
  const weightGoal = (values: Partial<GoalInput> = {}) =>
    goal({
      kind: 'bodyWeight',
      startValue: 90,
      target: 85,
      startDate: '2026-10-01',
      deadline: '2026-11-21',
      ...values,
    });

  it('erkennt die Richtung und das nötige Tempo', () => {
    const data: GoalData = {
      ...EMPTY,
      weights: [
        { date: '2026-09-01', weightKg: 91 },
        { date: '2026-10-15', weightKg: 89 },
        { date: '2026-11-05', weightKg: 88 },
      ],
    };
    const progress = goalProgress(weightGoal(), data, TODAY);
    expect(progress).toMatchObject({ current: 88, baseline: 90, percent: 40, daysLeft: 14 });
    expect(progress.perWeek).toBeCloseTo(1.5);
    expect(goalProgress(weightGoal({ target: 95 }), data, TODAY)).toMatchObject({
      lowerIsBetter: false,
      percent: 0,
    });
  });

  it('gilt ab dem ersten Tag nach dem Start, an dem das Ziel erreicht war', () => {
    const data: GoalData = {
      ...EMPTY,
      weights: [
        { date: '2026-09-01', weightKg: 84 },
        { date: '2026-10-20', weightKg: 84.8 },
        { date: '2026-11-05', weightKg: 86 },
      ],
    };
    expect(goalProgress(weightGoal(), data, TODAY)).toMatchObject({
      status: 'achieved',
      achievedOn: '2026-10-20',
      current: 86,
      percent: 100,
    });
  });
});

describe('Mengen-Ziele', () => {
  const data: GoalData = {
    ...EMPTY,
    strength: [
      strength('2026-10-30', [set()]),
      strength('2026-11-02', [set()]),
      strength('2026-11-02', [set()], 'pullup'),
      strength('2026-11-05', [set()]),
    ],
    endurance: [
      run('2026-11-03', { distanceMeters: 8000 }),
      run('2026-11-04', { sport: 'ride', distanceMeters: 30_000, durationSeconds: 3600 }),
      run('2026-10-10', { distanceMeters: 21_000 }),
    ],
  };

  it('zählt im laufenden Zeitraum und vergleicht mit dem Soll', () => {
    const monthly = goal({ kind: 'total', totalMetric: 'trainings', period: 'month', target: 12 });
    const progress = goalProgress(monthly, data, TODAY);
    expect(progress).toMatchObject({
      recurring: true,
      status: 'active',
      current: 4,
      percent: 33,
      range: { from: '2026-11-01', to: '2026-11-30' },
      daysLeft: 23,
    });
    expect(progress.expected).toBeCloseTo(12 * (7 / 30));
    expect(progress.history).toEqual({ reached: 0, total: 1 });
    const workouts = goal({ kind: 'total', totalMetric: 'workouts', period: 'week', target: 2 });
    expect(goalProgress(workouts, data, TODAY)).toMatchObject({
      current: 2,
      achievedOn: '2026-11-05',
      status: 'active',
      percent: 100,
    });
  });

  it('summiert Strecke und Dauer je Sportart', () => {
    const distance = goal({
      kind: 'total',
      totalMetric: 'distance',
      sport: 'run',
      period: 'custom',
      startDate: '2026-10-01',
      deadline: '2026-12-31',
      target: 100_000,
    });
    expect(goalProgress(distance, data, TODAY)).toMatchObject({ current: 29_000, percent: 29 });
    const duration = goal({
      kind: 'total',
      totalMetric: 'duration',
      period: 'week',
      target: 7200,
    });
    expect(goalProgress(duration, data, TODAY).current).toBe(3000 + 3600);
  });

  it('beendet einen eigenen Zeitraum als erreicht oder verpasst', () => {
    const past = goal({
      kind: 'total',
      totalMetric: 'workouts',
      period: 'custom',
      startDate: '2026-10-01',
      deadline: '2026-10-31',
      target: 2,
    });
    expect(goalProgress(past, data, TODAY)).toMatchObject({ status: 'missed', current: 1 });
    expect(goalProgress({ ...past, target: 1 }, data, TODAY)).toMatchObject({
      status: 'achieved',
      achievedOn: '2026-10-30',
    });
  });

  it('zählt abgeschlossene Zeiträume seit dem Anlegen', () => {
    const weekly = goal({
      kind: 'total',
      totalMetric: 'trainings',
      period: 'week',
      target: 1,
      startDate: '2026-10-05',
    });
    // Wochen ab 5.10., 12.10., 19.10., 26.10.: erreicht nur die erste (10.10.) und die letzte (30.10.)
    expect(goalProgress(weekly, data, TODAY).history).toEqual({ reached: 2, total: 4 });
  });
});

describe('Anzeige', () => {
  it('erzeugt verständliche Namen', () => {
    const bench = { name: 'Bankdrücken', isTimed: false, equipment: 'barbell' as const };
    expect(
      goalTitle(
        goal({
          kind: 'strength',
          exerciseId: 'b',
          strengthMetric: 'weight',
          target: 100,
          minReps: 5,
        }),
        bench,
        UNITS,
      ),
    ).toBe('Bankdrücken: 100 kg × 5');
    expect(
      goalTitle(
        goal({ kind: 'effort', sport: 'run', effortMeters: 10_000, target: 2970 }),
        null,
        UNITS,
      ),
    ).toBe('Laufen: 10 km in 49:30');
    expect(goalTitle(goal({ kind: 'bodyWeight', startValue: 90, target: 85 }), null, UNITS)).toBe(
      'Gewicht 85 kg',
    );
    expect(
      goalTitle(
        goal({
          kind: 'total',
          totalMetric: 'distance',
          sport: 'run',
          period: 'year',
          target: 500_000,
        }),
        null,
        UNITS,
      ),
    ).toBe('500 km Laufen pro Jahr');
    expect(
      goalTitle(
        goal({
          kind: 'total',
          totalMetric: 'duration',
          period: 'custom',
          deadline: '2026-12-31',
          target: 36_000,
        }),
        null,
        UNITS,
      ),
    ).toBe('10 h Ausdauer bis 31.12.2026');
    const named = goal({ kind: 'bodyWeight', startValue: 90, target: 85, title: 'Sommerform' });
    expect(goalName(named, null, UNITS)).toBe('Sommerform');
  });

  it('formatiert Werte in der Anzeigeeinheit', () => {
    const pullups = goal({
      kind: 'strength',
      exerciseId: 'p',
      strengthMetric: 'weight',
      target: 10,
    });
    expect(formatGoalValue(pullups, 10, { ...UNITS, weightUnit: 'lb' }, true)).toBe('+22 lb');
    const count = goal({ kind: 'total', totalMetric: 'workouts', period: 'week', target: 1 });
    expect(formatGoalValue(count, 1, UNITS)).toBe('1 Krafttraining');
  });

  it('sortiert nach Zieldatum, ohne Datum zuletzt', () => {
    const items = [
      { goal: goal({ kind: 'bodyWeight', startValue: 90, target: 85 }), id: 'none' },
      {
        goal: goal({ kind: 'bodyWeight', startValue: 90, target: 85, deadline: '2026-12-01' }),
        id: 'dec',
      },
      {
        goal: goal({ kind: 'bodyWeight', startValue: 90, target: 85, deadline: '2026-11-20' }),
        id: 'nov',
      },
    ].map((item) => ({ ...item, progress: goalProgress(item.goal, EMPTY, TODAY) }));
    expect(sortGoalsByDeadline(items).map((item) => item.id)).toEqual(['nov', 'dec', 'none']);
  });
});
