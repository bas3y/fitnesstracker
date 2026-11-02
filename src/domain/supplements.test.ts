import type { Supplement, SupplementDose } from '../db/types';
import {
  adherenceLevel,
  dailyUse,
  DEFAULT_TRAINING_RATE,
  doseDueAt,
  formatDaysLeft,
  formatDose,
  formatSupplementSchedule,
  intakePercentByDay,
  isDoseOverdue,
  isLowStock,
  isSupplementDueOn,
  isSupplementHabitCandidate,
  stockDaysLeft,
  supplementAdherence,
  supplementDay,
  supplementDayStatus,
  supplementsFromHabit,
  trainingRate,
  type TrainingDay,
} from './supplements';

const iso = (day: number, hours = 9, minutes = 0) =>
  new Date(2026, 10, day, hours, minutes).toISOString();
// 2026-11-02 ist ein Montag
const TODAY = '2026-11-02';
const NO_TRAINING = new Map<string, TrainingDay>();

function dose(overrides: Partial<SupplementDose> = {}): SupplementDose {
  return { id: 'd1', amount: 5, timing: 'time', time: '08:00', period: null, ...overrides };
}

function supplement(overrides: Partial<Supplement> = {}): Supplement {
  return {
    id: 's1',
    createdAt: new Date(2026, 9, 1).toISOString(),
    updatedAt: new Date(2026, 9, 1).toISOString(),
    deletedAt: null,
    name: 'Kreatin',
    unit: 'g',
    doses: [dose()],
    schedule: 'daily',
    weekdays: [],
    trainingKind: 'any',
    stock: null,
    packageSize: null,
    notes: '',
    order: 0,
    archivedAt: null,
    ...overrides,
  };
}

function training(overrides: Partial<TrainingDay> = {}): TrainingDay {
  return {
    strength: true,
    endurance: false,
    startedAt: iso(2, 17),
    endedAt: iso(2, 18),
    ...overrides,
  };
}

describe('Fälligkeit', () => {
  it('täglich, an Wochentagen und an Trainingstagen', () => {
    expect(isSupplementDueOn(supplement(), TODAY, NO_TRAINING)).toBe(true);
    const weekdays = supplement({ schedule: 'weekdays', weekdays: [1, 3] });
    expect(isSupplementDueOn(weekdays, TODAY, NO_TRAINING)).toBe(true);
    expect(isSupplementDueOn(weekdays, '2026-11-03', NO_TRAINING)).toBe(false);

    const days = new Map([[TODAY, training()]]);
    const any = supplement({ schedule: 'training' });
    expect(isSupplementDueOn(any, TODAY, days)).toBe(true);
    expect(isSupplementDueOn(any, TODAY, NO_TRAINING)).toBe(false);
    expect(isSupplementDueOn({ ...any, trainingKind: 'strength' }, TODAY, days)).toBe(true);
    expect(isSupplementDueOn({ ...any, trainingKind: 'endurance' }, TODAY, days)).toBe(false);
    const run = new Map([[TODAY, training({ strength: false, endurance: true })]]);
    expect(isSupplementDueOn({ ...any, trainingKind: 'endurance' }, TODAY, run)).toBe(true);
  });

  it('Trainingstage sind heute vorab abhakbar, an früheren Tagen nur mit Einnahme sichtbar', () => {
    const pre = supplement({ schedule: 'training' });
    expect(supplementDayStatus(pre, TODAY, TODAY, NO_TRAINING, false)).toBe('optional');
    expect(supplementDayStatus(pre, '2026-11-01', TODAY, NO_TRAINING, false)).toBe('hidden');
    expect(supplementDayStatus(pre, '2026-11-01', TODAY, NO_TRAINING, true)).toBe('optional');
    expect(supplementDayStatus(supplement(), TODAY, TODAY, NO_TRAINING, false)).toBe('due');
    const archived = supplement({ archivedAt: iso(1) });
    expect(supplementDayStatus(archived, TODAY, TODAY, NO_TRAINING, true)).toBe('hidden');
  });

  it('formatiert Rhythmus und Dosis', () => {
    expect(formatSupplementSchedule(supplement())).toBe('Täglich');
    expect(formatSupplementSchedule(supplement({ schedule: 'weekdays', weekdays: [3, 1] }))).toBe(
      'Mo, Mi',
    );
    expect(
      formatSupplementSchedule(supplement({ schedule: 'training', trainingKind: 'strength' })),
    ).toBe('Trainingstage (Kraft)');
    expect(formatDose(dose({ amount: 2.5 }), 'g')).toBe('2,5 g · 08:00');
    expect(formatDose(dose({ timing: 'period', period: 'night' }), '')).toBe(
      '5 · Vor dem Schlafen',
    );
    expect(formatDose(dose({ timing: 'afterTraining' }), 'g')).toBe('5 g · Nach dem Training');
  });
});

describe('Tagesliste und Zeitpunkte', () => {
  const morning = supplement({ id: 'a', name: 'Vitamin D', doses: [dose({ id: 'a1' })] });
  const evening = supplement({
    id: 'b',
    name: 'Magnesium',
    doses: [dose({ id: 'b1', timing: 'period', time: null, period: 'evening' })],
  });
  const pre = supplement({
    id: 'c',
    name: 'Pre-Workout',
    schedule: 'training',
    doses: [dose({ id: 'c1', timing: 'beforeTraining', time: null })],
  });
  const items = [pre, evening, morning].map((s) => ({ supplement: s, intakes: [] }));

  it('sortiert nach Uhrzeit, rund ums Training nach dem Workout', () => {
    const withTraining = new Map([[TODAY, training()]]);
    expect(
      supplementDay(items, TODAY, TODAY, withTraining).map((entry) => entry.supplement.name),
    ).toEqual(['Vitamin D', 'Pre-Workout', 'Magnesium']);
    // Ohne Workout steht „Vor dem Training“ am Ende und ist nur optional
    const day = supplementDay(items, TODAY, TODAY, NO_TRAINING);
    expect(day.map((entry) => [entry.supplement.name, entry.status])).toEqual([
      ['Vitamin D', 'due'],
      ['Magnesium', 'due'],
      ['Pre-Workout', 'optional'],
    ]);
  });

  it('fällig ab Uhrzeit, Tageszeit bzw. Beginn und Ende des Workouts', () => {
    expect(doseDueAt(dose(), TODAY, undefined)?.toISOString()).toBe(iso(2, 8));
    expect(doseDueAt(evening.doses[0]!, TODAY, undefined)?.toISOString()).toBe(iso(2, 18));
    expect(doseDueAt(pre.doses[0]!, TODAY, undefined)).toBeNull();
    expect(doseDueAt(pre.doses[0]!, TODAY, training())?.toISOString()).toBe(iso(2, 17));
    const after = dose({ timing: 'afterTraining', time: null });
    expect(doseDueAt(after, TODAY, training({ endedAt: null }))).toBeNull();
    expect(doseDueAt(after, TODAY, training())?.toISOString()).toBe(iso(2, 18));
  });

  it('überfällig nur, wenn fällig, offen und die Zeit erreicht ist', () => {
    const [vitamin, magnesium] = supplementDay(items, TODAY, TODAY, NO_TRAINING);
    const now = new Date(2026, 10, 2, 9);
    expect(isDoseOverdue(vitamin!, now)).toBe(true);
    expect(isDoseOverdue(magnesium!, now)).toBe(false);
    const taken = { ...vitamin!, intake: { doseId: 'a1', date: TODAY, takenAt: iso(2, 8) } };
    expect(isDoseOverdue(taken, now)).toBe(false);
  });

  it('ordnet Einnahmen der Dosis zu', () => {
    const intakes = [{ doseId: 'a1', date: TODAY, takenAt: iso(2, 8) }];
    const [entry] = supplementDay([{ supplement: morning, intakes }], TODAY, TODAY, NO_TRAINING);
    expect(entry?.intake).toEqual(intakes[0]);
    expect(
      supplementDay([{ supplement: morning, intakes }], '2026-11-01', TODAY, NO_TRAINING)[0]
        ?.intake,
    ).toBeNull();
  });
});

describe('Bestand', () => {
  it('rechnet mit 3 Trainings pro Woche, solange es keine gibt', () => {
    expect(trainingRate(NO_TRAINING, 'any', TODAY)).toBe(DEFAULT_TRAINING_RATE);
    const days = new Map(
      ['2026-10-30', '2026-10-28', '2026-10-26', '2026-10-01'].map((d) => [d, training()]),
    );
    // Nur die letzten 28 Tage zählen
    expect(trainingRate(days, 'any', TODAY)).toBe(3 / 28);
    expect(trainingRate(days, 'endurance', TODAY)).toBe(DEFAULT_TRAINING_RATE);
  });

  it('Verbrauch und Reichweite je Rhythmus', () => {
    expect(stockDaysLeft(supplement({ stock: 100 }), NO_TRAINING, TODAY)).toBe(20);
    expect(stockDaysLeft(supplement({ stock: 4 }), NO_TRAINING, TODAY)).toBe(0);
    expect(stockDaysLeft(supplement(), NO_TRAINING, TODAY)).toBeNull();
    const twoCaps = supplement({
      unit: 'Kapseln',
      doses: [dose({ amount: 1 }), dose({ id: 'd2', amount: 1, time: '20:00' })],
      schedule: 'weekdays',
      weekdays: [1, 3, 5],
      stock: 12,
    });
    expect(dailyUse(twoCaps, NO_TRAINING, TODAY)).toBeCloseTo(6 / 7);
    expect(stockDaysLeft(twoCaps, NO_TRAINING, TODAY)).toBe(14);
    const pre = supplement({ schedule: 'training', stock: 30 });
    expect(stockDaysLeft(pre, NO_TRAINING, TODAY)).toBe(Math.floor(30 / (5 * (3 / 7))));
  });

  it('warnt bis einschließlich der Schwelle', () => {
    expect(isLowStock(7, 7)).toBe(true);
    expect(isLowStock(8, 7)).toBe(false);
    expect(isLowStock(null, 7)).toBe(false);
    expect(formatDaysLeft(0)).toBe('Bestand aufgebraucht');
    expect(formatDaysLeft(1)).toBe('Reicht noch 1 Tag');
    expect(formatDaysLeft(5)).toBe('Reicht noch 5 Tage');
  });
});

describe('Verlauf', () => {
  it('Quote bis gestern ab Anlage, ohne nicht fällige Tage', () => {
    // Angelegt am 28.10., fällig 28.10.–01.11. = 5 Tage (heute zählt nicht)
    const item = {
      supplement: supplement({ createdAt: new Date(2026, 9, 28, 10).toISOString() }),
      intakes: ['2026-10-28', '2026-10-30', '2026-11-01', TODAY].map((date) => ({
        doseId: 'd1',
        date,
        takenAt: iso(2),
      })),
    };
    expect(supplementAdherence(item, NO_TRAINING, TODAY)).toEqual({
      taken: 3,
      due: 5,
      percent: 60,
    });

    const weekdays = {
      ...item,
      supplement: { ...item.supplement, schedule: 'weekdays' as const, weekdays: [5] },
    };
    // Nur Freitag, 30.10.
    expect(supplementAdherence(weekdays, NO_TRAINING, TODAY)).toEqual({
      taken: 1,
      due: 1,
      percent: 100,
    });
    const fresh = { supplement: supplement({ createdAt: iso(2) }), intakes: [] };
    expect(supplementAdherence(fresh, NO_TRAINING, TODAY)).toBeNull();
  });

  it('Heatmap: Anteil genommener Einnahmen je Tag', () => {
    const item = {
      supplement: supplement({ doses: [dose(), dose({ id: 'd2' })] }),
      intakes: [
        { doseId: 'd1', date: '2026-11-01', takenAt: iso(1) },
        { doseId: 'd1', date: TODAY, takenAt: iso(2) },
        { doseId: 'd2', date: TODAY, takenAt: iso(2) },
        { doseId: 'weg', date: '2026-10-31', takenAt: iso(1) },
      ],
    };
    expect([...intakePercentByDay(item, TODAY)]).toEqual([
      ['2026-11-01', 50],
      [TODAY, 100],
    ]);
    expect([0, 30, 50, 100].map(adherenceLevel)).toEqual([0, 1, 2, 4]);
  });
});

describe('Übernahme aus Gewohnheiten', () => {
  let counter = 0;
  const newId = () => `id-${++counter}`;
  const base = {
    name: 'Supplements',
    unit: '',
    target: 1,
    items: [],
    group: 'evening' as const,
    frequency: 'weekdays' as const,
    weekdays: [1, 4],
  };

  it('Unterpunkte werden je ein Supplement mit Tageszeit aus der Gruppe', () => {
    const result = supplementsFromHabit(
      {
        ...base,
        kind: 'items',
        items: [
          { id: 'k', name: 'Kreatin', target: 5, unit: 'g', step: 5 },
          { id: 'o', name: 'Omega-3', target: 2, unit: 'Kapseln', step: 1 },
        ],
      },
      newId,
    );
    expect(result).toEqual([
      {
        itemId: 'k',
        name: 'Kreatin',
        unit: 'g',
        dose: { id: 'id-1', amount: 5, timing: 'period', time: null, period: 'evening' },
        schedule: 'weekdays',
        weekdays: [1, 4],
      },
      expect.objectContaining({ itemId: 'o', name: 'Omega-3', unit: 'Kapseln' }),
    ]);
  });

  it('Zählen wird ein Supplement, „x-mal pro Woche“ wird täglich', () => {
    const [only, ...rest] = supplementsFromHabit(
      {
        ...base,
        kind: 'count',
        name: 'Kreatin',
        unit: 'g',
        target: 5,
        group: 'other',
        frequency: 'weekly',
      },
      newId,
    );
    expect(rest).toEqual([]);
    expect(only).toMatchObject({
      itemId: null,
      name: 'Kreatin',
      dose: { amount: 5, period: 'morning' },
      schedule: 'daily',
      weekdays: [],
    });
    expect(supplementsFromHabit({ ...base, kind: 'check' }, newId)).toEqual([]);
  });

  it('nur aktive Gewohnheiten mit Mengen kommen in Frage', () => {
    expect(isSupplementHabitCandidate({ kind: 'items', archivedAt: null })).toBe(true);
    expect(isSupplementHabitCandidate({ kind: 'count', archivedAt: null })).toBe(true);
    expect(isSupplementHabitCandidate({ kind: 'check', archivedAt: null })).toBe(false);
    expect(isSupplementHabitCandidate({ kind: 'items', archivedAt: iso(1) })).toBe(false);
  });
});
