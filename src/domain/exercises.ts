import type { Equipment, Exercise, ExerciseCategory, MuscleGroup } from '../db/types';
import { normalizeSearchText } from './search';

export interface ExerciseFilter {
  muscle: MuscleGroup | null;
  equipment: Equipment | null;
  category: ExerciseCategory | null;
  favoritesOnly: boolean;
  ownOnly: boolean;
  includeHidden: boolean;
}

export const EMPTY_EXERCISE_FILTER: ExerciseFilter = {
  muscle: null,
  equipment: null,
  category: null,
  favoritesOnly: false,
  ownOnly: false,
  includeHidden: false,
};

/** Zustand von Suche + Filter in Übungsliste und Übungsauswahl */
export interface ExerciseBrowserState {
  query: string;
  filter: ExerciseFilter;
}

export const INITIAL_BROWSER_STATE: ExerciseBrowserState = {
  query: '',
  filter: EMPTY_EXERCISE_FILTER,
};

type FilterableExercise = Pick<
  Exercise,
  | 'primaryMuscles'
  | 'secondaryMuscles'
  | 'equipment'
  | 'category'
  | 'isFavorite'
  | 'source'
  | 'hiddenAt'
  | 'deletedAt'
>;

/** Muskelfilter trifft Haupt- und Hilfsmuskeln; gelöschte Übungen nie, ausgeblendete nur auf Wunsch */
export function matchesExerciseFilter(
  exercise: FilterableExercise,
  filter: ExerciseFilter,
): boolean {
  if (exercise.deletedAt !== null) return false;
  if (!filter.includeHidden && exercise.hiddenAt !== null) return false;
  if (filter.favoritesOnly && !exercise.isFavorite) return false;
  if (filter.ownOnly && exercise.source !== 'user') return false;
  if (filter.category && exercise.category !== filter.category) return false;
  if (filter.equipment && exercise.equipment !== filter.equipment) return false;
  if (
    filter.muscle &&
    !exercise.primaryMuscles.includes(filter.muscle) &&
    !exercise.secondaryMuscles.includes(filter.muscle)
  ) {
    return false;
  }
  return true;
}

/** Anzahl gesetzter Detailfilter (Muskel, Equipment, Kategorie, Ausgeblendete) für die Filter-Schaltfläche */
export function countDetailFilters(filter: ExerciseFilter): number {
  return (
    [filter.muscle, filter.equipment, filter.category].filter(Boolean).length +
    (filter.includeHidden ? 1 : 0)
  );
}

const collator = new Intl.Collator('de', { sensitivity: 'base', numeric: true });

/** Favoriten zuerst, dann alphabetisch (deutsche Sortierung) */
export function sortExercises<T extends Pick<Exercise, 'name' | 'isFavorite'>>(
  exercises: readonly T[],
): T[] {
  return [...exercises].sort(
    (a, b) => Number(b.isFavorite) - Number(a.isFavorite) || collator.compare(a.name, b.name),
  );
}

type AlternativeExercise = Pick<
  Exercise,
  | 'id'
  | 'name'
  | 'category'
  | 'primaryMuscles'
  | 'secondaryMuscles'
  | 'equipment'
  | 'isFavorite'
  | 'hiddenAt'
  | 'deletedAt'
>;

/**
 * Alternativen zu einer Übung (z. B. wenn das Gerät belegt ist): gleiche Kategorie und mindestens
 * ein gemeinsamer Hauptmuskel. Mehr gemeinsame Muskeln zuerst, bei Gleichstand Favoriten und
 * anderes Equipment – das gleiche Gerät ist ja meist gerade nicht frei.
 */
export function suggestAlternatives<T extends AlternativeExercise>(
  exercise: AlternativeExercise,
  exercises: readonly T[],
  { excludeIds = [], limit = 6 }: { excludeIds?: readonly string[]; limit?: number } = {},
): T[] {
  const overlap = (a: readonly MuscleGroup[], b: readonly MuscleGroup[]) =>
    a.filter((muscle) => b.includes(muscle)).length;
  const score = (other: T) => {
    const primary = overlap(exercise.primaryMuscles, other.primaryMuscles);
    if (primary === 0) return 0;
    const sameTarget = other.primaryMuscles.length === exercise.primaryMuscles.length;
    return (
      primary * 4 +
      (sameTarget && primary === exercise.primaryMuscles.length ? 2 : 0) +
      overlap(exercise.secondaryMuscles, other.secondaryMuscles) +
      (other.isFavorite ? 1 : 0) +
      (other.equipment !== exercise.equipment ? 1 : 0)
    );
  };
  return exercises
    .filter(
      (other) =>
        other.id !== exercise.id &&
        !excludeIds.includes(other.id) &&
        other.category === exercise.category &&
        other.deletedAt === null &&
        other.hiddenAt === null,
    )
    .map((other) => ({ other, score: score(other) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || collator.compare(a.other.name, b.other.name))
    .slice(0, limit)
    .map(({ other }) => other);
}

/** Findet eine aktive Übung mit gleichem Namen (ohne Groß-/Kleinschreibung, Umlaut-Schreibweise) */
export function findDuplicateName<T extends Pick<Exercise, 'id' | 'name' | 'deletedAt'>>(
  name: string,
  exercises: readonly T[],
  exceptId?: string,
): T | undefined {
  const normalized = normalizeSearchText(name);
  if (normalized === '') return undefined;
  return exercises.find(
    (exercise) =>
      exercise.id !== exceptId &&
      exercise.deletedAt === null &&
      normalizeSearchText(exercise.name) === normalized,
  );
}
