import { emptyGoalInput, goalInputSchema, type GoalInput } from '../db/schemas';
import type { Goal } from '../db/types';
import { benchSession, EMPTY_MOTIVATION, motivationHabit, statsSet } from '../test/motivationData';
import {
  BADGES,
  badgeById,
  evaluateBadges,
  formatBadgeTier,
  formatBadgeValue,
  nextTier,
  tierShare,
  type BadgeState,
} from './badges';
import type { GoalEnduranceSession } from './goals';

const TODAY = '2026-11-07';
const KM = { weightUnit: 'kg', distanceUnit: 'km' } as const;
const MI = { weightUnit: 'lb', distanceUnit: 'mi' } as const;

const ride = (day: string, meters: number): GoalEnduranceSession => ({
  id: `ride-${day}`,
  sport: 'ride',
  startedAt: new Date(`${day}T07:00:00`).toISOString(),
  durationSeconds: 3600,
  distanceMeters: meters,
  trackSummary: null,
});

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

const byId = (states: BadgeState[], id: string) => states.find((s) => s.badge.id === id)!;

describe('Abzeichen', () => {
  it('jede Schwelle steigt und jede ID ist eindeutig', () => {
    expect(new Set(BADGES.map((badge) => badge.id)).size).toBe(BADGES.length);
    for (const badge of BADGES) {
      expect(
        badge.tiers.every((tier, index) => index === 0 || tier > badge.tiers[index - 1]!),
      ).toBe(true);
    }
    expect(badgeById('books')?.name).toBe('Bücher');
    expect(badgeById('nope')).toBeUndefined();
  });

  it('ohne Daten ist alles gesperrt', () => {
    const states = evaluateBadges(EMPTY_MOTIVATION, [], TODAY);
    expect(states).toHaveLength(BADGES.length);
    expect(states.every((state) => state.level === 0 && state.value === 0)).toBe(true);
  });

  it('Krafttrainings: Stufen mit Tag des Erreichens, ein Workout zählt einmal', () => {
    const days = Array.from({ length: 10 }, (_, i) => `2026-10-${String(i + 10).padStart(2, '0')}`);
    const sessions = days.flatMap((day) => [
      benchSession(day),
      { ...benchSession(day), exercise: { ...benchSession(day).exercise, id: 'row' } },
    ]);
    const state = byId(
      evaluateBadges({ ...EMPTY_MOTIVATION, strength: sessions }, [], TODAY),
      'workouts',
    );
    expect(state.value).toBe(10);
    expect(state.level).toBe(2);
    expect(state.tiers.slice(0, 3)).toEqual([
      { threshold: 1, reached: true, achievedOn: '2026-10-10' },
      { threshold: 10, reached: true, achievedOn: '2026-10-19' },
      { threshold: 50, reached: false, achievedOn: null },
    ]);
    expect(nextTier(state)?.threshold).toBe(50);
    expect(tierShare(state)).toBe(0);
  });

  it('Strecke, Volumen und Rekorde', () => {
    const data = {
      ...EMPTY_MOTIVATION,
      endurance: [ride('2026-10-01', 60_000), ride('2026-10-05', 50_000)],
      strength: [
        benchSession('2026-10-01', [statsSet({ weight: 100, reps: 5 })]),
        benchSession('2026-10-03', [
          statsSet({ weight: 105, reps: 5 }),
          statsSet({ weight: 100, reps: 10 }),
        ]),
      ],
    };
    const states = evaluateBadges(data, [], TODAY);
    expect(byId(states, 'distance')).toMatchObject({ value: 110_000, level: 2 });
    expect(byId(states, 'distance').tiers[1]?.achievedOn).toBe('2026-10-05');
    expect(byId(states, 'volume')).toMatchObject({ value: 500 + 525 + 1000, level: 1 });
    expect(byId(states, 'volume').tiers[0]?.achievedOn).toBe('2026-10-03');
    // Zweite Einheit: Gewicht, Wdh., 1RM und Volumen sind neu
    expect(byId(states, 'records').value).toBeGreaterThanOrEqual(3);
    expect(byId(states, 'records').tiers[0]?.achievedOn).toBe('2026-10-03');
  });

  it('Serien, Tagesziele, Zeit, Bücher, Fotos', () => {
    const habit = motivationHabit({ id: 'h', kind: 'check' });
    const days = Array.from({ length: 8 }, (_, i) => `2026-10-${String(i + 20).padStart(2, '0')}`);
    const states = evaluateBadges(
      {
        ...EMPTY_MOTIVATION,
        habits: [{ habit, entries: days.map((date) => ({ date, itemId: null, amount: 1 })) }],
        logs: days.map((date) => ({ date, steps: 15_000, waterMl: 3000, sleepSeconds: null })),
        timerSessions: [
          { kind: 'meditation', date: '2026-10-01', durationSeconds: 1800 },
          { kind: 'meditation', date: '2026-10-02', durationSeconds: 1800 },
          { kind: 'focus', date: '2026-10-02', durationSeconds: 3600 },
        ],
        finishedBooks: ['2026-09-01'],
        photoDays: ['2026-10-01'],
        journalDays: ['2026-10-01'],
      },
      [],
      TODAY,
    );
    expect(byId(states, 'habitStreak')).toMatchObject({ value: 8, level: 1 });
    expect(byId(states, 'habitStreak').tiers[0]?.achievedOn).toBeNull();
    expect(byId(states, 'steps')).toMatchObject({ value: 120_000, level: 1 });
    expect(byId(states, 'water')).toMatchObject({ value: 8, level: 1 });
    expect(byId(states, 'water').tiers[0]?.achievedOn).toBe('2026-10-26');
    expect(byId(states, 'sleep').value).toBe(0);
    expect(byId(states, 'meditation')).toMatchObject({ value: 3600, level: 1 });
    expect(byId(states, 'meditation').tiers[0]?.achievedOn).toBe('2026-10-02');
    expect(byId(states, 'focus').level).toBe(0);
    expect(byId(states, 'books').level).toBe(1);
    expect(byId(states, 'photos').level).toBe(1);
    expect(byId(states, 'journal').level).toBe(1);
  });

  it('zählt erreichte einmalige Ziele, nicht wiederkehrende', () => {
    const once = goal({ kind: 'custom', customType: 'check', title: 'Führerschein', target: 1 });
    const weekly = goal({ kind: 'total', totalMetric: 'workouts', period: 'week', target: 1 });
    const data = {
      ...EMPTY_MOTIVATION,
      strength: [benchSession('2026-11-03')],
      entries: [{ goalId: once.id, date: '2026-10-15', amount: 1 }],
    };
    const state = byId(evaluateBadges(data, [once, weekly], TODAY), 'goals');
    expect(state).toMatchObject({ value: 1, level: 1 });
    expect(state.tiers[0]?.achievedOn).toBe('2026-10-15');
  });
});

describe('Anzeige', () => {
  it('Werte in der Einheit des Nutzers', () => {
    expect(formatBadgeValue('distance', 100_000, KM)).toBe('100 km');
    expect(formatBadgeValue('distance', 10_000, MI)).toBe('6,2 mi');
    expect(formatBadgeValue('volume', 12_500, KM)).toBe('12,5 t');
    expect(formatBadgeValue('volume', 1_000_000, KM)).toBe('1.000 t');
    expect(formatBadgeValue('volume', 1000, MI)).toBe('2.205 lb');
    expect(formatBadgeValue('meditation', 5400, KM)).toBe('1,5 h');
    expect(formatBadgeValue('trainingStreak', 1, KM)).toBe('1 Woche');
    expect(formatBadgeValue('journal', 30, KM)).toBe('30 Tage');
    expect(formatBadgeValue('steps', 1_000_000, KM)).toBe('1.000.000');
  });

  it('Stufen-Namen', () => {
    expect(formatBadgeTier('workouts', 1, KM)).toBe('Erstes Krafttraining');
    expect(formatBadgeTier('workouts', 50, KM)).toBe('50 Krafttrainings');
    expect(formatBadgeTier('distance', 500_000, KM)).toBe('500 km insgesamt');
    expect(formatBadgeTier('trainingStreak', 4, KM)).toBe('4 Wochen am Stück im Wochenziel');
    expect(formatBadgeTier('steps', 5_000_000, KM)).toBe('5.000.000 Schritte');
    expect(formatBadgeTier('water', 30, KM)).toBe('30 Tage erreicht');
    expect(formatBadgeTier('focus', 18_000, KM)).toBe('5 h fokussiert');
    expect(formatBadgeTier('goals', 1, KM)).toBe('Erstes Ziel erreicht');
  });

  it('Anteil bis zur nächsten Stufe', () => {
    const badge = badgeById('books')!;
    const state = (value: number): BadgeState => {
      const tiers = badge.tiers.map((threshold) => ({
        threshold,
        reached: value >= threshold,
        achievedOn: null,
      }));
      return { badge, value, level: tiers.filter((t) => t.reached).length, tiers };
    };
    expect(tierShare(state(3))).toBe(0.5); // 1 → 5
    expect(tierShare(state(50))).toBe(1);
    expect(nextTier(state(50))).toBeNull();
  });
});
