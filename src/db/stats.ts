import type { StatsSession } from '../domain/stats';
import { db } from './database';
import type { WorkoutSet } from './types';

const isActive = (entity: { deletedAt: string | null }) => entity.deletedAt === null;

const bySequence = (a: WorkoutSet, b: WorkoutSet) =>
  (a.completedAt ?? '').localeCompare(b.completedAt ?? '') || a.order - b.order;

/** Abgehakte Sätze aller beendeten Workouts je Übung und Workout, ältestes zuerst */
export async function loadStatsSessions(): Promise<StatsSession[]> {
  const workouts = await db.workouts.filter((w) => isActive(w) && w.endedAt !== null).toArray();
  const ids = workouts.map((workout) => workout.id);
  const [items, sets, exercises] = await Promise.all([
    db.workoutExercises.where('workoutId').anyOf(ids).filter(isActive).toArray(),
    db.sets
      .where('workoutId')
      .anyOf(ids)
      .filter((set) => isActive(set) && set.completedAt !== null)
      .toArray(),
    db.exercises.toArray(),
  ]);
  const exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const exerciseIdOf = new Map(items.map((item) => [item.id, item.exerciseId]));

  const groups = new Map<string, Map<string, WorkoutSet[]>>();
  for (const set of sets) {
    const exerciseId = exerciseIdOf.get(set.workoutExerciseId);
    if (!exerciseId || !exerciseById.has(exerciseId)) continue;
    const byExercise = groups.get(set.workoutId) ?? new Map<string, WorkoutSet[]>();
    byExercise.set(exerciseId, [...(byExercise.get(exerciseId) ?? []), set]);
    groups.set(set.workoutId, byExercise);
  }

  const sorted = workouts.sort(
    (a, b) => a.startedAt.localeCompare(b.startedAt) || a.id.localeCompare(b.id),
  );
  return sorted.flatMap((workout) =>
    [...(groups.get(workout.id) ?? [])].map(([exerciseId, exerciseSets]) => ({
      workoutId: workout.id,
      startedAt: workout.startedAt,
      exercise: exerciseById.get(exerciseId)!,
      sets: exerciseSets.sort(bySequence),
    })),
  );
}
