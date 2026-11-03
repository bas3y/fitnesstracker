import { db } from './database';
import { create, update, type EntityChanges, type NewEntity } from './repository';
import {
  DAILY_GOAL_DEFAULTS,
  NUTRITION_GOAL_DEFAULTS,
  SUPPLEMENT_SETTING_DEFAULTS,
} from './schemas';
import {
  DEFAULT_DASHBOARD_WIDGETS,
  DEFAULT_QUICK_ACTIONS,
  ENDURANCE_SPORTS,
  type Settings,
} from './types';

// Feste ID statt UUID: Es gibt genau einen Einstellungs-Datensatz pro Gerät
export const SETTINGS_ID = 'app-settings';

export const REST_TIMER_DEFAULTS: Pick<
  Settings,
  'restTimerEnabled' | 'restTimerSeconds' | 'restTimerSound' | 'restTimerVibrate'
> = {
  restTimerEnabled: true,
  restTimerSeconds: 180,
  restTimerSound: true,
  restTimerVibrate: true,
};

export const DEFAULT_SETTINGS: NewEntity<Settings> = {
  name: '',
  weightUnit: 'kg',
  distanceUnit: 'km',
  bodyWeightKg: null,
  theme: 'system',
  lastBackupAt: null,
  seedVersion: 0,
  activePlanId: null,
  restAnalysisEnabled: false,
  dashboardWidgets: [...DEFAULT_DASHBOARD_WIDGETS],
  quickActions: [...DEFAULT_QUICK_ACTIONS],
  ...REST_TIMER_DEFAULTS,
  ...DAILY_GOAL_DEFAULTS,
  ...SUPPLEMENT_SETTING_DEFAULTS,
  nutritionGoals: {
    training: { ...NUTRITION_GOAL_DEFAULTS.training },
    rest: { ...NUTRITION_GOAL_DEFAULTS.rest },
  },
  trainingTiles: [...ENDURANCE_SPORTS],
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

/** Änderung aus dem gespeicherten Stand, in einem Schreibvorgang (schnelles Tippen verliert nichts) */
export function updateSettingsFrom(
  changes: (current: Settings) => EntityChanges<Settings>,
): Promise<void> {
  return db.transaction('rw', db.settings, async () => {
    const current = await ensureSettings();
    await update(db.settings, SETTINGS_ID, changes(current));
  });
}
