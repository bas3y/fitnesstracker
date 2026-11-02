import type { MuscleGroup } from '../db/types';
import {
  analyzeRest,
  availableMetrics,
  averagingWeeks,
  exerciseOverviews,
  exerciseProgress,
  exerciseSeries,
  filterByRange,
  focusHints,
  formatFocusHint,
  formatMetricValue,
  formatPercent,
  formatRestAdvice,
  hasEnoughHistory,
  heatLevel,
  heatmapWeeks,
  metricDisplayValue,
  metricLabel,
  muscleProgress,
  muscleVolumes,
  rangeStart,
  recentRecords,
  restByExercise,
  restPairs,
  sortOverviews,
  summarizeDays,
  trainsMuscle,
  weeklyMuscleSets,
  trainingProgress,
  weekSummary,
  type RestPair,
  type StatsExercise,
  type StatsSession,
  type StatsSet,
} from './stats';
import type { ExerciseKind } from './strength';
import { toDateInput } from './workout';

const NOW = new Date(2026, 9, 31, 12); // Sa, 31.10.2026

const barbell: ExerciseKind = { isTimed: false, isBodyweight: false, bodyWeightKg: null };
const bodyweight: ExerciseKind = { isTimed: false, isBodyweight: true, bodyWeightKg: 80 };

const set = (values: Partial<StatsSet> = {}): StatsSet => ({
  weight: 100,
  level: null,
  eccentricWeight: null,
  eccentricLevel: null,
  reps: 10,
  durationSeconds: null,
  isWarmup: false,
  workoutExerciseId: 'item',
  completedAt: '2026-10-01T10:00:00.000Z',
  ...values,
});

const exercise = (values: Partial<StatsExercise> = {}): StatsExercise => ({
  id: 'bench',
  name: 'Bankdrücken',
  category: 'strength',
  primaryMuscles: ['chest'],
  secondaryMuscles: ['triceps'],
  equipment: 'barbell',
  isTimed: false,
  ...values,
});

const session = (
  startedAt: string,
  sets: StatsSet[],
  values: Partial<StatsExercise> = {},
): StatsSession => ({
  startedAt,
  workoutId: `w-${startedAt}`,
  exercise: exercise(values),
  sets,
});

/** Lokaler Zeitpunkt, `days` Tage vor NOW */
const daysAgo = (days: number) => new Date(2026, 9, 31 - days, 12).toISOString();

describe('weekSummary', () => {
  it('zählt die laufende Woche ab Montag 0 Uhr, ohne Aufwärmsätze', () => {
    const monday = new Date(2026, 9, 26).toISOString();
    const sunday = new Date(2026, 9, 25, 23, 59).toISOString();
    const sessions = [
      session(sunday, [set()]),
      session(monday, [set({ isWarmup: true, weight: 40 }), set()]),
      session(daysAgo(0), [set(), set({ weight: 50 })], { id: 'row' }),
      { ...session(daysAgo(0), [set()], { id: 'curl' }), workoutId: `w-${daysAgo(0)}` },
    ];

    expect(weekSummary(sessions, null, NOW)).toEqual({
      workouts: 2,
      sets: 4,
      volumeKg: 1000 + 1000 + 500 + 1000,
    });
  });

  it('rechnet Körpergewichtsübungen mit Körpergewicht, Stufen und Halteübungen ohne Volumen', () => {
    const sessions = [
      session(daysAgo(0), [set({ weight: 10, reps: 5 })], { equipment: 'bodyweight' }),
      session(daysAgo(0), [set({ weight: null, level: 7 })]),
      session(daysAgo(0), [set({ reps: null, durationSeconds: 60 })], { isTimed: true }),
    ];

    expect(weekSummary(sessions, 80, NOW).volumeKg).toBe(450);
    expect(weekSummary(sessions, null, NOW).volumeKg).toBe(0);
    expect(weekSummary(sessions, 80, NOW).sets).toBe(3);
  });

  it('ist ohne Training in der Woche leer', () => {
    expect(weekSummary([session(daysAgo(30), [set()])], null, NOW)).toEqual({
      workouts: 0,
      sets: 0,
      volumeKg: 0,
    });
  });
});

describe('recentRecords', () => {
  const bench = (days: number, weight: number) => session(daysAgo(days), [set({ weight })]);

  it('liefert die neuesten Einheiten mit Rekord, die erste Einheit zählt nicht', () => {
    const rows = recentRecords([bench(20, 100), bench(10, 105), bench(5, 110)], null, 10);

    expect(rows.map((row) => row.startedAt)).toEqual([daysAgo(5), daysAgo(10)]);
    expect(rows[0]!.records.map((record) => record.type)).toEqual([
      'weight',
      'oneRepMax',
      'setVolume',
      'sessionVolume',
    ]);
    expect(rows[0]!.records[0]!.value).toBe(110);
  });

  it('sortiert über Übungen hinweg und begrenzt die Anzahl', () => {
    const row = (days: number, weight: number) =>
      session(daysAgo(days), [set({ weight })], { id: 'row', name: 'Rudern' });
    const rows = recentRecords([bench(20, 100), bench(10, 105), row(21, 60), row(3, 70)], null, 1);

    expect(rows.map((item) => item.exercise.name)).toEqual(['Rudern']);
  });

  it('ist ohne Rekorde leer', () => {
    expect(recentRecords([bench(20, 100), bench(10, 90)], null, 3)).toEqual([]);
  });
});

describe('trainingProgress', () => {
  const bench = (days: number, weight: number) =>
    session(daysAgo(days), [set({ weight, reps: 1 })]);

  it('Median der Kraftsteigerung, Workouts und Rekorde im Kalendermonat', () => {
    // NOW = 31.10.: 30 Tage zurück ist der 1.10., 31 Tage der 30.09.
    const sessions = [
      bench(80, 100),
      bench(40, 100),
      bench(31, 105),
      bench(20, 110),
      bench(10, 108),
      bench(5, 115),
      session(daysAgo(3), [set({ weight: 50 })], { id: 'cardio', category: 'cardio' }),
    ];
    const result = trainingProgress(sessions, null, NOW);
    // 3 Monate ab 31.07.: erste zwei Einheiten max. 100, letzte zwei max. 115
    expect(result.strengthPercent).toBeCloseTo(15);
    expect(result.exerciseCount).toBe(1);
    expect(result.workoutsThisMonth).toBe(4);
    expect(result.workoutsLastMonth).toBe(2);
    // Oktober: 110 (Gewicht, 1RM, Volumen Satz/Einheit) und 115 (dasselbe)
    expect(result.recordsThisMonth).toBe(8);
  });

  it('ohne genug Einheiten kein Prozentwert', () => {
    expect(trainingProgress([bench(5, 100)], null, NOW)).toMatchObject({
      strengthPercent: null,
      exerciseCount: 0,
      workoutsThisMonth: 1,
      recordsThisMonth: 0,
    });
  });
});

describe('Zeitraum', () => {
  it('beginnt jeweils am Tagesanfang, „Alles“ hat keinen Beginn', () => {
    expect(rangeStart('4w', NOW)).toEqual(new Date(2026, 9, 3));
    expect(rangeStart('3m', NOW)).toEqual(new Date(2026, 6, 31));
    expect(rangeStart('1y', NOW)).toEqual(new Date(2025, 9, 31));
    expect(rangeStart('all', NOW)).toBeNull();
  });

  it('filtert nach dem Trainingsbeginn, der erste Tag zählt mit', () => {
    const items = [
      { startedAt: daysAgo(29) },
      { startedAt: daysAgo(28) },
      { startedAt: daysAgo(0) },
    ];
    expect(filterByRange(items, '4w', NOW)).toEqual(items.slice(1));
    expect(filterByRange(items, 'all', NOW)).toEqual(items);
  });
});

describe('trainsMuscle', () => {
  it('trifft Haupt- und Hilfsmuskeln', () => {
    expect(trainsMuscle(exercise(), 'chest')).toBe(true);
    expect(trainsMuscle(exercise(), 'triceps')).toBe(true);
    expect(trainsMuscle(exercise(), 'quads')).toBe(false);
  });
});

describe('exerciseSeries', () => {
  it('liefert je Einheit max. Gewicht, 1RM und Volumen ohne Aufwärmsätze', () => {
    const [point] = exerciseSeries(
      [
        {
          startedAt: daysAgo(1),
          sets: [
            set({ isWarmup: true, weight: 200 }),
            set({ reps: 10 }),
            set({ weight: 90, reps: 12 }),
          ],
        },
      ],
      barbell,
    );
    expect(point!.values.weight).toBe(100);
    expect(point!.values.oneRepMax).toBeCloseTo(100 * (1 + 10 / 30));
    expect(point!.values.volume).toBe(100 * 10 + 90 * 12);
    expect(point!.values.reps).toBeUndefined();
  });

  it('lässt das 1RM aus, wenn alle Sätze über 12 Wdh. liegen', () => {
    const [point] = exerciseSeries([{ startedAt: daysAgo(1), sets: [set({ reps: 13 })] }], barbell);
    expect(point!.values.oneRepMax).toBeUndefined();
    expect(point!.values.weight).toBe(100);
  });

  it('mischt Stufen nie mit kg', () => {
    const [point] = exerciseSeries(
      [
        {
          startedAt: daysAgo(1),
          sets: [set({ weight: null, level: 7, reps: 11 }), set({ weight: 40, reps: 8 })],
        },
      ],
      barbell,
    );
    expect(point!.values).toMatchObject({ weight: 40, level: 7, levelReps: 11, volume: 320 });
  });

  it('zeigt bei Körpergewicht Wdh. und nutzt Körpergewicht + Zusatzgewicht', () => {
    const [point] = exerciseSeries(
      [{ startedAt: daysAgo(1), sets: [set({ weight: 10, reps: 6 })] }],
      bodyweight,
    );
    expect(point!.values).toMatchObject({ weight: 10, reps: 6, volume: 540 });
  });

  it('zeigt bei Halteübungen die Dauer', () => {
    const kind = { ...barbell, isTimed: true };
    const [point] = exerciseSeries(
      [{ startedAt: daysAgo(1), sets: [set({ weight: null, reps: null, durationSeconds: 60 })] }],
      kind,
    );
    expect(point!.values).toEqual({ duration: 60 });
  });

  it('führt Exzentrik als eigene Kennzahl', () => {
    const [point] = exerciseSeries(
      [{ startedAt: daysAgo(1), sets: [set({ eccentricWeight: 120 })] }],
      barbell,
    );
    expect(point!.values.eccentricWeight).toBe(120);
    expect(point!.values.weight).toBe(100);
  });

  it('lässt Einheiten ohne gültigen Satz weg', () => {
    expect(
      exerciseSeries([{ startedAt: daysAgo(1), sets: [set({ isWarmup: true })] }], barbell),
    ).toEqual([]);
  });
});

describe('availableMetrics', () => {
  it('zeigt Zusatzgewicht nur, wenn es je eines gab', () => {
    const groups = [{ startedAt: daysAgo(1), sets: [set({ weight: 0, reps: 8 })] }];
    expect(availableMetrics(exerciseSeries(groups, bodyweight))).toEqual([
      'oneRepMax',
      'volume',
      'reps',
    ]);
  });

  it('bietet ohne Körpergewicht kein 1RM und Volumen an', () => {
    const groups = [{ startedAt: daysAgo(1), sets: [set({ weight: 5, reps: 8 })] }];
    const kind = { ...bodyweight, bodyWeightKg: null };
    expect(availableMetrics(exerciseSeries(groups, kind))).toEqual(['weight', 'reps']);
  });
});

describe('Kennzahlen-Anzeige', () => {
  it('rechnet nur Gewichte in die Anzeigeeinheit um', () => {
    expect(metricDisplayValue('weight', 100, 'lb')).toBeCloseTo(220.5, 1);
    expect(metricDisplayValue('level', 7, 'lb')).toBe(7);
    expect(metricDisplayValue('reps', 10, 'lb')).toBe(10);
  });

  it('formatiert je Kennzahl passend', () => {
    expect(formatMetricValue('weight', 82.5, 'kg')).toBe('82,5 kg');
    expect(formatMetricValue('volume', 1234.6, 'kg')).toBe('1235 kg');
    expect(formatMetricValue('duration', 75, 'kg')).toBe('1:15');
    expect(formatMetricValue('reps', 8, 'kg')).toBe('8 Wdh.');
    expect(formatMetricValue('level', 7.5, 'kg')).toBe('7,5');
  });

  it('nennt Gewicht bei Körpergewichtsübungen Zusatzgewicht', () => {
    expect(metricLabel('weight', true)).toBe('Zusatzgewicht');
    expect(metricLabel('weight', false)).toBe('Gewicht');
  });

  it('unterscheidet Stufen-Kennzahlen von denen in kg', () => {
    expect(metricLabel('levelReps', false)).toBe('Wdh. (Stufe)');
    expect(metricLabel('eccentricLevel', false)).toBe('Exzentrik (Stufe)');
  });
});

describe('Heatmap', () => {
  it('fasst Sätze und Workouts je lokalem Tag zusammen, Aufwärmsätze zählen nicht', () => {
    const late = new Date(2026, 9, 30, 23, 30).toISOString();
    const days = summarizeDays([
      { ...session(late, [set(), set({ isWarmup: true })]), workoutId: 'a' },
      { ...session(late, [set()], { id: 'row' }), workoutId: 'a' },
      { ...session(daysAgo(1), [set()]), workoutId: 'b' },
    ]);
    expect(days.get('2026-10-30')).toEqual({ sets: 3, workoutIds: ['a', 'b'] });
  });

  it('baut Wochen Mo–So, die letzte endet mit heute', () => {
    const weeks = heatmapWeeks(new Map([['2026-10-26', 5]]), NOW, 53);
    expect(weeks).toHaveLength(53);
    const last = weeks.at(-1)!;
    expect(last.map((day) => day?.key ?? null)).toEqual([
      '2026-10-26',
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
      null,
    ]);
    expect(last[0]!.value).toBe(5);
    expect(last[1]!.value).toBe(0);
    expect(weeks[0]![0]!.key).toBe('2025-10-27');
  });

  it('verliert über die Zeitumstellung keinen Tag', () => {
    const keys = heatmapWeeks(new Map(), NOW, 53)
      .flat()
      .flatMap((day) => (day ? [day.key] : []));
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toHaveLength(52 * 7 + 6);
  });

  it('stuft nach Satzzahl ab', () => {
    expect([0, 1, 8, 9, 16, 17, 24, 25].map(heatLevel)).toEqual([0, 1, 1, 2, 2, 3, 3, 4]);
  });
});

describe('muscleVolumes', () => {
  it('zählt Hauptmuskeln voll, Hilfsmuskeln halb und mittelt über die Wochen', () => {
    const volumes = muscleVolumes([session(daysAgo(1), [set(), set(), set(), set()])], 2);
    expect(volumes).toEqual([
      { muscle: 'chest', setsPerWeek: 2 },
      { muscle: 'triceps', setsPerWeek: 1 },
    ]);
  });

  it('zählt nur Arbeitssätze von Kraftübungen', () => {
    expect(
      muscleVolumes(
        [
          session(daysAgo(1), [set({ isWarmup: true })]),
          session(daysAgo(1), [set()], { category: 'cardio' }),
        ],
        1,
      ),
    ).toEqual([]);
  });
});

describe('averagingWeeks', () => {
  it('nimmt den Zeitraum, wenn schon länger trainiert wird', () => {
    expect(averagingWeeks(daysAgo(200), '4w', NOW)).toBeCloseTo(4 + 0.5 / 7, 1);
  });

  it('beginnt nicht vor dem ersten Training und ist mindestens 1', () => {
    expect(averagingWeeks(daysAgo(14), '3m', NOW)).toBeCloseTo(2, 1);
    expect(averagingWeeks(daysAgo(1), '3m', NOW)).toBe(1);
    expect(averagingWeeks(undefined, '3m', NOW)).toBe(1);
  });
});

describe('weeklyMuscleSets', () => {
  it('liefert lückenlose Wochen ab Montag', () => {
    const weeks = weeklyMuscleSets(
      [session(new Date(2026, 9, 14, 12).toISOString(), [set(), set()])],
      'chest',
      NOW,
    );
    expect(weeks).toEqual([
      { weekStart: '2026-10-12', sets: 2 },
      { weekStart: '2026-10-19', sets: 0 },
      { weekStart: '2026-10-26', sets: 0 },
    ]);
  });

  it('wertet Hilfsmuskeln halb und liefert ohne Daten nichts', () => {
    const sessions = [session(daysAgo(1), [set(), set()])];
    expect(weeklyMuscleSets(sessions, 'triceps', NOW)).toEqual([
      { weekStart: '2026-10-26', sets: 1 },
    ]);
    expect(weeklyMuscleSets(sessions, 'quads', NOW)).toEqual([]);
  });
});

const weights = (values: number[]) =>
  values.map((weight, index) => ({
    startedAt: daysAgo(values.length - index),
    sets: [set({ weight, reps: 1 })],
  }));

describe('exerciseProgress', () => {
  it('vergleicht den Bestwert der ersten mit dem der letzten beiden Einheiten', () => {
    const result = exerciseProgress(weights([100, 90, 95, 110, 105]), barbell);
    expect(result).toMatchObject({ start: 100, end: 110, sessionCount: 5 });
    expect(result!.percent).toBeCloseTo(10);
  });

  it('erkennt Rückschritte', () => {
    expect(exerciseProgress(weights([100, 100, 90, 90]), barbell)!.percent).toBeCloseTo(-10);
  });

  it('braucht mindestens 4 Einheiten', () => {
    expect(exerciseProgress(weights([100, 110, 120]), barbell)).toBeNull();
  });

  it('rechnet Stufen getrennt von kg', () => {
    const groups = [5, 5, 6, 6].map((level, index) => ({
      startedAt: daysAgo(4 - index),
      sets: [set({ weight: null, level, reps: 1 })],
    }));
    expect(exerciseProgress(groups, barbell)!.percent).toBeCloseTo(20);
  });

  it('nutzt bei Halteübungen die Dauer', () => {
    const groups = [30, 30, 45, 45].map((durationSeconds, index) => ({
      startedAt: daysAgo(4 - index),
      sets: [set({ weight: null, reps: null, durationSeconds })],
    }));
    expect(exerciseProgress(groups, { ...barbell, isTimed: true })!.percent).toBeCloseTo(50);
  });

  it('fällt bei Körpergewicht ohne 1RM auf die Wdh. zurück', () => {
    const groups = [15, 15, 18, 18].map((reps, index) => ({
      startedAt: daysAgo(4 - index),
      sets: [set({ weight: 0, reps })],
    }));
    expect(exerciseProgress(groups, bodyweight)!.percent).toBeCloseTo(20);
  });
});

const progressSessions = (id: string, primary: MuscleGroup, values: number[]) =>
  values.map((weight, index) =>
    session(daysAgo(values.length - index), [set({ weight, reps: 1 })], {
      id,
      name: id,
      primaryMuscles: [primary],
      secondaryMuscles: [],
    }),
  );

describe('exerciseOverviews und Sortierung', () => {
  const overviews = exerciseOverviews(
    [
      ...progressSessions('Curl', 'biceps', [10, 10, 11, 11]),
      ...progressSessions('Bankdrücken', 'chest', [100, 100, 120, 120]),
      session(daysAgo(0), [set()], { id: 'Rudern', name: 'Rudern' }),
    ],
    null,
  );

  it('fasst Einheiten und Fortschritt je Übung zusammen', () => {
    const curl = overviews.find(({ exercise: item }) => item.id === 'Curl')!;
    expect(curl.sessionCount).toBe(4);
    expect(curl.progress!.percent).toBeCloseTo(10);
  });

  it('sortiert nach Fortschritt, ohne Fortschritt zuletzt', () => {
    expect(sortOverviews(overviews, 'progress').map((item) => item.exercise.name)).toEqual([
      'Bankdrücken',
      'Curl',
      'Rudern',
    ]);
  });

  it('sortiert nach Name und zuletzt trainiert', () => {
    expect(sortOverviews(overviews, 'name')[0]!.exercise.name).toBe('Bankdrücken');
    expect(sortOverviews(overviews, 'recent')[0]!.exercise.name).toBe('Rudern');
  });
});

describe('muscleProgress', () => {
  const rank = (sessions: StatsSession[]) => muscleProgress(exerciseOverviews(sessions, null));

  it('sortiert nach Fortschritt und nimmt den Median der Hauptmuskel-Übungen', () => {
    const result = rank([
      ...progressSessions('a', 'chest', [100, 100, 101, 101]),
      ...progressSessions('b', 'chest', [100, 100, 110, 110]),
      ...progressSessions('c', 'chest', [100, 100, 200, 200]),
      ...progressSessions('d', 'biceps', [100, 100, 120, 120]),
    ]);
    expect(result.map(({ muscle }) => muscle)).toEqual(['biceps', 'chest']);
    expect(result[1]).toMatchObject({ exerciseCount: 3 });
    expect(result[1]!.percent).toBeCloseTo(10);
  });

  it('zählt Hilfsmuskeln nicht', () => {
    const sessions = [100, 100, 120, 120].map((weight, index) =>
      session(daysAgo(4 - index), [set({ weight, reps: 1 })]),
    );
    expect(rank(sessions).map(({ muscle }) => muscle)).toEqual(['chest']);
  });
});

describe('focusHints', () => {
  const allMajor = (setsPerWeek: number) =>
    (
      [
        'chest',
        'shoulders',
        'lats',
        'upperBack',
        'biceps',
        'triceps',
        'abs',
        'glutes',
        'quads',
        'hamstrings',
      ] as MuscleGroup[]
    ).map((muscle) => ({ muscle, setsPerWeek }));

  it('nennt vernachlässigte große Gruppen zuerst, höchstens 3', () => {
    const volumes = allMajor(12).filter(({ muscle }) => muscle !== 'quads' && muscle !== 'lats');
    const hints = focusHints({
      volumes: [...volumes, { muscle: 'lats', setsPerWeek: 3 }],
      progress: [{ muscle: 'chest', percent: 0, exerciseCount: 1 }],
      enoughHistory: true,
    });
    expect(hints).toEqual([
      { muscle: 'quads', kind: 'neglected' },
      { muscle: 'lats', kind: 'neglected' },
      { muscle: 'chest', kind: 'stalledHighVolume' },
    ]);
  });

  it('markiert kleine Gruppen nie als vernachlässigt', () => {
    expect(focusHints({ volumes: allMajor(12), progress: [], enoughHistory: true })).toEqual([]);
  });

  it('wartet mit „vernachlässigt“, bis genug Zeit vergangen ist', () => {
    expect(focusHints({ volumes: [], progress: [], enoughHistory: false })).toEqual([]);
  });

  it('unterscheidet Stagnation nach Trainingsmenge', () => {
    const volumes = [...allMajor(12).slice(1), { muscle: 'chest' as const, setsPerWeek: 6 }];
    const hints = focusHints({
      volumes,
      progress: [
        { muscle: 'lats', percent: 0.5, exerciseCount: 1 },
        { muscle: 'chest', percent: -2, exerciseCount: 1 },
      ],
      enoughHistory: true,
    });
    expect(hints).toEqual([
      { muscle: 'chest', kind: 'stalledLowVolume' },
      { muscle: 'lats', kind: 'stalledHighVolume' },
    ]);
  });

  it('nennt die schwächste Gruppe, wenn keine stagniert', () => {
    expect(
      focusHints({
        volumes: allMajor(12),
        progress: [
          { muscle: 'chest', percent: 9, exerciseCount: 1 },
          { muscle: 'lats', percent: 3, exerciseCount: 1 },
        ],
        enoughHistory: true,
      }),
    ).toEqual([{ muscle: 'lats', kind: 'lowest' }]);
  });

  it('beschreibt jeden Hinweis auf Deutsch', () => {
    expect(formatFocusHint({ muscle: 'chest', kind: 'stalledHighVolume' })).toBe(
      'Brust: stagniert trotz viel Volumen, Übung oder Wdh.-Bereich wechseln',
    );
  });
});

describe('hasEnoughHistory', () => {
  it('braucht 2 Wochen seit dem ersten Training', () => {
    expect(hasEnoughHistory(undefined, NOW)).toBe(false);
    expect(hasEnoughHistory(daysAgo(13), NOW)).toBe(false);
    expect(hasEnoughHistory(daysAgo(14), NOW)).toBe(true);
  });
});

describe('formatPercent', () => {
  it('zeigt das Vorzeichen', () => {
    expect(formatPercent(8.04)).toBe('+8 %');
    expect(formatPercent(-3.26)).toBe('−3,3 %');
    expect(formatPercent(0)).toBe('0 %');
  });
});

const at = (seconds: number) => new Date(Date.UTC(2026, 9, 1, 10, 0, seconds)).toISOString();

describe('restPairs', () => {
  const pairsOf = (sets: StatsSet[]) => restPairs([{ startedAt: at(0), sets }], false);

  it('misst Satzende zu Satzende und den Rückgang der Wdh.', () => {
    expect(
      pairsOf([set({ reps: 10, completedAt: at(0) }), set({ reps: 8, completedAt: at(180) })]),
    ).toEqual([{ seconds: 180, dropPercent: 20 }]);
  });

  it('wertet eine Steigerung als negativen Abfall', () => {
    const [pair] = pairsOf([
      set({ reps: 10, completedAt: at(0) }),
      set({ reps: 11, completedAt: at(120) }),
    ]);
    expect(pair!.dropPercent).toBeCloseTo(-10);
  });

  it('vergleicht nur Arbeitssätze mit gleicher Last', () => {
    expect(
      pairsOf([
        set({ isWarmup: true, completedAt: at(0) }),
        set({ completedAt: at(120) }),
        set({ weight: 90, completedAt: at(240) }),
        set({ weight: null, level: 90, completedAt: at(360) }),
      ]),
    ).toEqual([]);
  });

  it('ignoriert nachträglich Abgehaktes und Unterbrechungen', () => {
    expect(
      pairsOf([
        set({ completedAt: at(0) }),
        set({ completedAt: at(0) }),
        set({ completedAt: at(29) }),
        set({ completedAt: at(1000) }),
      ]),
    ).toEqual([]);
  });

  it('paart nicht über verschiedene Einträge derselben Übung hinweg', () => {
    expect(
      pairsOf([
        set({ workoutExerciseId: 'a', completedAt: at(0) }),
        set({ workoutExerciseId: 'b', completedAt: at(120) }),
      ]),
    ).toEqual([]);
  });

  it('nutzt bei Halteübungen die Dauer', () => {
    const groups = [
      {
        startedAt: at(0),
        sets: [
          set({ reps: null, durationSeconds: 60, completedAt: at(0) }),
          set({ reps: null, durationSeconds: 45, completedAt: at(120) }),
        ],
      },
    ];
    expect(restPairs(groups, true)).toEqual([{ seconds: 120, dropPercent: 25 }]);
  });
});

const pairs = (count: number, seconds: number, dropPercent: number): RestPair[] =>
  Array.from({ length: count }, () => ({ seconds, dropPercent }));

describe('analyzeRest', () => {
  it('gruppiert nach Pausenlänge, die Grenze gehört zur längeren Gruppe', () => {
    const { buckets, pairCount } = analyzeRest([...pairs(2, 89, 10), ...pairs(2, 90, 20)]);
    expect(pairCount).toBe(4);
    expect(buckets.map(({ label, count, averageDrop }) => [label, count, averageDrop])).toEqual([
      ['unter 1:30', 2, 10],
      ['1:30–2:30', 2, 20],
    ]);
  });

  it('nennt fehlende Satzpaare bei zu wenig Daten', () => {
    expect(analyzeRest(pairs(14, 120, 30)).advice).toEqual({
      kind: 'notEnoughData',
      missingPairs: 1,
    });
  });

  it('braucht eine Pausenlänge mit genug Paaren', () => {
    const scattered = [
      ...pairs(4, 60, 10),
      ...pairs(4, 120, 10),
      ...pairs(4, 180, 10),
      ...pairs(4, 240, 10),
    ];
    expect(analyzeRest(scattered).advice.kind).toBe('notEnoughData');
  });

  it('empfiehlt längere Pausen, wenn sie spürbar mehr bringen', () => {
    expect(analyzeRest([...pairs(12, 120, 20), ...pairs(6, 180, 10)]).advice).toEqual({
      kind: 'longer',
      targetSeconds: 180,
    });
  });

  it('empfiehlt kürzere Pausen, wenn sie kaum etwas kosten', () => {
    expect(analyzeRest([...pairs(12, 180, 10), ...pairs(6, 120, 11)]).advice).toEqual({
      kind: 'shorter',
      targetSeconds: 120,
    });
  });

  it('lässt die Pause, wenn beides nicht zutrifft', () => {
    expect(analyzeRest([...pairs(12, 180, 10), ...pairs(6, 120, 20)]).advice).toEqual({
      kind: 'keep',
    });
  });

  it('bewertet bei nur einer Pausenlänge den Abfall selbst', () => {
    expect(analyzeRest(pairs(15, 120, 25)).advice).toEqual({ kind: 'longer', targetSeconds: 180 });
    expect(analyzeRest(pairs(15, 180, 3)).advice).toEqual({ kind: 'shorter', targetSeconds: 120 });
    expect(analyzeRest(pairs(15, 120, 10)).advice).toEqual({ kind: 'keep' });
  });

  it('empfiehlt nie mehr als 5 Minuten', () => {
    expect(analyzeRest(pairs(15, 240, 30)).advice).toEqual({ kind: 'longer', targetSeconds: 300 });
    expect(analyzeRest(pairs(15, 400, 30)).advice).toEqual({ kind: 'keep' });
  });
});

describe('restByExercise', () => {
  const pairedSession = (index: number, id: string) =>
    session(
      daysAgo(index),
      Array.from({ length: 6 }, (_, position) =>
        set({ reps: 10 - position, completedAt: at(position * 120 + index) }),
      ),
      { id, name: id },
    );

  it('wertet je Übung aus und lässt Übungen mit zu wenig Daten weg', () => {
    const sessions = [
      ...[0, 1, 2].map((index) => pairedSession(index, 'viel')),
      pairedSession(0, 'wenig'),
    ];
    const result = restByExercise(sessions);
    expect(result.map(({ exercise: item }) => item.id)).toEqual(['viel']);
    expect(result[0]!.analysis.pairCount).toBe(15);
  });
});

describe('formatRestAdvice', () => {
  it('formuliert jede Empfehlung', () => {
    expect(formatRestAdvice({ kind: 'notEnoughData', missingPairs: 3 })).toContain(
      '3 vergleichbare',
    );
    expect(formatRestAdvice({ kind: 'longer', targetSeconds: 180 })).toContain('3:00 verlängern');
    expect(formatRestAdvice({ kind: 'shorter', targetSeconds: 120 })).toContain('2:00 kürzen');
    expect(formatRestAdvice({ kind: 'keep' })).toBe('Deine Pausenlänge passt.');
  });
});

it('Heatmap-Schlüssel entsprechen dem lokalen Datum', () => {
  expect(toDateInput(new Date(2026, 9, 31, 0, 30).toISOString())).toBe('2026-10-31');
});
