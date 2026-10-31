import { dayKey } from '../domain/daily';
import {
  addWater,
  deleteBodyMeasurement,
  getBodyMeasurement,
  getDailyLog,
  listBodyMeasurements,
  listDailyLogs,
  loadBodyWeights,
  setBodyMeasure,
  setCurrentBodyWeight,
  updateDailyLog,
} from './daily';
import { db } from './database';
import { getSettings, updateSettings } from './settings';
import { resetDatabase } from './testUtils';

beforeEach(resetDatabase);

describe('updateDailyLog', () => {
  it('legt je Tag genau einen Eintrag an und ergänzt ihn', async () => {
    await updateDailyLog('2026-10-30', { steps: 5000 });
    await updateDailyLog('2026-10-30', { mood: 4 });

    expect(await db.dailyLogs.count()).toBe(1);
    expect(await getDailyLog('2026-10-30')).toMatchObject({ steps: 5000, mood: 4, energy: null });
  });

  it('sortiert nach Datum', async () => {
    await updateDailyLog('2026-10-30', { steps: 1 });
    await updateDailyLog('2026-10-01', { steps: 2 });
    expect((await listDailyLogs()).map((log) => log.date)).toEqual(['2026-10-01', '2026-10-30']);
  });

  it('lehnt ungültige Werte ab', async () => {
    await expect(updateDailyLog('2026-10-30', { mood: 6 })).rejects.toThrow();
    await expect(updateDailyLog('gestern', { mood: 3 })).rejects.toThrow();
    expect(await db.dailyLogs.count()).toBe(0);
  });
});

describe('addWater', () => {
  it('addiert auch bei gleichzeitigen Aufrufen', async () => {
    await Promise.all([
      addWater('2026-10-30', 250),
      addWater('2026-10-30', 250),
      addWater('2026-10-30', 500),
    ]);
    expect(await db.dailyLogs.count()).toBe(1);
    expect((await getDailyLog('2026-10-30'))?.waterMl).toBe(1000);
  });

  it('fällt nicht unter 0', async () => {
    await addWater('2026-10-30', 250);
    await addWater('2026-10-30', -500);
    expect((await getDailyLog('2026-10-30'))?.waterMl).toBe(0);
  });
});

describe('Körpergewicht', () => {
  it('übernimmt das neueste Gewicht in die Einstellungen', async () => {
    await updateDailyLog('2026-10-30', { weightKg: 80 });
    expect((await getSettings())?.bodyWeightKg).toBe(80);

    // Nachtrag für einen früheren Tag ändert das aktuelle Gewicht nicht
    await updateDailyLog('2026-10-01', { weightKg: 82 });
    expect((await getSettings())?.bodyWeightKg).toBe(80);
  });

  it('fällt beim Leeren auf den vorherigen Eintrag zurück', async () => {
    await updateDailyLog('2026-10-01', { weightKg: 82 });
    await updateDailyLog('2026-10-30', { weightKg: 80 });
    await updateDailyLog('2026-10-30', { weightKg: null });

    expect((await getSettings())?.bodyWeightKg).toBe(82);
    expect(await loadBodyWeights()).toEqual([{ date: '2026-10-01', weightKg: 82 }]);
  });

  it('andere Felder lassen die Einstellungen unberührt', async () => {
    await updateSettings({ bodyWeightKg: 75 });
    await updateDailyLog('2026-10-30', { steps: 100 });
    expect((await getSettings())?.bodyWeightKg).toBe(75);
  });

  it('Gewicht aus den Einstellungen gilt als Eintrag von heute', async () => {
    await setCurrentBodyWeight(81);
    expect((await getDailyLog(dayKey(new Date())))?.weightKg).toBe(81);
    expect((await getSettings())?.bodyWeightKg).toBe(81);

    await setCurrentBodyWeight(null);
    expect((await getDailyLog(dayKey(new Date())))?.weightKg).toBeNull();
    expect((await getSettings())?.bodyWeightKg).toBeNull();
  });
});

describe('Körpermaße', () => {
  it('sammelt Maße eines Tages in einem Eintrag', async () => {
    await setBodyMeasure('2026-10-30', 'waist', 0.85);
    await setBodyMeasure('2026-10-30', 'arm', 0.38);

    expect(await db.bodyMeasurements.count()).toBe(1);
    expect((await getBodyMeasurement('2026-10-30'))?.values).toEqual({ waist: 0.85, arm: 0.38 });
  });

  it('entfernt den Eintrag mit dem letzten Maß', async () => {
    await setBodyMeasure('2026-10-30', 'waist', 0.85);
    await setBodyMeasure('2026-10-30', 'waist', null);
    expect(await getBodyMeasurement('2026-10-30')).toBeUndefined();
  });

  it('legt für ein leeres Maß keinen Eintrag an', async () => {
    await setBodyMeasure('2026-10-30', 'waist', null);
    expect(await db.bodyMeasurements.count()).toBe(0);
  });

  it('löscht per Soft-Delete, derselbe Tag ist danach neu belegbar', async () => {
    await setBodyMeasure('2026-10-30', 'waist', 0.85);
    const entry = await getBodyMeasurement('2026-10-30');
    await deleteBodyMeasurement(entry!.id);

    expect(await listBodyMeasurements()).toEqual([]);
    expect(await db.bodyMeasurements.count()).toBe(1);

    await setBodyMeasure('2026-10-30', 'arm', 0.38);
    expect((await listBodyMeasurements()).map((item) => item.values)).toEqual([{ arm: 0.38 }]);
  });

  it('lehnt unplausible Werte ab', async () => {
    await expect(setBodyMeasure('2026-10-30', 'waist', 85)).rejects.toThrow();
  });
});
