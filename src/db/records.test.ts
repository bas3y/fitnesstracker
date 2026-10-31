import { toDateInput } from '../domain/workout';
import { updateDailyLog } from './daily';
import { db } from './database';
import {
  countWorkoutRecords,
  getSetRecords,
  getWorkoutRecords,
  loadExerciseSessions,
} from './records';
import type { BuiltinExercise } from './schemas';
import { applySeed } from './seed';
import { updateSettings } from './settings';
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
  updateWorkoutInfo,
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
let pullUp: Exercise;

beforeEach(async () => {
  await resetDatabase();
  await applySeed(
    {
      exercises: [
        { ...base, key: 'bench', name: 'Bankdrücken' },
        { ...base, key: 'pull-up', name: 'Klimmzüge', equipment: 'bodyweight' },
      ],
      foods: [],
    },
    1,
  );
  const byKey = async (key: string) =>
    (await db.exercises.where('builtinKey').equals(key).first())!;
  [bench, pullUp] = await Promise.all([byKey('bench'), byKey('pull-up')]);
});

async function openSets(workoutExerciseId: string) {
  return (await db.sets.where('workoutExerciseId').equals(workoutExerciseId).toArray())
    .filter((s) => s.deletedAt === null)
    .sort((a, b) => a.order - b.order);
}

/** Sätze nacheinander eintragen und abhaken; gibt die Satz-IDs zurück */
async function logSets(workoutId: string, exercise: Exercise, sets: Array<[number, number]>) {
  const item = await addWorkoutExercise(workoutId, exercise.id);
  const [first] = await openSets(item.id);
  const ids: string[] = [];
  for (const [index, [weight, reps]] of sets.entries()) {
    const set = index === 0 ? first! : await addSet(item.id);
    await updateSet(set.id, { weight, reps });
    await completeSet(set.id, 0);
    ids.push(set.id);
  }
  return ids;
}

let day = 0;

async function loggedWorkout(exercise: Exercise, sets: Array<[number, number]>) {
  const workout = await startWorkout();
  const ids = await logSets(workout.id, exercise, sets);
  await finishWorkout(workout.id, '');
  day++;
  const startedAt = `2026-03-${String(day).padStart(2, '0')}T10:00:00.000Z`;
  await updateWorkoutInfo(workout.id, { startedAt, durationSeconds: 3600, notes: '' });
  return { workout: (await db.workouts.get(workout.id))!, setIds: ids };
}

describe('Einheiten einer Übung', () => {
  it('lädt abgehakte Sätze je Workout chronologisch, auch das laufende', async () => {
    await loggedWorkout(bench, [[100, 5]]);
    await loggedWorkout(bench, [
      [100, 6],
      [100, 5],
    ]);
    const running = await startWorkout();
    await logSets(running.id, bench, [[102.5, 5]]);
    await addSet((await db.workoutExercises.where('workoutId').equals(running.id).first())!.id);

    const sessions = await loadExerciseSessions(bench.id);
    expect(sessions.map((s) => s.sets.map((set) => [set.weight, set.reps]))).toEqual([
      [[100, 5]],
      [
        [100, 6],
        [100, 5],
      ],
      [[102.5, 5]],
    ]);
    expect(await loadExerciseSessions(pullUp.id)).toEqual([]);
  });
});

describe('PR beim Abhaken', () => {
  it('meldet Rekorde gegenüber früheren Workouts, nicht beim ersten Mal', async () => {
    const { setIds } = await loggedWorkout(bench, [
      [100, 5],
      [100, 5],
    ]);
    expect(await getSetRecords(setIds[0]!)).toEqual([]);

    const running = await startWorkout();
    const [heavier, same] = await logSets(running.id, bench, [
      [105, 5],
      [105, 5],
    ]);
    expect((await getSetRecords(heavier!)).map((r) => r.type)).toEqual([
      'weight',
      'oneRepMax',
      'setVolume',
    ]);
    // Gleicher Satz direkt danach ist kein neuer Rekord mehr, aber das Einheitsvolumen
    expect((await getSetRecords(same!)).map((r) => r.type)).toEqual(['sessionVolume']);
  });

  it('rechnet Körpergewichtsübungen mit dem Körpergewicht aus den Einstellungen', async () => {
    await loggedWorkout(pullUp, [
      [0, 8],
      [0, 8],
    ]);
    const running = await startWorkout();
    const [withoutWeight] = await logSets(running.id, pullUp, [[0, 10]]);
    expect((await getSetRecords(withoutWeight!)).map((r) => r.type)).toEqual(['reps']);

    await updateSettings({ bodyWeightKg: 80 });
    expect((await getSetRecords(withoutWeight!)).map((r) => r.type)).toEqual([
      'oneRepMax',
      'setVolume',
      'reps',
    ]);
  });

  it('rechnet mit dem Körpergewicht vom Tag des Workouts', async () => {
    const first = await loggedWorkout(pullUp, [[0, 8]]);
    const second = await loggedWorkout(pullUp, [[0, 8]]);
    await updateDailyLog(toDateInput(first.workout.startedAt), { weightKg: 70 });
    await updateDailyLog(toDateInput(second.workout.startedAt), { weightKg: 90 });
    await updateSettings({ bodyWeightKg: 100 });

    const sessions = await loadExerciseSessions(pullUp.id);
    expect(sessions.map((session) => session.workout.id)).toEqual([
      first.workout.id,
      second.workout.id,
    ]);
    expect(sessions.map((session) => session.sets[0]!.bodyWeightKg)).toEqual([70, 90]);

    // Gleiche Wdh., aber 20 kg mehr Körpergewicht
    const records = await getWorkoutRecords(second.workout.id);
    expect(records.get(second.setIds[0]!)!.map((record) => record.type)).toContain('oneRepMax');
  });

  it('liefert für offene oder unbekannte Sätze nichts', async () => {
    await loggedWorkout(bench, [[100, 5]]);
    const running = await startWorkout();
    const item = await addWorkoutExercise(running.id, bench.id);
    const [open] = await openSets(item.id);
    await updateSet(open!.id, { weight: 120, reps: 5 });
    expect(await getSetRecords(open!.id)).toEqual([]);
    expect(await getSetRecords('gibt-es-nicht')).toEqual([]);
  });
});

describe('PR-Markierung in der Historie', () => {
  it('markiert Rekorde je Satz und zählt sie je Workout', async () => {
    const first = await loggedWorkout(bench, [[100, 5]]);
    const second = await loggedWorkout(bench, [
      [100, 6],
      [100, 4],
    ]);
    const third = await loggedWorkout(bench, [[90, 5]]);

    const records = await getWorkoutRecords(second.workout.id);
    expect([...records.keys()]).toEqual([second.setIds[0]]);
    expect(records.get(second.setIds[0]!)!.map((r) => r.type)).toEqual([
      'oneRepMax',
      'setVolume',
      'sessionVolume',
      'reps',
    ]);
    expect((await getWorkoutRecords(first.workout.id)).size).toBe(0);

    const counts = await countWorkoutRecords();
    expect(counts.get(second.workout.id)).toBe(4);
    expect(counts.has(first.workout.id)).toBe(false);
    expect(counts.has(third.workout.id)).toBe(false);
  });

  it('ignoriert gelöschte Workouts', async () => {
    const first = await loggedWorkout(bench, [[100, 5]]);
    const second = await loggedWorkout(bench, [[105, 5]]);
    expect((await countWorkoutRecords()).get(second.workout.id)).toBeGreaterThan(0);

    await deleteWorkout(first.workout.id);
    expect((await countWorkoutRecords()).size).toBe(0);
    expect((await getWorkoutRecords(second.workout.id)).size).toBe(0);
  });
});
