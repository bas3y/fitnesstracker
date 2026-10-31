import { db } from './database';
import { loadFinishedExerciseSessions } from './records';
import type { BuiltinExercise } from './schemas';
import { applySeed } from './seed';
import { loadStatsSessions } from './stats';
import { resetDatabase } from './testUtils';
import type { Exercise } from './types';
import {
  addSet,
  addWorkoutExercise,
  completeSet,
  deleteWorkout,
  finishWorkout,
  startWorkout,
  updateSet,
} from './workouts';

const base: Omit<BuiltinExercise, 'key' | 'name'> = {
  aliases: [],
  category: 'strength',
  primaryMuscles: ['chest'],
  secondaryMuscles: [],
  equipment: 'barbell',
  isUnilateral: false,
  isTimed: false,
};

let bench: Exercise;
let row: Exercise;

beforeEach(async () => {
  await resetDatabase();
  await applySeed(
    {
      exercises: [
        { ...base, key: 'bench', name: 'Bankdrücken' },
        { ...base, key: 'row', name: 'Rudern', primaryMuscles: ['lats'] },
      ],
      foods: [],
    },
    1,
  );
  const byKey = async (key: string) =>
    (await db.exercises.where('builtinKey').equals(key).first())!;
  bench = await byKey('bench');
  row = await byKey('row');
});

async function logSet(workoutId: string, exercise: Exercise, reps: number) {
  const item = await addWorkoutExercise(workoutId, exercise.id);
  const set = (await db.sets.where('workoutExerciseId').equals(item.id).toArray())[0]!;
  await updateSet(set.id, { weight: 50, reps });
  await completeSet(set.id, 0);
  return item;
}

describe('loadStatsSessions', () => {
  it('liefert nur abgehakte Sätze beendeter Workouts je Übung', async () => {
    const workout = await startWorkout();
    const item = await logSet(workout.id, bench, 8);
    await addSet(item.id);
    await logSet(workout.id, row, 10);
    await finishWorkout(workout.id, '');

    const running = await startWorkout();
    await logSet(running.id, bench, 12);

    const sessions = await loadStatsSessions();
    expect(sessions.map((session) => session.exercise.name).sort()).toEqual([
      'Bankdrücken',
      'Rudern',
    ]);
    expect(sessions.every((session) => session.sets.length === 1)).toBe(true);
    expect(sessions[0]!.workoutId).toBe(workout.id);
  });

  it('fasst dieselbe Übung innerhalb eines Workouts zusammen', async () => {
    const workout = await startWorkout();
    await logSet(workout.id, bench, 8);
    await logSet(workout.id, bench, 7);
    await finishWorkout(workout.id, '');

    const sessions = await loadStatsSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0]!.sets.map((set) => set.reps)).toEqual([8, 7]);
  });

  it('lässt gelöschte Workouts weg und sortiert nach Beginn', async () => {
    const first = await startWorkout();
    await logSet(first.id, bench, 8);
    await finishWorkout(first.id, '');
    const deleted = await startWorkout();
    await logSet(deleted.id, row, 8);
    await finishWorkout(deleted.id, '');
    await deleteWorkout(deleted.id);
    const last = await startWorkout();
    await logSet(last.id, row, 9);
    await finishWorkout(last.id, '');

    const sessions = await loadStatsSessions();
    expect(sessions.map((session) => session.workoutId)).toEqual([first.id, last.id]);
  });
});

describe('loadFinishedExerciseSessions', () => {
  it('lässt das laufende Workout weg', async () => {
    const workout = await startWorkout();
    await logSet(workout.id, bench, 8);
    await finishWorkout(workout.id, '');
    const running = await startWorkout();
    await logSet(running.id, bench, 12);

    const sessions = await loadFinishedExerciseSessions(bench.id);
    expect(sessions.map((session) => session.workout.id)).toEqual([workout.id]);
  });
});
