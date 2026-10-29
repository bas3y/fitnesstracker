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
    expect(v3.verno).toBe(3);
    await v3.delete();
  });
});
