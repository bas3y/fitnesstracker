import { REPORT_TODAY, sampleReportInput } from '../test/reportInput';
import { periodRange } from './periods';
import {
  averagePerBucket,
  dailyBuckets,
  effortRecordsIn,
  enduranceSessionsIn,
  enduranceTotalsPerBucket,
  exerciseChanges,
  fileSlug,
  monthBuckets,
  muscleSetsIn,
  recordsIn,
  reportFileName,
  sportTotalsIn,
  trainingBuckets,
  trainingDayKinds,
  trainingPerBucket,
  weightsIn,
} from './report';

const input = sampleReportInput();
const NOVEMBER = periodRange('month', REPORT_TODAY);
const OCTOBER = periodRange('month', '2026-10-01');

describe('Zeitachsen', () => {
  it('Monat: Kalenderwochen, am Monatsrand abgeschnitten', () => {
    // 1.11.2026 ist ein Sonntag
    expect(trainingBuckets('month', NOVEMBER)).toEqual([
      { label: 'KW 44', from: '2026-11-01', to: '2026-11-01' },
      { label: 'KW 45', from: '2026-11-02', to: '2026-11-08' },
      { label: 'KW 46', from: '2026-11-09', to: '2026-11-15' },
      { label: 'KW 47', from: '2026-11-16', to: '2026-11-22' },
      { label: 'KW 48', from: '2026-11-23', to: '2026-11-29' },
      { label: 'KW 49', from: '2026-11-30', to: '2026-11-30' },
    ]);
  });

  it('Woche: Tage Mo–So, Jahr: Monate', () => {
    const week = trainingBuckets('week', periodRange('week', REPORT_TODAY));
    expect(week.map((bucket) => bucket.label)).toEqual(['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']);
    expect(week[0]!.from).toBe('2026-11-02');
    const year = trainingBuckets('year', periodRange('year', REPORT_TODAY));
    expect(year).toHaveLength(12);
    expect(year[1]).toEqual({ label: 'Feb', from: '2026-02-01', to: '2026-02-28' });
  });

  it('Tageswerte: im Monat je Tag', () => {
    const days = dailyBuckets('month', NOVEMBER);
    expect(days).toHaveLength(30);
    expect(days[0]).toEqual({ label: '1', from: '2026-11-01', to: '2026-11-01' });
    expect(dailyBuckets('year', NOVEMBER)).toHaveLength(12);
  });

  it('monthBuckets über den Jahreswechsel', () => {
    expect(monthBuckets('2026-11-15', '2027-01-03').map((bucket) => bucket.label)).toEqual([
      'Nov 26',
      'Dez 26',
      'Jan 27',
    ]);
  });
});

describe('Training und Tageswerte je Abschnitt', () => {
  it('zählt Workouts (nicht Übungen) und Ausdauer-Einheiten', () => {
    const counts = trainingPerBucket(input, trainingBuckets('month', NOVEMBER));
    expect(counts[1]).toEqual({ strength: 2, endurance: 2 });
    expect(counts[0]).toEqual({ strength: 0, endurance: 0 });
  });

  it('mittelt nur Tage mit Wert', () => {
    const days = dailyBuckets('month', NOVEMBER);
    const steps = averagePerBucket(input.logs, days, (log) => log.steps);
    expect(steps.slice(0, 3)).toEqual([8000, 12_000, null]);
    const months = dailyBuckets('year', NOVEMBER);
    const sleep = averagePerBucket(input.logs, months, (log) => log.sleepSeconds);
    expect(sleep[10]).toBe(7.5 * 3600);
    expect(sleep[9]).toBeNull();
  });

  it('Gewichte im Zeitraum', () => {
    expect(weightsIn(input.logs, NOVEMBER)).toEqual([
      { day: '2026-11-01', kg: 81.5 },
      { day: '2026-11-04', kg: 81 },
    ]);
  });

  it('Trainingstage nach Art', () => {
    const kinds = trainingDayKinds(input, NOVEMBER);
    expect(Object.fromEntries(kinds)).toEqual({
      '2026-11-02': 'strength',
      '2026-11-03': 'endurance',
      '2026-11-05': 'both',
    });
  });
});

describe('Krafttraining', () => {
  it('Veränderung des Bestwerts gegenüber dem Vergleichszeitraum, größte zuerst', () => {
    const changes = exerciseChanges(input.strength, NOVEMBER, OCTOBER, 80);
    expect(changes.map((change) => change.exercise.name)).toEqual(['Bankdrücken', 'Kniebeuge']);
    // 1RM 100 × 5 = 116,7 gegenüber 90 × 5 = 105
    expect(changes[0]!.percent).toBeCloseTo(11.11, 1);
    expect(changes[0]!.sessions).toBe(2);
    expect(changes[0]!.sets).toBe(3);
    expect(changes[1]!.percent).toBeCloseTo(10, 5);
  });

  it('ohne Einheiten im Vergleichszeitraum gibt es keine Veränderung', () => {
    const changes = exerciseChanges(
      input.strength,
      NOVEMBER,
      periodRange('month', '2026-09-01'),
      80,
    );
    expect(changes.every((change) => change.percent === null)).toBe(true);
  });

  it('Rekorde im Zeitraum, älteste zuerst', () => {
    const rows = recordsIn(input.strength, NOVEMBER, 80);
    expect(rows).toHaveLength(3);
    expect(rows.at(-1)!.startedAt).toBe(new Date('2026-11-05T18:00:00').toISOString());
    expect(rows[0]!.records.map((record) => record.type)).toContain('weight');
    expect(recordsIn(input.strength, OCTOBER, 80)).toEqual([]);
  });

  it('Sätze je Muskelgruppe, Hilfsmuskeln halb', () => {
    expect(muscleSetsIn(input.strength, NOVEMBER)).toEqual([
      { muscle: 'chest', setsPerWeek: 3 },
      { muscle: 'triceps', setsPerWeek: 1.5 },
      { muscle: 'quads', setsPerWeek: 1 },
    ]);
  });
});

describe('Ausdauer', () => {
  it('Summen je Sportart, meiste Zeit zuerst', () => {
    const sports = sportTotalsIn(input.endurance, NOVEMBER);
    expect(sports.map((item) => item.sport)).toEqual(['ride', 'run']);
    expect(sports[1]!.totals).toEqual({
      count: 1,
      distanceMeters: 5000,
      durationSeconds: 1800,
      elevationGainMeters: 20,
    });
  });

  it('neue Bestzeiten im Zeitraum', () => {
    const records = effortRecordsIn(input.endurance, NOVEMBER);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ sport: 'run', meters: 5000, seconds: 1650 });
    expect(effortRecordsIn(input.endurance, OCTOBER)).toEqual([]);
  });

  it('Einheiten und Monatssummen', () => {
    expect(enduranceSessionsIn(input.endurance, NOVEMBER).map((session) => session.id)).toEqual([
      'run-2026-11-03',
      'run-2026-11-05',
    ]);
    const months = enduranceTotalsPerBucket(
      input.endurance,
      trainingBuckets('year', periodRange('year', REPORT_TODAY)),
    );
    expect(months[9]!.totals.count).toBe(1);
    expect(months[10]!.totals).toEqual({ count: 2, distanceMeters: 35_000, durationSeconds: 5400 });
  });
});

describe('Dateinamen', () => {
  it('Bericht je Zeitraum', () => {
    expect(reportFileName('month', NOVEMBER)).toBe('basey-bericht-2026-11');
    expect(reportFileName('year', periodRange('year', REPORT_TODAY))).toBe('basey-bericht-2026');
    expect(reportFileName('week', periodRange('week', REPORT_TODAY))).toBe(
      'basey-bericht-2026-kw45',
    );
    // Woche vom 28.12.2026 gehört zu KW 53 von 2026
    expect(reportFileName('week', periodRange('week', '2027-01-01'))).toBe(
      'basey-bericht-2026-kw53',
    );
  });

  it('fileSlug schreibt Umlaute aus', () => {
    expect(fileSlug('Bankdrücken (Langhantel)')).toBe('bankdruecken-langhantel');
    expect(fileSlug('Straße & Größe')).toBe('strasse-groesse');
    expect(fileSlug('💪')).toBe('export');
  });
});
