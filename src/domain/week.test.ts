import { describe, expect, it } from 'vitest';
import { formatPeekDay, lastDays, trainingsOn, weekTrainings } from './week';

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

describe('formatPeekDay', () => {
  it('nennt heute und gestern beim Namen', () => {
    expect(formatPeekDay('2026-11-13', '2026-11-13')).toBe('Heute');
    expect(formatPeekDay('2026-11-12', '2026-11-13')).toBe('Gestern');
    expect(formatPeekDay('2026-11-11', '2026-11-13')).toMatch(/^Mi\.?, 11\. Nov/);
  });
});

describe('trainingsOn', () => {
  it('listet Kraft vor Ausdauer, je nach Startzeit', () => {
    const iso = (time: string) => new Date(`2026-11-12T${time}:00`).toISOString();
    const result = trainingsOn(
      '2026-11-12',
      [
        { id: 'w2', startedAt: iso('18:00'), name: 'Beine' },
        { id: 'w1', startedAt: iso('07:00'), name: 'Oberkörper' },
        { id: 'w0', startedAt: new Date('2026-11-11T18:00:00').toISOString(), name: 'Alt' },
      ],
      [{ id: 'e1', startedAt: iso('06:00'), name: 'Laufen' }],
    );
    expect(result).toEqual([
      { kind: 'strength', id: 'w1', name: 'Oberkörper' },
      { kind: 'strength', id: 'w2', name: 'Beine' },
      { kind: 'endurance', id: 'e1', name: 'Laufen' },
    ]);
  });
});
