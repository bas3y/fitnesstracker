import {
  checksInWeek,
  formatHabitFrequency,
  formatMonth,
  formatStreak,
  habitStreak,
  isHabitDue,
  monthWeeks,
  shiftMonth,
  weekStart,
  type HabitSchedule,
} from './habits';

const daily: HabitSchedule = { frequency: 'daily', timesPerWeek: 3, weekdays: [] };
/** Montag und Donnerstag */
const monThu: HabitSchedule = { frequency: 'weekdays', timesPerWeek: 3, weekdays: [1, 4] };
const twicePerWeek: HabitSchedule = { frequency: 'weekly', timesPerWeek: 2, weekdays: [] };

// 2026-10-26 ist ein Montag
const MONDAY = '2026-10-26';
const SUNDAY = '2026-11-01';

describe('isHabitDue', () => {
  it('täglich und pro Woche stehen jeden Tag an, Wochentage nur an ihren Tagen', () => {
    expect(isHabitDue(daily, MONDAY)).toBe(true);
    expect(isHabitDue(twicePerWeek, '2026-10-27')).toBe(true);
    expect(isHabitDue(monThu, MONDAY)).toBe(true);
    expect(isHabitDue(monThu, '2026-10-27')).toBe(false);
  });
});

describe('formatHabitFrequency', () => {
  it('beschreibt den Rhythmus', () => {
    expect(formatHabitFrequency(daily)).toBe('Täglich');
    expect(formatHabitFrequency(twicePerWeek)).toBe('2× pro Woche');
    expect(formatHabitFrequency(monThu)).toBe('Mo, Do');
  });
});

describe('Wochen', () => {
  it('weekStart liefert den Montag, auch für den Sonntag', () => {
    expect(weekStart(MONDAY)).toBe(MONDAY);
    expect(weekStart(SUNDAY)).toBe(MONDAY);
    expect(weekStart('2026-11-02')).toBe('2026-11-02');
  });

  it('checksInWeek zählt nur Tage der Woche', () => {
    const dates = ['2026-10-25', MONDAY, SUNDAY, '2026-11-02'];
    expect(checksInWeek(dates, '2026-10-28')).toBe(2);
  });
});

describe('habitStreak täglich', () => {
  it('ohne Einträge ist alles 0', () => {
    expect(habitStreak(daily, [], MONDAY)).toEqual({ current: 0, best: 0, unit: 'days' });
  });

  it('zählt aufeinanderfolgende Tage bis heute', () => {
    const dates = ['2026-10-24', '2026-10-25', MONDAY];
    expect(habitStreak(daily, dates, MONDAY)).toMatchObject({ current: 3, best: 3 });
  });

  it('heute noch offen unterbricht die Serie nicht', () => {
    const dates = ['2026-10-24', '2026-10-25'];
    expect(habitStreak(daily, dates, MONDAY)).toMatchObject({ current: 2, best: 2 });
  });

  it('ein verpasster Tag beendet die Serie, der Bestwert bleibt', () => {
    const dates = ['2026-10-20', '2026-10-21', '2026-10-22', '2026-10-25', MONDAY];
    expect(habitStreak(daily, dates, MONDAY)).toMatchObject({ current: 2, best: 3 });
  });

  it('gestern und heute verpasst heißt keine aktuelle Serie', () => {
    expect(habitStreak(daily, ['2026-10-24'], MONDAY)).toMatchObject({ current: 0, best: 1 });
  });

  it('ignoriert Tage nach heute und ist unabhängig von der Reihenfolge', () => {
    const dates = [MONDAY, '2026-10-27', '2026-10-25'];
    expect(habitStreak(daily, dates, MONDAY)).toMatchObject({ current: 2, best: 2 });
  });

  it('läuft über die Zeitumstellung (25.10.2026) und den Jahreswechsel', () => {
    const october = ['2026-10-24', '2026-10-25', '2026-10-26'];
    expect(habitStreak(daily, october, '2026-10-26').current).toBe(3);
    const newYear = ['2026-12-31', '2027-01-01'];
    expect(habitStreak(daily, newYear, '2027-01-01').current).toBe(2);
  });
});

describe('habitStreak an Wochentagen', () => {
  it('Tage dazwischen unterbrechen die Serie nicht', () => {
    const dates = ['2026-10-19', '2026-10-22', MONDAY];
    expect(habitStreak(monThu, dates, '2026-10-28')).toMatchObject({ current: 3, best: 3 });
  });

  it('ein verpasster Termin beendet die Serie auch an einem freien Tag', () => {
    // Do 22.10. verpasst, heute ist Sonntag und es steht nichts an
    expect(habitStreak(monThu, ['2026-10-19'], '2026-10-25').current).toBe(0);
  });

  it('heute fällig und offen unterbricht nicht', () => {
    expect(habitStreak(monThu, ['2026-10-22'], MONDAY).current).toBe(1);
  });

  it('erledigte Tage außerhalb des Rhythmus zählen nicht', () => {
    expect(habitStreak(monThu, ['2026-10-27'], '2026-10-28')).toMatchObject({
      current: 0,
      best: 0,
    });
  });
});

describe('habitStreak pro Woche', () => {
  it('zählt Wochen mit erreichtem Ziel', () => {
    const dates = ['2026-10-12', '2026-10-13', '2026-10-19', '2026-10-25'];
    expect(habitStreak(twicePerWeek, dates, '2026-10-28')).toEqual({
      current: 2,
      best: 2,
      unit: 'weeks',
    });
  });

  it('die laufende Woche zählt erst mit erreichtem Ziel und bricht nichts', () => {
    const dates = ['2026-10-19', '2026-10-20', MONDAY];
    expect(habitStreak(twicePerWeek, dates, '2026-10-28').current).toBe(1);
    expect(habitStreak(twicePerWeek, [...dates, '2026-10-27'], '2026-10-28').current).toBe(2);
  });

  it('eine verfehlte Woche beendet die Serie', () => {
    const dates = ['2026-10-05', '2026-10-06', '2026-10-12', '2026-10-19', '2026-10-20'];
    expect(habitStreak(twicePerWeek, dates, '2026-10-28')).toMatchObject({ current: 1, best: 1 });
  });
});

describe('formatStreak', () => {
  it('beugt Tage und Wochen', () => {
    expect(formatStreak(1, 'days')).toBe('1 Tag');
    expect(formatStreak(0, 'days')).toBe('0 Tage');
    expect(formatStreak(1, 'weeks')).toBe('1 Woche');
    expect(formatStreak(3, 'weeks')).toBe('3 Wochen');
  });
});

describe('Kalender', () => {
  it('shiftMonth wechselt auch das Jahr', () => {
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
  });

  it('formatMonth schreibt den Monat aus', () => {
    expect(formatMonth('2026-10')).toBe('Oktober 2026');
  });

  it('monthWeeks beginnt am Montag und lässt Nachbarmonate leer', () => {
    // Oktober 2026 beginnt an einem Donnerstag und endet an einem Samstag
    const weeks = monthWeeks('2026-10');
    expect(weeks).toHaveLength(5);
    expect(weeks[0]).toEqual([
      null,
      null,
      null,
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
      '2026-10-04',
    ]);
    expect(weeks[4]).toEqual([
      '2026-10-26',
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
      null,
    ]);
    expect(weeks.flat().filter(Boolean)).toHaveLength(31);
  });

  it('monthWeeks kommt mit Monaten aus, die am Montag beginnen oder am Sonntag enden', () => {
    // Februar 2027 beginnt an einem Montag und endet an einem Sonntag
    const weeks = monthWeeks('2027-02');
    expect(weeks).toHaveLength(4);
    expect(weeks[0]?.[0]).toBe('2027-02-01');
    expect(weeks[3]?.[6]).toBe('2027-02-28');
  });
});
