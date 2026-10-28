import { db } from './database';
import { create, update, type EntityChanges, type NewEntity } from './repository';
import type { Settings } from './types';

// Feste ID statt UUID: Es gibt genau einen Einstellungs-Datensatz pro Gerät
export const SETTINGS_ID = 'app-settings';

export const DEFAULT_SETTINGS: NewEntity<Settings> = {
  name: '',
  weightUnit: 'kg',
  distanceUnit: 'km',
  bodyWeightKg: null,
  theme: 'system',
  lastBackupAt: null,
};

export function getSettings(): Promise<Settings | undefined> {
  return db.settings.get(SETTINGS_ID);
}

export function ensureSettings(): Promise<Settings> {
  return db.transaction('rw', db.settings, async () => {
    const existing = await db.settings.get(SETTINGS_ID);
    return existing ?? create(db.settings, { ...DEFAULT_SETTINGS, id: SETTINGS_ID });
  });
}

export async function updateSettings(changes: EntityChanges<Settings>): Promise<void> {
  await ensureSettings();
  await update(db.settings, SETTINGS_ID, changes);
}
