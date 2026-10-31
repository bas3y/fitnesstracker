import type { BodyMeasurement, DailyLog } from '../db/types';
import {
  averageValue,
  bodyWeightOn,
  dailyPoints,
  dayKey,
  filterDaysByRange,
  formatDailyMetric,
  formatDayLabel,
  formatSleep,
  goalDays,
  goalPercent,
  hoursToSeconds,
  isDayKey,
  latestMeasures,
  measurePoints,
  secondsToHours,
  shiftDay,
} from './daily';

const log = (date: string, values: Partial<DailyLog>): DailyLog => ({
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
  ...values,
});

const measurement = (date: string, values: BodyMeasurement['values']): BodyMeasurement => ({
  id: date,
  createdAt: '',
  updatedAt: '',
  deletedAt: null,
  date,
  values,
});

const goals = { stepsGoal: 10_000, waterGoalMl: 2500, sleepGoalSeconds: 8 * 3600 };

describe('Tage', () => {
  it('rechnet über Monats- und Jahresgrenzen', () => {
    expect(shiftDay('2026-12-31', 1)).toBe('2027-01-01');
    expect(shiftDay('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('nutzt den lokalen Tag', () => {
    expect(dayKey(new Date(2026, 9, 31, 23, 59))).toBe('2026-10-31');
    expect(dayKey(new Date(2026, 10, 1, 0, 1))).toBe('2026-11-01');
  });

  it('erkennt nur echte Kalendertage', () => {
    expect(isDayKey('2026-10-31')).toBe(true);
    expect(isDayKey('2026-02-30')).toBe(false);
    expect(isDayKey('heute')).toBe(false);
  });

  it('benennt heute und gestern', () => {
    expect(formatDayLabel('2026-10-31', '2026-10-31')).toBe('Heute');
    expect(formatDayLabel('2026-10-30', '2026-10-31')).toBe('Gestern');
    expect(formatDayLabel('2026-10-28', '2026-10-31')).toContain('28.10.2026');
  });

  it('filtert nach Zeitraum', () => {
    const items = [{ date: '2026-09-01' }, { date: '2026-10-10' }];
    const now = new Date(2026, 9, 31);
    expect(filterDaysByRange(items, '4w', now)).toEqual([{ date: '2026-10-10' }]);
    expect(filterDaysByRange(items, 'all', now)).toEqual(items);
  });
});

describe('bodyWeightOn', () => {
  const weights = [
    { date: '2026-05-01', weightKg: 80 },
    { date: '2026-08-01', weightKg: 78 },
  ];

  it('nimmt den letzten Eintrag bis zu diesem Tag', () => {
    expect(bodyWeightOn(weights, '2026-05-01')).toBe(80);
    expect(bodyWeightOn(weights, '2026-07-31')).toBe(80);
    expect(bodyWeightOn(weights, '2026-10-01')).toBe(78);
  });

  it('nimmt vor dem ersten Eintrag diesen ersten Eintrag', () => {
    expect(bodyWeightOn(weights, '2026-01-01')).toBe(80);
  });

  it('kennt ohne Einträge kein Gewicht', () => {
    expect(bodyWeightOn([], '2026-01-01')).toBeNull();
  });
});

describe('Kennzahlen', () => {
  const logs = [
    log('2026-10-01', { steps: 12_000, waterMl: 0, sleepSeconds: 7.5 * 3600, weightKg: 80 }),
    log('2026-10-02', { steps: 8000, waterMl: 2500 }),
    log('2026-10-03', {}),
  ];

  it('lässt nicht erfasste Tage und 0 aus', () => {
    expect(dailyPoints(logs, 'steps', 'kg').map((point) => point.value)).toEqual([12_000, 8000]);
    expect(dailyPoints(logs, 'water', 'kg').map((point) => point.value)).toEqual([2500]);
  });

  it('rechnet Gewicht und Schlaf in die Anzeige um', () => {
    expect(dailyPoints(logs, 'weight', 'lb')[0]!.value).toBe(176.4);
    expect(dailyPoints(logs, 'sleep', 'kg')[0]!.value).toBe(7.5);
  });

  it('mittelt nur erfasste Tage', () => {
    expect(averageValue(dailyPoints(logs, 'steps', 'kg'))).toBe(10_000);
    expect(averageValue([])).toBeNull();
  });

  it('zählt Tage mit erreichtem Ziel', () => {
    expect(goalDays(logs, 'steps', goals)).toEqual({ reached: 1, total: 2 });
    expect(goalDays(logs, 'water', goals)).toEqual({ reached: 1, total: 1 });
    expect(goalDays(logs, 'weight', goals)).toBeNull();
  });

  it('begrenzt den Balken auf 100 %', () => {
    expect(goalPercent(1250, 2500)).toBe(50);
    expect(goalPercent(5000, 2500)).toBe(100);
    expect(goalPercent(null, 2500)).toBe(0);
  });

  it('formatiert Werte', () => {
    expect(formatDailyMetric('weight', 79.5, 'kg')).toBe('79,5 kg');
    expect(formatDailyMetric('steps', 8000, 'kg')).toBe('8000 Schritte');
    expect(formatDailyMetric('mood', 3.5, 'kg')).toBe('3,5 von 5');
    expect(formatSleep(7.5 * 3600)).toBe('7,5 h');
  });

  it('rechnet Stunden und Sekunden hin und zurück', () => {
    expect(hoursToSeconds(7.25)).toBe(26_100);
    expect(secondsToHours(26_100)).toBe(7.25);
  });
});

describe('Körpermaße', () => {
  const entries = [
    measurement('2026-09-01', { waist: 0.9, arm: 0.38 }),
    measurement('2026-10-01', { waist: 0.885 }),
  ];

  it('liefert nur Messungen dieser Stelle', () => {
    expect(measurePoints(entries, 'arm', 'km').map((point) => point.value)).toEqual([38]);
    expect(measurePoints(entries, 'waist', 'km').map((point) => point.value)).toEqual([90, 88.5]);
    expect(measurePoints(entries, 'arm', 'mi')[0]!.value).toBe(15);
  });

  it('merkt sich je Stelle den neuesten Wert', () => {
    expect(latestMeasures(entries)).toEqual({ waist: 0.885, arm: 0.38 });
  });
});
