import {
  MAX_BODY_WEIGHT_KG,
  MAX_HRV_MS,
  MAX_RESTING_HEART_RATE,
  MAX_SLEEP_SECONDS,
  MAX_STEPS,
  MIN_BODY_WEIGHT_KG,
  MIN_RESTING_HEART_RATE,
  type DailyLogValues,
} from '../../db/schemas';
import {
  DAILY_IMPORT_FIELDS,
  type DailyImportField,
  type DailyLog,
  type DayKey,
  type SleepPhases,
} from '../../db/types';

export type HealthSource = 'apple' | 'garmin';

/** Tageswerte aus einem Gesundheits-Export; `null` = nicht enthalten */
export interface HealthDay {
  date: DayKey;
  steps: number | null;
  /** Nacht vor diesem Tag (Tag des Aufwachens) */
  sleepSeconds: number | null;
  sleepPhases: SleepPhases | null;
  weightKg: number | null;
  restingHeartRate: number | null;
  hrvMs: number | null;
}

export type HealthValues = Omit<HealthDay, 'date'>;

const inRange = (value: number | null | undefined, min: number, max: number) =>
  value != null && Number.isFinite(value) && value >= min && value <= max ? value : null;

const roundIn = (value: number | null | undefined, min: number, max: number) =>
  inRange(value == null ? null : Math.round(value), min, max);

/** Unplausible Werte verwerfen, damit das Speichern nie an der Validierung scheitert */
export function healthDay(date: DayKey, values: Partial<HealthValues>): HealthDay {
  const sleepSeconds = roundIn(values.sleepSeconds, 1, MAX_SLEEP_SECONDS);
  const phases = values.sleepPhases;
  const phase = (seconds: number) => Math.min(MAX_SLEEP_SECONDS, Math.max(0, Math.round(seconds)));
  const weight = inRange(values.weightKg, MIN_BODY_WEIGHT_KG, MAX_BODY_WEIGHT_KG);
  return {
    date,
    steps: roundIn(values.steps, 1, MAX_STEPS),
    sleepSeconds,
    sleepPhases:
      sleepSeconds !== null && phases
        ? {
            deep: phase(phases.deep),
            light: phase(phases.light),
            rem: phase(phases.rem),
            awake: phase(phases.awake),
          }
        : null,
    weightKg: weight === null ? null : Math.round(weight * 100) / 100,
    restingHeartRate: roundIn(
      values.restingHeartRate,
      MIN_RESTING_HEART_RATE,
      MAX_RESTING_HEART_RATE,
    ),
    hrvMs: roundIn(values.hrvMs, 1, MAX_HRV_MS),
  };
}

/**
 * Tage aus mehreren Quellen zusammenführen: Die erste Quelle hat Vorrang, weitere füllen nur
 * fehlende Werte (Schlaf samt Phasen als Einheit). Älteste zuerst.
 */
export function mergeHealthDays(...sources: HealthDay[][]): HealthDay[] {
  const merged = new Map<DayKey, HealthDay>();
  for (const days of sources) {
    for (const day of days) {
      const current = merged.get(day.date);
      if (!current) {
        merged.set(day.date, { ...day });
        continue;
      }
      current.steps ??= day.steps;
      if (current.sleepSeconds === null) {
        current.sleepSeconds = day.sleepSeconds;
        current.sleepPhases = day.sleepPhases;
      }
      current.weightKg ??= day.weightKg;
      current.restingHeartRate ??= day.restingHeartRate;
      current.hrvMs ??= day.hrvMs;
    }
  }
  return [...merged.values()].sort((a, b) => a.date.localeCompare(b.date));
}

// ---------- Plan ----------

type FieldValues = Partial<DailyLogValues>;

function importValues(day: HealthDay, field: DailyImportField): FieldValues | null {
  switch (field) {
    case 'steps':
      return day.steps === null ? null : { steps: day.steps };
    case 'sleep':
      return day.sleepSeconds === null
        ? null
        : { sleepSeconds: day.sleepSeconds, sleepPhases: day.sleepPhases };
    case 'weight':
      return day.weightKg === null ? null : { weightKg: day.weightKg };
    case 'restingHeartRate':
      return day.restingHeartRate === null ? null : { restingHeartRate: day.restingHeartRate };
    case 'hrv':
      return day.hrvMs === null ? null : { hrvMs: day.hrvMs };
  }
}

function storedValues(log: DailyLog, field: DailyImportField): FieldValues {
  switch (field) {
    case 'steps':
      return { steps: log.steps };
    case 'sleep':
      return { sleepSeconds: log.sleepSeconds, sleepPhases: log.sleepPhases };
    case 'weight':
      return { weightKg: log.weightKg };
    case 'restingHeartRate':
      return { restingHeartRate: log.restingHeartRate };
    case 'hrv':
      return { hrvMs: log.hrvMs };
  }
}

/** 0 Schritte oder 0 h Schlaf gelten wie in der Anzeige als nicht erfasst */
function isEmpty(values: FieldValues, field: DailyImportField): boolean {
  if (field === 'sleep') return !values.sleepSeconds;
  if (field === 'steps') return !values.steps;
  return Object.values(values).every((value) => value === null);
}

const sameValues = (a: FieldValues, b: FieldValues) => JSON.stringify(a) === JSON.stringify(b);

export interface HealthFieldCount {
  /** Tage mit Wert im Export */
  found: number;
  added: number;
  updated: number;
  unchanged: number;
  /** Eigener Eintrag bleibt */
  kept: number;
}

export interface HealthDayChange {
  date: DayKey;
  values: FieldValues;
  /** Vollständige neue Liste für den Tag */
  importedFields: DailyImportField[];
}

export interface HealthImportPlan {
  changes: HealthDayChange[];
  counts: Record<DailyImportField, HealthFieldCount>;
  firstDate: DayKey | null;
  lastDate: DayKey | null;
}

/**
 * Vergleicht die Tage mit den gespeicherten Einträgen. Leere und früher importierte Werte werden
 * übernommen, eigene Einträge bleiben. `counts` zählt alle Felder, `changes` nur die gewählten.
 * Tage nach `today` werden ignoriert.
 */
export function planHealthImport(
  days: readonly HealthDay[],
  logs: readonly DailyLog[],
  fields: readonly DailyImportField[],
  today: DayKey,
): HealthImportPlan {
  const byDate = new Map(logs.map((log) => [log.date, log]));
  const counts = Object.fromEntries(
    DAILY_IMPORT_FIELDS.map((field) => [
      field,
      { found: 0, added: 0, updated: 0, unchanged: 0, kept: 0 },
    ]),
  ) as Record<DailyImportField, HealthFieldCount>;
  const plan: HealthImportPlan = { changes: [], counts, firstDate: null, lastDate: null };

  for (const day of days) {
    if (day.date > today) continue;
    const log = byDate.get(day.date);
    const imported = new Set(log?.importedFields ?? []);
    const values: FieldValues = {};
    let found = false;

    for (const field of DAILY_IMPORT_FIELDS) {
      const next = importValues(day, field);
      if (!next) continue;
      found = true;
      const count = counts[field];
      count.found++;
      const current = log ? storedValues(log, field) : null;
      const empty = !current || isEmpty(current, field);
      if (!empty && !imported.has(field)) {
        count.kept++;
        continue;
      }
      if (current && !empty && sameValues(current, next)) {
        count.unchanged++;
        continue;
      }
      if (empty) count.added++;
      else count.updated++;
      if (fields.includes(field)) {
        Object.assign(values, next);
        imported.add(field);
      }
    }

    if (found) {
      if (!plan.firstDate || day.date < plan.firstDate) plan.firstDate = day.date;
      if (!plan.lastDate || day.date > plan.lastDate) plan.lastDate = day.date;
    }
    if (Object.keys(values).length > 0) {
      plan.changes.push({
        date: day.date,
        values,
        importedFields: DAILY_IMPORT_FIELDS.filter((field) => imported.has(field)),
      });
    }
  }
  return plan;
}
