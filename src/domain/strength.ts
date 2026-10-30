import type { WeightUnit, WorkoutSet } from '../db/types';
import { formatDecimal } from './format';
import { displayToKg, kgToDisplay, roundTo } from './units';
import { formatClock, formatWeight, suggestSetValues } from './workout';

export type StrengthSet = Pick<
  WorkoutSet,
  | 'weight'
  | 'level'
  | 'eccentricWeight'
  | 'eccentricLevel'
  | 'reps'
  | 'durationSeconds'
  | 'isWarmup'
>;

export interface ExerciseKind {
  isTimed: boolean;
  isBodyweight: boolean;
  /** Aus den Einstellungen; ohne Angabe gibt es bei Körpergewichtsübungen kein Volumen/1RM */
  bodyWeightKg: number | null;
}

/** Darüber werden 1RM-Schätzungen zu ungenau */
export const MAX_REPS_FOR_ONE_REP_MAX = 12;

const EPSILON = 1e-6;

// ---------- 1RM, Last, Volumen ----------

export type OneRepMaxFormula = 'epley' | 'brzycki';

export function epley(weight: number, reps: number): number {
  return reps === 1 ? weight : weight * (1 + reps / 30);
}

export function brzycki(weight: number, reps: number): number {
  return reps === 1 ? weight : (weight * 36) / (37 - reps);
}

/** Geschätztes 1RM; `null` ohne Last oder außerhalb von 1–12 Wdh. */
export function estimateOneRepMax(
  weight: number,
  reps: number,
  formula: OneRepMaxFormula = 'epley',
): number | null {
  if (weight <= 0 || !Number.isInteger(reps) || reps < 1 || reps > MAX_REPS_FOR_ONE_REP_MAX) {
    return null;
  }
  return formula === 'epley' ? epley(weight, reps) : brzycki(weight, reps);
}

/**
 * Bewegte Last in kg: Gewicht bzw. bei Körpergewichtsübungen Körpergewicht + Zusatzgewicht
 * (negativ = Unterstützung). `null` bei Stufen (nicht mit kg mischen) oder ohne Last.
 */
export function effectiveLoadKg(set: StrengthSet, kind: ExerciseKind): number | null {
  if (set.level !== null) return null;
  let load: number | null = set.weight;
  if (kind.isBodyweight) {
    load = kind.bodyWeightKg === null ? null : kind.bodyWeightKg + (set.weight ?? 0);
  }
  return load !== null && load > 0 ? load : null;
}

/** Volumen eines Satzes (Last × Wdh.); Aufwärmsätze, Halteübungen und Stufen zählen 0 */
export function setVolumeKg(set: StrengthSet, kind: ExerciseKind): number {
  if (set.isWarmup || kind.isTimed || !set.reps) return 0;
  const load = effectiveLoadKg(set, kind);
  return load === null ? 0 : load * set.reps;
}

export function sessionVolumeKg(sets: StrengthSet[], kind: ExerciseKind): number {
  return sets.reduce((sum, set) => sum + setVolumeKg(set, kind), 0);
}

export function setOneRepMax(set: StrengthSet, kind: ExerciseKind): number | null {
  if (set.isWarmup || kind.isTimed || set.reps === null) return null;
  const load = effectiveLoadKg(set, kind);
  return load === null ? null : estimateOneRepMax(load, set.reps);
}

/** Bester Arbeitssatz: höchstes 1RM, dann höchste Last, dann meiste Wdh. bzw. längste Dauer */
export function bestSet<T extends StrengthSet>(sets: T[], kind: ExerciseKind): T | null {
  let best: T | null = null;
  let bestKey: number[] = [];
  for (const set of sets) {
    if (set.isWarmup || !isPerformed(set, kind)) continue;
    const key = [
      setOneRepMax(set, kind) ?? 0,
      set.level ?? set.weight ?? 0,
      (kind.isTimed ? set.durationSeconds : set.reps) ?? 0,
    ];
    const index = key.findIndex((value, i) => value !== bestKey[i]);
    if (!best || (index >= 0 && key[index]! > bestKey[index]!)) {
      best = set;
      bestKey = key;
    }
  }
  return best;
}

function isPerformed(set: StrengthSet, kind: ExerciseKind) {
  return ((kind.isTimed ? set.durationSeconds : set.reps) ?? 0) > 0;
}

// ---------- Persönliche Rekorde ----------

export const RECORD_TYPES = [
  'weight',
  'oneRepMax',
  'setVolume',
  'sessionVolume',
  'reps',
  'duration',
  'level',
  'eccentricWeight',
  'eccentricLevel',
] as const;
export type RecordType = (typeof RECORD_TYPES)[number];

export interface PersonalRecord {
  type: RecordType;
  value: number;
  /** Bisheriger Bestwert */
  previous: number;
  /** Bei `reps`/`duration`: Last (kg bzw. Stufe), bei der der Wert erreicht wurde */
  load: number | null;
  byLevel: boolean;
}

/** Rekorde, die einfach „höchster Wert“ sind */
const MAX_TYPES = [
  'weight',
  'oneRepMax',
  'setVolume',
  'level',
  'eccentricWeight',
  'eccentricLevel',
] as const;
type MaxType = (typeof MAX_TYPES)[number];

function maxValues(set: StrengthSet, kind: ExerciseKind): Partial<Record<MaxType, number>> {
  const values: Partial<Record<MaxType, number>> = {};
  if (set.isWarmup || !isPerformed(set, kind)) return values;
  const put = (type: MaxType, value: number | null) => {
    if (value !== null && value > 0) values[type] = value;
  };
  if (set.level !== null) {
    put('level', set.level);
    put('eccentricLevel', set.eccentricLevel);
  } else {
    put('weight', set.weight);
    put('eccentricWeight', set.eccentricWeight);
    put('oneRepMax', setOneRepMax(set, kind));
    put('setVolume', setVolumeKg(set, kind));
  }
  return values;
}

/** Wdh. bzw. Dauer bei einer Last – vergleichbar nur mit Sätzen bei gleicher oder höherer Last */
interface LoadedValue {
  type: 'reps' | 'duration';
  byLevel: boolean;
  load: number;
  value: number;
}

function loadedValue(set: StrengthSet, kind: ExerciseKind): LoadedValue | null {
  if (set.isWarmup || !isPerformed(set, kind)) return null;
  const byLevel = set.level !== null;
  return {
    type: kind.isTimed ? 'duration' : 'reps',
    byLevel,
    load: byLevel ? set.level! : (set.weight ?? 0),
    value: (kind.isTimed ? set.durationSeconds : set.reps)!,
  };
}

/** `other` wurde mit mindestens so viel Last gemacht wie `own` */
const atLeastAsHeavy = (own: LoadedValue, other: LoadedValue) =>
  other.byLevel === own.byLevel && other.load >= own.load - EPSILON;

function maxOf(values: Array<number | undefined>): number | undefined {
  let max: number | undefined;
  for (const value of values) {
    if (value !== undefined && (max === undefined || value > max)) max = value;
  }
  return max;
}

const isLevelType = (type: RecordType) => type === 'level' || type === 'eccentricLevel';

const byRecordOrder = (a: PersonalRecord, b: PersonalRecord) =>
  RECORD_TYPES.indexOf(a.type) - RECORD_TYPES.indexOf(b.type);

function bestSessionVolume(history: StrengthSet[][], kind: ExerciseKind) {
  return maxOf(history.map((sets) => sessionVolumeKg(sets, kind)).filter((v) => v > 0));
}

/**
 * Rekorde, die ein gerade abgehakter Satz aufstellt (für den Toast). Verglichen wird mit allen
 * früheren Einheiten (`history`) und den davor abgehakten Sätzen dieser Einheit (`earlier`).
 * Ohne frühere Einheit mit vergleichbarem Wert gibt es keinen Rekord (erstes Training = Ausgangswert).
 */
export function detectRecords(
  set: StrengthSet,
  { history, earlier }: { history: StrengthSet[][]; earlier: StrengthSet[] },
  kind: ExerciseKind,
): PersonalRecord[] {
  const records: PersonalRecord[] = [];
  const past = history.flat();

  const own = maxValues(set, kind);
  for (const type of MAX_TYPES) {
    const value = own[type];
    if (value === undefined) continue;
    const baseline = maxOf(past.map((s) => maxValues(s, kind)[type]));
    if (baseline === undefined) continue;
    const best = Math.max(baseline, maxOf(earlier.map((s) => maxValues(s, kind)[type])) ?? 0);
    if (value > best + EPSILON) {
      records.push({ type, value, previous: best, load: null, byLevel: isLevelType(type) });
    }
  }

  const loaded = loadedValue(set, kind);
  if (loaded) {
    const bestAtLoad = (sets: StrengthSet[]) =>
      maxOf(
        sets
          .map((s) => loadedValue(s, kind))
          .filter((other) => other !== null && atLeastAsHeavy(loaded, other))
          .map((other) => other!.value),
      );
    const baseline = bestAtLoad(past);
    if (baseline !== undefined) {
      const best = Math.max(baseline, bestAtLoad(earlier) ?? 0);
      if (loaded.value > best) {
        records.push({
          type: loaded.type,
          value: loaded.value,
          previous: best,
          load: loaded.load,
          byLevel: loaded.byLevel,
        });
      }
    }
  }

  const sessionBest = bestSessionVolume(history, kind);
  const volume = setVolumeKg(set, kind);
  if (sessionBest !== undefined && volume > 0) {
    const before = sessionVolumeKg(earlier, kind);
    const after = before + volume;
    // Nur der Satz, mit dem die Einheit den Rekord überschreitet
    if (after > sessionBest + EPSILON && before <= sessionBest + EPSILON) {
      records.push({
        type: 'sessionVolume',
        value: after,
        previous: sessionBest,
        load: null,
        byLevel: false,
      });
    }
  }
  return records.sort(byRecordOrder);
}

/**
 * Rekorde einer Einheit gegenüber früheren Einheiten (für die Historie), je Satz.
 * Pro Rekordart wird nur der beste Satz markiert; das Einheitsvolumen am Satz, mit dem es den
 * bisherigen Bestwert überschreitet (Wert = Volumen der ganzen Einheit).
 */
export function sessionRecords(
  session: StrengthSet[],
  history: StrengthSet[][],
  kind: ExerciseKind,
): PersonalRecord[][] {
  const result: PersonalRecord[][] = session.map(() => []);
  const past = history.flat();

  const values = session.map((set) => maxValues(set, kind));
  for (const type of MAX_TYPES) {
    const baseline = maxOf(past.map((s) => maxValues(s, kind)[type]));
    if (baseline === undefined) continue;
    let bestIndex = -1;
    values.forEach((own, index) => {
      const value = own[type];
      if (value === undefined || value <= baseline + EPSILON) return;
      if (bestIndex < 0 || value > values[bestIndex]![type]! + EPSILON) bestIndex = index;
    });
    if (bestIndex >= 0) {
      result[bestIndex]!.push({
        type,
        value: values[bestIndex]![type]!,
        previous: baseline,
        load: null,
        byLevel: isLevelType(type),
      });
    }
  }

  const loaded = session.map((set) => loadedValue(set, kind));
  const pastLoaded = past
    .map((set) => loadedValue(set, kind))
    .filter((v): v is LoadedValue => v !== null);
  loaded.forEach((own, index) => {
    if (!own) return;
    const baseline = maxOf(
      pastLoaded.filter((other) => atLeastAsHeavy(own, other)).map((other) => other.value),
    );
    if (baseline === undefined || own.value <= baseline) return;
    // Ein anderer Satz dieser Einheit mit mind. gleicher Last und mind. gleichem Wert ist besser
    const outdone = loaded.some(
      (other, otherIndex) =>
        otherIndex !== index &&
        other !== null &&
        atLeastAsHeavy(own, other) &&
        other.value >= own.value &&
        (other.load > own.load + EPSILON || other.value > own.value || otherIndex < index),
    );
    if (!outdone) {
      result[index]!.push({
        type: own.type,
        value: own.value,
        previous: baseline,
        load: own.load,
        byLevel: own.byLevel,
      });
    }
  });

  const sessionBest = bestSessionVolume(history, kind);
  if (sessionBest !== undefined) {
    let running = 0;
    let crossing = -1;
    session.forEach((set, index) => {
      const before = running;
      running += setVolumeKg(set, kind);
      if (running > sessionBest + EPSILON && before <= sessionBest + EPSILON) crossing = index;
    });
    if (crossing >= 0) {
      result[crossing]!.push({
        type: 'sessionVolume',
        value: running,
        previous: sessionBest,
        load: null,
        byLevel: false,
      });
    }
  }
  return result.map((records) => records.sort(byRecordOrder));
}

/** Rekorde aller Einheiten einer Übung (chronologisch sortiert), je Einheit und Satz */
export function annotateSessions(
  sessions: StrengthSet[][],
  kind: ExerciseKind,
): PersonalRecord[][][] {
  return sessions.map((session, index) => sessionRecords(session, sessions.slice(0, index), kind));
}

export function formatRecord(
  record: PersonalRecord,
  { unit, isBodyweight }: { unit: WeightUnit; isBodyweight: boolean },
): { label: string; value: string } {
  const kg = (value: number, decimals: number) =>
    `${formatDecimal(roundTo(kgToDisplay(value, unit), decimals), decimals)} ${unit}`;
  const atLoad = (label: string) => {
    if (record.load === null) return label;
    if (record.byLevel) return `${label} bei Stufe ${formatDecimal(record.load, 1)}`;
    if (Math.abs(record.load) < EPSILON) return label;
    return isBodyweight
      ? `${label} mit ${formatWeight(record.load, unit, true)}`
      : `${label} bei ${formatWeight(record.load, unit)}`;
  };
  switch (record.type) {
    case 'weight':
      return {
        label: isBodyweight ? 'Zusatzgewicht' : 'Gewicht',
        value: formatWeight(record.value, unit, isBodyweight),
      };
    case 'oneRepMax':
      return { label: 'Geschätztes 1RM', value: kg(record.value, 1) };
    case 'setVolume':
      return { label: 'Volumen (Satz)', value: kg(record.value, 0) };
    case 'sessionVolume':
      return { label: 'Volumen (Einheit)', value: kg(record.value, 0) };
    case 'reps':
      return { label: atLoad('Wiederholungen'), value: String(record.value) };
    case 'duration':
      return { label: atLoad('Dauer'), value: formatClock(record.value) };
    case 'level':
      return { label: 'Stufe', value: formatDecimal(record.value, 1) };
    case 'eccentricWeight':
      return { label: 'Exzentrik-Gewicht', value: formatWeight(record.value, unit) };
    case 'eccentricLevel':
      return { label: 'Exzentrik-Stufe', value: formatDecimal(record.value, 1) };
  }
}

// ---------- Progressive Overload ----------

export interface RepRange {
  min: number;
  max: number;
}

/** Ohne Trainingsplan */
export const DEFAULT_REP_RANGE: RepRange = { min: 8, max: 12 };

/** Gewichtssprung beim Overload-Vorschlag: 2,5 kg bzw. 5 lb */
export function progressionWeightStepKg(unit: WeightUnit): number {
  return displayToKg(unit === 'kg' ? 2.5 : 5, unit);
}

export type ProgressionKind = 'increaseLoad' | 'addReps' | 'addTime';

export interface ProgressionSuggestion {
  kind: ProgressionKind;
  weight: number | null;
  level: number | null;
  reps: number | null;
  durationSeconds: number | null;
}

/**
 * Doppelprogression aus den Sätzen vom letzten Mal: Haben alle Sätze mit der höchsten Last das
 * obere Ende des Zielbereichs erreicht → mehr Last und wieder unteres Ende; sonst gleiche Last und
 * +1 Wdh. (ausgehend vom schwächsten dieser Sätze). Halteübungen: gleiche Last, etwas länger.
 */
export function suggestProgression(
  lastSets: StrengthSet[],
  {
    isTimed,
    isBodyweight,
    range = DEFAULT_REP_RANGE,
    weightStepKg = 2.5,
    levelStep = 1,
    durationStepSeconds = 5,
  }: {
    isTimed: boolean;
    isBodyweight: boolean;
    range?: RepRange;
    weightStepKg?: number;
    levelStep?: number;
    durationStepSeconds?: number;
  },
): ProgressionSuggestion | null {
  const kind = { isTimed, isBodyweight, bodyWeightKg: null };
  const working = lastSets.filter((set) => !set.isWarmup && isPerformed(set, kind));
  if (working.length === 0) return null;

  const byLevel = working.some((set) => set.level !== null);
  const sets = working.filter((set) => (set.level !== null) === byLevel);
  const loadOf = (set: StrengthSet) => (byLevel ? set.level! : (set.weight ?? 0));
  const top = Math.max(...sets.map(loadOf));
  const topSets = sets.filter((set) => Math.abs(loadOf(set) - top) < EPSILON);
  const hasLoad = byLevel || isBodyweight || topSets.some((set) => set.weight !== null);
  const withLoad = (load: number) =>
    byLevel ? { weight: null, level: load } : { weight: hasLoad ? load : null, level: null };

  if (isTimed) {
    const shortest = Math.min(...topSets.map((set) => set.durationSeconds!));
    return {
      kind: 'addTime',
      ...withLoad(top),
      reps: null,
      durationSeconds: shortest + durationStepSeconds,
    };
  }
  const fewest = Math.min(...topSets.map((set) => set.reps!));
  if (hasLoad && fewest >= range.max) {
    const step = byLevel ? levelStep : weightStepKg;
    return {
      kind: 'increaseLoad',
      ...withLoad(roundTo(top + step, 4)),
      reps: range.min,
      durationSeconds: null,
    };
  }
  return { kind: 'addReps', ...withLoad(top), reps: fewest + 1, durationSeconds: null };
}

/**
 * Startwerte der Sätze eines geplanten Workouts: mit Vorgeschichte der Overload-Vorschlag
 * (Exzentrik wie letztes Mal), beim ersten Mal das Planziel – die Last trägt man dann selbst ein.
 */
export function plannedSetValues({
  lastSets,
  count,
  isTimed,
  isBodyweight,
  range,
  targetDurationSeconds,
  weightStepKg,
}: {
  lastSets: Array<StrengthSet & Pick<WorkoutSet, 'rpe' | 'rir'>>;
  count: number;
  isTimed: boolean;
  isBodyweight: boolean;
  range: RepRange | null;
  targetDurationSeconds: number | null;
  weightStepKg: number;
}) {
  const suggestion = suggestProgression(lastSets, {
    isTimed,
    isBodyweight,
    range: range ?? DEFAULT_REP_RANGE,
    weightStepKg,
  });
  return Array.from({ length: count }, (_, index) => {
    const values = suggestSetValues({
      previous: undefined,
      lastTime: lastSets,
      index,
      isBodyweight,
    });
    if (suggestion) {
      const { weight, level, reps, durationSeconds } = suggestion;
      return { ...values, weight, level, reps, durationSeconds };
    }
    return {
      ...values,
      reps: isTimed ? null : (range?.min ?? null),
      durationSeconds: isTimed ? targetDurationSeconds : null,
    };
  });
}

/**
 * Startwerte geplanter Aufwärmsätze: der passende Aufwärmsatz vom letzten Mal, sonst das Planziel
 * ohne Last. Der Overload-Vorschlag gilt nur für Arbeitssätze.
 */
export function plannedWarmupValues({
  lastSets,
  count,
  isTimed,
  isBodyweight,
  range,
  targetDurationSeconds,
}: {
  lastSets: StrengthSet[];
  count: number;
  isTimed: boolean;
  isBodyweight: boolean;
  range: RepRange | null;
  targetDurationSeconds: number | null;
}) {
  const lastWarmups = lastSets.filter((set) => set.isWarmup);
  return Array.from({ length: count }, (_, index) => {
    const last = lastWarmups[index];
    return {
      weight: last ? last.weight : isBodyweight ? 0 : null,
      level: last?.level ?? null,
      eccentricWeight: last?.eccentricWeight ?? null,
      eccentricLevel: last?.eccentricLevel ?? null,
      reps: last ? last.reps : isTimed ? null : (range?.min ?? null),
      durationSeconds: last ? last.durationSeconds : isTimed ? targetDurationSeconds : null,
    };
  });
}
