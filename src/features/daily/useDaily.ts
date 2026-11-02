import { useLiveQuery } from 'dexie-react-hooks';
import { useSearchParams } from 'react-router-dom';
import { useBackTo } from '../../components/backNavigation';
import {
  getBodyMeasurement,
  getDailyLog,
  listBodyMeasurements,
  listDailyLogs,
} from '../../db/daily';
import type { DayKey } from '../../db/types';
import { dayKey, isDayKey } from '../../domain/daily';
import { useNow } from '../training/useWorkouts';
import { DAILY_PATH, withDate } from './paths';

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
  // Andere Parameter (z. B. Zeitraum des Verlaufs) bleiben erhalten
  const setDate = (next: DayKey) =>
    setParams(
      (current) => {
        const params = new URLSearchParams(current);
        if (next === today) params.delete('date');
        else params.set('date', next);
        return params;
      },
      { replace: true },
    );
  return { date, today, setDate };
}

/** Zurück zur Herkunft (z. B. Startseite), sonst zu `parent` mit dem gewählten Tag */
export function useDayBackTo(date: DayKey, today: DayKey, parent = DAILY_PATH) {
  return useBackTo(withDate(parent, date, today));
}
