import { describe, expect, it } from 'vitest';
import { DAILY_IMPORT_FIELDS } from '../../db/types';
import { dailyLogOf } from '../../test/dailyLog';
import { healthDay, mergeHealthDays, planHealthImport } from './health';

const ALL = DAILY_IMPORT_FIELDS;
const TODAY = '2026-11-04';
const phases = { deep: 3600, light: 14_400, rem: 5400, awake: 600 };

describe('healthDay', () => {
  it('verwirft unplausible Werte und rundet', () => {
    expect(
      healthDay('2026-11-01', {
        steps: 8123.6,
        sleepSeconds: 30 * 3600,
        sleepPhases: phases,
        weightKg: 81.456,
        restingHeartRate: 10,
        hrvMs: 45.4,
      }),
    ).toEqual({
      date: '2026-11-01',
      steps: 8124,
      sleepSeconds: null,
      sleepPhases: null,
      weightKg: 81.46,
      restingHeartRate: null,
      hrvMs: 45,
    });
  });
});

describe('mergeHealthDays', () => {
  it('erste Quelle hat Vorrang, weitere füllen Lücken; Schlaf nur mit seinen Phasen', () => {
    const garmin = [healthDay('2026-11-02', { sleepSeconds: 7 * 3600, sleepPhases: phases })];
    const apple = [
      healthDay('2026-11-02', { sleepSeconds: 6 * 3600, steps: 9000, hrvMs: 40 }),
      healthDay('2026-11-01', { steps: 5000 }),
    ];
    const merged = mergeHealthDays(garmin, apple);
    expect(merged.map((day) => day.date)).toEqual(['2026-11-01', '2026-11-02']);
    expect(merged[1]).toMatchObject({
      sleepSeconds: 7 * 3600,
      sleepPhases: phases,
      steps: 9000,
      hrvMs: 40,
    });
  });
});

describe('planHealthImport', () => {
  const days = [
    healthDay('2026-11-01', {
      steps: 8000,
      sleepSeconds: 25_200,
      sleepPhases: phases,
      restingHeartRate: 52,
    }),
    healthDay('2026-11-02', { steps: 9000, weightKg: 80, hrvMs: 45 }),
    healthDay('2026-11-05', { steps: 100 }),
  ];

  it('füllt leere Tage und legt neue an, Zukunft wird ignoriert', () => {
    const plan = planHealthImport(days, [dailyLogOf('2026-11-01', { mood: 4 })], ALL, TODAY);
    expect(plan.changes).toEqual([
      {
        date: '2026-11-01',
        values: {
          steps: 8000,
          sleepSeconds: 25_200,
          sleepPhases: phases,
          restingHeartRate: 52,
        },
        importedFields: ['steps', 'sleep', 'restingHeartRate'],
      },
      {
        date: '2026-11-02',
        values: { steps: 9000, weightKg: 80, hrvMs: 45 },
        importedFields: ['steps', 'weight', 'hrv'],
      },
    ]);
    expect(plan.counts.steps).toEqual({ found: 2, added: 2, updated: 0, unchanged: 0, kept: 0 });
    expect(plan.firstDate).toBe('2026-11-01');
    expect(plan.lastDate).toBe('2026-11-02');
  });

  it('eigene Einträge bleiben, importierte werden aktualisiert, gleiche übersprungen', () => {
    const logs = [
      dailyLogOf('2026-11-01', {
        steps: 7000,
        sleepSeconds: 25_200,
        sleepPhases: phases,
        importedFields: ['sleep'],
      }),
      dailyLogOf('2026-11-02', { steps: 4000, weightKg: 81, importedFields: ['steps'] }),
    ];
    const plan = planHealthImport(days, logs, ALL, TODAY);
    expect(plan.counts.steps).toEqual({ found: 2, added: 0, updated: 1, unchanged: 0, kept: 1 });
    expect(plan.counts.sleep).toMatchObject({ unchanged: 1 });
    expect(plan.counts.weight).toMatchObject({ kept: 1 });
    expect(plan.changes).toEqual([
      {
        date: '2026-11-01',
        values: { restingHeartRate: 52 },
        importedFields: ['sleep', 'restingHeartRate'],
      },
      {
        date: '2026-11-02',
        values: { steps: 9000, hrvMs: 45 },
        importedFields: ['steps', 'hrv'],
      },
    ]);
  });

  it('0 Schritte gelten als leer', () => {
    const plan = planHealthImport(days, [dailyLogOf('2026-11-01', { steps: 0 })], ['steps'], TODAY);
    expect(plan.changes[0]).toEqual({
      date: '2026-11-01',
      values: { steps: 8000 },
      importedFields: ['steps'],
    });
  });

  it('übernimmt nur die gewählten Werte, zählt aber alle', () => {
    const plan = planHealthImport(days, [], ['weight'], TODAY);
    expect(plan.changes).toEqual([
      { date: '2026-11-02', values: { weightKg: 80 }, importedFields: ['weight'] },
    ]);
    expect(plan.counts.steps.added).toBe(2);
  });

  it('zweiter Import desselben Stands ändert nichts', () => {
    const first = planHealthImport(days, [], ALL, TODAY);
    const logs = first.changes.map((change) =>
      dailyLogOf(change.date, { ...change.values, importedFields: change.importedFields }),
    );
    const second = planHealthImport(days, logs, ALL, TODAY);
    expect(second.changes).toEqual([]);
    expect(second.counts.steps).toMatchObject({ found: 2, unchanged: 2 });
  });
});
