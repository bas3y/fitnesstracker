import type { DayKey } from '../../db/types';
import { dayKey, isDayKey } from '../daily';
import { healthDay, type HealthDay, type HealthValues } from './health';

// Garmin-Datenexport (Garmin-Konto → Datenverwaltung): JSON-Dateien unter `DI_CONNECT/`.
// Das Format ist nicht dokumentiert; gelesen wird tolerant:
// - `DI-Connect-Wellness/*_sleepData.json`: `calendarDate` (Tag des Aufwachens),
//   `deepSleepSeconds`/`lightSleepSeconds`/`remSleepSeconds`/`awakeSleepSeconds`
// - `DI-Connect-Aggregator/UDSFile_*.json`: Tageswerte `totalSteps`, `restingHeartRate`
// - HRV (`lastNightAvg`, auch in `hrvSummary`), Gewicht in Gramm (`*bioMetrics*`), wenn vorhanden

/** Nur diese JSON-Dateien lesen (der Export enthält viele andere) */
export function isGarminHealthFile(path: string): boolean {
  if (!/\.json$/i.test(path)) return false;
  return /sleepData|UDSFile|hrv|healthStatus|bioMetrics/i.test(path.split(/[/\\]/).pop() ?? '');
}

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const numberOf = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

/** `"2024-01-31"`, `"2024-01-31T00:00:00.0"` oder `{ "date": "Jan 31, 2024 12:00:00 AM" }` */
function calendarDate(value: unknown): DayKey | null {
  if (typeof value === 'string') {
    const key = value.slice(0, 10);
    return isDayKey(key) ? key : null;
  }
  if (isObject(value) && typeof value.date === 'string') {
    const key = value.date.slice(0, 10);
    if (isDayKey(key)) return key;
    const time = Date.parse(value.date);
    return Number.isNaN(time) ? null : dayKey(new Date(time));
  }
  return null;
}

function dateOf(item: Json): DayKey | null {
  return (
    calendarDate(item.calendarDate) ??
    (isObject(item.metaData) ? calendarDate(item.metaData.calendarDate) : null)
  );
}

function hrvOf(item: Json): number | null {
  const summary = isObject(item.hrvSummary) ? item.hrvSummary : item;
  const direct = numberOf(summary.lastNightAvg);
  if (direct !== null) return direct;
  if (!Array.isArray(item.metrics)) return null;
  const metric = item.metrics.find((entry) => isObject(entry) && entry.type === 'HRV');
  return isObject(metric) ? numberOf(metric.value) : null;
}

function weightOf(item: Json): number | null {
  const weight = isObject(item.weight) ? numberOf(item.weight.weight) : numberOf(item.weight);
  // Garmin speichert Gramm
  return weight === null ? null : weight > 1000 ? weight / 1000 : weight;
}

const MAX_DEPTH = 4;

export class GarminHealthCollector {
  private readonly values = new Map<DayKey, Partial<HealthValues>>();

  /** `fileName` entscheidet, ob Gewichte gelesen werden (nur aus `*bioMetrics*`) */
  addJson(data: unknown, fileName: string): void {
    const withWeight = /bioMetrics/i.test(fileName);
    const visit = (value: unknown, depth: number) => {
      if (depth > MAX_DEPTH) return;
      if (Array.isArray(value)) {
        for (const item of value) visit(item, depth + 1);
        return;
      }
      if (!isObject(value)) return;
      const date = dateOf(value);
      if (date) this.read(date, value, withWeight);
      else for (const item of Object.values(value)) visit(item, depth + 1);
    };
    visit(data, 0);
  }

  private read(date: DayKey, item: Json, withWeight: boolean) {
    const day = this.values.get(date) ?? {};
    this.values.set(date, day);

    const deep = numberOf(item.deepSleepSeconds);
    const light = numberOf(item.lightSleepSeconds);
    const rem = numberOf(item.remSleepSeconds);
    if (day.sleepSeconds == null && (deep ?? light ?? rem) !== null) {
      const phases = {
        deep: deep ?? 0,
        light: light ?? 0,
        rem: rem ?? 0,
        awake: numberOf(item.awakeSleepSeconds) ?? 0,
      };
      // Nicht bestätigte Nächte haben keine Phasen bzw. nur Nullen
      const seconds = phases.deep + phases.light + phases.rem;
      if (seconds > 0) {
        day.sleepSeconds = seconds;
        day.sleepPhases = phases;
      }
    }

    const steps = numberOf(item.totalSteps);
    if (steps !== null && steps > 0) day.steps ??= steps;
    const resting = numberOf(item.restingHeartRate) ?? numberOf(item.currentDayRestingHeartRate);
    if (resting !== null && resting > 0) day.restingHeartRate ??= resting;
    const hrv = hrvOf(item);
    if (hrv !== null && hrv > 0) day.hrvMs ??= hrv;
    if (withWeight) day.weightKg ??= weightOf(item);
  }

  days(): HealthDay[] {
    return [...this.values.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, values]) => healthDay(date, values))
      .filter((day) =>
        Object.entries(day).some(([key, value]) => key !== 'date' && value !== null),
      );
  }
}
