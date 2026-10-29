import { findDuplicateName } from '../domain/exercises';
import { db } from './database';
import { create, nowIso, softDelete, update } from './repository';
import { exerciseInputSchema, type ExerciseInput } from './schemas';
import { EXERCISE_USER_DEFAULTS } from './seed';
import type { Exercise, LoadType } from './types';

async function validate(input: ExerciseInput, exceptId?: string) {
  const fields = exerciseInputSchema.parse(input);
  const active = await db.exercises.filter((exercise) => exercise.deletedAt === null).toArray();
  if (findDuplicateName(fields.name, active, exceptId)) {
    throw new Error(`Es gibt bereits eine Übung „${fields.name}“`);
  }
  return fields;
}

async function getUserExercise(id: string): Promise<Exercise> {
  const exercise = await db.exercises.get(id);
  if (!exercise || exercise.deletedAt !== null) throw new Error('Übung nicht gefunden');
  if (exercise.source !== 'user') throw new Error('Mitgelieferte Übungen sind nicht änderbar');
  return exercise;
}

export function createUserExercise(input: ExerciseInput): Promise<Exercise> {
  return db.transaction('rw', db.exercises, async () =>
    create<Exercise>(db.exercises, {
      ...(await validate(input)),
      source: 'user',
      builtinKey: null,
      ...EXERCISE_USER_DEFAULTS,
    }),
  );
}

export function updateUserExercise(id: string, input: ExerciseInput): Promise<void> {
  return db.transaction('rw', db.exercises, async () => {
    await getUserExercise(id);
    await update(db.exercises, id, await validate(input, id));
  });
}

/** Soft-Delete, damit spätere Workouts mit dieser Übung lesbar bleiben */
export function deleteUserExercise(id: string): Promise<void> {
  return db.transaction('rw', db.exercises, async () => {
    await getUserExercise(id);
    await softDelete(db.exercises, id);
  });
}

export function setExerciseFavorite(id: string, isFavorite: boolean): Promise<void> {
  return update(db.exercises, id, { isFavorite });
}

/** Ausblenden statt Löschen (v. a. für mitgelieferte Übungen) */
export function setExerciseHidden(id: string, hidden: boolean): Promise<void> {
  return update(db.exercises, id, { hiddenAt: hidden ? nowIso() : null });
}

export function setExerciseLoadType(id: string, loadType: LoadType): Promise<void> {
  return update(db.exercises, id, { loadType });
}

export function setExerciseNotes(id: string, notes: string): Promise<void> {
  return update(db.exercises, id, { notes: notes.trim() });
}
