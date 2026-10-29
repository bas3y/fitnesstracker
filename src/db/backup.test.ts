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
      expect(countRows(result.backup)).toEqual({ settings: 1, exercises: 0, foods: 0 });
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
      source: 'user',
      builtinKey: null,
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

describe('backupFileName', () => {
  it('enthält das Datum', () => {
    expect(backupFileName(new Date(2026, 0, 5))).toBe('fitnesstracker-backup-2026-01-05.json');
  });
});
