import type { DayKey, SleepPhases } from '../../db/types';
import { dayKey } from '../daily';
import { healthDay, type HealthDay } from './health';

// Apple-Health-Export (`export.xml`): oft mehrere GB, deshalb stückweise lesen und nur die
// Start-Tags `<Record …>` der benötigten Typen auswerten (kein DOM).

const STEPS = 'HKQuantityTypeIdentifierStepCount';
const SLEEP = 'HKCategoryTypeIdentifierSleepAnalysis';
const WEIGHT = 'HKQuantityTypeIdentifierBodyMass';
const RESTING_HEART_RATE = 'HKQuantityTypeIdentifierRestingHeartRate';
const HRV = 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN';
const WANTED = new Set([STEPS, SLEEP, WEIGHT, RESTING_HEART_RATE, HRV]);

export type HealthRecord = Record<string, string>;

export function isAppleHealthXml(head: string): boolean {
  return head.includes('<HealthData');
}

const RECORD_START = '<Record ';
const TYPE_ATTRIBUTE = /\btype="([^"]+)"/;
const ATTRIBUTE = /([\w:]+)="([^"]*)"/g;

/** Findet `<Record …>`-Tags auch über Stückgrenzen hinweg */
export class HealthXmlScanner {
  private rest = '';

  constructor(private readonly onRecord: (record: HealthRecord) => void) {}

  push(chunk: string): void {
    const text = this.rest + chunk;
    let pos = 0;
    for (;;) {
      const start = text.indexOf(RECORD_START, pos);
      if (start === -1) {
        // Ein angeschnittenes `<Record ` am Ende aufheben
        this.rest = text.slice(Math.max(pos, text.length - RECORD_START.length + 1));
        return;
      }
      const end = text.indexOf('>', start);
      if (end === -1) {
        this.rest = text.slice(start);
        return;
      }
      const tag = text.slice(start, end);
      const type = TYPE_ATTRIBUTE.exec(tag)?.[1];
      if (type && WANTED.has(type)) {
        const record: HealthRecord = {};
        for (const [, name, value] of tag.matchAll(ATTRIBUTE)) record[name!] = value!;
        this.onRecord(record);
      }
      pos = end + 1;
    }
  }
}

/** `2024-01-31 22:15:00 +0100` → Millisekunden */
export function parseHealthDate(text: string | undefined): number | null {
  if (!text) return null;
  const match = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}) ([+-]\d{2})(\d{2})$/.exec(text);
  const time = Date.parse(match ? `${match[1]}T${match[2]}${match[3]}:${match[4]}` : text);
  return Number.isNaN(time) ? null : time;
}

type Interval = [number, number];

/** Länge der Vereinigung in Sekunden (überlappende Einträge nicht doppelt zählen) */
export function unionSeconds(intervals: Interval[]): number {
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  let total = 0;
  let current: Interval | null = null;
  for (const [start, end] of sorted) {
    if (current && start <= current[1]) {
      current[1] = Math.max(current[1], end);
      continue;
    }
    if (current) total += current[1] - current[0];
    current = [start, end];
  }
  if (current) total += current[1] - current[0];
  return Math.round(total / 1000);
}

const SLEEP_CATEGORIES = ['inBed', 'asleep', 'deep', 'light', 'rem', 'awake'] as const;
type SleepCategory = (typeof SLEEP_CATEGORIES)[number];

const SLEEP_VALUES: Record<string, SleepCategory> = {
  HKCategoryValueSleepAnalysisInBed: 'inBed',
  HKCategoryValueSleepAnalysisAsleep: 'asleep',
  HKCategoryValueSleepAnalysisAsleepUnspecified: 'asleep',
  HKCategoryValueSleepAnalysisAsleepCore: 'light',
  HKCategoryValueSleepAnalysisAsleepDeep: 'deep',
  HKCategoryValueSleepAnalysisAsleepREM: 'rem',
  HKCategoryValueSleepAnalysisAwake: 'awake',
};

type SleepSource = Record<SleepCategory, Interval[]>;

/** Schlaf, der nach 18 Uhr endet, gehört zur folgenden Nacht (Tag des Aufwachens) */
const NIGHT_SHIFT_MS = 6 * 3600 * 1000;

const WEIGHT_FACTORS: Record<string, number> = { kg: 1, g: 0.001, lb: 0.45359237, st: 6.35029318 };

const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

function nested<V>(map: Map<DayKey, Map<string, V>>, day: DayKey, source: string, create: () => V) {
  let bySource = map.get(day);
  if (!bySource) map.set(day, (bySource = new Map()));
  let value = bySource.get(source);
  if (value === undefined) bySource.set(source, (value = create()));
  return value;
}

interface NightSummary {
  seconds: number;
  phases: SleepPhases | null;
}

function summarizeNight(source: SleepSource): NightSummary {
  const staged = [...source.deep, ...source.light, ...source.rem];
  const asleep = unionSeconds([...source.asleep, ...staged]);
  const phases =
    staged.length > 0
      ? {
          deep: unionSeconds(source.deep),
          light: unionSeconds(source.light),
          rem: unionSeconds(source.rem),
          awake: unionSeconds(source.awake),
        }
      : null;
  // Nur „Im Bett“ (z. B. Schlafenszeit am iPhone ohne Uhr) gilt als Schlaf, wenn sonst nichts da ist
  return { seconds: asleep > 0 ? asleep : unionSeconds(source.inBed), phases };
}

/**
 * Sammelt Tageswerte. Mehrere Quellen (iPhone, Uhr, Garmin über Health) werden nicht addiert:
 * Schritte = Quelle mit den meisten Schritten am Tag, Schlaf = Quelle mit Phasen bzw. dem längsten
 * Schlaf, Gewicht = letzte Messung am Tag, Ruhepuls/HRV = Tagesmittel.
 */
export class AppleHealthCollector {
  private readonly steps = new Map<DayKey, Map<string, number>>();
  private readonly sleep = new Map<DayKey, Map<string, SleepSource>>();
  private readonly weights = new Map<DayKey, { time: number; kg: number }>();
  private readonly restingHeartRates = new Map<DayKey, number[]>();
  private readonly hrvs = new Map<DayKey, number[]>();
  recordCount = 0;

  add(record: HealthRecord): void {
    const start = parseHealthDate(record.startDate);
    const end = parseHealthDate(record.endDate) ?? start;
    if (start === null || end === null) return;
    const source = record.sourceName ?? '';
    const value = Number(record.value);
    const day = dayKey(new Date(start));
    this.recordCount++;

    switch (record.type) {
      case STEPS: {
        if (!Number.isFinite(value)) return;
        const bySource = this.steps.get(day) ?? new Map<string, number>();
        bySource.set(source, (bySource.get(source) ?? 0) + value);
        this.steps.set(day, bySource);
        return;
      }
      case SLEEP: {
        const category = SLEEP_VALUES[record.value ?? ''];
        if (!category || end <= start) return;
        const night = dayKey(new Date(end + NIGHT_SHIFT_MS));
        const entry = nested(
          this.sleep,
          night,
          source,
          () =>
            Object.fromEntries(SLEEP_CATEGORIES.map((key) => [key, []])) as unknown as SleepSource,
        );
        entry[category].push([start, end]);
        return;
      }
      case WEIGHT: {
        const factor = WEIGHT_FACTORS[record.unit ?? 'kg'];
        if (!factor || !Number.isFinite(value)) return;
        const current = this.weights.get(day);
        if (!current || start >= current.time)
          this.weights.set(day, { time: start, kg: value * factor });
        return;
      }
      case RESTING_HEART_RATE:
      case HRV: {
        if (!Number.isFinite(value)) return;
        const map = record.type === HRV ? this.hrvs : this.restingHeartRates;
        map.set(day, [...(map.get(day) ?? []), value]);
        return;
      }
    }
  }

  days(): HealthDay[] {
    const dates = new Set<DayKey>([
      ...this.steps.keys(),
      ...this.sleep.keys(),
      ...this.weights.keys(),
      ...this.restingHeartRates.keys(),
      ...this.hrvs.keys(),
    ]);
    return [...dates].sort().map((date) => {
      const steps = this.steps.get(date);
      const nights = [...(this.sleep.get(date)?.values() ?? [])].map(summarizeNight);
      const night = nights.sort(
        (a, b) => Number(!!b.phases) - Number(!!a.phases) || b.seconds - a.seconds,
      )[0];
      const restingHeartRates = this.restingHeartRates.get(date);
      const hrvs = this.hrvs.get(date);
      return healthDay(date, {
        steps: steps ? Math.max(...steps.values()) : null,
        sleepSeconds: night?.seconds ?? null,
        sleepPhases: night?.phases ?? null,
        weightKg: this.weights.get(date)?.kg ?? null,
        restingHeartRate: restingHeartRates ? average(restingHeartRates) : null,
        hrvMs: hrvs ? average(hrvs) : null,
      });
    });
  }
}
