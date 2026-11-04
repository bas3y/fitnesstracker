import type { DailyLog } from '../db/types';

/** Tageseintrag für Tests ohne Datenbank */
export const dailyLogOf = (date: string, values: Partial<DailyLog> = {}): DailyLog => ({
  id: date,
  createdAt: '',
  updatedAt: '',
  deletedAt: null,
  date,
  steps: null,
  waterMl: null,
  sleepSeconds: null,
  sleepQuality: null,
  weightKg: null,
  mood: null,
  energy: null,
  restingHeartRate: null,
  hrvMs: null,
  sleepPhases: null,
  importedFields: [],
  ...values,
});
