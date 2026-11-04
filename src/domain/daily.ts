import type { DailyLogValues } from '../db/schemas';
import type {
  BodyMeasure,
  BodyMeasurement,
  DailyImportField,
  DailyLog,
  DayKey,
  DistanceUnit,
  Settings,
  SleepPhases,
  WeightUnit,
} from '../db/types';
import { formatDecimal } from './format';
import { formatDayKey, parseDayKey, rangeStart, type StatsRange } from './stats';
import { bodyLengthToDisplay, bodyLengthUnit, kgToDisplay, roundTo } from './units';
import { toDateInput } from './workout';

const SECONDS_PER_HOUR = 3600;

// ---------- Tage ----------

export function dayKey(date: Date): DayKey {
  return toDateInput(date.toISOString());
}

export function shiftDay(key: DayKey, days: number): DayKey {
  const date = parseDayKey(key);
  date.setDate(date.getDate() + days);
  return dayKey(date);
}

/** Echtes Kalenderdatum im Format `YYYY-MM-DD` */
export function isDayKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && dayKey(parseDayKey(value)) === value;
}

export function formatDayLabel(key: DayKey, today: DayKey): string {
  if (key === today) return 'Heute';
  if (key === shiftDay(today, -1)) return 'Gestern';
  return formatDayKey(key);
}

export function filterDaysByRange<T extends { date: DayKey }>(
  items: T[],
  range: StatsRange,
  now: Date,
): T[] {
  const start = rangeStart(range, now);
  if (!start) return items;
  const startKey = dayKey(start);
  return items.filter((item) => item.date >= startKey);
}

// ---------- Körpergewicht ----------

export interface DatedWeight {
  date: DayKey;
  weightKg: number;
}

/**
 * Gewicht an einem Tag: letzter Eintrag bis dahin, davor der erste Eintrag überhaupt.
 * `weights` ist aufsteigend sortiert.
 */
export function bodyWeightOn(weights: DatedWeight[], key: DayKey): number | null {
  let result = weights[0]?.weightKg ?? null;
  for (const { date, weightKg } of weights) {
    if (date > key) break;
    result = weightKg;
  }
  return result;
}

// ---------- Kennzahlen ----------

export const DAILY_METRICS = [
  'weight',
  'steps',
  'water',
  'sleep',
  'sleepQuality',
  'mood',
  'energy',
  'restingHeartRate',
  'hrv',
] as const;
export type DailyMetric = (typeof DAILY_METRICS)[number];

export const DAILY_METRIC_LABELS: Record<DailyMetric, string> = {
  weight: 'Gewicht',
  steps: 'Schritte',
  water: 'Wasser',
  sleep: 'Schlaf',
  sleepQuality: 'Schlafqualität',
  mood: 'Stimmung',
  energy: 'Energie',
  restingHeartRate: 'Ruhepuls',
  hrv: 'HRV',
};

export type DailyGoals = Pick<Settings, 'stepsGoal' | 'waterGoalMl' | 'sleepGoalSeconds'>;

function rawValue(log: DailyLog, metric: DailyMetric): number | null {
  switch (metric) {
    case 'weight':
      return log.weightKg;
    case 'steps':
      return log.steps;
    case 'water':
      return log.waterMl;
    case 'sleep':
      return log.sleepSeconds;
    case 'sleepQuality':
      return log.sleepQuality;
    case 'mood':
      return log.mood;
    case 'energy':
      return log.energy;
    case 'restingHeartRate':
      return log.restingHeartRate;
    case 'hrv':
      return log.hrvMs;
  }
}

/** Wert für die Achse: Gewicht in der Anzeigeeinheit, Schlaf in Stunden */
function displayValue(metric: DailyMetric, value: number, unit: WeightUnit): number {
  if (metric === 'weight') return roundTo(kgToDisplay(value, unit), 1);
  return metric === 'sleep' ? roundTo(value / SECONDS_PER_HOUR, 2) : value;
}

/** Text zu einem Wert aus `dailyPoints` */
export function formatDailyMetric(metric: DailyMetric, value: number, unit: WeightUnit): string {
  switch (metric) {
    case 'weight':
      return `${formatDecimal(value, 1)} ${unit}`;
    case 'steps':
      return `${formatDecimal(value, 0)} Schritte`;
    case 'water':
      return `${formatDecimal(value, 0)} ml`;
    case 'sleep':
      return `${formatDecimal(value, 1)} h`;
    case 'restingHeartRate':
      return `${formatDecimal(value, 0)} bpm`;
    case 'hrv':
      return `${formatDecimal(value, 0)} ms`;
    default:
      return `${formatDecimal(value, 1)} von 5`;
  }
}

export interface DailyPoint {
  time: number;
  value: number;
}

/** 0 zählt als nicht erfasst: Wasser steht z. B. nach +250 und −250 wieder auf 0 */
export function dailyPoints(logs: DailyLog[], metric: DailyMetric, unit: WeightUnit): DailyPoint[] {
  return logs.flatMap((log) => {
    const value = rawValue(log, metric);
    return value
      ? [{ time: parseDayKey(log.date).getTime(), value: displayValue(metric, value, unit) }]
      : [];
  });
}

export function averageValue(points: DailyPoint[]): number | null {
  if (points.length === 0) return null;
  return points.reduce((sum, point) => sum + point.value, 0) / points.length;
}

function goalOf(metric: DailyMetric, goals: DailyGoals): number | null {
  if (metric === 'steps') return goals.stepsGoal;
  if (metric === 'water') return goals.waterGoalMl;
  return metric === 'sleep' ? goals.sleepGoalSeconds : null;
}

/** Tage mit erreichtem Ziel; `null` = Kennzahl hat kein Ziel */
export function goalDays(
  logs: DailyLog[],
  metric: DailyMetric,
  goals: DailyGoals,
): { reached: number; total: number } | null {
  const goal = goalOf(metric, goals);
  if (goal === null) return null;
  const values = logs.map((log) => rawValue(log, metric) ?? 0).filter((value) => value > 0);
  return { reached: values.filter((value) => value >= goal).length, total: values.length };
}

/** Anteil am Ziel in Prozent, für Balken auf 100 begrenzt */
export function goalPercent(value: number | null, goal: number): number {
  if (!value || goal <= 0) return 0;
  return Math.min(100, Math.round((value / goal) * 100));
}

export function formatSleep(seconds: number): string {
  return `${formatDecimal(seconds / SECONDS_PER_HOUR, 2)} h`;
}

export function secondsToHours(seconds: number): number {
  return roundTo(seconds / SECONDS_PER_HOUR, 2);
}

export function hoursToSeconds(hours: number): number {
  return Math.round(hours * SECONDS_PER_HOUR);
}

// ---------- Schlafphasen ----------

export const SLEEP_PHASES = [
  'deep',
  'light',
  'rem',
  'awake',
] as const satisfies readonly (keyof SleepPhases)[];

export const SLEEP_PHASE_LABELS: Record<keyof SleepPhases, string> = {
  deep: 'Tiefschlaf',
  light: 'Leichtschlaf',
  rem: 'REM',
  awake: 'Wach',
};

/** Ø je Phase über alle Nächte mit Phasen; `null` = keine */
export function averageSleepPhases(logs: DailyLog[]): SleepPhases | null {
  const nights = logs.flatMap((log) => (log.sleepPhases ? [log.sleepPhases] : []));
  if (nights.length === 0) return null;
  const average = (phase: keyof SleepPhases) =>
    Math.round(nights.reduce((sum, night) => sum + night[phase], 0) / nights.length);
  return {
    deep: average('deep'),
    light: average('light'),
    rem: average('rem'),
    awake: average('awake'),
  };
}

// ---------- Herkunft (Import) ----------

const IMPORT_FIELD_OF: Partial<Record<keyof DailyLogValues, DailyImportField>> = {
  steps: 'steps',
  sleepSeconds: 'sleep',
  sleepPhases: 'sleep',
  weightKg: 'weight',
  restingHeartRate: 'restingHeartRate',
  hrvMs: 'hrv',
};

/** Import-Felder, die eine Änderung berührt */
export function importFieldsOf(values: Partial<DailyLogValues>): DailyImportField[] {
  const fields = Object.keys(values).flatMap(
    (key) => IMPORT_FIELD_OF[key as keyof DailyLogValues] ?? [],
  );
  return [...new Set(fields)];
}

// ---------- Körpermaße ----------

export function measurePoints(
  entries: BodyMeasurement[],
  measure: BodyMeasure,
  unit: DistanceUnit,
): DailyPoint[] {
  return entries.flatMap(({ date, values }) => {
    const value = values[measure];
    return value === undefined
      ? []
      : [
          {
            time: parseDayKey(date).getTime(),
            value: roundTo(bodyLengthToDisplay(value, unit), 1),
          },
        ];
  });
}

export function formatBodyLength(value: number, unit: DistanceUnit): string {
  return `${formatDecimal(value, 1)} ${bodyLengthUnit(unit)}`;
}

/** Letzter gemessener Wert je Stelle (für den Startwert der Stepper) */
export function latestMeasures(entries: BodyMeasurement[]): BodyMeasurement['values'] {
  return Object.assign({}, ...entries.map((entry) => entry.values)) as BodyMeasurement['values'];
}
