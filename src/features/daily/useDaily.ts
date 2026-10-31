import { useLiveQuery } from 'dexie-react-hooks';
import { useSearchParams } from 'react-router-dom';
import {
  getBodyMeasurement,
  getDailyLog,
  listBodyMeasurements,
  listDailyLogs,
} from '../../db/daily';
import type { DayKey } from '../../db/types';
import { dayKey, isDayKey } from '../../domain/daily';
import { useNow } from '../training/useWorkouts';

/** `undefined` = lädt, `null` = noch kein Eintrag */
export function useDailyLog(date: DayKey) {
  return useLiveQuery(async () => (await getDailyLog(date)) ?? null, [date]);
}

export function useDailyLogs() {
  return useLiveQuery(listDailyLogs, []);
}

/** `undefined` = lädt, `null` = noch kein Eintrag */
export function useBodyMeasurement(date: DayKey) {
  return useLiveQuery(async () => (await getBodyMeasurement(date)) ?? null, [date]);
}

export function useBodyMeasurements() {
  return useLiveQuery(listBodyMeasurements, []);
}

/** Gewählter Tag steht in der URL; ohne Angabe heute, auch über Mitternacht hinweg */
export function useDayParam() {
  const [params, setParams] = useSearchParams();
  const today = dayKey(useNow(true, 60_000));
  const value = params.get('date');
  const date = value && isDayKey(value) && value <= today ? value : today;
  const setDate = (next: DayKey) =>
    setParams(next === today ? {} : { date: next }, { replace: true });
  return { date, today, setDate };
}
