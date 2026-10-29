import { suggestSetValues } from '../domain/workout';
import { db } from './database';
import { create, nowIso, softDelete, update } from './repository';
import { setValuesSchema, type SetValues } from './schemas';
import type { Exercise, LoadType, Workout, WorkoutExercise, WorkoutSet } from './types';

const isActive = (entity: { deletedAt: string | null }) => entity.deletedAt === null;
const byOrder = (a: { order: number }, b: { order: number }) => a.order - b.order;

export interface WorkoutItem {
  workoutExercise: WorkoutExercise;
  /** `null`, falls die Übung nicht (mehr) existiert */
  exercise: Exercise | null;
  sets: WorkoutSet[];
}

export interface WorkoutDetail {
  workout: Workout;
  items: WorkoutItem[];
}

export interface LastPerformance {
  workout: Workout;
  sets: WorkoutSet[];
}

export async function getActiveWorkout(): Promise<Workout | undefined> {
  const running = await db.workouts.filter((w) => isActive(w) && w.endedAt === null).toArray();
  return running.sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
}

async function getWorkout(id: string): Promise<Workout> {
  const workout = await db.workouts.get(id);
  if (!workout || !isActive(workout)) throw new Error('Workout nicht gefunden');
  return workout;
}

async function getWorkoutExercise(id: string): Promise<WorkoutExercise> {
  const item = await db.workoutExercises.get(id);
  if (!item || !isActive(item)) throw new Error('Übung im Workout nicht gefunden');
  return item;
}

async function getSet(id: string): Promise<WorkoutSet> {
  const set = await db.sets.get(id);
  if (!set || !isActive(set)) throw new Error('Satz nicht gefunden');
  return set;
}

async function activeChildren(workoutId: string) {
  const [items, sets] = await Promise.all([
    db.workoutExercises.where('workoutId').equals(workoutId).filter(isActive).toArray(),
    db.sets.where('workoutId').equals(workoutId).filter(isActive).toArray(),
  ]);
  return { items: items.sort(byOrder), sets: sets.sort(byOrder) };
}

export async function loadWorkoutDetail(id: string): Promise<WorkoutDetail | null> {
  const workout = await db.workouts.get(id);
  if (!workout || !isActive(workout)) return null;
  const { items, sets } = await activeChildren(id);
  // Auch gelöschte Übungen laden, damit alte Workouts lesbar bleiben
  const exercises = await db.exercises.bulkGet(items.map((item) => item.exerciseId));
  return {
    workout,
    items: items.map((workoutExercise, index) => ({
      workoutExercise,
      exercise: exercises[index] ?? null,
      sets: sets.filter((set) => set.workoutExerciseId === workoutExercise.id),
    })),
  };
}

/** Startet ein leeres Workout – oder gibt das bereits laufende zurück */
export function startWorkout(): Promise<Workout> {
  return db.transaction('rw', db.workouts, async () => {
    const running = await getActiveWorkout();
    if (running) return running;
    return create<Workout>(db.workouts, {
      startedAt: nowIso(),
      endedAt: null,
      notes: '',
      restEndsAt: null,
    });
  });
}

/** Abgeschlossene Sätze dieser Übung aus dem letzten beendeten Workout (vor `beforeWorkoutId`) */
export async function getLastPerformance(
  exerciseId: string,
  beforeWorkoutId?: string,
): Promise<LastPerformance | null> {
  const items = await db.workoutExercises
    .where('exerciseId')
    .equals(exerciseId)
    .filter((item) => isActive(item) && item.workoutId !== beforeWorkoutId)
    .toArray();
  if (items.length === 0) return null;

  const before = beforeWorkoutId ? await db.workouts.get(beforeWorkoutId) : undefined;
  const workouts = (await db.workouts.bulkGet([...new Set(items.map((i) => i.workoutId))]))
    .filter((w): w is Workout => !!w && isActive(w) && w.endedAt !== null)
    .filter((w) => !before || w.startedAt < before.startedAt)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));

  for (const workout of workouts) {
    const itemIds = new Set(items.filter((i) => i.workoutId === workout.id).map((i) => i.id));
    const sets = (await db.sets.where('workoutId').equals(workout.id).toArray())
      .filter(
        (set) => isActive(set) && set.completedAt !== null && itemIds.has(set.workoutExerciseId),
      )
      .sort(byOrder);
    if (sets.length > 0) return { workout, sets };
  }
  return null;
}

export function addWorkoutExercise(
  workoutId: string,
  exerciseId: string,
): Promise<WorkoutExercise> {
  return db.transaction(
    'rw',
    [db.workouts, db.workoutExercises, db.sets, db.exercises],
    async () => {
      await getWorkout(workoutId);
      const { items } = await activeChildren(workoutId);
      const item = await create<WorkoutExercise>(db.workoutExercises, {
        workoutId,
        exerciseId,
        order: (items.at(-1)?.order ?? -1) + 1,
      });
      await addSet(item.id);
      return item;
    },
  );
}

export function removeWorkoutExercise(id: string): Promise<void> {
  return db.transaction('rw', [db.workoutExercises, db.sets], async () => {
    await getWorkoutExercise(id);
    const sets = await db.sets.where('workoutExerciseId').equals(id).filter(isActive).toArray();
    for (const set of sets) await softDelete(db.sets, set.id);
    await softDelete(db.workoutExercises, id);
  });
}

/** Neue Reihenfolge der Übungen (z. B. nach Ziehen), `ids` = alle Übungen des Workouts */
export function reorderWorkoutExercises(workoutId: string, ids: string[]): Promise<void> {
  return db.transaction('rw', [db.workoutExercises, db.sets], async () => {
    const { items } = await activeChildren(workoutId);
    const known = new Set(items.map((item) => item.id));
    if (ids.length !== items.length || !ids.every((id) => known.has(id))) {
      throw new Error('Reihenfolge passt nicht zum Workout');
    }
    for (const [order, id] of ids.entries()) {
      if (items.find((item) => item.id === id)?.order !== order) {
        await update(db.workoutExercises, id, { order });
      }
    }
  });
}

/**
 * Wechselt zwischen Gewicht und Stufe: merkt sich die Wahl an der Übung und leert bei
 * offenen Sätzen den jeweils anderen Wert (abgehakte Sätze bleiben unverändert).
 */
export function setWorkoutExerciseLoadType(
  workoutExerciseId: string,
  loadType: LoadType,
): Promise<void> {
  return db.transaction('rw', [db.workoutExercises, db.sets, db.exercises], async () => {
    const item = await getWorkoutExercise(workoutExerciseId);
    await update(db.exercises, item.exerciseId, { loadType });
    const open = await db.sets
      .where('workoutExerciseId')
      .equals(workoutExerciseId)
      .filter((set) => isActive(set) && set.completedAt === null)
      .toArray();
    for (const set of open) {
      await update(db.sets, set.id, loadType === 'level' ? { weight: null } : { level: null });
    }
  });
}

/**
 * Neuer Satz, vorbefüllt mit dem vorigen Satz bzw. dem letzten Mal. In einem bereits beendeten
 * Workout (nachträgliches Bearbeiten) gilt er direkt als abgehakt.
 */
export function addSet(workoutExerciseId: string): Promise<WorkoutSet> {
  return db.transaction(
    'rw',
    [db.workouts, db.workoutExercises, db.sets, db.exercises],
    async () => {
      const item = await getWorkoutExercise(workoutExerciseId);
      const workout = await getWorkout(item.workoutId);
      const exercise = await db.exercises.get(item.exerciseId);
      const sets = (
        await db.sets
          .where('workoutExerciseId')
          .equals(workoutExerciseId)
          .filter(isActive)
          .toArray()
      ).sort(byOrder);
      const previous = sets.at(-1);
      const lastTime = await getLastPerformance(item.exerciseId, workout.id);
      const values = suggestSetValues({
        previous,
        lastTime: lastTime?.sets ?? [],
        index: sets.filter((set) => !set.isWarmup).length,
        isBodyweight: exercise?.equipment === 'bodyweight',
      });
      // Gewicht oder Stufe – je nachdem, was zuletzt an der Übung gewählt wurde
      const byLevel = exercise?.loadType === 'level';
      return create<WorkoutSet>(db.sets, {
        ...values,
        weight: byLevel ? null : values.weight,
        level: byLevel ? values.level : null,
        workoutId: workout.id,
        workoutExerciseId,
        order: (previous?.order ?? -1) + 1,
        rpe: null,
        rir: null,
        isWarmup: false,
        restSeconds: null,
        completedAt: workout.endedAt,
      });
    },
  );
}

export async function updateSet(id: string, changes: Partial<SetValues>): Promise<void> {
  const fields = setValuesSchema.partial().parse(changes);
  await db.transaction('rw', db.sets, async () => {
    await getSet(id);
    await update(db.sets, id, fields);
  });
}

export function deleteSet(id: string): Promise<void> {
  return softDelete(db.sets, id);
}

/** Satz abhaken und – im laufenden Workout – den Pausen-Timer starten */
export function completeSet(id: string, restSeconds: number): Promise<void> {
  return db.transaction('rw', [db.sets, db.workouts], async () => {
    const set = await getSet(id);
    const workout = await getWorkout(set.workoutId);
    const now = new Date();
    const rest = workout.endedAt === null && restSeconds > 0 ? restSeconds : null;
    await update(db.sets, id, { completedAt: now.toISOString(), restSeconds: rest });
    if (rest !== null) {
      await update(db.workouts, workout.id, {
        restEndsAt: new Date(now.getTime() + rest * 1000).toISOString(),
      });
    }
  });
}

export function uncompleteSet(id: string): Promise<void> {
  return update(db.sets, id, { completedAt: null, restSeconds: null });
}

export function setRestEndsAt(workoutId: string, restEndsAt: string | null): Promise<void> {
  return update(db.workouts, workoutId, { restEndsAt });
}

/** Verlängert/verkürzt die laufende Pause (nicht unter „jetzt“) */
export function adjustRest(workoutId: string, deltaSeconds: number): Promise<void> {
  return db.transaction('rw', db.workouts, async () => {
    const workout = await getWorkout(workoutId);
    if (!workout.restEndsAt) return;
    const now = Date.now();
    const base = Math.max(Date.parse(workout.restEndsAt), now);
    const endsAt = Math.max(now, base + deltaSeconds * 1000);
    await update(db.workouts, workoutId, { restEndsAt: new Date(endsAt).toISOString() });
  });
}

/**
 * Beendet das Workout: nicht abgehakte Sätze und Übungen ohne abgehakten Satz werden verworfen.
 */
export function finishWorkout(id: string, notes: string): Promise<void> {
  return db.transaction('rw', [db.workouts, db.workoutExercises, db.sets], async () => {
    const workout = await getWorkout(id);
    if (workout.endedAt !== null) throw new Error('Workout ist bereits beendet');
    const { items, sets } = await activeChildren(id);
    for (const set of sets) {
      if (set.completedAt === null) await softDelete(db.sets, set.id);
    }
    for (const item of items) {
      const done = sets.some((s) => s.workoutExerciseId === item.id && s.completedAt !== null);
      if (!done) await softDelete(db.workoutExercises, item.id);
    }
    await update(db.workouts, id, { endedAt: nowIso(), restEndsAt: null, notes: notes.trim() });
  });
}

/** Löscht (Soft-Delete) ein Workout samt Übungen und Sätzen – auch zum Verwerfen eines laufenden */
export function deleteWorkout(id: string): Promise<void> {
  return db.transaction('rw', [db.workouts, db.workoutExercises, db.sets], async () => {
    await getWorkout(id);
    const { items, sets } = await activeChildren(id);
    for (const set of sets) await softDelete(db.sets, set.id);
    for (const item of items) await softDelete(db.workoutExercises, item.id);
    await softDelete(db.workouts, id);
  });
}

/** Nachträgliches Bearbeiten eines beendeten Workouts */
export function updateWorkoutInfo(
  id: string,
  {
    startedAt,
    durationSeconds,
    notes,
  }: { startedAt: string; durationSeconds: number; notes: string },
): Promise<void> {
  return db.transaction('rw', db.workouts, async () => {
    if (durationSeconds <= 0) throw new Error('Dauer muss größer als 0 sein');
    const workout = await getWorkout(id);
    if (workout.endedAt === null) throw new Error('Workout läuft noch');
    const endedAt = new Date(Date.parse(startedAt) + durationSeconds * 1000).toISOString();
    await update(db.workouts, id, { startedAt, endedAt, notes: notes.trim() });
  });
}

export interface WorkoutSummary {
  workout: Workout;
  exerciseNames: string[];
  setCount: number;
}

/** Beendete Workouts, neueste zuerst */
export async function listWorkoutHistory(): Promise<WorkoutSummary[]> {
  const workouts = (
    await db.workouts.filter((w) => isActive(w) && w.endedAt !== null).toArray()
  ).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  const ids = workouts.map((w) => w.id);
  const [items, sets] = await Promise.all([
    db.workoutExercises.where('workoutId').anyOf(ids).filter(isActive).toArray(),
    db.sets.where('workoutId').anyOf(ids).filter(isActive).toArray(),
  ]);
  const exercises = await db.exercises.bulkGet([...new Set(items.map((i) => i.exerciseId))]);
  const names = new Map(exercises.filter((e) => !!e).map((e) => [e.id, e.name]));
  return workouts.map((workout) => ({
    workout,
    exerciseNames: items
      .filter((i) => i.workoutId === workout.id)
      .sort(byOrder)
      .map((i) => names.get(i.exerciseId) ?? 'Unbekannte Übung'),
    setCount: sets.filter((s) => s.workoutId === workout.id && s.completedAt !== null).length,
  }));
}
