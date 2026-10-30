import Dexie from 'dexie';
import { AppDatabase } from './database';

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
    expect(v7.verno).toBe(7);
    await v7.delete();
  });
});
