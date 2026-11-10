import {
  enduranceSessionsToCsv,
  workoutsToCsv,
  type CsvEnduranceSession,
  type CsvSession,
  type CsvSet,
  type CsvWorkout,
} from './csv';

const START = new Date(2026, 9, 30, 18, 5).toISOString();

const set = (values: Partial<CsvSet> = {}): CsvSet => ({
  weight: 62.5,
  level: null,
  eccentricWeight: null,
  eccentricLevel: null,
  reps: 8,
  durationSeconds: null,
  rpe: null,
  rir: null,
  isWarmup: false,
  completedAt: '2026-10-30T17:10:00.000Z',
  ...values,
});

const workout = (
  values: Partial<CsvWorkout['workout']> = {},
  planDayName: string | null = null,
) => ({
  workout: {
    id: 'w1',
    startedAt: START,
    endedAt: new Date(Date.parse(START) + 45 * 60_000).toISOString(),
    notes: '',
    ...values,
  },
  planDayName,
});

const session = (name: string, sets: CsvSet[], workoutId = 'w1'): CsvSession => ({
  workoutId,
  exercise: { name },
  sets,
});

/** Zeilen ohne BOM und Kopfzeile, Zellen getrennt */
const rows = (csv: string) =>
  csv
    .slice(1)
    .split('\r\n')
    .slice(1, -1)
    .map((row) => row.split(';'));

describe('workoutsToCsv', () => {
  it('beginnt mit BOM und Kopfzeile in der gewählten Einheit', () => {
    const csv = workoutsToCsv([], [], 'lb');

    expect(csv.startsWith('﻿Datum;Uhrzeit;Training;Dauer (min);Übung;Satz;')).toBe(true);
    expect(csv).toContain(';Gewicht (lb);');
    expect(csv).toContain(';Negativ-Gewicht (lb);');
  });

  it('schreibt eine Zeile je Satz mit Dezimalkomma', () => {
    const csv = workoutsToCsv(
      [workout({ notes: 'Gut' }, 'Push')],
      [
        session('Bankdrücken', [
          set({ isWarmup: true, weight: 40, rpe: 6 }),
          set({ eccentricWeight: 80, rir: 2 }),
        ]),
      ],
      'kg',
    );

    expect(rows(csv)).toEqual([
      [
        '2026-10-30',
        '18:05',
        'Push',
        '45',
        'Bankdrücken',
        '1',
        'ja',
        '40',
        '',
        '8',
        '',
        '',
        '',
        '6',
        '',
        'Gut',
      ],
      [
        '2026-10-30',
        '18:05',
        'Push',
        '45',
        'Bankdrücken',
        '2',
        'nein',
        '62,5',
        '',
        '8',
        '',
        '80',
        '',
        '',
        '2',
        'Gut',
      ],
    ]);
  });

  it('lässt Gewicht bei Stufen leer und behält negative Zusatzgewichte als Zahl', () => {
    const csv = workoutsToCsv(
      [workout()],
      [
        session('Beinpresse', [set({ weight: null, level: 7, eccentricLevel: 9 })]),
        session('Klimmzüge', [set({ weight: -10, completedAt: '2026-10-30T17:20:00.000Z' })]),
        session('Plank', [
          set({
            weight: null,
            reps: null,
            durationSeconds: 60,
            completedAt: '2026-10-30T17:30:00.000Z',
          }),
        ]),
      ],
      'kg',
    );

    const [level, assisted, timed] = rows(csv);
    expect(level!.slice(7, 13)).toEqual(['', '7', '8', '', '', '9']);
    expect(assisted![7]).toBe('-10');
    expect(timed!.slice(7, 11)).toEqual(['', '', '', '60']);
  });

  it('rechnet Gewichte in lb um', () => {
    const csv = workoutsToCsv([workout()], [session('Curl', [set({ weight: 20 })])], 'lb');

    expect(rows(csv)[0]![7]).toBe('44,09');
  });

  it('sortiert Workouts und Übungen chronologisch', () => {
    const later = new Date(Date.parse(START) + 86_400_000).toISOString();
    const csv = workoutsToCsv(
      [workout({ id: 'w2', startedAt: later, endedAt: later }), workout()],
      [
        session('Dritte', [set()], 'w2'),
        session('Zweite', [set({ completedAt: '2026-10-30T17:40:00.000Z' })]),
        session('Erste', [set({ completedAt: '2026-10-30T17:20:00.000Z' })]),
      ],
      'kg',
    );

    expect(rows(csv).map((row) => row[4])).toEqual(['Erste', 'Zweite', 'Dritte']);
  });

  it('maskiert Trennzeichen, Anführungszeichen und Zeilenumbrüche', () => {
    const csv = workoutsToCsv(
      [workout({ notes: 'Knie "zwickt";\nleichter' })],
      [session('Curl', [set()])],
      'kg',
    );

    expect(csv).toContain(';"Knie ""zwickt"";\nleichter"\r\n');
  });

  it('entschärft Text, den Tabellenprogramme als Formel ausführen würden', () => {
    const csv = workoutsToCsv(
      [workout({ notes: '=HYPERLINK("x")' })],
      [session('-Test', [set()])],
      'kg',
    );

    expect(csv).toContain(";'-Test;");
    expect(csv).toContain(`;"'=HYPERLINK(""x"")"\r\n`);
  });
});

describe('enduranceSessionsToCsv', () => {
  const session = (values: Partial<CsvEnduranceSession> = {}): CsvEnduranceSession => ({
    sport: 'run',
    title: '',
    startedAt: START,
    durationSeconds: 1530,
    distanceMeters: 5000,
    elevationGainMeters: 42,
    avgHeartRate: 151,
    maxHeartRate: 178,
    calories: null,
    notes: '',
    ...values,
  });

  it('eine Zeile je Einheit, älteste zuerst, Strecke in der Anzeigeeinheit', () => {
    const csv = enduranceSessionsToCsv(
      [
        session({
          startedAt: new Date(2026, 10, 2, 7, 0).toISOString(),
          sport: 'ride',
          title: 'Pendeln; Arbeit',
        }),
        session(),
      ],
      'km',
    );
    const lines = csv.slice(1).trim().split('\r\n');
    expect(lines[0]).toBe(
      'Datum;Uhrzeit;Sportart;Titel;Dauer (min);Strecke (km);Höhenmeter (m);Ø Puls;Max. Puls;Kalorien;Notiz',
    );
    expect(lines[1]).toBe('2026-10-30;18:05;Laufen;;25,5;5;42;151;178;;');
    expect(lines[2]).toBe('2026-11-02;07:00;Radfahren;"Pendeln; Arbeit";25,5;5;42;151;178;;');
  });

  it('rechnet in Meilen um', () => {
    const csv = enduranceSessionsToCsv([session({ distanceMeters: 1609.344 })], 'mi');
    expect(csv).toContain('Strecke (mi)');
    expect(csv).toContain(';1;42;');
  });
});
