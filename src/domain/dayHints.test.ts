import {
  buildDayHint,
  dayHintKey,
  dayHintPhase,
  hoursMinutes,
  listNames,
  type DayHintInput,
  type DayHintTraining,
} from './dayHints';

const at = (time: string) => new Date(`2026-11-13T${time}:00`);

const training = (end: string, records: string[] = []): DayHintTraining => ({
  name: 'Oberkörper A',
  endedAt: at(end),
  summary: '52 min · 18 Sätze',
  records,
  to: '/training/history/w1',
});

const input = (overrides: Partial<DayHintInput> = {}): DayHintInput => ({
  now: at('08:00'),
  today: '2026-11-13',
  name: '',
  sleepSeconds: 6 * 3600 + 40 * 60,
  sleepGoalSeconds: 7.5 * 3600,
  waterMl: 1750,
  waterGoalMl: 2500,
  plannedDay: { name: 'Oberkörper A', scheduled: true },
  morningSupplements: ['Vitamin D'],
  openSupplements: ['Vitamin D', 'Magnesium'],
  openHabits: ['Lesen'],
  lastTraining: null,
  nutrition: {
    proteinOnly: false,
    hasEntries: true,
    kcal: 1850,
    kcalGoal: 2400,
    protein: 110,
    proteinGoal: 150,
  },
  ...overrides,
});

describe('dayHintPhase', () => {
  it('morgens 4–11 Uhr, abends ab 18 Uhr, tagsüber nichts', () => {
    expect(dayHintPhase(at('03:59'), null)).toBeNull();
    expect(dayHintPhase(at('04:00'), null)).toBe('morning');
    expect(dayHintPhase(at('10:59'), null)).toBe('morning');
    expect(dayHintPhase(at('11:00'), null)).toBeNull();
    expect(dayHintPhase(at('17:59'), null)).toBeNull();
    expect(dayHintPhase(at('18:00'), null)).toBe('evening');
  });

  it('bis 3 h nach dem Training gilt die Trainingskarte', () => {
    expect(dayHintPhase(at('14:00'), training('12:30'))).toBe('afterTraining');
    expect(dayHintPhase(at('19:00'), training('17:00'))).toBe('afterTraining');
    expect(dayHintPhase(at('15:31'), training('12:30'))).toBeNull();
    // Training in der Zukunft (Uhr verstellt) zählt nicht
    expect(dayHintPhase(at('12:00'), training('12:30'))).toBeNull();
  });
});

describe('buildDayHint', () => {
  it('morgens: Schlaf, Plan, Supplements und Weg zum Training', () => {
    const hint = buildDayHint(input({ name: 'Alex' }), null)!;
    expect(hint).toMatchObject({
      phase: 'morning',
      key: '2026-11-13:morning',
      title: 'Guten Morgen, Alex!',
      action: { kind: 'training' },
    });
    expect(hint.lines).toEqual([
      'Schlaf: 6 h 40 min – 50 min unter deinem Ziel.',
      'Heute im Plan: Oberkörper A.',
      'Supplements: Vitamin D.',
    ]);
  });

  it('morgens ohne Schlaf und Plan: Schlaf eintragen', () => {
    const hint = buildDayHint(
      input({
        sleepSeconds: null,
        plannedDay: null,
        morningSupplements: [],
      }),
      null,
    )!;
    expect(hint.lines).toEqual(['Schlaf von letzter Nacht noch nicht eingetragen.']);
    expect(hint.action).toMatchObject({ kind: 'sleep' });
    const rotation = buildDayHint(
      input({ plannedDay: { name: 'Beine', scheduled: false }, sleepSeconds: 8 * 3600 }),
      null,
    )!;
    expect(rotation.lines.slice(0, 2)).toEqual([
      'Schlaf: 8 h – Ziel erreicht.',
      'Nächstes Training: Beine.',
    ]);
  });

  it('nach dem Training: Kurzfassung und Rekorde', () => {
    const hint = buildDayHint(
      input({ now: at('14:00'), lastTraining: training('13:00', ['Bankdrücken', 'Klimmzüge']) }),
      null,
    )!;
    expect(hint).toMatchObject({
      phase: 'afterTraining',
      title: 'Oberkörper A geschafft',
      lines: ['52 min · 18 Sätze', '2 neue Rekorde: Bankdrücken und Klimmzüge.'],
      action: { kind: 'workout', to: '/training/history/w1' },
    });
  });

  it('abends: Ernährungsbericht, Wasser, Offenes', () => {
    const hint = buildDayHint(input({ now: at('20:00') }), null)!;
    expect(hint.title).toBe('Deine Tagesbilanz');
    expect(hint.lines).toEqual([
      'Kalorien: 1850 von 2400 kcal.',
      'Protein: 110 g – 40 g fehlen.',
      'Wasser: noch 0,75 l bis zum Ziel.',
      'Offen: Lesen.',
      'Supplements offen: Vitamin D und Magnesium.',
    ]);
    expect(hint.action).toMatchObject({ kind: 'nutrition' });
  });

  it('abends ohne Mahlzeiten, nur Protein oder alles erledigt', () => {
    const empty = buildDayHint(
      input({
        now: at('20:00'),
        nutrition: { ...input().nutrition!, hasEntries: false, kcal: 0, protein: 0 },
      }),
      null,
    )!;
    expect(empty.lines[0]).toBe('Heute noch keine Mahlzeit eingetragen.');
    expect(empty.lines[1]).toBe('Wasser: noch 0,75 l bis zum Ziel.');

    const proteinOnly = buildDayHint(
      input({
        now: at('20:00'),
        nutrition: { ...input().nutrition!, proteinOnly: true, hasEntries: false, protein: 160 },
        openHabits: [],
      }),
      null,
    )!;
    expect(proteinOnly.lines[0]).toBe('Protein: 160 g – Ziel erreicht.');
    expect(proteinOnly.action).toBeNull();

    const done = buildDayHint(
      input({
        now: at('20:00'),
        nutrition: null,
        waterMl: 2500,
        openHabits: [],
        openSupplements: [],
      }),
      null,
    )!;
    expect(done.lines).toEqual(['Alles erledigt – stark!']);
    expect(done.action).toBeNull();
  });

  it('weggetippt bleibt weg, bis die nächste Tageszeit kommt', () => {
    const dismissed = dayHintKey('2026-11-13', 'morning');
    expect(buildDayHint(input(), dismissed)).toBeNull();
    expect(buildDayHint(input({ now: at('19:00') }), dismissed)?.phase).toBe('evening');
    expect(buildDayHint(input({ now: at('13:00') }), null)).toBeNull();
  });
});

describe('Hilfen', () => {
  it('zählt Namen auf', () => {
    expect(listNames([])).toBe('');
    expect(listNames(['A'])).toBe('A');
    expect(listNames(['A', 'B', 'C'])).toBe('A, B und C');
    expect(listNames(['A', 'B', 'C', 'D', 'E'])).toBe('A, B, C + 2 weitere');
  });

  it('schreibt Stunden und Minuten', () => {
    expect(hoursMinutes(50 * 60)).toBe('50 min');
    expect(hoursMinutes(2 * 3600)).toBe('2 h');
    expect(hoursMinutes(6 * 3600 + 40 * 60)).toBe('6 h 40 min');
  });
});
