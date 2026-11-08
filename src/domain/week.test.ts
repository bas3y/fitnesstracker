import { describe, expect, it } from 'vitest';
import { lastDays, weekTrainings } from './week';

const at = (date: string, time = '10:00') => new Date(`${date}T${time}:00`).toISOString();

describe('weekTrainings', () => {
  // Mi 4.11.2026, Woche Mo 2.11. – So 8.11.
  const today = '2026-11-04';

  it('zählt Workouts einmal und Ausdauer-Einheiten einzeln, nur in dieser Woche', () => {
    const strength = [
      { workoutId: 'w1', startedAt: at('2026-11-02') },
      { workoutId: 'w1', startedAt: at('2026-11-02') },
      { workoutId: 'w2', startedAt: at('2026-11-01') },
    ];
    const endurance = [{ startedAt: at('2026-11-04', '07:00') }, { startedAt: at('2026-11-04') }];
    const week = weekTrainings(strength, endurance, today);
    expect(week.count).toBe(3);
    expect(week.days.map((day) => day.trained)).toEqual([
      true,
      false,
      true,
      false,
      false,
      false,
      false,
    ]);
    expect(week.days[0]!.date).toBe('2026-11-02');
    expect(week.days[6]!.date).toBe('2026-11-08');
  });

  it('ohne Training ist die Woche leer', () => {
    expect(weekTrainings([], [], today).count).toBe(0);
  });
});

describe('lastDays', () => {
  it('füllt fehlende Tage mit 0, ältester zuerst', () => {
    const values = [
      { date: '2026-11-04', value: 8000 },
      { date: '2026-11-02', value: null },
      { date: '2026-10-20', value: 12000 },
    ];
    expect(lastDays(values, '2026-11-04', 3)).toEqual([
      { date: '2026-11-02', value: 0 },
      { date: '2026-11-03', value: 0 },
      { date: '2026-11-04', value: 8000 },
    ]);
  });
});
