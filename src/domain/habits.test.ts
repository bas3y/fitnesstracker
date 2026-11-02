import {
  amountInWeek,
  checksInWeek,
  dayAmount,
  doneDates,
  endPause,
  formatHabitAmount,
  formatHabitFrequency,
  formatHabitTarget,
  formatMonth,
  formatStreak,
  habitCompletion,
  habitDayProgress,
  habitStreak,
  isHabitDoneOn,
  isHabitDue,
  isHabitShownOn,
  isPausedOn,
  isSingleTap,
  itemsDone,
  monthWeeks,
  quitAmounts,
  quitStreak,
  shiftMonth,
  startPause,
  weekStart,
  type HabitRules,
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

describe('Pausen', () => {
  const pausedThu = (to: string | null): HabitSchedule => ({
    ...daily,
    pauses: [{ from: '2026-10-22', to }],
  });

  it('isPausedOn gilt ab `from` bis vor `to`', () => {
    const habit = { pauses: [{ from: '2026-10-22', to: '2026-10-24' }] };
    expect(isPausedOn(habit, '2026-10-21')).toBe(false);
    expect(isPausedOn(habit, '2026-10-22')).toBe(true);
    expect(isPausedOn(habit, '2026-10-23')).toBe(true);
    expect(isPausedOn(habit, '2026-10-24')).toBe(false);
    expect(isPausedOn({ pauses: [{ from: '2026-10-22', to: null }] }, '2030-01-01')).toBe(true);
  });

  it('pausierte Tage unterbrechen keine Serie und zählen nicht mit', () => {
    // Mi erledigt, Do–Sa pausiert, So und Mo erledigt
    const dates = ['2026-10-21', '2026-10-25', MONDAY];
    expect(habitStreak(pausedThu('2026-10-25'), dates, MONDAY)).toMatchObject({ current: 3 });
    expect(habitStreak(daily, dates, MONDAY)).toMatchObject({ current: 2 });
  });

  it('eine laufende Pause hält die Serie', () => {
    expect(habitStreak(pausedThu(null), ['2026-10-20', '2026-10-21'], MONDAY).current).toBe(2);
  });

  it('pro Woche: eine Woche mit Pause bricht nichts, zählt aber nur mit erreichtem Ziel', () => {
    const habit = { ...twicePerWeek, pauses: [{ from: '2026-10-19', to: '2026-10-21' }] };
    const dates = ['2026-10-12', '2026-10-13', MONDAY, '2026-10-27'];
    expect(habitStreak(habit, dates, '2026-10-28').current).toBe(2);
  });

  it('startPause und endPause', () => {
    const started = startPause([], '2026-10-22');
    expect(started).toEqual([{ from: '2026-10-22', to: null }]);
    expect(startPause(started, '2026-10-23')).toEqual(started);
    expect(endPause(started, '2026-10-25')).toEqual([{ from: '2026-10-22', to: '2026-10-25' }]);
    // Am selben Tag fortgesetzt: Die Pause entfällt
    expect(endPause(started, '2026-10-22')).toEqual([]);
  });

  it('isHabitShownOn blendet Archivierte, Pausierte und nicht fällige aus', () => {
    const base = { ...monThu, pauses: [], archivedAt: null };
    expect(isHabitShownOn(base, MONDAY)).toBe(true);
    expect(isHabitShownOn(base, '2026-10-27')).toBe(false);
    expect(isHabitShownOn({ ...base, archivedAt: '2026-10-20T10:00:00.000Z' }, MONDAY)).toBe(false);
    expect(isHabitShownOn({ ...base, pauses: [{ from: MONDAY, to: null }] }, MONDAY)).toBe(false);
  });
});

describe('Mengen und Arten', () => {
  const rules = (overrides: Partial<HabitRules>): HabitRules => ({
    ...daily,
    kind: 'check',
    target: 1,
    items: [],
    ...overrides,
  });
  const entries = [
    { date: MONDAY, itemId: null, amount: 6 },
    { date: MONDAY, itemId: 'a', amount: 5 },
    { date: MONDAY, itemId: 'b', amount: 1 },
    { date: '2026-10-27', itemId: 'a', amount: 5 },
    { date: '2026-10-27', itemId: 'b', amount: 2 },
  ];
  const items = [
    { id: 'a', name: 'Kreatin', target: 5, unit: 'g', step: 5 },
    { id: 'b', name: 'Omega-3', target: 2, unit: 'Kapseln', step: 1 },
  ];

  it('dayAmount trennt Gewohnheit und Unterpunkte', () => {
    expect(dayAmount(entries, MONDAY)).toBe(6);
    expect(dayAmount(entries, MONDAY, 'b')).toBe(1);
    expect(dayAmount(entries, '2026-10-28')).toBe(0);
  });

  it('isHabitDoneOn je Art', () => {
    expect(isHabitDoneOn(rules({ kind: 'check' }), entries, MONDAY)).toBe(true);
    expect(isHabitDoneOn(rules({ kind: 'count', target: 6 }), entries, MONDAY)).toBe(true);
    expect(isHabitDoneOn(rules({ kind: 'count', target: 10 }), entries, MONDAY)).toBe(false);
    expect(isHabitDoneOn(rules({ kind: 'items', items }), entries, MONDAY)).toBe(false);
    expect(isHabitDoneOn(rules({ kind: 'items', items }), entries, '2026-10-27')).toBe(true);
    expect(isHabitDoneOn(rules({ kind: 'items', items: [] }), entries, MONDAY)).toBe(false);
    expect(isHabitDoneOn(rules({ kind: 'quit', target: 5 }), entries, MONDAY)).toBe(false);
    expect(isHabitDoneOn(rules({ kind: 'quit', target: 0 }), entries, '2026-10-27')).toBe(true);
  });

  it('itemsDone und doneDates', () => {
    const habit = rules({ kind: 'items', items });
    expect(itemsDone(habit, entries, MONDAY)).toBe(1);
    expect(doneDates(habit, entries)).toEqual(['2026-10-27']);
    expect(doneDates(rules({ kind: 'quit', target: 0 }), entries)).toEqual([]);
  });

  it('Unterpunkte gelöschter Einträge zählen nicht mehr', () => {
    const onlyA = rules({ kind: 'items', items: [items[0]!] });
    expect(doneDates(onlyA, entries)).toEqual([MONDAY, '2026-10-27']);
  });

  it('isSingleTap, wenn ein Tipp das Ziel erreicht', () => {
    expect(isSingleTap({ target: 5, step: 5 })).toBe(true);
    expect(isSingleTap({ target: 2, step: 1 })).toBe(false);
  });

  it('formatiert Mengen und Ziele', () => {
    expect(formatHabitAmount(2.5, 'l')).toBe('2,5 l');
    expect(formatHabitAmount(3, '')).toBe('3');
    const base = { unit: 'Zigaretten', items: [] };
    expect(formatHabitTarget({ ...base, kind: 'quit', target: 0 })).toBe('Ganz aufhören');
    expect(formatHabitTarget({ ...base, kind: 'quit', target: 5 })).toBe(
      'Höchstens 5 Zigaretten am Tag',
    );
    expect(formatHabitTarget({ ...base, kind: 'count', target: 10, unit: 'Seiten' })).toBe(
      '10 Seiten',
    );
    expect(formatHabitTarget({ ...base, kind: 'items', target: 1, items })).toBe('2 Unterpunkte');
    expect(formatHabitTarget({ ...base, kind: 'check', target: 1 })).toBeNull();
  });
});

describe('quitStreak', () => {
  const quit = { target: 0, startDate: '2026-10-20', pauses: [] };
  const relapse = (date: string, amount = 1) => ({ date, itemId: null, amount });

  it('zählt Tage ab dem Start ohne Rückfall, heute eingeschlossen', () => {
    expect(quitStreak(quit, [], MONDAY)).toEqual({ current: 7, best: 7, unit: 'days' });
  });

  it('ein Rückfall setzt zurück, heute sofort', () => {
    expect(quitStreak(quit, [relapse('2026-10-23')], MONDAY)).toMatchObject({
      current: 3,
      best: 3,
    });
    expect(quitStreak(quit, [relapse(MONDAY)], MONDAY)).toMatchObject({ current: 0, best: 6 });
  });

  it('Reduzieren: unter dem Limit zählt als geschafft', () => {
    const reduce = { ...quit, target: 3 };
    const entries = [relapse('2026-10-21', 3), relapse('2026-10-23', 4)];
    expect(quitStreak(reduce, entries, MONDAY)).toMatchObject({ current: 3, best: 3 });
  });

  it('Pausen zählen nicht mit, Einträge nach heute auch nicht', () => {
    const paused = { ...quit, pauses: [{ from: '2026-10-22', to: '2026-10-24' }] };
    expect(quitStreak(paused, [relapse('2026-10-27')], MONDAY).current).toBe(5);
  });

  it('ohne Startdatum ab dem ersten Eintrag', () => {
    const noStart = { ...quit, startDate: null, target: 2 };
    expect(quitStreak(noStart, [relapse('2026-10-24', 1)], MONDAY).current).toBe(3);
  });

  it('amountInWeek summiert Mo–So', () => {
    const entries = [relapse('2026-10-25', 2), relapse(MONDAY, 3), relapse(SUNDAY, 1)];
    expect(amountInWeek(entries, '2026-10-28')).toBe(4);
  });
});

describe('Verlauf', () => {
  const created = '2026-10-23T08:00:00.000Z';
  const habit = {
    ...daily,
    kind: 'check' as const,
    target: 1,
    items: [],
    pauses: [],
    startDate: null,
    createdAt: created,
    archivedAt: null,
  };

  it('habitCompletion: Anteil je Tag ab Anlage, ohne Aufhören', () => {
    const items = [
      { habit, entries: [{ date: '2026-10-24', itemId: null, amount: 1 }] },
      {
        habit: { ...habit, frequency: 'weekdays' as const, weekdays: [6] },
        entries: [{ date: '2026-10-24', itemId: null, amount: 1 }],
      },
      { habit: { ...habit, kind: 'quit' as const, target: 0 }, entries: [] },
    ];
    expect(habitCompletion(items, null, '2026-10-25')).toEqual([
      { date: '2026-10-23', value: 0 },
      { date: '2026-10-24', value: 100 },
      { date: '2026-10-25', value: 0 },
    ]);
    expect(habitCompletion(items, '2026-10-25', '2026-10-25')).toHaveLength(1);
  });

  it('habitCompletion lässt Tage ohne Fälliges weg (Pause, Archiv)', () => {
    const paused = { ...habit, pauses: [{ from: '2026-10-24', to: null }] };
    expect(habitCompletion([{ habit: paused, entries: [] }], null, '2026-10-25')).toEqual([
      { date: '2026-10-23', value: 0 },
    ]);
    const archived = { ...habit, archivedAt: '2026-10-24T12:00:00.000Z' };
    expect(habitCompletion([{ habit: archived, entries: [] }], null, '2026-10-25')).toHaveLength(1);
  });

  it('habitDayProgress: Stand des Tages ohne Aufhören, Pausierte und nicht Fällige', () => {
    const items = [
      { habit, entries: [{ date: '2026-10-24', itemId: null, amount: 1 }] },
      { habit, entries: [] },
      { habit: { ...habit, frequency: 'weekdays' as const, weekdays: [1] }, entries: [] },
      { habit: { ...habit, pauses: [{ from: '2026-10-20', to: null }] }, entries: [] },
      { habit: { ...habit, kind: 'quit' as const, target: 0 }, entries: [] },
    ];
    expect(habitDayProgress(items, '2026-10-24')).toEqual({ done: 1, total: 2 });
    expect(habitDayProgress([], '2026-10-24')).toEqual({ done: 0, total: 0 });
  });

  it('quitAmounts: auch Tage ohne Eintrag ab dem Start', () => {
    const quit = { ...habit, kind: 'quit' as const, target: 0, startDate: '2026-10-24' };
    expect(
      quitAmounts(
        { habit: quit, entries: [{ date: '2026-10-25', itemId: null, amount: 2 }] },
        null,
        MONDAY,
      ),
    ).toEqual([
      { date: '2026-10-24', value: 0 },
      { date: '2026-10-25', value: 2 },
      { date: MONDAY, value: 0 },
    ]);
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
