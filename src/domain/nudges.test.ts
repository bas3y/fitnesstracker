import type { MuscleGroup } from '../db/types';
import {
  dayDistance,
  formatTrainingGap,
  mealForTime,
  proteinSuggestions,
  trainingGap,
} from './nudges';

const session = (date: string, primaryMuscles: MuscleGroup[]) => ({
  startedAt: new Date(`${date}T18:00:00`).toISOString(),
  exercise: {
    id: primaryMuscles.join('-'),
    name: 'Übung',
    category: 'strength' as const,
    primaryMuscles,
    secondaryMuscles: [] as MuscleGroup[],
    equipment: 'barbell' as const,
    isTimed: false,
  },
});

describe('trainingGap', () => {
  it('nennt den Bereich, der am längsten nicht trainiert wurde', () => {
    const sessions = [
      session('2026-11-07', ['quads']),
      session('2026-11-12', ['chest']),
      session('2026-11-09', ['lats']),
    ];
    const gap = trainingGap(sessions, '2026-11-13');
    expect(gap).toEqual({ area: 'legs', days: 6 });
    expect(formatTrainingGap(gap!)).toBe('Letztes Beintraining vor 6 Tagen');
  });

  it('meldet nichts unter 4 Tagen und ignoriert Hilfsmuskeln und nie trainierte Bereiche', () => {
    const recent = [session('2026-11-11', ['quads']), session('2026-11-12', ['chest'])];
    expect(trainingGap(recent, '2026-11-13')).toBeNull();
    const helper = session('2026-11-01', ['triceps']);
    helper.exercise.secondaryMuscles = ['shoulders'];
    expect(trainingGap([helper], '2026-11-13')).toBeNull();
    expect(trainingGap([], '2026-11-13')).toBeNull();
  });

  it('nimmt das letzte Training des Bereichs', () => {
    const sessions = [session('2026-11-01', ['glutes']), session('2026-11-08', ['hamstrings'])];
    expect(trainingGap(sessions, '2026-11-13')).toEqual({ area: 'legs', days: 5 });
  });

  it('zählt Kalendertage', () => {
    expect(dayDistance('2026-10-24', '2026-10-26')).toBe(2);
    // Zeitumstellung am 25.10.
    expect(dayDistance('2026-10-24', '2026-10-27')).toBe(3);
  });
});

describe('proteinSuggestions', () => {
  const food = (id: string, protein: number, extra: object = {}) => ({
    id,
    name: id,
    protein,
    portions: [{ label: '1 Becher', grams: 150 }],
    hiddenAt: null,
    deletedAt: null,
    ...extra,
  });

  it('schlägt proteinreiche Lebensmittel mit Standardportion vor, in der Reihenfolge', () => {
    const result = proteinSuggestions([
      food('Skyr', 11),
      food('Apfel', 0.3),
      food('Skyr', 11),
      food('Quark', 12, { portions: [] }),
      food('Versteckt', 30, { hiddenAt: '2026-01-01T00:00:00.000Z' }),
      food('Hähnchen', 23),
      food('Thunfisch', 25),
    ]);
    expect(result.map((item) => item.food.name)).toEqual(['Skyr', 'Quark', 'Hähnchen']);
    expect(result[0]).toMatchObject({ protein: 16.5, amount: { grams: 150 } });
    expect(result[1]).toMatchObject({ protein: 12, amount: { grams: 100, portion: null } });
  });
});

describe('mealForTime', () => {
  it('wählt die Mahlzeit nach Uhrzeit', () => {
    const at = (time: string) => mealForTime(new Date(`2026-11-13T${time}:00`));
    expect(at('07:30')).toBe('breakfast');
    expect(at('11:00')).toBe('snack');
    expect(at('12:15')).toBe('lunch');
    expect(at('16:00')).toBe('snack');
    expect(at('19:00')).toBe('dinner');
    expect(at('23:00')).toBe('snack');
  });
});
