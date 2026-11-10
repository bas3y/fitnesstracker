import { db } from './database';
import type { BuiltinExercise } from './schemas';
import { applySeed } from './seed';
import { resetDatabase } from './testUtils';
import { createEnduranceSession } from './endurance';
import type { EnduranceSessionInput } from './schemas';
import { createEnduranceCsvFile, createWorkoutsCsvFile } from './workoutExport';
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

    expect(file.name).toBe('basey-workouts-2026-10-31.csv');
    expect(file.type).toContain('text/csv');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain(';Bankdrücken;1;nein;50;;8;');
    expect(lines[1]!.endsWith(';Notiz')).toBe(true);
  });

  it('nur die Sätze einer Übung, Dateiname nach der Übung', async () => {
    const workout = await startWorkout();
    await logSet(workout.id, 8);
    await finishWorkout(workout.id, '');
    const exercise = (await db.exercises.where('builtinKey').equals('bench').first())!;

    const file = (await createWorkoutsCsvFile('kg', new Date(2026, 9, 31), exercise))!;
    expect(file.name).toBe('basey-bankdruecken-2026-10-31.csv');
    expect((await file.text()).trim().split('\r\n')).toHaveLength(2);

    const other = { id: 'gibt-es-nicht', name: 'Andere' };
    expect(await createWorkoutsCsvFile('kg', new Date(), other)).toBeNull();
  });
});

describe('createEnduranceCsvFile', () => {
  const input = (sport: 'run' | 'ride', startedAt: string): EnduranceSessionInput => ({
    sport,
    title: '',
    startedAt,
    durationSeconds: 1800,
    distanceMeters: sport === 'run' ? 5000 : 20_000,
    avgHeartRate: null,
    maxHeartRate: null,
    elevationGainMeters: null,
    calories: null,
    rating: null,
    notes: '',
    gearId: null,
    poolLengthMeters: null,
    laps: null,
    swimStroke: null,
    swolf: null,
  });

  it('filtert nach Sportart und Beginn', async () => {
    await createEnduranceSession(input('run', new Date(2026, 9, 1, 7).toISOString()));
    await createEnduranceSession(input('run', new Date(2026, 10, 2, 7).toISOString()));
    await createEnduranceSession(input('ride', new Date(2026, 10, 3, 7).toISOString()));

    const file = (await createEnduranceCsvFile(
      'km',
      { sport: 'run', from: '2026-10-15' },
      new Date(2026, 10, 7),
    ))!;
    const lines = (await file.text()).trim().split('\r\n');
    expect(file.name).toBe('basey-ausdauer-laufen-2026-11-07.csv');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('2026-11-02;07:00;Laufen;;30;5;');

    const all = (await createEnduranceCsvFile('km', { sport: null, from: null }))!;
    expect((await all.text()).trim().split('\r\n')).toHaveLength(4);
    expect(await createEnduranceCsvFile('km', { sport: 'swim', from: null })).toBeNull();
  });
});
