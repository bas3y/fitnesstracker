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
    expect(v16.verno).toBe(16);
    await v16.delete();
  });
});
