import {
  annotateSessions,
  bestSet,
  brzycki,
  currentBests,
  detectRecords,
  effectiveLoadKg,
  epley,
  estimateOneRepMax,
  formatRecord,
  plannedSetValues,
  plannedWarmupValues,
  progressionWeightStepKg,
  sessionRecords,
  sessionVolumeKg,
  setOneRepMax,
  setVolumeKg,
  suggestProgression,
  type ExerciseKind,
  type PersonalRecord,
  type StrengthSet,
} from './strength';

const set = (
  weight: number | null,
  reps: number | null,
  extra: Partial<StrengthSet> = {},
): StrengthSet => ({
  weight,
  level: null,
  eccentricWeight: null,
  eccentricLevel: null,
  reps,
  durationSeconds: null,
  isWarmup: false,
  ...extra,
});
const level = (value: number, reps: number, extra: Partial<StrengthSet> = {}) =>
  set(null, reps, { level: value, ...extra });
const hold = (seconds: number, weight: number | null = 0) =>
  set(weight, null, { durationSeconds: seconds });

const barbell: ExerciseKind = { isTimed: false, isBodyweight: false, bodyWeightKg: 80 };
const bodyweight: ExerciseKind = { isTimed: false, isBodyweight: true, bodyWeightKg: 80 };
const timed: ExerciseKind = { isTimed: true, isBodyweight: true, bodyWeightKg: 80 };

const types = (records: PersonalRecord[]) => records.map((r) => r.type);

describe('plannedWarmupValues (geplante Aufwärmsätze)', () => {
  const plan = {
    count: 2,
    isTimed: false,
    isBodyweight: false,
    range: { min: 6, max: 10 },
    targetDurationSeconds: null,
  };

  it('nutzt beim ersten Mal das Planziel ohne Last', () => {
    const values = plannedWarmupValues({ ...plan, lastSets: [set(100, 5)] });
    expect(values).toHaveLength(2);
    expect(values[0]).toMatchObject({ weight: null, reps: 6, durationSeconds: null });
  });

  it('übernimmt die Aufwärmsätze vom letzten Mal der Reihe nach', () => {
    const values = plannedWarmupValues({
      ...plan,
      lastSets: [set(40, 8, { isWarmup: true }), level(3, 6, { isWarmup: true }), set(100, 5)],
    });
    expect(values[0]).toMatchObject({ weight: 40, level: null, reps: 8 });
    expect(values[1]).toMatchObject({ weight: null, level: 3, reps: 6 });
  });

  it('füllt zusätzlich geplante Sätze mit dem Planziel', () => {
    const values = plannedWarmupValues({ ...plan, lastSets: [set(40, 8, { isWarmup: true })] });
    expect(values[1]).toMatchObject({ weight: null, reps: 6 });
  });

  it('beachtet Körpergewichts- und Halteübungen', () => {
    expect(
      plannedWarmupValues({ ...plan, count: 1, isBodyweight: true, lastSets: [] })[0],
    ).toMatchObject({ weight: 0, reps: 6 });
    expect(
      plannedWarmupValues({
        ...plan,
        count: 1,
        isTimed: true,
        targetDurationSeconds: 45,
        lastSets: [],
      })[0],
    ).toMatchObject({ reps: null, durationSeconds: 45 });
  });
});

describe('plannedSetValues (Vorbefüllung aus dem Plan)', () => {
  const plan = {
    count: 3,
    isTimed: false,
    isBodyweight: false,
    range: { min: 6, max: 10 },
    targetDurationSeconds: null,
    weightStepKg: 2.5,
  };
  const logged = (weight: number, reps: number, extra: Partial<StrengthSet> = {}) => ({
    ...set(weight, reps, extra),
    rpe: null,
    rir: null,
  });

  it('nutzt beim ersten Mal die Untergrenze des Zielbereichs ohne Last', () => {
    const values = plannedSetValues({ ...plan, lastSets: [] });
    expect(values).toHaveLength(3);
    expect(values[0]).toMatchObject({ weight: null, reps: 6, durationSeconds: null });
  });

  it('startet Körpergewichtsübungen mit 0 kg Zusatzgewicht', () => {
    const [first] = plannedSetValues({ ...plan, isBodyweight: true, lastSets: [] });
    expect(first).toMatchObject({ weight: 0, reps: 6 });
  });

  it('nutzt bei Halteübungen die Zieldauer', () => {
    const [first] = plannedSetValues({
      ...plan,
      isTimed: true,
      targetDurationSeconds: 45,
      lastSets: [],
    });
    expect(first).toMatchObject({ reps: null, durationSeconds: 45 });
  });

  it('steigert die Last, wenn alle Sätze die Obergrenze erreicht haben', () => {
    const values = plannedSetValues({ ...plan, lastSets: [logged(60, 10), logged(60, 10)] });
    expect(values.map((v) => [v.weight, v.reps])).toEqual([
      [62.5, 6],
      [62.5, 6],
      [62.5, 6],
    ]);
  });

  it('bleibt sonst beim Gewicht und legt eine Wdh. drauf', () => {
    const [first] = plannedSetValues({ ...plan, lastSets: [logged(60, 8), logged(60, 7)] });
    expect(first).toMatchObject({ weight: 60, reps: 8 });
  });

  it('nimmt ohne Planbereich den Standardbereich und lässt Wdh. beim ersten Mal offen', () => {
    expect(plannedSetValues({ ...plan, range: null, lastSets: [] })[0]?.reps).toBeNull();
    const [next] = plannedSetValues({ ...plan, range: null, lastSets: [logged(60, 12)] });
    expect(next).toMatchObject({ weight: 62.5, reps: 8 });
  });

  it('behält die Exzentrik vom letzten Mal', () => {
    const [first] = plannedSetValues({
      ...plan,
      lastSets: [logged(80, 8, { eccentricWeight: 100 })],
    });
    expect(first).toMatchObject({ weight: 80, eccentricWeight: 100 });
  });

  it('rechnet den Gewichtssprung zur Anzeigeeinheit passend um', () => {
    expect(progressionWeightStepKg('kg')).toBe(2.5);
    expect(progressionWeightStepKg('lb')).toBeCloseTo(2.268, 3);
  });
});

describe('1RM-Formeln', () => {
  it('rechnet Epley und Brzycki', () => {
    expect(epley(100, 5)).toBeCloseTo(116.667, 3);
    expect(brzycki(100, 5)).toBeCloseTo(112.5, 3);
    expect(epley(100, 10)).toBeCloseTo(133.333, 3);
    expect(brzycki(100, 10)).toBeCloseTo(133.333, 3);
  });

  it('gibt bei einer Wiederholung das Gewicht selbst zurück', () => {
    expect(epley(140, 1)).toBe(140);
    expect(brzycki(140, 1)).toBe(140);
    expect(estimateOneRepMax(140, 1)).toBe(140);
  });

  it('schätzt nur zwischen 1 und 12 Wdh. und nur mit Last', () => {
    expect(estimateOneRepMax(100, 5)).toBeCloseTo(116.667, 3);
    expect(estimateOneRepMax(100, 5, 'brzycki')).toBeCloseTo(112.5, 3);
    expect(estimateOneRepMax(100, 12)).toBeCloseTo(140, 3);
    expect(estimateOneRepMax(100, 13)).toBeNull();
    expect(estimateOneRepMax(100, 0)).toBeNull();
    expect(estimateOneRepMax(100, 2.5)).toBeNull();
    expect(estimateOneRepMax(0, 5)).toBeNull();
  });
});

describe('Last und Volumen', () => {
  it('nimmt das Gewicht bzw. Körpergewicht + Zusatzgewicht', () => {
    expect(effectiveLoadKg(set(100, 5), barbell)).toBe(100);
    expect(effectiveLoadKg(set(null, 5), barbell)).toBeNull();
    expect(effectiveLoadKg(set(10, 5), bodyweight)).toBe(90);
    expect(effectiveLoadKg(set(-20, 5), bodyweight)).toBe(60);
    expect(effectiveLoadKg(set(null, 5), bodyweight)).toBe(80);
    expect(effectiveLoadKg(set(10, 5), { ...bodyweight, bodyWeightKg: null })).toBeNull();
    // Gewicht vom Tag des Workouts geht vor dem aktuellen
    expect(effectiveLoadKg({ ...set(10, 5), bodyWeightKg: 70 }, bodyweight)).toBe(80);
    expect(effectiveLoadKg(set(-100, 5), bodyweight)).toBeNull();
  });

  it('mischt Stufen nie mit kg', () => {
    expect(effectiveLoadKg(level(7, 10), barbell)).toBeNull();
    expect(setVolumeKg(level(7, 10), barbell)).toBe(0);
    expect(setOneRepMax(level(7, 10), barbell)).toBeNull();
  });

  it('rechnet Volumen ohne Aufwärmsätze und Halteübungen', () => {
    expect(setVolumeKg(set(100, 5), barbell)).toBe(500);
    expect(setVolumeKg(set(60, 10, { isWarmup: true }), barbell)).toBe(0);
    expect(setVolumeKg(set(100, null), barbell)).toBe(0);
    expect(setVolumeKg(set(0, 10), bodyweight)).toBe(800);
    expect(setVolumeKg(hold(60), timed)).toBe(0);
    expect(
      sessionVolumeKg([set(60, 10, { isWarmup: true }), set(100, 5), set(100, 4)], barbell),
    ).toBe(900);
  });

  it('schätzt das 1RM pro Satz, bei Körpergewicht inkl. Körpergewicht', () => {
    expect(setOneRepMax(set(100, 5), barbell)).toBeCloseTo(116.667, 3);
    expect(setOneRepMax(set(10, 5), bodyweight)).toBeCloseTo(105, 3);
    expect(setOneRepMax(set(100, 5, { isWarmup: true }), barbell)).toBeNull();
    expect(setOneRepMax(set(100, 20), barbell)).toBeNull();
  });

  it('findet den besten Arbeitssatz', () => {
    const sets = [set(120, 5, { isWarmup: true }), set(100, 5), set(105, 3), set(100, 6)];
    expect(bestSet(sets, barbell)).toBe(sets[3]);
    expect(bestSet([level(7, 10), level(8, 8), level(8, 9)], barbell)).toEqual(level(8, 9));
    expect(bestSet([hold(30), hold(45), hold(40)], timed)).toEqual(hold(45));
    expect(bestSet([], barbell)).toBeNull();
  });
});

describe('detectRecords (PR beim Abhaken)', () => {
  const detect = (
    newSet: StrengthSet,
    history: StrengthSet[][],
    earlier: StrengthSet[] = [],
    kind = barbell,
  ) => detectRecords(newSet, { history, earlier }, kind);

  it('meldet beim ersten Training keinen Rekord', () => {
    expect(detect(set(100, 5), [])).toEqual([]);
    expect(detect(set(110, 5), [], [set(100, 5)])).toEqual([]);
  });

  // Zwei Sätze, damit ein einzelner neuer Satz nicht schon das Einheitsvolumen übertrifft
  const twoSets = [[set(100, 5), set(100, 5)]];

  it('erkennt max. Gewicht, 1RM und Satzvolumen', () => {
    const records = detect(set(105, 5), twoSets);
    expect(types(records)).toEqual(['weight', 'oneRepMax', 'setVolume']);
    expect(records[0]).toMatchObject({ value: 105, previous: 100 });
  });

  it('erkennt mehr Wdh. bei gleichem oder höherem Gewicht', () => {
    const records = detect(set(100, 6), twoSets);
    expect(types(records)).toEqual(['oneRepMax', 'setVolume', 'reps']);
    expect(records.at(-1)).toMatchObject({ type: 'reps', value: 6, previous: 5, load: 100 });

    expect(detect(set(90, 7), [[set(100, 8)]])).toEqual([]);
    expect(types(detect(set(90, 9), [[set(100, 8)]]))).toContain('reps');
    // Schwerer als je zuvor: Gewichts-, aber kein Wdh.-Rekord
    expect(types(detect(set(110, 5), twoSets))).toEqual(['weight', 'oneRepMax', 'setVolume']);
  });

  it('vergleicht auch mit den vorher abgehakten Sätzen der Einheit', () => {
    expect(detect(set(102.5, 5), [[set(100, 5)]], [set(102.5, 5)])).toEqual([]);
    expect(types(detect(set(105, 5), [[set(100, 5)]], [set(102.5, 5)]))).toContain('weight');
  });

  it('meldet das Einheitsvolumen nur beim Überschreiten', () => {
    const history = [[set(100, 5), set(100, 5)]];
    const crossing = detect(set(50, 2), history, [set(100, 5), set(100, 5)]);
    expect(crossing).toEqual([
      { type: 'sessionVolume', value: 1100, previous: 1000, load: null, byLevel: false },
    ]);
    expect(detect(set(50, 2), history, [set(100, 5), set(100, 5), set(50, 2)])).toEqual([]);
  });

  it('ignoriert Aufwärmsätze und nicht ausgeführte Sätze', () => {
    expect(detect(set(120, 5, { isWarmup: true }), [[set(100, 5)]])).toEqual([]);
    expect(detect(set(120, null), [[set(100, 5)]])).toEqual([]);
    expect(types(detect(set(100, 6), [[set(150, 6, { isWarmup: true }), set(100, 5)]]))).toEqual([
      'oneRepMax',
      'setVolume',
      'sessionVolume',
      'reps',
    ]);
  });

  it('rechnet Körpergewichtsübungen mit Körpergewicht', () => {
    expect(types(detect(set(0, 10), [[set(0, 8), set(0, 8)]], [], bodyweight))).toEqual([
      'oneRepMax',
      'setVolume',
      'reps',
    ]);
    expect(types(detect(set(10, 5), [[set(5, 5), set(5, 5)]], [], bodyweight))).toEqual([
      'weight',
      'oneRepMax',
      'setVolume',
    ]);
    // Weniger Unterstützung = mehr bewegte Last
    expect(types(detect(set(-10, 8), [[set(-20, 8), set(-20, 8)]], [], bodyweight))).toEqual([
      'oneRepMax',
      'setVolume',
    ]);
    // Ohne Körpergewicht in den Einstellungen nur Wdh.
    const noBodyWeight = { ...bodyweight, bodyWeightKg: null };
    expect(types(detect(set(0, 10), [[set(0, 8)]], [], noBodyWeight))).toEqual(['reps']);
  });

  it('behandelt Stufen getrennt vom Gewicht', () => {
    expect(types(detect(level(8, 10), [[level(7, 10)]]))).toEqual(['level']);
    expect(detect(level(7, 11), [[level(7, 10)]])).toEqual([
      { type: 'reps', value: 11, previous: 10, load: 7, byLevel: true },
    ]);
    expect(detect(level(8, 10), [[set(100, 5)]])).toEqual([]);
    expect(detect(set(100, 5), [[level(8, 10)]])).toEqual([]);
  });

  it('erkennt längere Dauer bei Halteübungen', () => {
    expect(detect(hold(50), [[hold(45)]], [], timed)).toEqual([
      { type: 'duration', value: 50, previous: 45, load: 0, byLevel: false },
    ]);
    expect(detect(hold(40, 10), [[hold(45)]], [], timed)).toEqual([]);
  });

  it('führt die Exzentrik als eigenen Rekord', () => {
    expect(
      types(detect(set(80, 8, { eccentricWeight: 105 }), [[set(80, 8, { eccentricWeight: 100 })]])),
    ).toEqual(['eccentricWeight']);
    expect(
      types(detect(level(7, 8, { eccentricLevel: 10 }), [[level(7, 8, { eccentricLevel: 9 })]])),
    ).toEqual(['eccentricLevel']);
  });
});

describe('sessionRecords (Markierung in der Historie)', () => {
  it('markiert je Rekordart nur den besten Satz', () => {
    const records = sessionRecords([set(102.5, 5), set(105, 5)], [[set(100, 5)]], barbell);
    expect(types(records[0]!)).toEqual(['sessionVolume']);
    expect(records[0]![0]).toMatchObject({ value: 1037.5, previous: 500 });
    expect(types(records[1]!)).toEqual(['weight', 'oneRepMax', 'setVolume']);
  });

  it('markiert Wdh.-Rekorde nur am besten Satz', () => {
    const records = sessionRecords([set(100, 6), set(100, 7), set(90, 7)], [[set(100, 5)]], {
      ...barbell,
      bodyWeightKg: null,
    });
    // Satz 1 überschreitet bereits das Einheitsvolumen (600 > 500)
    expect(types(records[0]!)).toEqual(['sessionVolume']);
    expect(types(records[1]!)).toEqual(['oneRepMax', 'setVolume', 'reps']);
    expect(types(records[2]!)).toEqual([]);
  });

  it('gibt für die erste Einheit keine Rekorde', () => {
    const annotated = annotateSessions(
      [[set(100, 5)], [set(100, 5)], [set(100, 6), set(100, 3)]],
      barbell,
    );
    expect(annotated.map((session) => session.flat().length)).toEqual([0, 0, 4]);
    expect(types(annotated[2]![0]!)).toEqual(['oneRepMax', 'setVolume', 'sessionVolume', 'reps']);
  });
});

describe('currentBests (Bestwerte einer Übung)', () => {
  const session = (startedAt: string, sets: StrengthSet[]) => ({ startedAt, sets });
  const find = (bests: ReturnType<typeof currentBests>, type: string) =>
    bests.find((best) => best.type === type);

  it('zählt auch die erste Einheit und merkt sich das Datum', () => {
    const bests = currentBests([session('2026-01-01', [set(100, 5)])], barbell);
    expect(find(bests, 'weight')).toMatchObject({ value: 100, achievedAt: '2026-01-01' });
    expect(find(bests, 'sessionVolume')).toMatchObject({ value: 500 });
  });

  it('behält das Datum, an dem der Wert zuerst erreicht wurde', () => {
    const bests = currentBests(
      [session('2026-01-01', [set(100, 5)]), session('2026-02-01', [set(100, 5)])],
      barbell,
    );
    expect(find(bests, 'weight')?.achievedAt).toBe('2026-01-01');
  });

  it('nimmt pro Rekordart den höchsten Wert, ohne Aufwärmsätze', () => {
    const bests = currentBests(
      [
        session('2026-01-01', [set(120, 1, { isWarmup: true }), set(100, 5)]),
        session('2026-02-01', [set(90, 10)]),
      ],
      barbell,
    );
    expect(find(bests, 'weight')?.value).toBe(100);
    expect(find(bests, 'setVolume')?.value).toBe(900);
    expect(find(bests, 'reps')).toMatchObject({ value: 10, load: 90 });
  });

  it('nimmt bei gleichen Wdh. die höhere Last', () => {
    const bests = currentBests([session('2026-01-01', [set(80, 5), set(100, 5)])], barbell);
    expect(find(bests, 'reps')?.load).toBe(100);
  });

  it('trennt Stufen von kg', () => {
    const bests = currentBests([session('2026-01-01', [set(50, 8), level(7, 12)])], barbell);
    expect(find(bests, 'level')).toMatchObject({ value: 7, byLevel: true });
    expect(find(bests, 'weight')).toMatchObject({ value: 50, byLevel: false });
    expect(bests.filter((best) => best.type === 'reps')).toHaveLength(2);
  });

  it('nennt die Dauer bei Halteübungen', () => {
    const bests = currentBests([session('2026-01-01', [hold(60)])], timed);
    expect(find(bests, 'duration')?.value).toBe(60);
  });

  it('ist ohne Sätze leer', () => {
    expect(currentBests([], barbell)).toEqual([]);
  });
});

describe('formatRecord', () => {
  const kg = { unit: 'kg' as const, isBodyweight: false };
  const record = (partial: Partial<PersonalRecord>): PersonalRecord => ({
    type: 'weight',
    value: 0,
    previous: 0,
    load: null,
    byLevel: false,
    ...partial,
  });

  it('beschriftet und formatiert die Rekordarten', () => {
    expect(formatRecord(record({ value: 102.5 }), kg)).toEqual({
      label: 'Gewicht',
      value: '102,5 kg',
    });
    expect(formatRecord(record({ value: 10 }), { ...kg, isBodyweight: true })).toEqual({
      label: 'Zusatzgewicht',
      value: '+10 kg',
    });
    expect(formatRecord(record({ type: 'oneRepMax', value: 116.6667 }), kg).value).toBe('116,7 kg');
    expect(formatRecord(record({ type: 'sessionVolume', value: 2400.4 }), kg)).toEqual({
      label: 'Volumen (Einheit)',
      value: '2400 kg',
    });
    expect(formatRecord(record({ type: 'level', value: 8, byLevel: true }), kg)).toEqual({
      label: 'Stufe',
      value: '8',
    });
    expect(formatRecord(record({ type: 'duration', value: 75, load: 0 }), kg)).toEqual({
      label: 'Dauer',
      value: '1:15',
    });
    expect(formatRecord(record({ type: 'eccentricWeight', value: 100 }), kg).label).toBe(
      'Exzentrik-Gewicht',
    );
  });

  it('nennt die Last bei Wdh.-Rekorden', () => {
    const reps = record({ type: 'reps', value: 10, load: 80 });
    expect(formatRecord(reps, kg)).toEqual({ label: 'Wiederholungen bei 80 kg', value: '10' });
    expect(formatRecord(reps, { unit: 'lb', isBodyweight: false }).label).toBe(
      'Wiederholungen bei 176,37 lb',
    );
    expect(formatRecord({ ...reps, load: 10 }, { ...kg, isBodyweight: true }).label).toBe(
      'Wiederholungen mit +10 kg',
    );
    expect(formatRecord({ ...reps, load: 0 }, { ...kg, isBodyweight: true }).label).toBe(
      'Wiederholungen',
    );
    expect(formatRecord({ ...reps, load: 7, byLevel: true }, kg).label).toBe(
      'Wiederholungen bei Stufe 7',
    );
  });
});

describe('suggestProgression (Progressive Overload)', () => {
  const options = { isTimed: false, isBodyweight: false };

  it('erhöht das Gewicht, wenn alle Sätze das Ziel erreicht haben', () => {
    expect(suggestProgression([set(80, 12), set(80, 12), set(80, 13)], options)).toEqual({
      kind: 'increaseLoad',
      weight: 82.5,
      level: null,
      reps: 8,
      durationSeconds: null,
    });
  });

  it('sonst gleiches Gewicht und +1 Wdh. vom schwächsten Satz', () => {
    expect(suggestProgression([set(80, 12), set(80, 10), set(80, 9)], options)).toEqual({
      kind: 'addReps',
      weight: 80,
      level: null,
      reps: 10,
      durationSeconds: null,
    });
  });

  it('betrachtet nur Arbeitssätze mit der höchsten Last', () => {
    const sets = [set(60, 10, { isWarmup: true }), set(80, 12), set(80, 12), set(70, 8)];
    expect(suggestProgression(sets, options)).toMatchObject({ weight: 82.5, reps: 8 });
  });

  it('nutzt Zielbereich und Schrittweite aus den Optionen', () => {
    expect(
      suggestProgression([set(100, 5), set(100, 5)], {
        ...options,
        range: { min: 3, max: 5 },
        weightStepKg: 5,
      }),
    ).toMatchObject({ kind: 'increaseLoad', weight: 105, reps: 3 });
    expect(
      suggestProgression([set(100, 12)], { ...options, weightStepKg: 2.26796185 }),
    ).toMatchObject({ weight: 102.268 });
  });

  it('steigert Stufen um eine Stufe', () => {
    expect(suggestProgression([level(7, 12), level(7, 12)], options)).toMatchObject({
      kind: 'increaseLoad',
      weight: null,
      level: 8,
      reps: 8,
    });
  });

  it('steigert bei Körpergewicht erst Wdh., dann Zusatzgewicht', () => {
    const bw = { isTimed: false, isBodyweight: true };
    expect(suggestProgression([set(0, 9)], bw)).toMatchObject({ weight: 0, reps: 10 });
    expect(suggestProgression([set(0, 12)], bw)).toMatchObject({ weight: 2.5, reps: 8 });
  });

  it('erhöht ohne Gewichtsangabe nur die Wdh.', () => {
    expect(suggestProgression([set(null, 12)], options)).toMatchObject({
      kind: 'addReps',
      weight: null,
      reps: 13,
    });
  });

  it('verlängert Halteübungen', () => {
    expect(suggestProgression([hold(45), hold(40)], { isTimed: true, isBodyweight: true })).toEqual(
      { kind: 'addTime', weight: 0, level: null, reps: null, durationSeconds: 45 },
    );
  });

  it('gibt ohne Arbeitssätze keinen Vorschlag', () => {
    expect(suggestProgression([], options)).toBeNull();
    expect(suggestProgression([set(60, 10, { isWarmup: true })], options)).toBeNull();
  });
});
