import { dayKey, type DatedWeight } from '../domain/daily';
import { db } from './database';
import { create, softDelete, update } from './repository';
import {
  bodyMeasureSchema,
  dailyLogValuesSchema,
  dayKeySchema,
  MAX_WATER_ML,
  type DailyLogValues,
} from './schemas';
import { ensureSettings, updateSettings } from './settings';
import type { BodyMeasure, BodyMeasurement, DailyLog, DayKey } from './types';

const isActive = (entity: { deletedAt: string | null }) => entity.deletedAt === null;

const EMPTY_DAILY_VALUES: DailyLogValues = {
  steps: null,
  waterMl: null,
  sleepSeconds: null,
  sleepQuality: null,
  weightKg: null,
  mood: null,
  energy: null,
};

export function getDailyLog(date: DayKey): Promise<DailyLog | undefined> {
  return db.dailyLogs.where('date').equals(date).filter(isActive).first();
}

/** Älteste zuerst */
export function listDailyLogs(): Promise<DailyLog[]> {
  return db.dailyLogs.orderBy('date').filter(isActive).toArray();
}

/** Alle eingetragenen Gewichte, älteste zuerst */
export async function loadBodyWeights(): Promise<DatedWeight[]> {
  const logs = await listDailyLogs();
  return logs.flatMap(({ date, weightKg }) => (weightKg === null ? [] : [{ date, weightKg }]));
}

async function writeDailyLog(date: DayKey, values: Partial<DailyLogValues>): Promise<void> {
  const existing = await getDailyLog(date);
  if (existing) await update(db.dailyLogs, existing.id, values);
  else await create(db.dailyLogs, { ...EMPTY_DAILY_VALUES, ...values, date });
}

/** Das neueste Gewicht ist zugleich das aktuelle Körpergewicht */
async function syncBodyWeight(): Promise<void> {
  const latest = (await loadBodyWeights()).at(-1);
  if (!latest) return;
  const settings = await ensureSettings();
  if (settings.bodyWeightKg !== latest.weightKg) {
    await updateSettings({ bodyWeightKg: latest.weightKg });
  }
}

/** Legt den Tageseintrag bei Bedarf an */
export async function updateDailyLog(
  date: DayKey,
  changes: Partial<DailyLogValues>,
): Promise<void> {
  const key = dayKeySchema.parse(date);
  const values = dailyLogValuesSchema.partial().parse(changes);
  await db.transaction('rw', db.dailyLogs, db.settings, async () => {
    await writeDailyLog(key, values);
    if ('weightKg' in values) await syncBodyWeight();
  });
}

/** Addiert im selben Schreibvorgang, schnelles Tippen geht also nicht verloren */
export async function addWater(date: DayKey, ml: number): Promise<void> {
  const key = dayKeySchema.parse(date);
  await db.transaction('rw', db.dailyLogs, async () => {
    const current = (await getDailyLog(key))?.waterMl ?? 0;
    const waterMl = Math.min(MAX_WATER_ML, Math.max(0, current + ml));
    await writeDailyLog(key, dailyLogValuesSchema.partial().parse({ waterMl }));
  });
}

/** Körpergewicht aus den Einstellungen: gilt als Eintrag von heute */
export async function setCurrentBodyWeight(weightKg: number | null): Promise<void> {
  await updateDailyLog(dayKey(new Date()), { weightKg });
  if (weightKg === null) await updateSettings({ bodyWeightKg: null });
}

export function getBodyMeasurement(date: DayKey): Promise<BodyMeasurement | undefined> {
  return db.bodyMeasurements.where('date').equals(date).filter(isActive).first();
}

/** Älteste zuerst */
export function listBodyMeasurements(): Promise<BodyMeasurement[]> {
  return db.bodyMeasurements.orderBy('date').filter(isActive).toArray();
}

/** Ein Maß setzen oder mit `null` entfernen; ein leerer Eintrag verschwindet */
export async function setBodyMeasure(
  date: DayKey,
  measure: BodyMeasure,
  meters: number | null,
): Promise<void> {
  const key = dayKeySchema.parse(date);
  const value = bodyMeasureSchema.nullable().parse(meters);
  await db.transaction('rw', db.bodyMeasurements, async () => {
    const existing = await getBodyMeasurement(key);
    const values = { ...existing?.values };
    if (value === null) delete values[measure];
    else values[measure] = value;

    if (!existing) {
      if (value !== null) await create(db.bodyMeasurements, { date: key, values });
    } else if (Object.keys(values).length === 0) {
      await softDelete(db.bodyMeasurements, existing.id);
    } else {
      await update(db.bodyMeasurements, existing.id, { values });
    }
  });
}

export function deleteBodyMeasurement(id: string): Promise<void> {
  return softDelete(db.bodyMeasurements, id);
}
