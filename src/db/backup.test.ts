import {
  backupFileName,
  countRows,
  createBackup,
  parseBackup,
  parseBackupText,
  restoreBackup,
} from './backup';
import { db } from './database';
import { create } from './repository';
import { applySeed, SEED_VERSION } from './seed';
import { getSettings, updateSettings } from './settings';
import { resetDatabase } from './testUtils';
import type { Exercise } from './types';
import {
  addWorkoutExercise,
  completeSet,
  finishWorkout,
  loadWorkoutDetail,
  startWorkout,
  updateSet,
} from './workouts';

beforeEach(resetDatabase);

async function validBackup() {
  await updateSettings({ name: 'Alex', bodyWeightKg: 80 });
  return JSON.parse(JSON.stringify(await createBackup()));
}

describe('createBackup', () => {
  it('exportiert alle Tabellen mit Metadaten', async () => {
    await updateSettings({ name: 'Alex' });
    const backup = await createBackup();
    expect(backup.app).toBe('fitnesstracker');
    expect(backup.backupVersion).toBe(1);
    expect(backup.dbVersion).toBe(db.verno);
    expect(Object.keys(backup.tables)).toEqual(db.tables.map((t) => t.name));
    expect(backup.tables.settings[0]?.name).toBe('Alex');
  });
});

describe('parseBackup', () => {
  it('akzeptiert eine exportierte Sicherung', async () => {
    const result = parseBackup(await validBackup());
    expect(result.ok).toBe(true);
    if (result.ok)
      expect(countRows(result.backup)).toEqual({
        settings: 1,
        exercises: 0,
        foods: 0,
        workouts: 0,
        workoutExercises: 0,
        sets: 0,
      });
  });

  it('lehnt fremde Dateien ab', () => {
    expect(parseBackup({ foo: 1 }).ok).toBe(false);
    expect(parseBackupText('kein json').ok).toBe(false);
  });

  it('lehnt Sicherungen neuerer App-Versionen ab', async () => {
    const data = await validBackup();
    const newerBackup = parseBackup({ ...data, backupVersion: 99 });
    const newerDb = parseBackup({ ...data, dbVersion: db.verno + 1 });
    expect(newerBackup).toMatchObject({ ok: false, error: expect.stringContaining('neueren') });
    expect(newerDb).toMatchObject({ ok: false, error: expect.stringContaining('neueren') });
  });

  it('lehnt ungültige Datensätze mit Pfadangabe ab', async () => {
    const data = await validBackup();
    data.tables.settings[0].weightUnit = 'stone';
    const result = parseBackup(data);
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining('weightUnit') });
  });

  it('ergänzt fehlende Tabellen als leer', async () => {
    const data = await validBackup();
    delete data.tables.settings;
    const result = parseBackup(data);
    expect(result.ok && result.backup.tables.settings).toEqual([]);
  });
});

describe('restoreBackup', () => {
  it('ersetzt alle Daten und setzt lastBackupAt auf den Export-Zeitpunkt', async () => {
    const result = parseBackup(await validBackup());
    if (!result.ok) throw new Error(result.error);

    await updateSettings({ name: 'Überschrieben', bodyWeightKg: 90 });
    await restoreBackup(result.backup);

    const settings = await getSettings();
    expect(settings?.name).toBe('Alex');
    expect(settings?.bodyWeightKg).toBe(80);
    expect(settings?.lastBackupAt).toBe(result.backup.exportedAt);
    expect(await db.settings.count()).toBe(1);
  });

  it('übernimmt Übungen und Lebensmittel aus der Sicherung', async () => {
    await applySeed({ exercises: [], foods: [] }, SEED_VERSION);
    const own = await create<Exercise>(db.exercises, {
      name: 'Meine Übung',
      aliases: [],
      category: 'strength',
      primaryMuscles: ['chest'],
      secondaryMuscles: [],
      equipment: 'other',
      isUnilateral: false,
      isTimed: false,
      source: 'user',
      builtinKey: null,
      isFavorite: true,
      hiddenAt: null,
      notes: 'Sitz 3',
    });
    const result = parseBackup(JSON.parse(JSON.stringify(await createBackup())));
    if (!result.ok) throw new Error(result.error);

    await resetDatabase();
    await restoreBackup(result.backup);

    expect(await db.exercises.toArray()).toEqual([own]);
  });

  it('spielt bei Sicherungen vor DB-Version 2 die mitgelieferten Daten ein', async () => {
    const oldBackup = await validBackup();
    oldBackup.dbVersion = 1;
    delete oldBackup.tables.settings[0].seedVersion;
    delete oldBackup.tables.exercises;
    delete oldBackup.tables.foods;
    const result = parseBackup(oldBackup);
    if (!result.ok) throw new Error(result.error);

    await restoreBackup(result.backup);

    expect((await getSettings())?.name).toBe('Alex');
    expect((await getSettings())?.seedVersion).toBe(SEED_VERSION);
    expect(await db.exercises.where('builtinKey').equals('barbell-bench-press').count()).toBe(1);
    expect(await db.foods.where('builtinKey').equals('oats').count()).toBe(1);
  });
});

describe('Sicherungen aus DB-Version 2', () => {
  it('ergänzt Favorit, Ausblenden und Notiz an Übungen', async () => {
    const data = await validBackup();
    data.dbVersion = 2;
    data.tables.exercises = [
      {
        id: 'e1',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        deletedAt: null,
        source: 'user',
        builtinKey: null,
        name: 'Alte Übung',
        aliases: [],
        category: 'strength',
        primaryMuscles: ['chest'],
        secondaryMuscles: [],
        equipment: 'machine',
        isUnilateral: false,
      },
    ];
    const result = parseBackup(data);
    if (!result.ok) throw new Error(result.error);
    expect(result.backup.tables.exercises[0]).toMatchObject({
      isFavorite: false,
      hiddenAt: null,
      notes: '',
    });
  });
});

describe('Workouts im Backup', () => {
  it('sichert und stellt Workouts, Übungen und Sätze wieder her', async () => {
    await applySeed(
      {
        exercises: [
          {
            key: 'bench',
            name: 'Bankdrücken',
            aliases: [],
            category: 'strength',
            primaryMuscles: ['chest'],
            secondaryMuscles: [],
            equipment: 'barbell',
            isUnilateral: false,
            isTimed: false,
          },
        ],
        foods: [],
      },
      SEED_VERSION,
    );
    const exercise = (await db.exercises.toArray())[0]!;
    const workout = await startWorkout();
    const item = await addWorkoutExercise(workout.id, exercise.id);
    const [set] = await db.sets.toArray();
    await updateSet(set!.id, { weight: 80, reps: 8, rpe: 8 });
    await completeSet(set!.id, 90);
    await finishWorkout(workout.id, 'Notiz');

    const result = parseBackup(JSON.parse(JSON.stringify(await createBackup())));
    if (!result.ok) throw new Error(result.error);
    expect(countRows(result.backup)).toMatchObject({ workouts: 1, workoutExercises: 1, sets: 1 });

    await resetDatabase();
    await restoreBackup(result.backup);
    const detail = await loadWorkoutDetail(workout.id);
    expect(detail?.workout.notes).toBe('Notiz');
    expect(detail?.items[0]?.workoutExercise.id).toBe(item.id);
    expect(detail?.items[0]?.sets[0]).toMatchObject({ weight: 80, reps: 8, rpe: 8 });
  });

  it('importiert Sicherungen aus DB-Version 3 (ohne Workouts und Pausen-Einstellungen)', async () => {
    const data = await validBackup();
    data.dbVersion = 3;
    for (const key of ['restTimerSeconds', 'restTimerSound', 'restTimerVibrate']) {
      delete data.tables.settings[0][key];
    }
    delete data.tables.workouts;
    delete data.tables.workoutExercises;
    delete data.tables.sets;
    const result = parseBackup(data);
    if (!result.ok) throw new Error(result.error);
    expect(result.backup.tables.settings[0]).toMatchObject({
      restTimerSeconds: 90,
      restTimerSound: true,
      restTimerVibrate: true,
    });
    expect(result.backup.tables.workouts).toEqual([]);
  });
});

describe('backupFileName', () => {
  it('enthält das Datum', () => {
    expect(backupFileName(new Date(2026, 0, 5))).toBe('fitnesstracker-backup-2026-01-05.json');
  });
});
