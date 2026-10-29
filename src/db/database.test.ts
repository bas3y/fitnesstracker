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
    expect(v2.verno).toBe(2);
    await v2.delete();
  });
});
