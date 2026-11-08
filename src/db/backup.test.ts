import {
  backupFileName,
  backupHasPhotos,
  countRows,
  createBackup,
  parseBackup,
  parseBackupText,
  restoreBackup,
} from './backup';
import { getBodyMeasurement, getDailyLog, setBodyMeasure, updateDailyLog } from './daily';
import { db } from './database';
import { createEnduranceSession, createGear, loadEnduranceSession, loadGear } from './endurance';
import { createUserExercise } from './exercises';
import { addGoalEntry, createGoal, listGoals, loadGoalData } from './goals';
import { createRecipe, createUserFood, setFoodFavorite } from './foods';
import { addMealEntry, listMealEntries, listSavedMeals, saveMeal } from './nutrition';
import { addHabitAmount, createHabit, loadHabit, pauseHabit, setHabitChecked } from './habits';
import { addJournalPrompt, getJournalEntry, listJournalPrompts, saveJournalEntry } from './journal';
import {
  addProgressPhoto,
  listProgressPhotos,
  loadPhotoFile,
  loadProgressPhoto,
  type PhotoImage,
} from './photos';
import {
  addPlanExercise,
  createPlan,
  deletePlan,
  loadPlanDetail,
  setPlanBlocks,
  startPlanBlock,
  startPlanWorkout,
} from './plans';
import { newBlock } from '../domain/blocks';
import { dayKey } from '../domain/daily';
import {
  addBookNote,
  addReadingLog,
  createBook,
  listBookLogs,
  listBookNotes,
  setReadingHabit,
} from './reading';
import { create } from './repository';
import {
  DAILY_GOAL_DEFAULTS,
  EMPTY_EXERCISE_INPUT,
  EMPTY_FOOD_INPUT,
  EMPTY_HABIT_INPUT,
  EMPTY_JOURNAL_VALUES,
  EMPTY_SUPPLEMENT_INPUT,
  emptyBookInput,
  emptyGoalInput,
  NUTRITION_GOAL_DEFAULTS,
  TIMER_PRESET_DEFAULTS,
  type EnduranceSessionInput,
} from './schemas';
import { addTimerSession, listTimerSessions, setTimerHabit, startTimer } from './timer';
import { createSupplement, loadSupplement, setSupplementTaken } from './supplements';
import { applySeed, SEED_VERSION } from './seed';
import { getSettings, updateSettings } from './settings';
import { resetDatabase } from './testUtils';
import { createTodo, listTodos } from './todos';
import {
  DEFAULT_DASHBOARD_WIDGETS,
  DEFAULT_QUICK_ACTIONS,
  ENDURANCE_SPORTS,
  type Exercise,
} from './types';
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
const RUN_INPUT: EnduranceSessionInput = {
  sport: 'run',
  title: '',
  startedAt: '2026-11-03T17:00:00.000Z',
  durationSeconds: 1800,
  distanceMeters: 6000,
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
};

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
    // Fotos nur auf Wunsch
    expect(Object.keys(backup.tables)).toEqual(
      db.tables
        .map((t) => t.name)
        .filter((name) => !['progressPhotos', 'photoFiles'].includes(name)),
    );
    expect(Object.keys(await createBackup({ includePhotos: true }))).toEqual(Object.keys(backup));
    expect(Object.keys((await createBackup({ includePhotos: true })).tables)).toEqual(
      db.tables.map((t) => t.name),
    );
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
        dailyLogs: 0,
        bodyMeasurements: 0,
        habits: 0,
        habitChecks: 0,
        todos: 0,
        supplements: 0,
        supplementIntakes: 0,
        mealEntries: 0,
        savedMeals: 0,
        enduranceSessions: 0,
        gear: 0,
        enduranceTracks: 0,
        goals: 0,
        goalEntries: 0,
        journalPrompts: 0,
        journalEntries: 0,
        books: 0,
        readingLogs: 0,
        bookNotes: 0,
        timerSessions: 0,
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

describe('Alltag in Sicherungen', () => {
  it('stellt Tageseinträge und Körpermaße wieder her', async () => {
    await updateDailyLog('2026-10-30', { steps: 8000, weightKg: 79.5 });
    await setBodyMeasure('2026-10-30', 'waist', 0.85);
    const result = parseBackup(JSON.parse(JSON.stringify(await createBackup())));
    if (!result.ok) throw new Error(result.error);

    await resetDatabase();
    await restoreBackup(result.backup);

    expect(await getDailyLog('2026-10-30')).toMatchObject({ steps: 8000, weightKg: 79.5 });
    expect((await getBodyMeasurement('2026-10-30'))?.values).toEqual({ waist: 0.85 });
  });

  it('ergänzt in Sicherungen aus DB-Version 11 Tagesziele und leere Tabellen', async () => {
    const data = await validBackup();
    data.dbVersion = 11;
    delete data.tables.dailyLogs;
    delete data.tables.bodyMeasurements;
    delete data.tables.settings[0].stepsGoal;
    delete data.tables.settings[0].waterGoalMl;
    delete data.tables.settings[0].sleepGoalSeconds;
    const result = parseBackup(data);
    if (!result.ok) throw new Error(result.error);
    expect(result.backup.tables.dailyLogs).toEqual([]);
    expect(result.backup.tables.settings[0]).toMatchObject(DAILY_GOAL_DEFAULTS);
  });

  it('lehnt unbekannte Körpermaße ab', async () => {
    await setBodyMeasure('2026-10-30', 'waist', 0.85);
    const data = await validBackup();
    data.tables.bodyMeasurements[0].values = { nase: 0.05 };
    expect(parseBackup(data).ok).toBe(false);
  });
});

describe('Gewohnheiten in Sicherungen', () => {
  it('stellt Gewohnheiten und erledigte Tage wieder her', async () => {
    const habit = await createHabit({ ...EMPTY_HABIT_INPUT, name: 'Lesen', group: 'evening' });
    await setHabitChecked(habit.id, '2026-10-30', true);
    const result = parseBackup(JSON.parse(JSON.stringify(await createBackup())));
    if (!result.ok) throw new Error(result.error);
    expect(countRows(result.backup)).toMatchObject({ habits: 1, habitChecks: 1 });

    await resetDatabase();
    await restoreBackup(result.backup);

    expect(await loadHabit(habit.id)).toMatchObject({
      habit: { name: 'Lesen', group: 'evening' },
      dates: ['2026-10-30'],
    });
  });

  it('ergänzt in Sicherungen aus DB-Version 12 leere Tabellen', async () => {
    const data = await validBackup();
    data.dbVersion = 12;
    delete data.tables.habits;
    delete data.tables.habitChecks;
    const result = parseBackup(data);
    if (!result.ok) throw new Error(result.error);
    expect(result.backup.tables.habits).toEqual([]);
    expect(result.backup.tables.habitChecks).toEqual([]);
  });

  it('lehnt unbekannte Häufigkeiten ab', async () => {
    await createHabit({ ...EMPTY_HABIT_INPUT, name: 'Lesen' });
    const data = await validBackup();
    data.tables.habits[0].frequency = 'monatlich';
    expect(parseBackup(data).ok).toBe(false);
  });

  it('stellt Unterpunkte, Mengen, Pausen und To-dos wieder her', async () => {
    const habit = await createHabit({
      ...EMPTY_HABIT_INPUT,
      name: 'Supplements',
      kind: 'items',
      items: [{ id: 'kreatin', name: 'Kreatin', target: 5, unit: 'g', step: 5 }],
    });
    await addHabitAmount(habit.id, '2026-10-30', 5, 'kreatin');
    await pauseHabit(habit.id, '2026-10-31');
    await createTodo({ title: 'Einkaufen', priority: 'high', date: '2026-10-30' });
    const result = parseBackup(JSON.parse(JSON.stringify(await createBackup())));
    if (!result.ok) throw new Error(result.error);

    await resetDatabase();
    await restoreBackup(result.backup);

    expect(await loadHabit(habit.id)).toMatchObject({
      habit: { kind: 'items', pauses: [{ from: '2026-10-31', to: null }] },
      entries: [{ date: '2026-10-30', itemId: 'kreatin', amount: 5 }],
      dates: ['2026-10-30'],
    });
    expect(await listTodos()).toMatchObject([{ title: 'Einkaufen', priority: 'high' }]);
  });

  it('ergänzt in Sicherungen aus DB-Version 13 die neuen Felder', async () => {
    const habit = await createHabit({ ...EMPTY_HABIT_INPUT, name: 'Lesen' });
    await setHabitChecked(habit.id, '2026-10-30', true);
    const data = await validBackup();
    data.dbVersion = 13;
    for (const field of ['kind', 'target', 'unit', 'step', 'items', 'startDate', 'pauses']) {
      delete data.tables.habits[0][field];
    }
    delete data.tables.habits[0].archivedAt;
    delete data.tables.habitChecks[0].itemId;
    delete data.tables.habitChecks[0].amount;
    delete data.tables.todos;
    delete data.tables.settings[0].quickActions;
    const result = parseBackup(data);
    if (!result.ok) throw new Error(result.error);
    expect(result.backup.tables.habits[0]).toMatchObject({
      kind: 'check',
      target: 1,
      items: [],
      pauses: [],
      archivedAt: null,
    });
    expect(result.backup.tables.habitChecks[0]).toMatchObject({ itemId: null, amount: 1 });
    expect(result.backup.tables.todos).toEqual([]);
    expect(result.backup.tables.settings[0]!.quickActions).toEqual([...DEFAULT_QUICK_ACTIONS]);
  });
});

describe('Supplements im Backup', () => {
  it('stellt Supplements, Einnahmen und Bestand wieder her', async () => {
    const supplement = await createSupplement({
      ...EMPTY_SUPPLEMENT_INPUT,
      name: 'Kreatin',
      unit: 'g',
      doses: [{ id: 'd1', amount: 5, timing: 'afterTraining', time: null, period: null }],
      schedule: 'training',
      trainingKind: 'strength',
      stock: 100,
      packageSize: 500,
    });
    await setSupplementTaken(supplement.id, 'd1', '2026-10-30', true);
    await updateSettings({ supplementLowStockDays: 10 });
    const result = parseBackup(JSON.parse(JSON.stringify(await createBackup())));
    if (!result.ok) throw new Error(result.error);
    expect(countRows(result.backup)).toMatchObject({ supplements: 1, supplementIntakes: 1 });

    await resetDatabase();
    await restoreBackup(result.backup);
    expect(await loadSupplement(supplement.id)).toMatchObject({
      supplement: { name: 'Kreatin', stock: 95, schedule: 'training', trainingKind: 'strength' },
      intakes: [{ doseId: 'd1', date: '2026-10-30', stockDeducted: 5 }],
    });
    expect((await getSettings())?.supplementLowStockDays).toBe(10);
  });

  it('ergänzt in Sicherungen aus DB-Version 14 Tabellen und Einstellungen', async () => {
    const data = await validBackup();
    data.dbVersion = 14;
    delete data.tables.supplements;
    delete data.tables.supplementIntakes;
    for (const key of [
      'supplementLowStockDays',
      'supplementRemindersEnabled',
      'supplementNotificationsEnabled',
    ]) {
      delete data.tables.settings[0][key];
    }
    const result = parseBackup(data);
    if (!result.ok) throw new Error(result.error);
    expect(result.backup.tables.supplements).toEqual([]);
    expect(result.backup.tables.supplementIntakes).toEqual([]);
    expect(result.backup.tables.settings[0]).toMatchObject({
      supplementLowStockDays: 7,
      supplementRemindersEnabled: true,
      supplementNotificationsEnabled: false,
    });
  });

  it('lehnt ungültige Zeitpunkte ab', async () => {
    await createSupplement({
      ...EMPTY_SUPPLEMENT_INPUT,
      name: 'Zink',
      doses: [{ id: 'd1', amount: 1, timing: 'time', time: '08:00', period: null }],
    });
    const data = await validBackup();
    data.tables.supplements[0].doses[0].timing = 'mittags';
    expect(parseBackup(data).ok).toBe(false);
  });
});

describe('Ernährung im Backup', () => {
  it('stellt Lebensmittel, Rezepte, Mahlzeiten, Lieblingsmahlzeiten und Ziele wieder her', async () => {
    const food = await createUserFood({
      ...EMPTY_FOOD_INPUT,
      name: 'Quark',
      kcal: 67,
      protein: 12,
    });
    await setFoodFavorite(food.id, true);
    const recipe = await createRecipe({
      name: 'Quarkspeise',
      ingredients: [{ id: 'a', foodId: food.id, grams: 250 }],
      cookedWeightGrams: null,
      servings: 2,
    });
    await addMealEntry('2026-11-02', 'snack', recipe.id, {
      grams: 125,
      portion: { label: '1 Portion', grams: 125, count: 1 },
    });
    await saveMeal('Snack', '2026-11-02', 'snack');
    await updateSettings({
      nutritionGoals: {
        training: { kcal: 2800, protein: 160, carbs: 300, fat: null },
        rest: { kcal: 2300, protein: 160, carbs: null, fat: 70 },
      },
    });
    const result = parseBackup(JSON.parse(JSON.stringify(await createBackup())));
    if (!result.ok) throw new Error(result.error);
    expect(countRows(result.backup)).toMatchObject({ mealEntries: 1, savedMeals: 1 });

    await resetDatabase();
    await restoreBackup(result.backup);
    expect(await db.foods.get(food.id)).toMatchObject({ isFavorite: true });
    expect(await db.foods.get(recipe.id)).toMatchObject({ recipe: { servings: 2 } });
    expect(await listMealEntries('2026-11-02')).toMatchObject([
      { name: 'Quarkspeise', grams: 125, portion: { count: 1 } },
    ]);
    expect(await listSavedMeals()).toMatchObject([{ savedMeal: { name: 'Snack' } }]);
    expect((await getSettings())?.nutritionGoals.rest.fat).toBe(70);
  });

  it('ergänzt in Sicherungen aus DB-Version 15 Tabellen, Felder und Ziele', async () => {
    await createUserFood({ ...EMPTY_FOOD_INPUT, name: 'Quark' });
    const data = await validBackup();
    data.dbVersion = 15;
    delete data.tables.mealEntries;
    delete data.tables.savedMeals;
    delete data.tables.settings[0].nutritionGoals;
    for (const key of ['isFavorite', 'hiddenAt', 'recipe']) delete data.tables.foods[0][key];
    const result = parseBackup(data);
    if (!result.ok) throw new Error(result.error);
    expect(result.backup.tables.mealEntries).toEqual([]);
    expect(result.backup.tables.savedMeals).toEqual([]);
    expect(result.backup.tables.foods[0]).toMatchObject({
      isFavorite: false,
      hiddenAt: null,
      recipe: null,
    });
    expect(result.backup.tables.settings[0]!.nutritionGoals).toEqual(NUTRITION_GOAL_DEFAULTS);
  });

  it('stellt Strichcodes wieder her und ergänzt sie in Sicherungen aus DB-Version 21', async () => {
    await createUserFood({ ...EMPTY_FOOD_INPUT, name: 'Skyr', barcode: '4006381333931' });
    const data = await validBackup();
    const restored = parseBackup(data);
    if (!restored.ok) throw new Error(restored.error);
    await restoreBackup(restored.backup);
    expect(await db.foods.where('barcode').equals('4006381333931').count()).toBe(1);

    data.dbVersion = 21;
    delete data.tables.foods[0].barcode;
    const old = parseBackup(data);
    if (!old.ok) throw new Error(old.error);
    expect(old.backup.tables.foods[0]).toMatchObject({ name: 'Skyr', barcode: null });
  });

  it('lehnt ungültige Mahlzeiten ab', async () => {
    const food = await createUserFood({ ...EMPTY_FOOD_INPUT, name: 'Quark' });
    await addMealEntry('2026-11-02', 'snack', food.id, { grams: 100, portion: null });
    const data = await validBackup();
    data.tables.mealEntries[0].meal = 'brunch';
    expect(parseBackup(data).ok).toBe(false);
  });

  it('stellt Ausdauer-Einheiten, Ausrüstung und Kacheln wieder her', async () => {
    const shoe = await createGear({
      name: 'Pegasus',
      sports: ['run'],
      initialDistanceMeters: 50_000,
      warnDistanceMeters: 700_000,
      notes: '',
    });
    const session = await createEnduranceSession({ ...RUN_INPUT, gearId: shoe.id });
    await updateSettings({ trainingTiles: ['swim', 'run'] });
    const data = await validBackup();
    await resetDatabase();

    const result = parseBackup(data);
    if (!result.ok) throw new Error(result.error);
    await restoreBackup(result.backup);
    expect(await loadEnduranceSession(session.id)).toMatchObject({
      distanceMeters: 6000,
      gearId: shoe.id,
      source: 'manual',
    });
    expect(await loadGear(shoe.id)).toMatchObject({ initialDistanceMeters: 50_000 });
    expect((await getSettings())?.trainingTiles).toEqual(['swim', 'run']);
  });

  it('ergänzt in Sicherungen aus DB-Version 16 Tabellen und Kacheln', async () => {
    const data = await validBackup();
    data.dbVersion = 16;
    delete data.tables.enduranceSessions;
    delete data.tables.gear;
    delete data.tables.settings[0].trainingTiles;
    const result = parseBackup(data);
    if (!result.ok) throw new Error(result.error);
    expect(result.backup.tables.enduranceSessions).toEqual([]);
    expect(result.backup.tables.gear).toEqual([]);
    expect(result.backup.tables.settings[0]!.trainingTiles).toEqual([...ENDURANCE_SPORTS]);
  });

  it('ergänzt in Sicherungen aus DB-Version 17 Verläufe und Pulswerte', async () => {
    const data = await validBackup();
    data.dbVersion = 17;
    delete data.tables.enduranceTracks;
    delete data.tables.settings[0].maxHeartRate;
    delete data.tables.settings[0].restingHeartRate;
    const result = parseBackup(data);
    if (!result.ok) throw new Error(result.error);
    expect(result.backup.tables.enduranceTracks).toEqual([]);
    expect(result.backup.tables.settings[0]).toMatchObject({
      maxHeartRate: null,
      restingHeartRate: null,
    });
  });

  it('ergänzt in Sicherungen aus DB-Version 18 die Gesundheitswerte der Tageseinträge', async () => {
    await updateDailyLog('2026-10-30', { steps: 8000 });
    const data = await validBackup();
    data.dbVersion = 18;
    for (const key of ['restingHeartRate', 'hrvMs', 'sleepPhases', 'importedFields']) {
      delete data.tables.dailyLogs[0][key];
    }
    const result = parseBackup(data);
    if (!result.ok) throw new Error(result.error);
    expect(result.backup.tables.dailyLogs[0]).toMatchObject({
      steps: 8000,
      restingHeartRate: null,
      hrvMs: null,
      sleepPhases: null,
      importedFields: [],
    });
  });

  it('ergänzt in Sicherungen aus DB-Version 20 Protein und Willkommens-Hinweis', async () => {
    await updateDailyLog('2026-10-30', { steps: 8000 });
    const data = await validBackup();
    data.dbVersion = 20;
    delete data.tables.dailyLogs[0].proteinGrams;
    delete data.tables.settings[0].proteinOnly;
    delete data.tables.settings[0].welcomeDismissed;
    const result = parseBackup(data);
    if (!result.ok) throw new Error(result.error);
    expect(result.backup.tables.dailyLogs[0]).toMatchObject({ steps: 8000, proteinGrams: null });
    expect(result.backup.tables.settings[0]).toMatchObject({
      proteinOnly: false,
      welcomeDismissed: true,
    });
  });

  it('stellt Protein ohne Lebensmittel und den Protein-Modus wieder her', async () => {
    await updateDailyLog('2026-10-30', { proteinGrams: 40 });
    await updateSettings({ proteinOnly: true });
    const backup = parseBackup(await validBackup());
    if (!backup.ok) throw new Error(backup.error);
    await resetDatabase();
    await restoreBackup(backup.backup);
    expect(await getDailyLog('2026-10-30')).toMatchObject({ proteinGrams: 40 });
    expect(await getSettings()).toMatchObject({ proteinOnly: true, welcomeDismissed: false });
  });

  it('lehnt unbekannte Sportarten ab', async () => {
    await createEnduranceSession(RUN_INPUT);
    const data = await validBackup();
    data.tables.enduranceSessions[0].sport = 'curling';
    expect(parseBackup(data).ok).toBe(false);
  });
});

describe('Ziele im Backup', () => {
  it('stellt Ziele wieder her und ergänzt sie in Sicherungen aus DB-Version 22', async () => {
    const goal = await createGoal({ ...emptyGoalInput('total', '2026-11-01'), target: 12 });
    const data = await validBackup();
    await resetDatabase();
    const result = parseBackup(data);
    if (!result.ok) throw new Error(result.error);
    await restoreBackup(result.backup);
    expect(await listGoals()).toMatchObject([{ id: goal.id, target: 12, period: 'month' }]);

    data.dbVersion = 22;
    delete data.tables.goals;
    const old = parseBackup(data);
    if (!old.ok) throw new Error(old.error);
    expect(old.backup.tables.goals).toEqual([]);
  });

  it('stellt eigene Ziele mit Einträgen wieder her und ergänzt Sicherungen aus DB-Version 23', async () => {
    const goal = await createGoal({
      ...emptyGoalInput('custom', '2026-11-01'),
      title: 'Spanisch',
      icon: '🇪🇸',
      unit: 'Lektionen',
      target: 50,
    });
    await addGoalEntry(goal.id, 3, '2026-11-02');
    const data = await validBackup();
    await resetDatabase();
    const result = parseBackup(data);
    if (!result.ok) throw new Error(result.error);
    await restoreBackup(result.backup);
    expect(await listGoals()).toMatchObject([{ id: goal.id, icon: '🇪🇸', unit: 'Lektionen' }]);
    expect((await loadGoalData()).entries).toEqual([
      { goalId: goal.id, date: '2026-11-02', amount: 3 },
    ]);

    const total = await createGoal({ ...emptyGoalInput('total', '2026-11-01'), target: 12 });
    const old = await validBackup();
    old.dbVersion = 23;
    delete old.tables.goalEntries;
    old.tables.goals = old.tables.goals.filter((item: { id: string }) => item.id === total.id);
    for (const key of ['habitId', 'habitMetric', 'customType', 'unit', 'icon']) {
      delete old.tables.goals[0][key];
    }
    const parsed = parseBackup(old);
    if (!parsed.ok) throw new Error(parsed.error);
    expect(parsed.backup.tables.goalEntries).toEqual([]);
    expect(parsed.backup.tables.goals).toMatchObject([
      { id: total.id, habitId: null, habitMetric: null, customType: null, unit: '', icon: '' },
    ]);
  });

  it('lehnt unbekannte Zielarten ab', async () => {
    const data = await validBackup();
    data.tables.goals = [
      {
        id: 'g1',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        deletedAt: null,
        kind: 'abnehmen',
      },
    ];
    expect(parseBackup(data).ok).toBe(false);
  });
});

describe('Persönliche Entwicklung im Backup', () => {
  it('stellt Journal, Fragen, Bücher, Seiten und Notizen wieder her', async () => {
    const habit = await createHabit({
      ...EMPTY_HABIT_INPUT,
      name: 'Lesen',
      kind: 'count',
      target: 20,
      unit: 'Seiten',
    });
    await setReadingHabit(habit.id);
    const prompt = await addJournalPrompt('day', 'Was habe ich gelernt?');
    await saveJournalEntry('day', '2026-11-07', {
      ...EMPTY_JOURNAL_VALUES,
      text: 'Notiz',
      gratitude: ['Sonne'],
      answers: { [prompt.id]: 'Viel' },
    });
    await saveJournalEntry('week', '2026-11-07', { ...EMPTY_JOURNAL_VALUES, rating: 4 });
    const book = await createBook({ ...emptyBookInput('2026-11-01'), title: 'Buch' });
    await addReadingLog(book.id, '2026-11-07', 12);
    await addBookNote(book.id, { text: 'Zitat', page: 3 });

    const data = await validBackup();
    await resetDatabase();
    const result = parseBackup(data);
    if (!result.ok) throw new Error(result.error);
    await restoreBackup(result.backup);

    expect(await getJournalEntry('day', '2026-11-07')).toMatchObject({
      text: 'Notiz',
      gratitude: ['Sonne'],
      answers: { [prompt.id]: 'Viel' },
    });
    expect((await getJournalEntry('week', '2026-11-03'))?.rating).toBe(4);
    expect(await listJournalPrompts()).toMatchObject([{ id: prompt.id }]);
    expect(await listBookLogs(book.id)).toMatchObject([{ pages: 12, habitId: habit.id }]);
    expect(await listBookNotes(book.id)).toMatchObject([{ text: 'Zitat', page: 3 }]);
    expect((await getSettings())?.readingHabitId).toBe(habit.id);
  });

  it('ergänzt Sicherungen aus DB-Version 24', async () => {
    const data = await validBackup();
    data.dbVersion = 24;
    delete data.tables.settings[0].readingHabitId;
    for (const table of ['journalPrompts', 'journalEntries', 'books', 'readingLogs', 'bookNotes']) {
      delete data.tables[table];
    }
    const result = parseBackup(data);
    if (!result.ok) throw new Error(result.error);
    expect(result.backup.tables.settings[0]?.readingHabitId).toBeNull();
    expect(result.backup.tables.books).toEqual([]);
    expect(result.backup.tables.journalEntries).toEqual([]);
  });
});

describe('Timer und Fortschrittsfotos', () => {
  const image = (): PhotoImage => ({
    mimeType: 'image/jpeg',
    width: 3,
    height: 4,
    full: new Uint8Array([255, 216, 255, 1, 2]).buffer,
    thumb: new Uint8Array([7]).buffer,
  });

  it('stellt Sitzungen, Timer-Einstellungen und Fotos samt Bilddaten wieder her', async () => {
    const habit = await createHabit({ ...EMPTY_HABIT_INPUT, name: 'Meditieren' });
    await setTimerHabit('meditation', habit.id);
    await addTimerSession({
      kind: 'meditation',
      date: '2026-11-07',
      durationSeconds: 600,
      note: 'gut',
    });
    await startTimer('focus', { ...TIMER_PRESET_DEFAULTS, focusMinutes: 50 });
    const photo = await addProgressPhoto({ date: '2026-11-07', pose: 'front', note: '' }, image());

    const data = JSON.parse(JSON.stringify(await createBackup({ includePhotos: true })));
    await resetDatabase();
    const result = parseBackup(data);
    if (!result.ok) throw new Error(result.error);
    expect(countRows(result.backup)).toMatchObject({
      timerSessions: 1,
      progressPhotos: 1,
      photoFiles: 2,
    });
    expect(backupHasPhotos(result.backup)).toBe(true);
    await restoreBackup(result.backup);

    expect(await listTimerSessions()).toMatchObject([{ note: 'gut', habitId: habit.id }]);
    const settings = await getSettings();
    expect(settings).toMatchObject({
      meditationHabitId: habit.id,
      timerPresets: { focusMinutes: 50 },
      activeTimer: { kind: 'focus' },
    });
    expect(await loadProgressPhoto(photo.id)).toMatchObject({ pose: 'front', bytes: 6 });
    const file = await loadPhotoFile(photo.id, 'full');
    expect(new Uint8Array(file!.data)).toEqual(new Uint8Array([255, 216, 255, 1, 2]));
  });

  it('lässt Fotos auf dem Gerät, wenn die Sicherung keine enthält', async () => {
    const data = JSON.parse(JSON.stringify(await createBackup()));
    const photo = await addProgressPhoto({ date: '2026-11-07', pose: 'side', note: '' }, image());
    const result = parseBackup(data);
    if (!result.ok) throw new Error(result.error);
    expect(backupHasPhotos(result.backup)).toBe(false);
    expect(countRows(result.backup)).not.toHaveProperty('progressPhotos');
    await restoreBackup(result.backup);
    expect(await loadProgressPhoto(photo.id)).not.toBeNull();
    expect(await loadPhotoFile(photo.id, 'thumb')).not.toBeNull();
  });

  it('ersetzt Fotos, wenn die Sicherung welche enthält, und lehnt kaputte Bilddaten ab', async () => {
    const data = JSON.parse(JSON.stringify(await createBackup({ includePhotos: true })));
    await addProgressPhoto({ date: '2026-11-07', pose: 'side', note: '' }, image());
    const result = parseBackup(data);
    if (!result.ok) throw new Error(result.error);
    await restoreBackup(result.backup);
    expect(await listProgressPhotos()).toHaveLength(0);
    expect(await db.photoFiles.count()).toBe(0);

    await addProgressPhoto({ date: '2026-11-07', pose: 'side', note: '' }, image());
    const broken = JSON.parse(JSON.stringify(await createBackup({ includePhotos: true })));
    broken.tables.photoFiles[0].data = 'kein base64!';
    expect(parseBackup(broken)).toMatchObject({ ok: false });
  });

  it('ergänzt Sicherungen aus DB-Version 25', async () => {
    const data = await validBackup();
    data.dbVersion = 25;
    for (const key of ['timerPresets', 'activeTimer', 'focusHabitId', 'meditationHabitId']) {
      delete data.tables.settings[0][key];
    }
    delete data.tables.timerSessions;
    const result = parseBackup(data);
    if (!result.ok) throw new Error(result.error);
    expect(result.backup.tables.settings[0]).toMatchObject({
      timerPresets: TIMER_PRESET_DEFAULTS,
      activeTimer: null,
      focusHabitId: null,
      meditationHabitId: null,
    });
    expect(result.backup.tables.timerSessions).toEqual([]);
  });

  it('ergänzt Sicherungen aus DB-Version 26 und behält gemeldete Erfolge', async () => {
    await updateSettings({
      trainingWeekTarget: 3,
      celebrations: { badges: { workouts: 2 }, goals: { g1: 'once' } },
    });
    const current = await validBackup();
    const restored = parseBackup(current);
    if (!restored.ok) throw new Error(restored.error);
    expect(restored.backup.tables.settings[0]).toMatchObject({
      trainingWeekTarget: 3,
      celebrations: { badges: { workouts: 2 }, goals: { g1: 'once' } },
    });

    const data = await validBackup();
    data.dbVersion = 26;
    delete data.tables.settings[0].trainingWeekTarget;
    delete data.tables.settings[0].celebrations;
    const result = parseBackup(data);
    if (!result.ok) throw new Error(result.error);
    expect(result.backup.tables.settings[0]).toMatchObject({
      trainingWeekTarget: 2,
      celebrations: null,
    });
  });

  it('behält die Farbpalette und ergänzt sie in Sicherungen aus DB-Version 28', async () => {
    await updateSettings({ palette: 'violet' });
    const current = parseBackup(await validBackup());
    if (!current.ok) throw new Error(current.error);
    expect(current.backup.tables.settings[0]).toMatchObject({ palette: 'violet' });

    const data = await validBackup();
    data.dbVersion = 28;
    delete data.tables.settings[0].palette;
    const result = parseBackup(data);
    if (!result.ok) throw new Error(result.error);
    expect(result.backup.tables.settings[0]).toMatchObject({ palette: 'green' });

    data.tables.settings[0].palette = 'pink';
    expect(parseBackup(data).ok).toBe(false);
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
      ...DEFAULT_DASHBOARD_WIDGETS,
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

  it('sichert Trainingsblöcke und den Block im Workout', async () => {
    const plan = await createPlan('Block-Plan');
    const detail = await loadPlanDetail(plan.id);
    const exercise = await createUserExercise(EXERCISE);
    await addPlanExercise(detail!.days[0]!.day.id, exercise);
    const blocks = [newBlock('build', 3, 'b1'), newBlock('deload', 1, 'b2')];
    await setPlanBlocks(plan.id, blocks);
    const today = dayKey(new Date());
    await startPlanBlock(plan.id, 1, today);
    const workout = await startPlanWorkout(detail!.days[0]!.day.id);
    const data = JSON.parse(JSON.stringify(await createBackup()));
    await resetDatabase();

    const result = parseBackup(data);
    if (!result.ok) throw new Error(result.error);
    await restoreBackup(result.backup);
    expect(await db.plans.get(plan.id)).toMatchObject({
      blocks,
      blockProgress: { index: 1, startDate: today },
      blockAdjust: true,
    });
    expect((await db.workouts.get(workout.id))?.block).toMatchObject({ kind: 'deload' });
  });

  it('ergänzt bei Sicherungen aus DB-Version 27 die Blockfelder', async () => {
    await createPlan('Alt');
    const data = JSON.parse(JSON.stringify(await createBackup()));
    data.dbVersion = 27;
    delete data.tables.plans[0].blocks;
    delete data.tables.plans[0].blockProgress;
    delete data.tables.plans[0].blockAdjust;
    data.tables.workouts = [
      {
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        deletedAt: null,
        id: 'w1',
        startedAt: '2026-01-01T00:00:00.000Z',
        endedAt: null,
        notes: '',
        restEndsAt: null,
        planId: null,
        planDayId: null,
      },
    ];

    const result = parseBackup(data);
    if (!result.ok) throw new Error(result.error);
    expect(result.backup.tables.plans[0]).toMatchObject({
      blocks: [],
      blockProgress: null,
      blockAdjust: true,
    });
    expect(result.backup.tables.workouts[0]?.block).toBeNull();
  });

  it('lehnt ungültige Blöcke ab', async () => {
    const plan = await createPlan('Block-Plan');
    await setPlanBlocks(plan.id, [newBlock('build')]);
    const data = JSON.parse(JSON.stringify(await createBackup()));
    data.tables.plans[0].blocks[0].weeks = 0;
    expect(parseBackup(data).ok).toBe(false);
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
