import { benchSession, EMPTY_MOTIVATION, motivationHabit } from '../test/motivationData';
import {
  daySeries,
  proteinGoalDays,
  runReachedOn,
  streakOverview,
  summarizeRuns,
  supplementDays,
  trainingDates,
  weekSeries,
  type StreakSupplement,
} from './streaks';
import type { GoalEnduranceSession } from './goals';
import type { TrainingDay } from './supplements';

const TODAY = '2026-11-07'; // Samstag

const run = (day: string): GoalEnduranceSession => ({
  id: `run-${day}`,
  sport: 'run',
  startedAt: new Date(`${day}T07:00:00`).toISOString(),
  durationSeconds: 1800,
  distanceMeters: 5000,
  trackSummary: null,
});

const trainingDay: TrainingDay = {
  strength: true,
  endurance: false,
  startedAt: '2026-11-05T17:00:00.000Z',
  endedAt: '2026-11-05T18:00:00.000Z',
};

describe('daySeries / summarizeRuns', () => {
  it('zählt Tage am Stück, heute offen unterbricht nichts', () => {
    const done = new Set(['2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06']);
    const series = daySeries(done, TODAY);
    expect(summarizeRuns(series, 'days')).toEqual({
      current: 4,
      best: 4,
      unit: 'days',
      todayDone: false,
    });
    expect(summarizeRuns(daySeries(new Set([...done, TODAY]), TODAY), 'days')).toMatchObject({
      current: 5,
      todayDone: true,
    });
    expect(runReachedOn(series, 3)).toBe('2026-11-05');
    expect(runReachedOn(series, 10)).toBeNull();
  });

  it('bricht nach einem verpassten Tag ab und merkt die beste Serie', () => {
    const done = new Set(['2026-10-20', '2026-10-21', '2026-10-22', '2026-11-05', '2026-11-06']);
    expect(summarizeRuns(daySeries(done, TODAY), 'days')).toMatchObject({ current: 2, best: 3 });
    // Gestern verpasst: Serie ist vorbei
    expect(summarizeRuns(daySeries(new Set(['2026-11-05']), TODAY), 'days').current).toBe(0);
  });

  it('übersprungene Tage zählen weder für noch gegen die Serie', () => {
    const done = new Set(['2026-11-02', '2026-11-04', '2026-11-06']);
    const skip = (day: string) => !done.has(day) && day !== '2026-11-07';
    expect(summarizeRuns(daySeries(done, TODAY, skip), 'days')).toMatchObject({
      current: 3,
      best: 3,
    });
  });

  it('ignoriert Tage nach heute und liefert ohne Daten nichts', () => {
    expect(daySeries(new Set(['2026-11-10']), TODAY)).toEqual([]);
    expect(summarizeRuns([], 'days')).toEqual({
      current: 0,
      best: 0,
      unit: 'days',
      todayDone: false,
    });
  });
});

describe('Trainingswochen', () => {
  it('zählt je Workout und Einheit ein Training', () => {
    const strength = [
      benchSession('2026-11-03'),
      {
        ...benchSession('2026-11-03'),
        exercise: { ...benchSession('2026-11-03').exercise, id: 'squat' },
      },
    ];
    expect(trainingDates(strength, [run('2026-11-04')])).toEqual(['2026-11-03', '2026-11-04']);
  });

  it('Wochen mit Wochenziel am Stück, Datum = Tag des Erreichens, laufende Woche offen', () => {
    const dates = [
      '2026-10-13',
      '2026-10-15', // KW 42
      '2026-10-20',
      '2026-10-24', // KW 43
      '2026-10-27',
      '2026-10-28',
      '2026-10-30', // KW 44
      '2026-11-03', // KW 45 (läuft)
    ];
    const series = weekSeries(dates, 2, TODAY);
    expect(series.map((point) => point.value)).toEqual([1, 2, 3, 0]);
    expect(series.map((point) => point.date)).toEqual([
      '2026-10-15',
      '2026-10-24',
      '2026-10-28',
      '2026-11-02',
    ]);
    expect(summarizeRuns(series, 'weeks')).toEqual({
      current: 3,
      best: 3,
      unit: 'weeks',
      todayDone: false,
    });
    // Eine Woche ohne Ziel unterbricht
    expect(
      weekSeries(['2026-10-13', '2026-10-14', '2026-10-27', '2026-10-28'], 2, TODAY).map(
        (point) => point.value,
      ),
    ).toEqual([1, 0, 1, 0]);
  });
});

describe('proteinGoalDays', () => {
  it('Trainings- und Ruhetag, schnell erfasstes Protein zählt mit', () => {
    const meal = (date: string, grams: number) => ({
      date,
      grams,
      nutrients: { kcal: 100, protein: 25, carbs: 0, fat: 0, fiber: 0, sugar: 0, alcohol: 0 },
    });
    const days = proteinGoalDays(
      [meal('2026-11-04', 480), meal('2026-11-05', 480), meal('2026-11-06', 400)],
      [
        { date: '2026-11-06', proteinGrams: 20 },
        { date: '2026-11-07', proteinGrams: null },
      ],
      new Map([['2026-11-05', trainingDay]]),
      EMPTY_MOTIVATION.nutritionGoals,
    );
    // 04.: 120 g Ruhetag ✓, 05.: 120 g Trainingstag (150) ✗, 06.: 100 + 20 ✓
    expect([...days].sort()).toEqual(['2026-11-04', '2026-11-06']);
  });
});

describe('supplementDays', () => {
  const supplement = (values: Partial<StreakSupplement['supplement']> = {}) => ({
    doses: [
      { id: 'a', amount: 1, timing: 'period' as const, time: null, period: 'morning' as const },
      { id: 'b', amount: 1, timing: 'period' as const, time: null, period: 'evening' as const },
    ],
    schedule: 'daily' as const,
    weekdays: [],
    trainingKind: 'any' as const,
    createdAt: new Date('2026-11-04T08:00:00').toISOString(),
    archivedAt: null,
    ...values,
  });
  const intake = (date: string, doseId: string) => ({ date, doseId });

  it('erledigt nur mit allen fälligen Einnahmen, Tage ohne fällige zählen nicht', () => {
    const items: StreakSupplement[] = [
      {
        supplement: supplement(),
        intakes: [intake('2026-11-04', 'a'), intake('2026-11-04', 'b'), intake('2026-11-05', 'a')],
      },
      {
        supplement: supplement({
          doses: [{ id: 'c', amount: 1, timing: 'beforeTraining', time: null, period: null }],
          schedule: 'training',
        }),
        intakes: [],
      },
    ];
    const { done, due } = supplementDays(items, new Map([['2026-11-06', trainingDay]]), TODAY);
    expect([...done]).toEqual(['2026-11-04']);
    expect([...due]).toEqual(['2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07']);
  });

  it('archivierte zählen bis zum Vortag, Wochentage nur an ihren Tagen', () => {
    const items: StreakSupplement[] = [
      {
        supplement: supplement({
          doses: [{ id: 'a', amount: 1, timing: 'period', time: null, period: 'morning' }],
          archivedAt: new Date('2026-11-06T09:00:00').toISOString(),
        }),
        intakes: [intake('2026-11-04', 'a'), intake('2026-11-05', 'a')],
      },
    ];
    const { done, due } = supplementDays(items, new Map(), TODAY);
    expect([...done]).toEqual(['2026-11-04', '2026-11-05']);
    expect([...due]).toEqual(['2026-11-04', '2026-11-05']);

    const weekly = supplementDays(
      [{ supplement: supplement({ schedule: 'weekdays', weekdays: [4] }), intakes: [] }],
      new Map(),
      TODAY,
    );
    expect([...weekly.due]).toEqual(['2026-11-05']);
  });
});

describe('streakOverview', () => {
  it('laufende Serien zuerst, Bereiche ohne Serie fehlen, archivierte Gewohnheiten auch', () => {
    const habit = motivationHabit({ id: 'h', kind: 'check', name: 'Dehnen', icon: '🤸' });
    const archived = motivationHabit({
      id: 'x',
      kind: 'check',
      archivedAt: '2026-11-01T00:00:00.000Z',
    });
    const entry = (date: string) => ({ date, itemId: null, amount: 1 });
    const items = streakOverview(
      {
        ...EMPTY_MOTIVATION,
        strength: [benchSession('2026-10-27'), benchSession('2026-10-29')],
        endurance: [run('2026-11-03'), run('2026-11-05')],
        journalDays: ['2026-10-01', '2026-10-02'],
        logs: [
          { date: '2026-11-06', steps: 12_000, waterMl: null, sleepSeconds: null },
          { date: '2026-11-07', steps: 11_000, waterMl: null, sleepSeconds: null },
        ],
        habits: [
          {
            habit,
            entries: [
              '2026-11-01',
              '2026-11-02',
              '2026-11-03',
              '2026-11-04',
              '2026-11-05',
              '2026-11-06',
            ].map(entry),
          },
          { habit: archived, entries: [entry('2026-11-06')] },
        ],
        timerSessions: [{ kind: 'meditation', date: '2026-11-07', durationSeconds: 600 }],
      },
      TODAY,
    );
    expect(items.map((item) => [item.key, item.current, item.best, item.todayDone])).toEqual([
      ['training', 2, 2, true],
      ['habit:h', 6, 6, false],
      ['steps', 2, 2, true],
      ['meditation', 1, 1, true],
      ['journal', 0, 2, false],
    ]);
    expect(items[1]).toMatchObject({ name: 'Dehnen', icon: '🤸', habitId: 'h', area: 'habit' });
  });

  it('Aufhören-Gewohnheit: Tage im Limit, heute zählt sofort', () => {
    const quit = motivationHabit({
      id: 'q',
      kind: 'quit',
      target: 0,
      startDate: '2026-11-01',
      name: 'Rauchen',
    });
    const items = streakOverview(
      {
        ...EMPTY_MOTIVATION,
        habits: [{ habit: quit, entries: [{ date: '2026-11-03', itemId: null, amount: 2 }] }],
      },
      TODAY,
    );
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ current: 4, best: 4, todayDone: true });
  });
});
