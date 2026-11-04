import { describe, expect, it } from 'vitest';
import { healthDate, sampleAppleHealthXml, type HealthRecordInput } from '../../test/importFiles';
import {
  AppleHealthCollector,
  HealthXmlScanner,
  parseHealthDate,
  unionSeconds,
  type HealthRecord,
} from './appleHealth';

const at = (day: number, hour: number, minute = 0) =>
  new Date(2026, 9, day, hour, minute).getTime();
const HOUR = 3600;

const sleep = (
  value: string,
  start: number,
  end: number,
  source = 'Apple Watch von Test',
): HealthRecordInput => ({
  type: 'HKCategoryTypeIdentifierSleepAnalysis',
  start,
  end,
  value: `HKCategoryValueSleepAnalysis${value}`,
  source,
});

function collect(records: HealthRecordInput[], chunkSize = 37) {
  const collector = new AppleHealthCollector();
  const scanner = new HealthXmlScanner((record) => collector.add(record));
  const xml = sampleAppleHealthXml(records);
  for (let i = 0; i < xml.length; i += chunkSize) scanner.push(xml.slice(i, i + chunkSize));
  return collector;
}

describe('HealthXmlScanner', () => {
  it('findet Einträge über Stückgrenzen hinweg und überspringt andere Typen', () => {
    const found: HealthRecord[] = [];
    const scanner = new HealthXmlScanner((record) => found.push(record));
    const xml = sampleAppleHealthXml([
      { type: 'HKQuantityTypeIdentifierStepCount', start: at(1, 9), value: 120 },
      {
        type: 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
        start: at(1, 3),
        value: 40,
        unit: 'ms',
      },
    ]);
    for (let i = 0; i < xml.length; i += 5) scanner.push(xml.slice(i, i + 5));
    expect(found.map((record) => [record.type, record.value])).toEqual([
      ['HKQuantityTypeIdentifierStepCount', '120'],
      ['HKQuantityTypeIdentifierHeartRateVariabilitySDNN', '40'],
    ]);
  });
});

describe('parseHealthDate', () => {
  it('liest Datum mit Zeitzone', () => {
    expect(parseHealthDate('2026-10-01 22:15:00 +0200')).toBe(Date.UTC(2026, 9, 1, 20, 15));
    expect(parseHealthDate(healthDate(at(3, 7)))).toBe(at(3, 7));
    expect(parseHealthDate('Unsinn')).toBeNull();
  });
});

describe('unionSeconds', () => {
  it('zählt Überlappungen nur einmal', () => {
    expect(
      unionSeconds([
        [0, 10_000],
        [5000, 20_000],
        [30_000, 31_000],
      ]),
    ).toBe(21);
  });
});

describe('AppleHealthCollector', () => {
  it('Schritte: je Tag die Quelle mit den meisten Schritten (keine Doppelzählung)', () => {
    const steps = (start: number, value: number, source: string): HealthRecordInput => ({
      type: 'HKQuantityTypeIdentifierStepCount',
      start,
      end: start + 600_000,
      value,
      source,
    });
    const days = collect([
      steps(at(1, 9), 3000, 'iPhone'),
      steps(at(1, 12), 2000, 'iPhone'),
      steps(at(1, 9), 4000, 'Connect'),
      steps(at(1, 18), 2500, 'Connect'),
      steps(at(2, 10), 100, 'iPhone'),
    ]).days();
    expect(days.map((day) => [day.date, day.steps])).toEqual([
      ['2026-10-01', 6500],
      ['2026-10-02', 100],
    ]);
  });

  it('Schlaf: Nacht zählt zum Tag des Aufwachens, Phasen von der genauesten Quelle', () => {
    const days = collect([
      // iPhone-Schlafenszeit: nur „Im Bett“
      sleep('InBed', at(1, 22, 30), at(2, 6, 45), 'iPhone'),
      // Uhr mit Phasen
      sleep('AsleepCore', at(1, 23), at(2, 1)),
      sleep('AsleepDeep', at(2, 1), at(2, 2)),
      sleep('Awake', at(2, 2), at(2, 2, 10)),
      sleep('AsleepREM', at(2, 2, 10), at(2, 3, 40)),
      sleep('AsleepCore', at(2, 3, 40), at(2, 6, 30)),
      // Mittagsschlaf gehört zum selben Tag, ältere Uhr nur „Asleep“
      sleep('Asleep', at(3, 13), at(3, 13, 30), 'Alte Uhr'),
    ]).days();
    expect(days).toHaveLength(2);
    expect(days[0]).toMatchObject({
      date: '2026-10-02',
      sleepSeconds: 7 * HOUR + 20 * 60,
      sleepPhases: { deep: HOUR, light: 4 * HOUR + 50 * 60, rem: 90 * 60, awake: 600 },
    });
    expect(days[1]).toMatchObject({ date: '2026-10-03', sleepSeconds: 1800, sleepPhases: null });
  });

  it('Schlaf: nur „Im Bett“ zählt, wenn sonst nichts da ist', () => {
    const [day] = collect([sleep('InBed', at(4, 23), at(5, 7), 'iPhone')]).days();
    expect(day).toMatchObject({ date: '2026-10-05', sleepSeconds: 8 * HOUR, sleepPhases: null });
  });

  it('Gewicht (letzte Messung, lb umgerechnet), Ruhepuls und HRV als Tagesmittel', () => {
    const [day] = collect([
      { type: 'HKQuantityTypeIdentifierBodyMass', start: at(6, 7), value: 82, unit: 'kg' },
      { type: 'HKQuantityTypeIdentifierBodyMass', start: at(6, 8), value: 180, unit: 'lb' },
      {
        type: 'HKQuantityTypeIdentifierRestingHeartRate',
        start: at(6, 0),
        value: 50,
        unit: 'count/min',
      },
      {
        type: 'HKQuantityTypeIdentifierRestingHeartRate',
        start: at(6, 0),
        value: 53,
        unit: 'count/min',
      },
      {
        type: 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
        start: at(6, 3),
        value: 40.2,
        unit: 'ms',
      },
      {
        type: 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
        start: at(6, 9),
        value: 50,
        unit: 'ms',
      },
    ]).days();
    expect(day).toMatchObject({
      date: '2026-10-06',
      weightKg: 81.65,
      restingHeartRate: 52,
      hrvMs: 45,
    });
  });
});
