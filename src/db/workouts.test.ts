import { db } from './database';
import type { BuiltinExercise } from './schemas';
import { applySeed } from './seed';
import { getSettings } from './settings';
import { resetDatabase } from './testUtils';
import type { Exercise } from './types';
import {
  addSet,
  addWorkoutExercise,
  adjustRest,
  applyToOpenSets,
  completeSet,
  deleteWorkout,
  finishWorkout,
  getActiveWorkout,
  getLastPerformance,
  listWorkoutHistory,
  loadWorkoutDetail,
  removeWorkoutExercise,
  reorderWorkoutExercises,
  setRestTimerEnabled,
  setWorkoutExerciseLoadType,
  startWorkout,
  uncompleteSet,
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
let squat: Exercise;

beforeEach(async () => {
  await resetDatabase();
  await applySeed(
    {
      exercises: [
        { ...base, key: 'bench', name: 'Bankdrücken' },
        { ...base, key: 'pull-up', name: 'Klimmzüge', equipment: 'bodyweight' },
        { ...base, key: 'squat', name: 'Kniebeugen', equipment: 'machine' },
      ],
      foods: [],
    },
    1,
  );
  const byKey = async (key: string) =>
    (await db.exercises.where('builtinKey').equals(key).first())!;
  [bench, pullUp, squat] = await Promise.all([byKey('bench'), byKey('pull-up'), byKey('squat')]);
});

async function setsOf(workoutExerciseId: string) {
  return (await db.sets.where('workoutExerciseId').equals(workoutExerciseId).toArray())
    .filter((s) => s.deletedAt === null)
    .sort((a, b) => a.order - b.order);
}

let day = 0;

/** Beendetes Workout mit abgehakten Sätzen (Gewicht, Wdh.), jeweils einen Tag nach dem vorigen */
async function loggedWorkout(exercise: Exercise, sets: Array<[number, number]>) {
  const workout = await startWorkout();
  const item = await addWorkoutExercise(workout.id, exercise.id);
  const [first] = await setsOf(item.id);
  for (const [index, [weight, reps]] of sets.entries()) {
    const set = index === 0 ? first! : await addSet(item.id);
    await updateSet(set.id, { weight, reps });
    await completeSet(set.id, 0);
  }
  await finishWorkout(workout.id, '');
  day++;
  const startedAt = `2026-02-${String(day).padStart(2, '0')}T10:00:00.000Z`;
  await updateWorkoutInfo(workout.id, { startedAt, durationSeconds: 3600, notes: '' });
  return (await db.workouts.get(workout.id))!;
}

describe('Workout starten', () => {
  it('legt ein laufendes Workout an und gibt es beim zweiten Start erneut zurück', async () => {
    const first = await startWorkout();
    const second = await startWorkout();
    expect(second.id).toBe(first.id);
    expect(first).toMatchObject({ endedAt: null, notes: '', restEndsAt: null, deletedAt: null });
    expect((await getActiveWorkout())?.id).toBe(first.id);
  });
});

describe('Übungen und Sätze', () => {
  it('fügt Übungen mit einem ersten Satz hinzu und ändert die Reihenfolge', async () => {
    const workout = await startWorkout();
    const a = await addWorkoutExercise(workout.id, bench.id);
    const b = await addWorkoutExercise(workout.id, squat.id);
    expect(await setsOf(a.id)).toHaveLength(1);

    await reorderWorkoutExercises(workout.id, [b.id, a.id]);
    let detail = await loadWorkoutDetail(workout.id);
    expect(detail?.items.map((i) => i.exercise?.name)).toEqual(['Kniebeugen', 'Bankdrücken']);
    await expect(reorderWorkoutExercises(workout.id, [b.id])).rejects.toThrow();

    await removeWorkoutExercise(b.id);
    detail = await loadWorkoutDetail(workout.id);
    expect(detail?.items.map((i) => i.exercise?.name)).toEqual(['Bankdrücken']);
    expect(await setsOf(b.id)).toEqual([]);
  });

  it('befüllt neue Sätze mit dem vorigen Satz; Körpergewicht startet mit 0 kg', async () => {
    const workout = await startWorkout();
    const item = await addWorkoutExercise(workout.id, bench.id);
    const [first] = await setsOf(item.id);
    expect(first).toMatchObject({ weight: null, reps: null, isWarmup: false, completedAt: null });

    await updateSet(first!.id, { weight: 60, reps: 10 });
    const second = await addSet(item.id);
    expect(second).toMatchObject({ weight: 60, reps: 10, order: 1 });

    const bodyweight = await addWorkoutExercise(workout.id, pullUp.id);
    expect((await setsOf(bodyweight.id))[0]?.weight).toBe(0);
  });

  it('schaltet zwischen Gewicht und Stufe um und merkt sich die Wahl an der Übung', async () => {
    const workout = await startWorkout();
    const item = await addWorkoutExercise(workout.id, squat.id);
    const [first] = await setsOf(item.id);
    await updateSet(first!.id, { weight: 50, reps: 10 });
    await completeSet(first!.id, 0);
    const open = await addSet(item.id);

    await setWorkoutExerciseLoadType(item.id, 'level');
    expect((await db.exercises.get(squat.id))?.loadType).toBe('level');
    expect(await db.sets.get(first!.id)).toMatchObject({ weight: 50, level: null });
    expect(await db.sets.get(open.id)).toMatchObject({ weight: null });

    await updateSet(open.id, { level: 7 });
    expect(await addSet(item.id)).toMatchObject({ weight: null, level: 7, reps: 10 });

    // Nächstes Workout startet direkt mit Stufe
    await finishWorkout(workout.id, '');
    const next = await startWorkout();
    const nextItem = await addWorkoutExercise(next.id, squat.id);
    expect((await setsOf(nextItem.id))[0]).toMatchObject({ weight: null, reps: 10 });
  });

  it('übernimmt die Exzentrik in neue Sätze und leert sie beim Wechsel auf Stufe', async () => {
    const workout = await startWorkout();
    const item = await addWorkoutExercise(workout.id, squat.id);
    const [first] = await setsOf(item.id);
    await updateSet(first!.id, { weight: 80, eccentricWeight: 100, reps: 8 });
    const second = await addSet(item.id);
    expect(second).toMatchObject({ weight: 80, eccentricWeight: 100, eccentricLevel: null });

    await setWorkoutExerciseLoadType(item.id, 'level');
    expect(await db.sets.get(second.id)).toMatchObject({ weight: null, eccentricWeight: null });
    await updateSet(second.id, { level: 7, eccentricLevel: 9 });
    expect(await addSet(item.id)).toMatchObject({ level: 7, eccentricLevel: 9 });
    await expect(updateSet(second.id, { eccentricWeight: -5 })).rejects.toThrow();
  });

  it('übernimmt Werte (Vorschlag) in alle offenen Arbeitssätze', async () => {
    const workout = await startWorkout();
    const item = await addWorkoutExercise(workout.id, bench.id);
    const [done] = await setsOf(item.id);
    await updateSet(done!.id, { weight: 60, reps: 10 });
    await completeSet(done!.id, 0);
    const warmup = await addSet(item.id);
    await updateSet(warmup.id, { isWarmup: true });
    const open = await addSet(item.id);

    await applyToOpenSets(item.id, { weight: 82.5, reps: 8 });
    expect(await db.sets.get(done!.id)).toMatchObject({ weight: 60, reps: 10 });
    expect(await db.sets.get(warmup.id)).toMatchObject({ weight: 60, reps: 10 });
    expect(await db.sets.get(open.id)).toMatchObject({ weight: 82.5, reps: 8 });
  });

  it('validiert Satzwerte', async () => {
    const workout = await startWorkout();
    const item = await addWorkoutExercise(workout.id, bench.id);
    const [set] = await setsOf(item.id);
    await expect(updateSet(set!.id, { reps: -1 })).rejects.toThrow();
    await expect(updateSet(set!.id, { rpe: 11 })).rejects.toThrow();
    await updateSet(set!.id, { rpe: 7.5, rir: 2, isWarmup: true, durationSeconds: 30 });
    expect((await db.sets.get(set!.id))?.rpe).toBe(7.5);
  });
});

describe('Pausen-Timer', () => {
  it('startet beim Abhaken über einen Zeitstempel und lässt sich anpassen', async () => {
    const workout = await startWorkout();
    const item = await addWorkoutExercise(workout.id, bench.id);
    const [set] = await setsOf(item.id);

    const before = Date.now();
    await completeSet(set!.id, 90);
    const { restEndsAt } = (await db.workouts.get(workout.id))!;
    expect(Date.parse(restEndsAt!) - before).toBeGreaterThanOrEqual(90_000);
    expect(Date.parse(restEndsAt!) - before).toBeLessThan(91_000);
    expect(await db.sets.get(set!.id)).toMatchObject({ restSeconds: 90 });

    await adjustRest(workout.id, 15);
    const longer = (await db.workouts.get(workout.id))!.restEndsAt!;
    expect(Date.parse(longer) - Date.parse(restEndsAt!)).toBe(15_000);

    await adjustRest(workout.id, -600);
    expect(Date.parse((await db.workouts.get(workout.id))!.restEndsAt!)).toBeLessThanOrEqual(
      Date.now(),
    );

    await uncompleteSet(set!.id);
    expect(await db.sets.get(set!.id)).toMatchObject({ completedAt: null, restSeconds: null });
  });

  it('startet bei Pausenzeit 0 keinen Timer', async () => {
    const workout = await startWorkout();
    const item = await addWorkoutExercise(workout.id, bench.id);
    const [set] = await setsOf(item.id);
    await completeSet(set!.id, 0);
    expect((await db.workouts.get(workout.id))?.restEndsAt).toBeNull();
  });

  it('beendet beim Ausschalten eine laufende Pause, der Satz behält seinen Zeitpunkt', async () => {
    const workout = await startWorkout();
    const item = await addWorkoutExercise(workout.id, bench.id);
    const [set] = await setsOf(item.id);
    await completeSet(set!.id, 90);

    await setRestTimerEnabled(false);

    expect((await db.workouts.get(workout.id))?.restEndsAt).toBeNull();
    expect((await getSettings())?.restTimerEnabled).toBe(false);
    expect((await db.sets.get(set!.id))?.completedAt).not.toBeNull();

    await setRestTimerEnabled(true);
    expect((await getSettings())?.restTimerEnabled).toBe(true);
  });

  it('lässt sich ohne laufendes Workout umschalten', async () => {
    await setRestTimerEnabled(false);
    expect((await getSettings())?.restTimerEnabled).toBe(false);
  });
});

describe('Workout beenden', () => {
  it('verwirft offene Sätze und Übungen ohne abgehakten Satz', async () => {
    const workout = await startWorkout();
    const done = await addWorkoutExercise(workout.id, bench.id);
    const empty = await addWorkoutExercise(workout.id, squat.id);
    const [first] = await setsOf(done.id);
    await completeSet(first!.id, 90);
    await addSet(done.id);

    await finishWorkout(workout.id, '  Gutes Training ');

    const detail = await loadWorkoutDetail(workout.id);
    expect(detail?.workout).toMatchObject({ notes: 'Gutes Training', restEndsAt: null });
    expect(detail?.workout.endedAt).not.toBeNull();
    expect(detail?.items).toHaveLength(1);
    expect(detail?.items[0]?.sets).toHaveLength(1);
    expect(await setsOf(empty.id)).toEqual([]);
    expect(await getActiveWorkout()).toBeUndefined();
    await expect(finishWorkout(workout.id, '')).rejects.toThrow();
  });

  it('löscht Workouts samt Übungen und Sätzen (Soft-Delete)', async () => {
    const workout = await loggedWorkout(bench, [[80, 8]]);
    await deleteWorkout(workout.id);
    expect(await loadWorkoutDetail(workout.id)).toBeNull();
    expect((await db.workouts.get(workout.id))?.deletedAt).not.toBeNull();
    expect((await db.sets.toArray()).every((s) => s.deletedAt !== null)).toBe(true);
    expect(await listWorkoutHistory()).toEqual([]);
  });
});

describe('Letztes Mal und Historie', () => {
  it('liefert die Sätze aus dem letzten beendeten Workout und befüllt damit neue Sätze', async () => {
    await loggedWorkout(bench, [[70, 10]]);
    await loggedWorkout(bench, [
      [80, 8],
      [82.5, 6],
    ]);

    const current = await startWorkout();
    const last = await getLastPerformance(bench.id, current.id);
    expect(last?.sets.map((s) => [s.weight, s.reps])).toEqual([
      [80, 8],
      [82.5, 6],
    ]);
    expect(await getLastPerformance(squat.id, current.id)).toBeNull();

    const item = await addWorkoutExercise(current.id, bench.id);
    const [first] = await setsOf(item.id);
    expect(first).toMatchObject({ weight: 80, reps: 8 });
  });

  it('listet beendete Workouts, neueste zuerst, ohne das laufende', async () => {
    const older = await loggedWorkout(bench, [[80, 8]]);
    await updateWorkoutInfo(older.id, {
      startedAt: '2026-01-01T10:00:00.000Z',
      durationSeconds: 3600,
      notes: 'Alt',
    });
    const newer = await loggedWorkout(squat, [
      [100, 5],
      [100, 5],
    ]);
    await startWorkout();

    const history = await listWorkoutHistory();
    expect(history.map((h) => h.workout.id)).toEqual([newer.id, older.id]);
    expect(history[0]).toMatchObject({ exerciseNames: ['Kniebeugen'], setCount: 2 });
    expect(history[1]?.workout).toMatchObject({
      endedAt: '2026-01-01T11:00:00.000Z',
      notes: 'Alt',
    });
  });

  it('legt beim nachträglichen Bearbeiten neue Sätze direkt abgehakt an', async () => {
    const workout = await loggedWorkout(bench, [[80, 8]]);
    const detail = await loadWorkoutDetail(workout.id);
    const added = await addSet(detail!.items[0]!.workoutExercise.id);
    expect(added.completedAt).toBe(detail!.workout.endedAt);
    await expect(
      updateWorkoutInfo(workout.id, {
        startedAt: workout.startedAt,
        durationSeconds: 0,
        notes: '',
      }),
    ).rejects.toThrow('Dauer');
  });
});
