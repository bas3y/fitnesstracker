import { bodyWeightOn, type DatedWeight } from '../domain/daily';
import {
  annotateSessions,
  detectRecords,
  exerciseKind,
  sessionRecords,
  withBodyWeight,
  type PersonalRecord,
  type StrengthSet,
} from '../domain/strength';
import { toDateInput } from '../domain/workout';
import { loadBodyWeights } from './daily';
import { db } from './database';
import { SETTINGS_ID } from './settings';
import type { Workout, WorkoutSet } from './types';

const isActive = (entity: { deletedAt: string | null }) => entity.deletedAt === null;

export type LoadedSet = WorkoutSet & Pick<StrengthSet, 'bodyWeightKg'>;

export interface ExerciseSession {
  workout: Workout;
  /** Abgehakte Sätze in der Reihenfolge des Abhakens */
  sets: LoadedSet[];
}

export async function getBodyWeightKg(): Promise<number | null> {
  return (await db.settings.get(SETTINGS_ID))?.bodyWeightKg ?? null;
}

const bySequence = (a: WorkoutSet, b: WorkoutSet) =>
  (a.completedAt ?? '').localeCompare(b.completedAt ?? '') || a.order - b.order;

function groupSessions(
  workouts: Workout[],
  sets: WorkoutSet[],
  weights: DatedWeight[],
): ExerciseSession[] {
  const byWorkout = new Map<string, WorkoutSet[]>();
  for (const set of sets) {
    const list = byWorkout.get(set.workoutId) ?? [];
    list.push(set);
    byWorkout.set(set.workoutId, list);
  }
  return workouts
    .filter((workout) => isActive(workout) && byWorkout.has(workout.id))
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt) || a.id.localeCompare(b.id))
    .map((workout) => ({
      workout,
      sets: withBodyWeight(
        byWorkout.get(workout.id)!.sort(bySequence),
        bodyWeightOn(weights, toDateInput(workout.startedAt)),
      ),
    }));
}

/** Abgehakte Sätze einer Übung je Workout (auch das laufende), ältestes zuerst */
export async function loadExerciseSessions(exerciseId: string): Promise<ExerciseSession[]> {
  const items = await db.workoutExercises
    .where('exerciseId')
    .equals(exerciseId)
    .filter(isActive)
    .toArray();
  if (items.length === 0) return [];
  const itemIds = new Set(items.map((item) => item.id));
  const workoutIds = [...new Set(items.map((item) => item.workoutId))];
  const [workouts, sets, weights] = await Promise.all([
    db.workouts.bulkGet(workoutIds),
    db.sets
      .where('workoutId')
      .anyOf(workoutIds)
      .filter(
        (set) => isActive(set) && set.completedAt !== null && itemIds.has(set.workoutExerciseId),
      )
      .toArray(),
    loadBodyWeights(),
  ]);
  return groupSessions(
    workouts.filter((w): w is Workout => !!w),
    sets,
    weights,
  );
}

/** Wie `loadExerciseSessions`, aber nur beendete Workouts (für Verläufe und Bestwerte) */
export async function loadFinishedExerciseSessions(exerciseId: string): Promise<ExerciseSession[]> {
  const sessions = await loadExerciseSessions(exerciseId);
  return sessions.filter((session) => session.workout.endedAt !== null);
}

/** Rekorde, die ein abgehakter Satz gegenüber allem davor aufstellt (für den PR-Toast) */
export async function getSetRecords(setId: string): Promise<PersonalRecord[]> {
  const set = await db.sets.get(setId);
  if (!set || !isActive(set) || set.completedAt === null) return [];
  const item = await db.workoutExercises.get(set.workoutExerciseId);
  if (!item) return [];
  const [exercise, sessions, bodyWeightKg] = await Promise.all([
    db.exercises.get(item.exerciseId),
    loadExerciseSessions(item.exerciseId),
    getBodyWeightKg(),
  ]);
  const index = sessions.findIndex((session) => session.workout.id === set.workoutId);
  if (index < 0) return [];
  const current = sessions[index]!.sets;
  const position = current.findIndex((s) => s.id === set.id);
  return detectRecords(
    current[position] ?? set,
    {
      history: sessions.slice(0, index).map((session) => session.sets),
      earlier: current.slice(0, Math.max(0, position)),
    },
    exerciseKind(exercise, bodyWeightKg),
  );
}

/** Rekorde eines Workouts je Satz-ID (nur Sätze mit Rekord) */
export async function getWorkoutRecords(workoutId: string): Promise<Map<string, PersonalRecord[]>> {
  const items = await db.workoutExercises
    .where('workoutId')
    .equals(workoutId)
    .filter(isActive)
    .toArray();
  const exerciseIds = [...new Set(items.map((item) => item.exerciseId))];
  const [exercises, bodyWeightKg] = await Promise.all([
    db.exercises.bulkGet(exerciseIds),
    getBodyWeightKg(),
  ]);
  const result = new Map<string, PersonalRecord[]>();
  for (const [i, exerciseId] of exerciseIds.entries()) {
    const sessions = await loadExerciseSessions(exerciseId);
    const index = sessions.findIndex((session) => session.workout.id === workoutId);
    if (index < 0) continue;
    const sets = sessions[index]!.sets;
    const records = sessionRecords(
      sets,
      sessions.slice(0, index).map((session) => session.sets),
      exerciseKind(exercises[i], bodyWeightKg),
    );
    sets.forEach((set, j) => {
      if (records[j]!.length > 0) result.set(set.id, records[j]!);
    });
  }
  return result;
}

/** Anzahl der Rekorde je beendetem Workout (Workout-ID → Anzahl, nur > 0) */
export async function countWorkoutRecords(): Promise<Map<string, number>> {
  const workouts = await db.workouts.filter((w) => isActive(w) && w.endedAt !== null).toArray();
  const ids = workouts.map((w) => w.id);
  const [items, sets, bodyWeightKg, weights] = await Promise.all([
    db.workoutExercises.where('workoutId').anyOf(ids).filter(isActive).toArray(),
    db.sets
      .where('workoutId')
      .anyOf(ids)
      .filter((set) => isActive(set) && set.completedAt !== null)
      .toArray(),
    getBodyWeightKg(),
    loadBodyWeights(),
  ]);
  const exerciseOf = new Map(items.map((item) => [item.id, item.exerciseId]));
  const setsByExercise = new Map<string, WorkoutSet[]>();
  for (const set of sets) {
    const exerciseId = exerciseOf.get(set.workoutExerciseId);
    if (!exerciseId) continue;
    const list = setsByExercise.get(exerciseId) ?? [];
    list.push(set);
    setsByExercise.set(exerciseId, list);
  }

  const exerciseIds = [...setsByExercise.keys()];
  const exercises = await db.exercises.bulkGet(exerciseIds);
  const counts = new Map<string, number>();
  exerciseIds.forEach((exerciseId, i) => {
    const sessions = groupSessions(workouts, setsByExercise.get(exerciseId)!, weights);
    const annotated = annotateSessions(
      sessions.map((session) => session.sets),
      exerciseKind(exercises[i], bodyWeightKg),
    );
    annotated.forEach((perSet, index) => {
      const count = perSet.reduce((sum, records) => sum + records.length, 0);
      if (count === 0) return;
      const id = sessions[index]!.workout.id;
      counts.set(id, (counts.get(id) ?? 0) + count);
    });
  });
  return counts;
}
