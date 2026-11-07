import Dexie from 'dexie';
import { AppDatabase } from './database';
import { DEFAULT_DASHBOARD_WIDGETS, DEFAULT_QUICK_ACTIONS } from './types';

describe('AppDatabase-Migration', () => {
  it('Version 2 ergänzt seedVersion und behält bestehende Einstellungen', async () => {
    const name = 'migration-test';
    const v1 = new Dexie(name);
    v1.version(1).stores({ settings: 'id, updatedAt' });
    await v1.table('settings').add({
      id: 'app-settings',
      name: 'Alt',
      weightUnit: 'lb',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      deletedAt: null,
    });
    v1.close();

    const v2 = new AppDatabase(name);
    expect(await v2.settings.get('app-settings')).toMatchObject({
      name: 'Alt',
      weightUnit: 'lb',
      seedVersion: 0,
    });
    expect(await v2.exercises.count()).toBe(0);
    await v2.delete();
  });

  it('Version 3 ergänzt Favorit, Ausblenden und Notiz an bestehenden Übungen', async () => {
    const name = 'migration-test-v3';
    const v2 = new Dexie(name);
    v2.version(1).stores({ settings: 'id, updatedAt' });
    v2.version(2).stores({
      exercises: 'id, builtinKey, source, category, updatedAt',
      foods: 'id, builtinKey, source, category, updatedAt',
    });
    await v2.table('exercises').add({
      id: 'e1',
      source: 'user',
      builtinKey: null,
      name: 'Meine Übung',
      deletedAt: null,
    });
    v2.close();

    const v3 = new AppDatabase(name);
    expect(await v3.exercises.get('e1')).toMatchObject({
      name: 'Meine Übung',
      isFavorite: false,
      hiddenAt: null,
      notes: '',
    });
    await v3.delete();
  });

  it('Version 4 ergänzt Workout-Tabellen, Pausen-Einstellungen und isTimed', async () => {
    const name = 'migration-test-v4';
    const v3 = new Dexie(name);
    v3.version(1).stores({ settings: 'id, updatedAt' });
    v3.version(2).stores({
      exercises: 'id, builtinKey, source, category, updatedAt',
      foods: 'id, builtinKey, source, category, updatedAt',
    });
    v3.version(3).stores({ exercises: 'id, builtinKey, source, category, updatedAt' });
    await v3.table('settings').add({ id: 'app-settings', name: 'Alt', seedVersion: 2 });
    await v3.table('exercises').add({ id: 'e1', source: 'user', name: 'Plank', notes: 'x' });
    v3.close();

    const v4 = new AppDatabase(name);
    expect(await v4.settings.get('app-settings')).toMatchObject({
      name: 'Alt',
      restTimerSeconds: 180,
      restTimerSound: true,
      restTimerVibrate: true,
    });
    expect(await v4.exercises.get('e1')).toMatchObject({ name: 'Plank', isTimed: false });
    expect(await v4.workouts.count()).toBe(0);
    expect(await v4.sets.count()).toBe(0);
    await v4.delete();
  });

  it('Version 5 ergänzt loadType an Übungen und level an Sätzen', async () => {
    const name = 'migration-test-v5';
    const v4 = new Dexie(name);
    v4.version(4).stores({
      settings: 'id, updatedAt',
      exercises: 'id, builtinKey, source, category, updatedAt',
      foods: 'id, builtinKey, source, category, updatedAt',
      workouts: 'id, startedAt, updatedAt',
      workoutExercises: 'id, workoutId, exerciseId, updatedAt',
      sets: 'id, workoutId, workoutExerciseId, updatedAt',
    });
    await v4.table('exercises').add({ id: 'e1', name: 'Beinpresse' });
    await v4.table('sets').add({ id: 's1', workoutId: 'w1', weight: 100, reps: 10 });
    v4.close();

    const v5 = new AppDatabase(name);
    expect(await v5.exercises.get('e1')).toMatchObject({ loadType: 'weight' });
    expect(await v5.sets.get('s1')).toMatchObject({ weight: 100, level: null });
    await v5.delete();
  });

  it('Version 6 ergänzt die Exzentrik an Sätzen', async () => {
    const name = 'migration-test-v6';
    const v5 = new Dexie(name);
    v5.version(5).stores({
      settings: 'id, updatedAt',
      exercises: 'id, builtinKey, source, category, updatedAt',
      foods: 'id, builtinKey, source, category, updatedAt',
      workouts: 'id, startedAt, updatedAt',
      workoutExercises: 'id, workoutId, exerciseId, updatedAt',
      sets: 'id, workoutId, workoutExerciseId, updatedAt',
    });
    await v5.table('sets').add({ id: 's1', workoutId: 'w1', weight: 100, level: null, reps: 10 });
    v5.close();

    const v6 = new AppDatabase(name);
    expect(await v6.sets.get('s1')).toMatchObject({
      weight: 100,
      reps: 10,
      eccentricWeight: null,
      eccentricLevel: null,
    });
    await v6.delete();
  });

  it('Version 7 ergänzt Plantabellen und lässt bestehende Workouts unverändert frei', async () => {
    const name = 'migration-test-v7';
    const v6 = new Dexie(name);
    v6.version(6).stores({
      settings: 'id, updatedAt',
      exercises: 'id, builtinKey, source, category, updatedAt',
      foods: 'id, builtinKey, source, category, updatedAt',
      workouts: 'id, startedAt, updatedAt',
      workoutExercises: 'id, workoutId, exerciseId, updatedAt',
      sets: 'id, workoutId, workoutExerciseId, updatedAt',
    });
    await v6.table('settings').add({ id: 'app-settings', name: 'Alt' });
    await v6.table('workouts').add({ id: 'w1', notes: 'Alt', startedAt: '2026-01-01' });
    await v6.table('workoutExercises').add({ id: 'we1', workoutId: 'w1', exerciseId: 'e1' });
    await v6.table('sets').add({ id: 's1', workoutId: 'w1', weight: 100 });
    v6.close();

    const v7 = new AppDatabase(name);
    expect(await v7.settings.get('app-settings')).toMatchObject({
      name: 'Alt',
      activePlanId: null,
    });
    expect(await v7.workouts.get('w1')).toMatchObject({
      notes: 'Alt',
      planId: null,
      planDayId: null,
    });
    expect(await v7.workoutExercises.get('we1')).toMatchObject({
      exerciseId: 'e1',
      repMin: null,
      repMax: null,
      targetDurationSeconds: null,
      restSeconds: null,
    });
    expect(await v7.sets.get('s1')).toMatchObject({ weight: 100 });
    expect(await v7.plans.count()).toBe(0);
    await v7.delete();
  });

  it('Version 8 nummeriert bestehende Pläne in Anlagereihenfolge', async () => {
    const name = 'migration-test-v8';
    const v7 = new Dexie(name);
    v7.version(7).stores({
      settings: 'id, updatedAt',
      exercises: 'id, builtinKey, source, category, updatedAt',
      foods: 'id, builtinKey, source, category, updatedAt',
      workouts: 'id, startedAt, updatedAt',
      workoutExercises: 'id, workoutId, exerciseId, updatedAt',
      sets: 'id, workoutId, workoutExerciseId, updatedAt',
      plans: 'id, updatedAt',
      planDays: 'id, planId, updatedAt',
      planExercises: 'id, planId, planDayId, exerciseId, updatedAt',
    });
    await v7.table('plans').bulkAdd([
      { id: 'b', name: 'Zweiter', createdAt: '2026-02-01T00:00:00.000Z' },
      { id: 'a', name: 'Erster', createdAt: '2026-01-01T00:00:00.000Z' },
    ]);
    v7.close();

    const v8 = new AppDatabase(name);
    expect(await v8.plans.get('a')).toMatchObject({ name: 'Erster', order: 0 });
    expect(await v8.plans.get('b')).toMatchObject({ name: 'Zweiter', order: 1 });
    await v8.delete();
  });

  it('Version 9 ergänzt Aufwärmsätze an Plan-Übungen und lässt die Ziele unverändert', async () => {
    const name = 'migration-test-v9';
    const v8 = new Dexie(name);
    v8.version(8).stores({
      settings: 'id, updatedAt',
      exercises: 'id, builtinKey, source, category, updatedAt',
      foods: 'id, builtinKey, source, category, updatedAt',
      workouts: 'id, startedAt, updatedAt',
      workoutExercises: 'id, workoutId, exerciseId, updatedAt',
      sets: 'id, workoutId, workoutExerciseId, updatedAt',
      plans: 'id, updatedAt',
      planDays: 'id, planId, updatedAt',
      planExercises: 'id, planId, planDayId, exerciseId, updatedAt',
    });
    await v8.table('planExercises').add({ id: 'pe1', targetSets: 4, repMin: 6, repMax: 10 });
    v8.close();

    const v9 = new AppDatabase(name);
    expect(await v9.planExercises.get('pe1')).toMatchObject({
      targetSets: 4,
      repMin: 6,
      repMax: 10,
      warmupSets: 0,
    });
    await v9.delete();
  });

  it('Version 10 ergänzt die Pausen-Schalter und behält die Einstellungen', async () => {
    const name = 'migration-test-v10';
    const v9 = new Dexie(name);
    v9.version(9).stores({
      settings: 'id, updatedAt',
      exercises: 'id, builtinKey, source, category, updatedAt',
      foods: 'id, builtinKey, source, category, updatedAt',
      workouts: 'id, startedAt, updatedAt',
      workoutExercises: 'id, workoutId, exerciseId, updatedAt',
      sets: 'id, workoutId, workoutExerciseId, updatedAt',
      plans: 'id, updatedAt',
      planDays: 'id, planId, updatedAt',
      planExercises: 'id, planId, planDayId, exerciseId, updatedAt',
    });
    await v9.table('settings').add({ id: 'app-settings', restTimerSeconds: 120 });
    v9.close();

    const v10 = new AppDatabase(name);
    expect(await v10.settings.get('app-settings')).toMatchObject({
      restTimerSeconds: 120,
      restTimerEnabled: true,
      restAnalysisEnabled: false,
    });
    await v10.delete();
  });

  it('Version 11 ergänzt die Dashboard-Widgets und behält die Einstellungen', async () => {
    const name = 'migration-test-v11';
    const v10 = new Dexie(name);
    v10.version(10).stores({
      settings: 'id, updatedAt',
      exercises: 'id, builtinKey, source, category, updatedAt',
      foods: 'id, builtinKey, source, category, updatedAt',
      workouts: 'id, startedAt, updatedAt',
      workoutExercises: 'id, workoutId, exerciseId, updatedAt',
      sets: 'id, workoutId, workoutExerciseId, updatedAt',
      plans: 'id, updatedAt',
      planDays: 'id, planId, updatedAt',
      planExercises: 'id, planId, planDayId, exerciseId, updatedAt',
    });
    await v10.table('settings').add({ id: 'app-settings', name: 'Alex' });
    v10.close();

    // Version 14 stellt danach einmalig auf den neuen Standardaufbau um
    const v11 = new AppDatabase(name);
    expect(await v11.settings.get('app-settings')).toMatchObject({
      name: 'Alex',
      dashboardWidgets: [...DEFAULT_DASHBOARD_WIDGETS],
    });
    await v11.delete();
  });

  it('Version 12 ergänzt Tagesziele und Alltagstabellen und behält die Einstellungen', async () => {
    const name = 'migration-test-v12';
    const v11 = new Dexie(name);
    v11.version(11).stores({
      settings: 'id, updatedAt',
      exercises: 'id, builtinKey, source, category, updatedAt',
      foods: 'id, builtinKey, source, category, updatedAt',
      workouts: 'id, startedAt, updatedAt',
      workoutExercises: 'id, workoutId, exerciseId, updatedAt',
      sets: 'id, workoutId, workoutExerciseId, updatedAt',
      plans: 'id, updatedAt',
      planDays: 'id, planId, updatedAt',
      planExercises: 'id, planId, planDayId, exerciseId, updatedAt',
    });
    await v11.table('settings').add({ id: 'app-settings', name: 'Alex', bodyWeightKg: 80 });
    v11.close();

    const v12 = new AppDatabase(name);
    expect(await v12.settings.get('app-settings')).toMatchObject({
      name: 'Alex',
      bodyWeightKg: 80,
      stepsGoal: 10_000,
      waterGoalMl: 2500,
      sleepGoalSeconds: 8 * 3600,
    });
    expect(await v12.dailyLogs.count()).toBe(0);
    expect(await v12.bodyMeasurements.count()).toBe(0);
    expect(v12.verno).toBeGreaterThanOrEqual(12);
    await v12.delete();
  });

  it('Version 13 ergänzt die Habit-Tabellen und behält vorhandene Daten', async () => {
    const name = 'migration-test-v13';
    const v12 = new Dexie(name);
    v12.version(12).stores({
      settings: 'id, updatedAt',
      exercises: 'id, builtinKey, source, category, updatedAt',
      foods: 'id, builtinKey, source, category, updatedAt',
      workouts: 'id, startedAt, updatedAt',
      workoutExercises: 'id, workoutId, exerciseId, updatedAt',
      sets: 'id, workoutId, workoutExerciseId, updatedAt',
      plans: 'id, updatedAt',
      planDays: 'id, planId, updatedAt',
      planExercises: 'id, planId, planDayId, exerciseId, updatedAt',
      dailyLogs: 'id, date, updatedAt',
      bodyMeasurements: 'id, date, updatedAt',
    });
    await v12.table('dailyLogs').add({ id: 'd1', date: '2026-10-30', steps: 8000 });
    v12.close();

    const v13 = new AppDatabase(name);
    expect(await v13.dailyLogs.get('d1')).toMatchObject({ steps: 8000 });
    expect(await v13.habits.count()).toBe(0);
    expect(await v13.habitChecks.count()).toBe(0);
    expect(v13.verno).toBeGreaterThanOrEqual(13);
    await v13.delete();
  });

  it('Version 14 ergänzt Mengen, Pausen und To-dos und stellt die Startseite um', async () => {
    const name = 'migration-test-v14';
    const v13 = new Dexie(name);
    v13.version(13).stores({
      settings: 'id, updatedAt',
      exercises: 'id, builtinKey, source, category, updatedAt',
      foods: 'id, builtinKey, source, category, updatedAt',
      workouts: 'id, startedAt, updatedAt',
      workoutExercises: 'id, workoutId, exerciseId, updatedAt',
      sets: 'id, workoutId, workoutExerciseId, updatedAt',
      plans: 'id, updatedAt',
      planDays: 'id, planId, updatedAt',
      planExercises: 'id, planId, planDayId, exerciseId, updatedAt',
      dailyLogs: 'id, date, updatedAt',
      bodyMeasurements: 'id, date, updatedAt',
      habits: 'id, updatedAt',
      habitChecks: 'id, habitId, date, updatedAt',
    });
    await v13.table('settings').add({
      id: 'app-settings',
      name: 'Alex',
      dashboardWidgets: ['records', 'daily'],
    });
    await v13.table('habits').add({ id: 'h1', name: 'Lesen', frequency: 'daily', order: 0 });
    await v13.table('habitChecks').add({ id: 'c1', habitId: 'h1', date: '2026-10-30' });
    v13.close();

    const v14 = new AppDatabase(name);
    expect(await v14.habits.get('h1')).toMatchObject({
      name: 'Lesen',
      kind: 'check',
      target: 1,
      unit: '',
      step: 1,
      items: [],
      startDate: null,
      pauses: [],
      archivedAt: null,
    });
    expect(await v14.habitChecks.get('c1')).toMatchObject({ itemId: null, amount: 1 });
    expect(await v14.settings.get('app-settings')).toMatchObject({
      name: 'Alex',
      dashboardWidgets: [...DEFAULT_DASHBOARD_WIDGETS],
      quickActions: [...DEFAULT_QUICK_ACTIONS],
    });
    expect(await v14.todos.count()).toBe(0);
    expect(v14.verno).toBeGreaterThanOrEqual(14);
    await v14.delete();
  });

  it('Version 15 ergänzt Supplements und ihre Einstellungen', async () => {
    const name = 'migration-test-v15';
    const v14 = new Dexie(name);
    v14.version(14).stores({
      settings: 'id, updatedAt',
      exercises: 'id, builtinKey, source, category, updatedAt',
      foods: 'id, builtinKey, source, category, updatedAt',
      workouts: 'id, startedAt, updatedAt',
      workoutExercises: 'id, workoutId, exerciseId, updatedAt',
      sets: 'id, workoutId, workoutExerciseId, updatedAt',
      plans: 'id, updatedAt',
      planDays: 'id, planId, updatedAt',
      planExercises: 'id, planId, planDayId, exerciseId, updatedAt',
      dailyLogs: 'id, date, updatedAt',
      bodyMeasurements: 'id, date, updatedAt',
      habits: 'id, updatedAt',
      habitChecks: 'id, habitId, date, updatedAt',
      todos: 'id, date, updatedAt',
    });
    await v14.table('settings').add({ id: 'app-settings', name: 'Alex', quickActions: ['water'] });
    await v14.table('todos').add({ id: 't1', title: 'Einkaufen', date: '2026-10-30' });
    v14.close();

    const v15 = new AppDatabase(name);
    expect(await v15.todos.get('t1')).toMatchObject({ title: 'Einkaufen' });
    expect(await v15.settings.get('app-settings')).toMatchObject({
      name: 'Alex',
      quickActions: ['water'],
      supplementLowStockDays: 7,
      supplementRemindersEnabled: true,
      supplementNotificationsEnabled: false,
    });
    expect(await v15.supplements.count()).toBe(0);
    expect(await v15.supplementIntakes.count()).toBe(0);
    expect(v15.verno).toBeGreaterThanOrEqual(15);
    await v15.delete();
  });

  it('Version 16 ergänzt Ernährung, Felder an Lebensmitteln und die Ernährungsziele', async () => {
    const name = 'migration-test-v16';
    const v15 = new Dexie(name);
    v15.version(15).stores({
      settings: 'id, updatedAt',
      exercises: 'id, builtinKey, source, category, updatedAt',
      foods: 'id, builtinKey, source, category, updatedAt',
      workouts: 'id, startedAt, updatedAt',
      workoutExercises: 'id, workoutId, exerciseId, updatedAt',
      sets: 'id, workoutId, workoutExerciseId, updatedAt',
      plans: 'id, updatedAt',
      planDays: 'id, planId, updatedAt',
      planExercises: 'id, planId, planDayId, exerciseId, updatedAt',
      dailyLogs: 'id, date, updatedAt',
      bodyMeasurements: 'id, date, updatedAt',
      habits: 'id, updatedAt',
      habitChecks: 'id, habitId, date, updatedAt',
      todos: 'id, date, updatedAt',
      supplements: 'id, updatedAt',
      supplementIntakes: 'id, supplementId, date, updatedAt',
    });
    await v15.table('settings').add({ id: 'app-settings', name: 'Alex', stepsGoal: 8000 });
    await v15.table('foods').add({ id: 'f1', source: 'user', name: 'Mein Müsli', kcal: 380 });
    v15.close();

    const v16 = new AppDatabase(name);
    expect(await v16.foods.get('f1')).toMatchObject({
      name: 'Mein Müsli',
      kcal: 380,
      isFavorite: false,
      hiddenAt: null,
      recipe: null,
    });
    expect(await v16.settings.get('app-settings')).toMatchObject({
      name: 'Alex',
      stepsGoal: 8000,
      nutritionGoals: {
        training: { kcal: 2500, protein: 150, carbs: null, fat: null },
        rest: { kcal: 2200, protein: 150, carbs: null, fat: null },
      },
    });
    expect(await v16.mealEntries.count()).toBe(0);
    expect(await v16.savedMeals.count()).toBe(0);
    expect(v16.verno).toBeGreaterThanOrEqual(16);
    await v16.delete();
  });

  it('Version 17 ergänzt Ausdauer, Ausrüstung und die Kacheln der Trainingsseite', async () => {
    const name = 'migration-test-v17';
    const v16 = new Dexie(name);
    v16.version(16).stores({
      settings: 'id, updatedAt',
      exercises: 'id, builtinKey, source, category, updatedAt',
      foods: 'id, builtinKey, source, category, updatedAt',
      workouts: 'id, startedAt, updatedAt',
      workoutExercises: 'id, workoutId, exerciseId, updatedAt',
      sets: 'id, workoutId, workoutExerciseId, updatedAt',
      plans: 'id, updatedAt',
      planDays: 'id, planId, updatedAt',
      planExercises: 'id, planId, planDayId, exerciseId, updatedAt',
      dailyLogs: 'id, date, updatedAt',
      bodyMeasurements: 'id, date, updatedAt',
      habits: 'id, updatedAt',
      habitChecks: 'id, habitId, date, updatedAt',
      todos: 'id, date, updatedAt',
      supplements: 'id, updatedAt',
      supplementIntakes: 'id, supplementId, date, updatedAt',
      mealEntries: 'id, date, foodId, updatedAt',
      savedMeals: 'id, updatedAt',
    });
    await v16.table('settings').add({ id: 'app-settings', name: 'Alex', distanceUnit: 'mi' });
    await v16.table('workouts').add({ id: 'w1', startedAt: '2026-11-01T10:00:00.000Z' });
    v16.close();

    const v17 = new AppDatabase(name);
    expect(await v17.settings.get('app-settings')).toMatchObject({
      name: 'Alex',
      distanceUnit: 'mi',
      trainingTiles: ['run', 'ride', 'swim', 'hike', 'mobility', 'other'],
    });
    expect(await v17.workouts.get('w1')).toMatchObject({ startedAt: '2026-11-01T10:00:00.000Z' });
    expect(await v17.enduranceSessions.count()).toBe(0);
    expect(await v17.gear.count()).toBe(0);
    expect(v17.verno).toBeGreaterThanOrEqual(17);
    await v17.delete();
  });

  it('Version 18 ergänzt Verläufe und Pulswerte, Einheiten bleiben', async () => {
    const name = 'migration-test-v18';
    const v17 = new Dexie(name);
    v17.version(17).stores({
      settings: 'id, updatedAt',
      exercises: 'id, builtinKey, source, category, updatedAt',
      foods: 'id, builtinKey, source, category, updatedAt',
      workouts: 'id, startedAt, updatedAt',
      workoutExercises: 'id, workoutId, exerciseId, updatedAt',
      sets: 'id, workoutId, workoutExerciseId, updatedAt',
      plans: 'id, updatedAt',
      planDays: 'id, planId, updatedAt',
      planExercises: 'id, planId, planDayId, exerciseId, updatedAt',
      dailyLogs: 'id, date, updatedAt',
      bodyMeasurements: 'id, date, updatedAt',
      habits: 'id, updatedAt',
      habitChecks: 'id, habitId, date, updatedAt',
      todos: 'id, date, updatedAt',
      supplements: 'id, updatedAt',
      supplementIntakes: 'id, supplementId, date, updatedAt',
      mealEntries: 'id, date, foodId, updatedAt',
      savedMeals: 'id, updatedAt',
      enduranceSessions: 'id, sport, startedAt, gearId, updatedAt',
      gear: 'id, updatedAt',
    });
    await v17.table('settings').add({ id: 'app-settings', name: 'Alex', trainingTiles: ['run'] });
    await v17.table('enduranceSessions').add({ id: 'e1', sport: 'run', distanceMeters: 5000 });
    v17.close();

    const v18 = new AppDatabase(name);
    expect(await v18.settings.get('app-settings')).toMatchObject({
      name: 'Alex',
      trainingTiles: ['run'],
      maxHeartRate: null,
      restingHeartRate: null,
    });
    expect(await v18.enduranceSessions.get('e1')).toMatchObject({ distanceMeters: 5000 });
    expect(await v18.enduranceTracks.count()).toBe(0);
    expect(v18.verno).toBeGreaterThanOrEqual(18);
    await v18.delete();
  });

  it('Version 19 ergänzt Gesundheitswerte an Tageseinträgen, Werte bleiben', async () => {
    const name = 'migration-test-v19';
    const v18 = new Dexie(name);
    v18.version(18).stores({
      settings: 'id, updatedAt',
      exercises: 'id, builtinKey, source, category, updatedAt',
      foods: 'id, builtinKey, source, category, updatedAt',
      workouts: 'id, startedAt, updatedAt',
      workoutExercises: 'id, workoutId, exerciseId, updatedAt',
      sets: 'id, workoutId, workoutExerciseId, updatedAt',
      plans: 'id, updatedAt',
      planDays: 'id, planId, updatedAt',
      planExercises: 'id, planId, planDayId, exerciseId, updatedAt',
      dailyLogs: 'id, date, updatedAt',
      bodyMeasurements: 'id, date, updatedAt',
      habits: 'id, updatedAt',
      habitChecks: 'id, habitId, date, updatedAt',
      todos: 'id, date, updatedAt',
      supplements: 'id, updatedAt',
      supplementIntakes: 'id, supplementId, date, updatedAt',
      mealEntries: 'id, date, foodId, updatedAt',
      savedMeals: 'id, updatedAt',
      enduranceSessions: 'id, sport, startedAt, gearId, updatedAt',
      gear: 'id, updatedAt',
      enduranceTracks: 'id, sessionId, updatedAt',
    });
    await v18
      .table('dailyLogs')
      .add({ id: 'd1', date: '2026-11-01', steps: 8000, sleepSeconds: 25_200, weightKg: 80 });
    v18.close();

    const v19 = new AppDatabase(name);
    expect(await v19.dailyLogs.get('d1')).toMatchObject({
      steps: 8000,
      sleepSeconds: 25_200,
      weightKg: 80,
      restingHeartRate: null,
      hrvMs: null,
      sleepPhases: null,
      importedFields: [],
    });
    expect(v19.verno).toBeGreaterThanOrEqual(19);
    await v19.delete();
  });

  it('Version 20 berechnet Bestzeiten und Puls aus vorhandenen Verläufen', async () => {
    const name = 'migration-test-v20';
    const v19 = new Dexie(name);
    v19.version(19).stores({
      settings: 'id, updatedAt',
      exercises: 'id, builtinKey, source, category, updatedAt',
      foods: 'id, builtinKey, source, category, updatedAt',
      workouts: 'id, startedAt, updatedAt',
      workoutExercises: 'id, workoutId, exerciseId, updatedAt',
      sets: 'id, workoutId, workoutExerciseId, updatedAt',
      plans: 'id, updatedAt',
      planDays: 'id, planId, updatedAt',
      planExercises: 'id, planId, planDayId, exerciseId, updatedAt',
      dailyLogs: 'id, date, updatedAt',
      bodyMeasurements: 'id, date, updatedAt',
      habits: 'id, updatedAt',
      habitChecks: 'id, habitId, date, updatedAt',
      todos: 'id, date, updatedAt',
      supplements: 'id, updatedAt',
      supplementIntakes: 'id, supplementId, date, updatedAt',
      mealEntries: 'id, date, foodId, updatedAt',
      savedMeals: 'id, updatedAt',
      enduranceSessions: 'id, sport, startedAt, gearId, updatedAt',
      gear: 'id, updatedAt',
      enduranceTracks: 'id, sessionId, updatedAt',
    });
    await v19.table('settings').add({ id: 'app-settings', name: 'Alex' });
    await v19.table('enduranceSessions').bulkAdd([
      { id: 'e1', sport: 'run', distanceMeters: 2000, deletedAt: null },
      { id: 'e2', sport: 'run', distanceMeters: 5000, deletedAt: null },
    ]);
    await v19.table('enduranceTracks').add({
      id: 't1',
      sessionId: 'e1',
      deletedAt: null,
      time: [0, 300, 600],
      distance: [0, 1000, 2000],
      heartRate: [140, 150, null],
      altitude: [],
      route: [],
      laps: [],
    });
    v19.close();

    const v20 = new AppDatabase(name);
    expect(await v20.settings.get('app-settings')).toMatchObject({
      name: 'Alex',
      addBurnedCalories: false,
    });
    expect(await v20.enduranceSessions.get('e1')).toMatchObject({
      distanceMeters: 2000,
      trackSummary: {
        bestEfforts: [{ meters: 1000, seconds: 300 }],
        heartRateSeconds: [
          [140, 30],
          [150, 30],
        ],
      },
    });
    expect(await v20.enduranceSessions.get('e2')).toMatchObject({ trackSummary: null });
    expect(v20.verno).toBeGreaterThanOrEqual(20);
    await v20.delete();
  });

  it('Version 21 ergänzt Protein ohne Lebensmittel und blendet den Willkommens-Hinweis aus', async () => {
    const name = 'migration-test-v21';
    const v20 = new Dexie(name);
    v20.version(20).stores({
      settings: 'id, updatedAt',
      exercises: 'id, builtinKey, source, category, updatedAt',
      foods: 'id, builtinKey, source, category, updatedAt',
      workouts: 'id, startedAt, updatedAt',
      workoutExercises: 'id, workoutId, exerciseId, updatedAt',
      sets: 'id, workoutId, workoutExerciseId, updatedAt',
      plans: 'id, updatedAt',
      planDays: 'id, planId, updatedAt',
      planExercises: 'id, planId, planDayId, exerciseId, updatedAt',
      dailyLogs: 'id, date, updatedAt',
      bodyMeasurements: 'id, date, updatedAt',
      habits: 'id, updatedAt',
      habitChecks: 'id, habitId, date, updatedAt',
      todos: 'id, date, updatedAt',
      supplements: 'id, updatedAt',
      supplementIntakes: 'id, supplementId, date, updatedAt',
      mealEntries: 'id, date, foodId, updatedAt',
      savedMeals: 'id, updatedAt',
      enduranceSessions: 'id, sport, startedAt, gearId, updatedAt',
      gear: 'id, updatedAt',
      enduranceTracks: 'id, sessionId, updatedAt',
    });
    await v20.table('settings').add({ id: 'app-settings', name: 'Alex', addBurnedCalories: true });
    await v20.table('dailyLogs').add({ id: 'd1', date: '2026-11-01', waterMl: 500 });
    v20.close();

    const v21 = new AppDatabase(name);
    expect(await v21.settings.get('app-settings')).toMatchObject({
      name: 'Alex',
      addBurnedCalories: true,
      proteinOnly: false,
      welcomeDismissed: true,
    });
    expect(await v21.dailyLogs.get('d1')).toMatchObject({ waterMl: 500, proteinGrams: null });
    expect(v21.verno).toBeGreaterThanOrEqual(21);
    await v21.delete();
  });

  it('Version 22 ergänzt den Strichcode an Lebensmitteln (mit Index)', async () => {
    const name = 'migration-test-v22';
    const v21 = new Dexie(name);
    v21.version(21).stores({
      settings: 'id, updatedAt',
      exercises: 'id, builtinKey, source, category, updatedAt',
      foods: 'id, builtinKey, source, category, updatedAt',
      workouts: 'id, startedAt, updatedAt',
      workoutExercises: 'id, workoutId, exerciseId, updatedAt',
      sets: 'id, workoutId, workoutExerciseId, updatedAt',
      plans: 'id, updatedAt',
      planDays: 'id, planId, updatedAt',
      planExercises: 'id, planId, planDayId, exerciseId, updatedAt',
      dailyLogs: 'id, date, updatedAt',
      bodyMeasurements: 'id, date, updatedAt',
      habits: 'id, updatedAt',
      habitChecks: 'id, habitId, date, updatedAt',
      todos: 'id, date, updatedAt',
      supplements: 'id, updatedAt',
      supplementIntakes: 'id, supplementId, date, updatedAt',
      mealEntries: 'id, date, foodId, updatedAt',
      savedMeals: 'id, updatedAt',
      enduranceSessions: 'id, sport, startedAt, gearId, updatedAt',
      gear: 'id, updatedAt',
      enduranceTracks: 'id, sessionId, updatedAt',
    });
    await v21.table('foods').add({ id: 'f1', name: 'Quark', source: 'user', isFavorite: true });
    v21.close();

    const v22 = new AppDatabase(name);
    expect(await v22.foods.get('f1')).toMatchObject({
      name: 'Quark',
      isFavorite: true,
      barcode: null,
    });
    await v22.foods.update('f1', { barcode: '4006381333931' });
    expect(await v22.foods.where('barcode').equals('4006381333931').count()).toBe(1);
    expect(v22.verno).toBeGreaterThanOrEqual(22);
    await v22.delete();
  });

  it('Version 23 ergänzt die Tabelle für Ziele und behält bestehende Daten', async () => {
    const name = 'migration-test-v23';
    const v22 = new Dexie(name);
    v22.version(22).stores({
      settings: 'id, updatedAt',
      exercises: 'id, builtinKey, source, category, updatedAt',
      foods: 'id, builtinKey, source, category, barcode, updatedAt',
      workouts: 'id, startedAt, updatedAt',
      workoutExercises: 'id, workoutId, exerciseId, updatedAt',
      sets: 'id, workoutId, workoutExerciseId, updatedAt',
      plans: 'id, updatedAt',
      planDays: 'id, planId, updatedAt',
      planExercises: 'id, planId, planDayId, exerciseId, updatedAt',
      dailyLogs: 'id, date, updatedAt',
      bodyMeasurements: 'id, date, updatedAt',
      habits: 'id, updatedAt',
      habitChecks: 'id, habitId, date, updatedAt',
      todos: 'id, date, updatedAt',
      supplements: 'id, updatedAt',
      supplementIntakes: 'id, supplementId, date, updatedAt',
      mealEntries: 'id, date, foodId, updatedAt',
      savedMeals: 'id, updatedAt',
      enduranceSessions: 'id, sport, startedAt, gearId, updatedAt',
      gear: 'id, updatedAt',
      enduranceTracks: 'id, sessionId, updatedAt',
    });
    await v22.table('dailyLogs').add({ id: 'd1', date: '2026-11-01', weightKg: 82 });
    v22.close();

    const v23 = new AppDatabase(name);
    expect(await v23.dailyLogs.get('d1')).toMatchObject({ weightKg: 82 });
    expect(await v23.goals.count()).toBe(0);
    expect(v23.verno).toBeGreaterThanOrEqual(23);
    await v23.delete();
  });

  it('Version 24 ergänzt Ziele um Gewohnheiten/eigene Ziele und die Tabelle für Einträge', async () => {
    const name = 'migration-test-v24';
    const v23 = new Dexie(name);
    v23.version(23).stores({
      settings: 'id, updatedAt',
      exercises: 'id, builtinKey, source, category, updatedAt',
      foods: 'id, builtinKey, source, category, barcode, updatedAt',
      workouts: 'id, startedAt, updatedAt',
      workoutExercises: 'id, workoutId, exerciseId, updatedAt',
      sets: 'id, workoutId, workoutExerciseId, updatedAt',
      plans: 'id, updatedAt',
      planDays: 'id, planId, updatedAt',
      planExercises: 'id, planId, planDayId, exerciseId, updatedAt',
      dailyLogs: 'id, date, updatedAt',
      bodyMeasurements: 'id, date, updatedAt',
      habits: 'id, updatedAt',
      habitChecks: 'id, habitId, date, updatedAt',
      todos: 'id, date, updatedAt',
      supplements: 'id, updatedAt',
      supplementIntakes: 'id, supplementId, date, updatedAt',
      mealEntries: 'id, date, foodId, updatedAt',
      savedMeals: 'id, updatedAt',
      enduranceSessions: 'id, sport, startedAt, gearId, updatedAt',
      gear: 'id, updatedAt',
      enduranceTracks: 'id, sessionId, updatedAt',
      goals: 'id, updatedAt',
    });
    await v23.table('goals').add({
      id: 'g1',
      kind: 'bodyWeight',
      title: '',
      target: 85,
      startDate: '2026-11-01',
      deadline: null,
      startValue: 90,
      totalMetric: null,
      period: null,
    });
    v23.close();

    const v24 = new AppDatabase(name);
    expect(await v24.goals.get('g1')).toMatchObject({
      target: 85,
      startValue: 90,
      habitId: null,
      habitMetric: null,
      customType: null,
      unit: '',
      icon: '',
    });
    expect(await v24.goalEntries.where('goalId').equals('g1').count()).toBe(0);
    expect(v24.verno).toBeGreaterThanOrEqual(24);
    await v24.delete();
  });

  it('Version 25 ergänzt Journal, Bücher und die Lese-Gewohnheit in den Einstellungen', async () => {
    const name = 'migration-test-v25';
    const v24 = new Dexie(name);
    v24.version(24).stores({
      settings: 'id, updatedAt',
      exercises: 'id, builtinKey, source, category, updatedAt',
      foods: 'id, builtinKey, source, category, barcode, updatedAt',
      workouts: 'id, startedAt, updatedAt',
      workoutExercises: 'id, workoutId, exerciseId, updatedAt',
      sets: 'id, workoutId, workoutExerciseId, updatedAt',
      plans: 'id, updatedAt',
      planDays: 'id, planId, updatedAt',
      planExercises: 'id, planId, planDayId, exerciseId, updatedAt',
      dailyLogs: 'id, date, updatedAt',
      bodyMeasurements: 'id, date, updatedAt',
      habits: 'id, updatedAt',
      habitChecks: 'id, habitId, date, updatedAt',
      todos: 'id, date, updatedAt',
      supplements: 'id, updatedAt',
      supplementIntakes: 'id, supplementId, date, updatedAt',
      mealEntries: 'id, date, foodId, updatedAt',
      savedMeals: 'id, updatedAt',
      enduranceSessions: 'id, sport, startedAt, gearId, updatedAt',
      gear: 'id, updatedAt',
      enduranceTracks: 'id, sessionId, updatedAt',
      goals: 'id, updatedAt',
      goalEntries: 'id, goalId, updatedAt',
    });
    await v24.table('settings').add({ id: 'app-settings', name: 'Niklas', proteinOnly: true });
    await v24.table('goalEntries').add({ id: 'e1', goalId: 'g1', date: '2026-11-07', amount: 2 });
    v24.close();

    const v25 = new AppDatabase(name);
    expect(await v25.settings.get('app-settings')).toMatchObject({
      name: 'Niklas',
      proteinOnly: true,
      readingHabitId: null,
    });
    expect(await v25.goalEntries.get('e1')).toMatchObject({ amount: 2 });
    expect(
      await v25.journalEntries.where('[kind+date]').equals(['day', '2026-11-07']).count(),
    ).toBe(0);
    expect(await v25.books.count()).toBe(0);
    expect(await v25.readingLogs.where('bookId').equals('x').count()).toBe(0);
    expect(await v25.bookNotes.count()).toBe(0);
    expect(await v25.journalPrompts.count()).toBe(0);
    expect(v25.verno).toBeGreaterThanOrEqual(25);
    await v25.delete();
  });

  it('Version 26 ergänzt Timer und Fortschrittsfotos, Einstellungen und Bücher bleiben', async () => {
    const name = 'migration-test-v26';
    const v25 = new Dexie(name);
    v25.version(25).stores({
      settings: 'id, updatedAt',
      exercises: 'id, builtinKey, source, category, updatedAt',
      foods: 'id, builtinKey, source, category, barcode, updatedAt',
      workouts: 'id, startedAt, updatedAt',
      workoutExercises: 'id, workoutId, exerciseId, updatedAt',
      sets: 'id, workoutId, workoutExerciseId, updatedAt',
      plans: 'id, updatedAt',
      planDays: 'id, planId, updatedAt',
      planExercises: 'id, planId, planDayId, exerciseId, updatedAt',
      dailyLogs: 'id, date, updatedAt',
      bodyMeasurements: 'id, date, updatedAt',
      habits: 'id, updatedAt',
      habitChecks: 'id, habitId, date, updatedAt',
      todos: 'id, date, updatedAt',
      supplements: 'id, updatedAt',
      supplementIntakes: 'id, supplementId, date, updatedAt',
      mealEntries: 'id, date, foodId, updatedAt',
      savedMeals: 'id, updatedAt',
      enduranceSessions: 'id, sport, startedAt, gearId, updatedAt',
      gear: 'id, updatedAt',
      enduranceTracks: 'id, sessionId, updatedAt',
      goals: 'id, updatedAt',
      goalEntries: 'id, goalId, updatedAt',
      journalPrompts: 'id, updatedAt',
      journalEntries: 'id, [kind+date], updatedAt',
      books: 'id, updatedAt',
      readingLogs: 'id, bookId, date, updatedAt',
      bookNotes: 'id, bookId, updatedAt',
    });
    await v25.table('settings').add({ id: 'app-settings', name: 'Niklas', readingHabitId: 'h1' });
    await v25.table('books').add({ id: 'b1', title: 'Dune' });
    v25.close();

    const v26 = new AppDatabase(name);
    expect(await v26.settings.get('app-settings')).toMatchObject({
      name: 'Niklas',
      readingHabitId: 'h1',
      timerPresets: { focusMinutes: 25, breakMinutes: 5, rounds: 4, meditationMinutes: 10 },
      activeTimer: null,
      focusHabitId: null,
      meditationHabitId: null,
    });
    expect(await v26.books.get('b1')).toMatchObject({ title: 'Dune' });
    expect(await v26.timerSessions.where('date').equals('2026-11-07').count()).toBe(0);
    expect(await v26.progressPhotos.where('date').equals('2026-11-07').count()).toBe(0);
    expect(await v26.photoFiles.where('[photoId+variant]').equals(['p', 'full']).count()).toBe(0);
    expect(v26.verno).toBeGreaterThanOrEqual(26);
    await v26.delete();
  });

  it('Version 27 ergänzt Trainingsserie und Erfolge, Einstellungen bleiben', async () => {
    const name = 'migration-test-v27';
    const v26 = new Dexie(name);
    v26.version(26).stores({
      settings: 'id, updatedAt',
      exercises: 'id, builtinKey, source, category, updatedAt',
      foods: 'id, builtinKey, source, category, barcode, updatedAt',
      workouts: 'id, startedAt, updatedAt',
      workoutExercises: 'id, workoutId, exerciseId, updatedAt',
      sets: 'id, workoutId, workoutExerciseId, updatedAt',
      plans: 'id, updatedAt',
      planDays: 'id, planId, updatedAt',
      planExercises: 'id, planId, planDayId, exerciseId, updatedAt',
      dailyLogs: 'id, date, updatedAt',
      bodyMeasurements: 'id, date, updatedAt',
      habits: 'id, updatedAt',
      habitChecks: 'id, habitId, date, updatedAt',
      todos: 'id, date, updatedAt',
      supplements: 'id, updatedAt',
      supplementIntakes: 'id, supplementId, date, updatedAt',
      mealEntries: 'id, date, foodId, updatedAt',
      savedMeals: 'id, updatedAt',
      enduranceSessions: 'id, sport, startedAt, gearId, updatedAt',
      gear: 'id, updatedAt',
      enduranceTracks: 'id, sessionId, updatedAt',
      goals: 'id, updatedAt',
      goalEntries: 'id, goalId, updatedAt',
      journalPrompts: 'id, updatedAt',
      journalEntries: 'id, [kind+date], updatedAt',
      books: 'id, updatedAt',
      readingLogs: 'id, bookId, date, updatedAt',
      bookNotes: 'id, bookId, updatedAt',
      timerSessions: 'id, kind, date, updatedAt',
      progressPhotos: 'id, date, updatedAt',
      photoFiles: 'id, [photoId+variant], updatedAt',
    });
    await v26.table('settings').add({ id: 'app-settings', name: 'Niklas', focusHabitId: 'h1' });
    await v26.table('timerSessions').add({ id: 't1', kind: 'focus', date: '2026-11-07' });
    v26.close();

    const v27 = new AppDatabase(name);
    expect(await v27.settings.get('app-settings')).toMatchObject({
      name: 'Niklas',
      focusHabitId: 'h1',
      trainingWeekTarget: 2,
      celebrations: null,
    });
    expect(await v27.timerSessions.get('t1')).toMatchObject({ kind: 'focus' });
    expect(v27.verno).toBeGreaterThanOrEqual(27);
    await v27.delete();
  });

  it('Version 28 ergänzt Trainingsblöcke an Plänen und Workouts, Daten bleiben', async () => {
    const name = 'migration-test-v28';
    const v27 = new Dexie(name);
    v27.version(27).stores({
      settings: 'id, updatedAt',
      exercises: 'id, builtinKey, source, category, updatedAt',
      foods: 'id, builtinKey, source, category, barcode, updatedAt',
      workouts: 'id, startedAt, updatedAt',
      workoutExercises: 'id, workoutId, exerciseId, updatedAt',
      sets: 'id, workoutId, workoutExerciseId, updatedAt',
      plans: 'id, updatedAt',
      planDays: 'id, planId, updatedAt',
      planExercises: 'id, planId, planDayId, exerciseId, updatedAt',
      dailyLogs: 'id, date, updatedAt',
      bodyMeasurements: 'id, date, updatedAt',
      habits: 'id, updatedAt',
      habitChecks: 'id, habitId, date, updatedAt',
      todos: 'id, date, updatedAt',
      supplements: 'id, updatedAt',
      supplementIntakes: 'id, supplementId, date, updatedAt',
      mealEntries: 'id, date, foodId, updatedAt',
      savedMeals: 'id, updatedAt',
      enduranceSessions: 'id, sport, startedAt, gearId, updatedAt',
      gear: 'id, updatedAt',
      enduranceTracks: 'id, sessionId, updatedAt',
      goals: 'id, updatedAt',
      goalEntries: 'id, goalId, updatedAt',
      journalPrompts: 'id, updatedAt',
      journalEntries: 'id, [kind+date], updatedAt',
      books: 'id, updatedAt',
      readingLogs: 'id, bookId, date, updatedAt',
      bookNotes: 'id, bookId, updatedAt',
      timerSessions: 'id, kind, date, updatedAt',
      progressPhotos: 'id, date, updatedAt',
      photoFiles: 'id, [photoId+variant], updatedAt',
    });
    await v27.table('plans').add({ id: 'p1', name: 'PPL', schedule: 'rotation', order: 0 });
    await v27
      .table('workouts')
      .add({ id: 'w1', startedAt: '2026-11-01T10:00:00.000Z', planId: 'p1' });
    v27.close();

    const v28 = new AppDatabase(name);
    expect(await v28.plans.get('p1')).toMatchObject({
      name: 'PPL',
      blocks: [],
      blockProgress: null,
      blockAdjust: true,
    });
    expect(await v28.workouts.get('w1')).toMatchObject({ planId: 'p1', block: null });
    expect(v28.verno).toBe(28);
    await v28.delete();
  });
});
