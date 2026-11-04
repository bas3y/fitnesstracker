import type { DayKey } from '../../db/types';

export const DAILY_PATH = '/daily';
export const BODY_PATH = '/daily/body';
export const MEASUREMENTS_PATH = '/daily/measurements';
export const DAILY_HISTORY_PATH = '/daily/history';
export const HEALTH_IMPORT_PATH = '/daily/import';

/** Gewählter Tag als `?date=`, heute ohne Angabe */
export function withDate(path: string, date: DayKey, today: DayKey): string {
  return date === today ? path : `${path}?date=${date}`;
}
