import { db } from './database';
import type { BuiltinExercise } from './schemas';
import { applySeed } from './seed';
import { resetDatabase } from './testUtils';
import { createWorkoutsCsvFile } from './workoutExport';
import {
  addWorkoutExercise,
  completeSet,
  finishWorkout,
  startWorkout,
  updateSet,
} from './workouts';

const bench: BuiltinExercise = {
  key: 'bench',
  name: 'Bankdrücken',
  aliases: [],
  category: 'strength',
  primaryMuscles: ['chest'],
  secondaryMuscles: [],
  equipment: 'barbell',
  isUnilateral: false,
  isTimed: false,
};

async function logSet(workoutId: string, reps: number) {
  const exercise = (await db.exercises.where('builtinKey').equals('bench').first())!;
  const item = await addWorkoutExercise(workoutId, exercise.id);
  const set = (await db.sets.where('workoutExerciseId').equals(item.id).toArray())[0]!;
  await updateSet(set.id, { weight: 50, reps });
  await completeSet(set.id, 0);
}

beforeEach(async () => {
  await resetDatabase();
  await applySeed({ exercises: [bench], foods: [] }, 1);
});

describe('createWorkoutsCsvFile', () => {
  it('liefert nichts, solange kein Workout beendet ist', async () => {
    const workout = await startWorkout();
    await logSet(workout.id, 8);

    expect(await createWorkoutsCsvFile('kg')).toBeNull();
  });

  it('enthält nur beendete Workouts und trägt das Datum im Dateinamen', async () => {
    const workout = await startWorkout();
    await logSet(workout.id, 8);
    await finishWorkout(workout.id, 'Notiz');
    const running = await startWorkout();
    await logSet(running.id, 12);

    const file = (await createWorkoutsCsvFile('kg', new Date(2026, 9, 31)))!;
    const lines = (await file.text()).trim().split('\r\n');

    expect(file.name).toBe('fitnesstracker-workouts-2026-10-31.csv');
    expect(file.type).toContain('text/csv');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain(';Bankdrücken;1;nein;50;;8;');
    expect(lines[1]!.endsWith(';Notiz')).toBe(true);
  });
});
