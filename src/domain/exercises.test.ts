import type { Exercise } from '../db/types';
import {
  countDetailFilters,
  EMPTY_EXERCISE_FILTER,
  findDuplicateName,
  matchesExerciseFilter,
  sortExercises,
  suggestAlternatives,
  type ExerciseFilter,
} from './exercises';

function exercise(overrides: Partial<Exercise>): Exercise {
  return {
    id: crypto.randomUUID(),
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
    source: 'builtin',
    builtinKey: 'x',
    name: 'Übung',
    aliases: [],
    category: 'strength',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['triceps'],
    equipment: 'barbell',
    isUnilateral: false,
    isTimed: false,
    isFavorite: false,
    hiddenAt: null,
    notes: '',
    loadType: 'weight',
    ...overrides,
  };
}

const filter = (changes: Partial<ExerciseFilter>) => ({ ...EMPTY_EXERCISE_FILTER, ...changes });

describe('suggestAlternatives', () => {
  const bench = exercise({ name: 'Bankdrücken' });
  const names = (list: Exercise[]) => list.map((item) => item.name);

  it('verlangt gleichen Hauptmuskel und gleiche Kategorie', () => {
    const list = [
      bench,
      exercise({ name: 'Brustpresse', equipment: 'machine' }),
      exercise({ name: 'Rudern', primaryMuscles: ['lats'] }),
      exercise({ name: 'Dehnen', category: 'mobility' }),
    ];
    expect(names(suggestAlternatives(bench, list))).toEqual(['Brustpresse']);
  });

  it('lässt Ausgeblendetes, Gelöschtes und Ausgeschlossenes weg', () => {
    const excluded = exercise({ name: 'Schon im Workout' });
    const list = [
      exercise({ name: 'Ausgeblendet', hiddenAt: '2026-01-01T00:00:00.000Z' }),
      exercise({ name: 'Gelöscht', deletedAt: '2026-01-01T00:00:00.000Z' }),
      excluded,
    ];
    expect(suggestAlternatives(bench, list, { excludeIds: [excluded.id] })).toEqual([]);
  });

  it('bevorzugt gleiche Muskeln, dann Favoriten und anderes Equipment', () => {
    const list = [
      exercise({ name: 'A Gleiches Gerät', secondaryMuscles: [] }),
      exercise({ name: 'B Teiltreffer', primaryMuscles: ['chest', 'shoulders'] }),
      exercise({ name: 'C Anderes Gerät', equipment: 'cable', secondaryMuscles: [] }),
      exercise({ name: 'D Volltreffer', equipment: 'dumbbell' }),
    ];
    expect(names(suggestAlternatives(bench, list))).toEqual([
      'D Volltreffer',
      'C Anderes Gerät',
      'A Gleiches Gerät',
      'B Teiltreffer',
    ]);
  });

  it('begrenzt die Anzahl', () => {
    const list = Array.from({ length: 10 }, (_, i) => exercise({ name: `Übung ${i}` }));
    expect(suggestAlternatives(bench, list, { limit: 3 })).toHaveLength(3);
  });
});

describe('matchesExerciseFilter', () => {
  it('ohne Filter: alle aktiven, nicht ausgeblendeten Übungen', () => {
    expect(matchesExerciseFilter(exercise({}), EMPTY_EXERCISE_FILTER)).toBe(true);
    expect(
      matchesExerciseFilter(
        exercise({ deletedAt: '2026-01-02T00:00:00.000Z' }),
        EMPTY_EXERCISE_FILTER,
      ),
    ).toBe(false);
    const hidden = exercise({ hiddenAt: '2026-01-02T00:00:00.000Z' });
    expect(matchesExerciseFilter(hidden, EMPTY_EXERCISE_FILTER)).toBe(false);
    expect(matchesExerciseFilter(hidden, filter({ includeHidden: true }))).toBe(true);
  });

  it('Muskelgruppe trifft Haupt- und Hilfsmuskeln', () => {
    const bench = exercise({});
    expect(matchesExerciseFilter(bench, filter({ muscle: 'chest' }))).toBe(true);
    expect(matchesExerciseFilter(bench, filter({ muscle: 'triceps' }))).toBe(true);
    expect(matchesExerciseFilter(bench, filter({ muscle: 'quads' }))).toBe(false);
  });

  it('kombiniert Equipment, Kategorie, Favoriten und Eigene', () => {
    const own = exercise({
      source: 'user',
      builtinKey: null,
      isFavorite: true,
      equipment: 'cable',
    });
    expect(
      matchesExerciseFilter(
        own,
        filter({ equipment: 'cable', category: 'strength', favoritesOnly: true, ownOnly: true }),
      ),
    ).toBe(true);
    expect(matchesExerciseFilter(own, filter({ equipment: 'barbell' }))).toBe(false);
    expect(matchesExerciseFilter(own, filter({ category: 'cardio' }))).toBe(false);
    expect(matchesExerciseFilter(exercise({}), filter({ favoritesOnly: true }))).toBe(false);
    expect(matchesExerciseFilter(exercise({}), filter({ ownOnly: true }))).toBe(false);
  });
});

describe('countDetailFilters', () => {
  it('zählt Muskel, Equipment, Kategorie und Ausgeblendete', () => {
    expect(countDetailFilters(EMPTY_EXERCISE_FILTER)).toBe(0);
    expect(countDetailFilters(filter({ favoritesOnly: true, ownOnly: true }))).toBe(0);
    expect(
      countDetailFilters(
        filter({ muscle: 'abs', equipment: 'cable', category: 'strength', includeHidden: true }),
      ),
    ).toBe(4);
  });
});

describe('sortExercises', () => {
  it('Favoriten zuerst, dann deutsch alphabetisch', () => {
    const sorted = sortExercises([
      exercise({ name: 'Zug' }),
      exercise({ name: 'Ätzend' }),
      exercise({ name: 'beugen' }),
      exercise({ name: 'Rudern', isFavorite: true }),
    ]);
    expect(sorted.map((e) => e.name)).toEqual(['Rudern', 'Ätzend', 'beugen', 'Zug']);
  });
});

describe('findDuplicateName', () => {
  const list = [
    exercise({ id: 'a', name: 'Bankdrücken (Langhantel)' }),
    exercise({ id: 'b', name: 'Alt', deletedAt: '2026-01-02T00:00:00.000Z' }),
  ];

  it('erkennt gleiche Namen unabhängig von Schreibweise', () => {
    expect(findDuplicateName('bankdruecken  (LANGHANTEL)', list)?.id).toBe('a');
    expect(findDuplicateName('Bankdrücken', list)).toBeUndefined();
  });

  it('ignoriert gelöschte Übungen und die bearbeitete Übung selbst', () => {
    expect(findDuplicateName('Alt', list)).toBeUndefined();
    expect(findDuplicateName('Bankdrücken (Langhantel)', list, 'a')).toBeUndefined();
  });
});
