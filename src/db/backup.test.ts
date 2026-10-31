import {
  backupFileName,
  countRows,
  createBackup,
  parseBackup,
  parseBackupText,
  restoreBackup,
} from './backup';
import { db } from './database';
import { createUserExercise } from './exercises';
import { addPlanExercise, createPlan, deletePlan, loadPlanDetail } from './plans';
import { create } from './repository';
import { EMPTY_EXERCISE_INPUT } from './schemas';
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

const EXERCISE = { ...EMPTY_EXERCISE_INPUT, name: 'Testübung', primaryMuscles: ['chest' as const] };

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
        plans: 0,
        planDays: 0,
        planExercises: 0,
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
      loadType: 'level',
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

describe('Sicherungen aus DB-Version 10', () => {
  it('ergänzt die Standard-Widgets und lehnt unbekannte Widgets ab', async () => {
    const data = await validBackup();
    data.dbVersion = 10;
    delete data.tables.settings[0].dashboardWidgets;
    const result = parseBackup(data);
    if (!result.ok) throw new Error(result.error);
    expect(result.backup.tables.settings[0]!.dashboardWidgets).toEqual([
      'week',
      'lastWorkout',
      'records',
      'activity',
    ]);

    data.tables.settings[0].dashboardWidgets = ['unbekannt'];
    expect(parseBackup(data).ok).toBe(false);
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
      restTimerSeconds: 180,
      restTimerSound: true,
      restTimerVibrate: true,
    });
    expect(result.backup.tables.workouts).toEqual([]);
  });

  it('ergänzt bei Sicherungen aus DB-Version 4 loadType und level', async () => {
    const data = await validBackup();
    data.dbVersion = 4;
    data.tables.sets = [
      {
        id: 's1',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        deletedAt: null,
        workoutId: 'w1',
        workoutExerciseId: 'we1',
        order: 0,
        weight: 80,
        reps: 8,
        durationSeconds: null,
        rpe: null,
        rir: null,
        isWarmup: false,
        restSeconds: 180,
        completedAt: '2026-01-01T00:00:00.000Z',
      },
    ];
    const result = parseBackup(data);
    if (!result.ok) throw new Error(result.error);
    expect(result.backup.tables.sets[0]).toMatchObject({
      weight: 80,
      level: null,
      eccentricWeight: null,
      eccentricLevel: null,
    });
  });

  it('sichert und stellt Trainingspläne samt aktivem Plan wieder her', async () => {
    const plan = await createPlan('Mein Plan');
    const detail = await loadPlanDetail(plan.id);
    await addPlanExercise(detail!.days[0]!.day.id, await createUserExercise(EXERCISE));
    const data = JSON.parse(JSON.stringify(await createBackup()));
    await deletePlan(plan.id);
    await resetDatabase();

    const result = parseBackup(data);
    if (!result.ok) throw new Error(result.error);
    await restoreBackup(result.backup);
    expect((await getSettings())?.activePlanId).toBe(plan.id);
    expect((await loadPlanDetail(plan.id))?.days[0]?.items).toHaveLength(1);
  });

  it('ergänzt bei Sicherungen aus DB-Version 9 die Pausen-Schalter', async () => {
    const data = await validBackup();
    data.dbVersion = 9;
    delete data.tables.settings[0].restTimerEnabled;
    delete data.tables.settings[0].restAnalysisEnabled;

    const result = parseBackup(data);
    if (!result.ok) throw new Error(result.error);
    expect(result.backup.tables.settings[0]).toMatchObject({
      restTimerEnabled: true,
      restAnalysisEnabled: false,
    });
  });

  it('ergänzt bei Sicherungen aus DB-Version 8 die Aufwärmsätze', async () => {
    const plan = await createPlan('Mein Plan');
    const detail = await loadPlanDetail(plan.id);
    await addPlanExercise(detail!.days[0]!.day.id, await createUserExercise(EXERCISE));
    const data = JSON.parse(JSON.stringify(await createBackup()));
    data.dbVersion = 8;
    delete data.tables.planExercises[0].warmupSets;

    const result = parseBackup(data);
    if (!result.ok) throw new Error(result.error);
    expect(result.backup.tables.planExercises[0]?.warmupSets).toBe(0);
  });

  it('ergänzt bei Sicherungen aus DB-Version 6 die Planfelder', async () => {
    const data = await validBackup();
    const row = {
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      deletedAt: null,
    };
    data.dbVersion = 6;
    delete data.tables.plans;
    delete data.tables.planDays;
    delete data.tables.planExercises;
    delete data.tables.settings[0].activePlanId;
    data.tables.workouts = [
      {
        ...row,
        id: 'w1',
        startedAt: '2026-01-01T00:00:00.000Z',
        endedAt: null,
        notes: '',
        restEndsAt: null,
      },
    ];
    data.tables.workoutExercises = [
      { ...row, id: 'we1', workoutId: 'w1', exerciseId: 'e1', order: 0 },
    ];
    const result = parseBackup(data);
    if (!result.ok) throw new Error(result.error);
    expect(result.backup.tables.plans).toEqual([]);
    expect(result.backup.tables.settings[0]?.activePlanId).toBeNull();
    expect(result.backup.tables.workouts[0]).toMatchObject({ planId: null, planDayId: null });
    expect(result.backup.tables.workoutExercises[0]).toMatchObject({
      repMin: null,
      repMax: null,
      targetDurationSeconds: null,
      restSeconds: null,
    });
  });
});

describe('backupFileName', () => {
  it('enthält das Datum', () => {
    expect(backupFileName(new Date(2026, 0, 5))).toBe('fitnesstracker-backup-2026-01-05.json');
  });
});
