import { badgeById, type BadgeState } from './badges';
import { celebrate, goalCelebrationKey, type CelebratedGoal } from './celebrations';

const UNITS = { weightUnit: 'kg', distanceUnit: 'km' } as const;

function badge(id: string, level: number): BadgeState {
  const def = badgeById(id)!;
  return {
    badge: def,
    value: def.tiers[level - 1] ?? 0,
    level,
    tiers: def.tiers.map((threshold, index) => ({
      threshold,
      reached: index < level,
      achievedOn: null,
    })),
  };
}

function goal(id: string, achievedOn: string | null, recurringFrom?: string): CelebratedGoal {
  return {
    goal: { id },
    progress: {
      achievedOn,
      recurring: recurringFrom !== undefined,
      range: recurringFrom ? { from: recurringFrom, to: '2026-11-08' } : null,
    },
    name: `Ziel ${id}`,
  };
}

describe('celebrate', () => {
  it('der erste Abgleich merkt sich den Stand ohne Hinweis', () => {
    const result = celebrate(null, [badge('workouts', 2)], [goal('g', '2026-11-01')], UNITS);
    expect(result.toast).toBeNull();
    expect(result.changed).toBe(true);
    expect(result.next).toEqual({ badges: { workouts: 2 }, goals: { g: 'once' } });
  });

  it('meldet neue Stufen und erreichte Ziele einmal', () => {
    const current = { badges: { workouts: 1 }, goals: {} };
    const result = celebrate(
      current,
      [badge('workouts', 2), badge('books', 0)],
      [goal('g', '2026-11-07'), goal('open', null)],
      UNITS,
    );
    expect(result.toast).toEqual({
      title: 'Geschafft!',
      lines: ['Ziel g', 'Krafttraining: 10 Krafttrainings'],
    });
    expect(result.next).toEqual({ badges: { workouts: 2 }, goals: { g: 'once' } });

    const again = celebrate(result.next, [badge('workouts', 2)], [goal('g', '2026-11-07')], UNITS);
    expect(again.toast).toBeNull();
    expect(again.changed).toBe(false);
  });

  it('Stufen werden nie zurückgenommen, gelöschte Ziele fallen heraus', () => {
    const current = { badges: { workouts: 3 }, goals: { gone: 'once', kept: 'once' } };
    const result = celebrate(current, [badge('workouts', 2)], [goal('kept', null)], UNITS);
    expect(result.toast).toBeNull();
    expect(result.next).toEqual({ badges: { workouts: 3 }, goals: { kept: 'once' } });
    expect(result.changed).toBe(true);
  });

  it('wiederkehrende Ziele je Zeitraum', () => {
    const week1 = goal('w', '2026-11-03', '2026-11-02');
    expect(goalCelebrationKey(week1.progress)).toBe('2026-11-02');
    const current = { badges: {}, goals: { w: '2026-10-26' } };
    const result = celebrate(current, [], [week1], UNITS);
    expect(result.toast).toEqual({ title: 'Ziel erreicht!', lines: ['Ziel w'] });
    expect(goalCelebrationKey(goal('x', null).progress)).toBeNull();
  });

  it('Überschriften und höchstens vier Zeilen', () => {
    const current = { badges: {}, goals: {} };
    expect(celebrate(current, [badge('books', 1)], [], UNITS).toast?.title).toBe(
      'Neues Abzeichen!',
    );
    const many = celebrate(
      current,
      ['books', 'photos', 'journal', 'workouts', 'endurance'].map((id) => badge(id, 1)),
      [],
      UNITS,
    );
    expect(many.toast?.title).toBe('Neue Abzeichen!');
    expect(many.toast?.lines).toHaveLength(4);
    expect(many.toast?.lines[3]).toBe('und 2 weitere');
    expect(celebrate(current, [], [goal('a', 'x'), goal('b', 'x')], UNITS).toast?.title).toBe(
      'Ziele erreicht!',
    );
  });
});
