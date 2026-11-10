import type { Exercise, MuscleGroup, WeightUnit, WorkoutSet } from '../db/types';
import { formatDecimal } from './format';
import { MUSCLE_LABELS } from './labels';
import {
  byRecordOrder,
  estimateOneRepMax,
  exerciseKind,
  isPerformed,
  sessionRecords,
  sessionVolumeKg,
  setOneRepMax,
  type ExerciseKind,
  type PersonalRecord,
  type StrengthSet,
} from './strength';
import { kgToDisplay, roundTo } from './units';
import { formatClock, formatWorkoutDate, toDateInput } from './workout';

const DAY_MS = 24 * 60 * 60 * 1000;
const EPSILON = 1e-6;

export type StatsSet = StrengthSet & Pick<WorkoutSet, 'workoutExerciseId' | 'completedAt'>;
export type StatsExercise = Pick<
  Exercise,
  'id' | 'name' | 'category' | 'primaryMuscles' | 'secondaryMuscles' | 'equipment' | 'isTimed'
>;

export interface SetGroup {
  startedAt: string;
  /** Abgehakte Sätze in der Reihenfolge des Abhakens */
  sets: StatsSet[];
}

/** Eine Übung in einem beendeten Workout */
export interface StatsSession extends SetGroup {
  workoutId: string;
  exercise: StatsExercise;
}

const isWorkingSet = (set: StrengthSet) => !set.isWarmup;

// ---------- Zeitraum ----------

export const STATS_RANGES = ['4w', '3m', '1y', 'all'] as const;
export type StatsRange = (typeof STATS_RANGES)[number];
export const DEFAULT_STATS_RANGE: StatsRange = '3m';

export const STATS_RANGE_LABELS: Record<StatsRange, string> = {
  '4w': '4 Wo.',
  '3m': '3 Mon.',
  '1y': '1 Jahr',
  all: 'Alles',
};

/** Beginn des Zeitraums (Tagesanfang), `null` = alles */
export function rangeStart(range: StatsRange, now: Date): Date | null {
  if (range === 'all') return null;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (range === '4w') start.setDate(start.getDate() - 28);
  if (range === '3m') start.setMonth(start.getMonth() - 3);
  if (range === '1y') start.setFullYear(start.getFullYear() - 1);
  return start;
}

export function filterByRange<T extends { startedAt: string }>(
  sessions: T[],
  range: StatsRange,
  now: Date,
): T[] {
  const start = rangeStart(range, now);
  if (!start) return sessions;
  return sessions.filter((session) => Date.parse(session.startedAt) >= start.getTime());
}

/** Haupt- oder Hilfsmuskel */
export function trainsMuscle(exercise: StatsExercise, muscle: MuscleGroup): boolean {
  return exercise.primaryMuscles.includes(muscle) || exercise.secondaryMuscles.includes(muscle);
}

// ---------- Verlauf einer Übung ----------

export const EXERCISE_METRICS = [
  'weight',
  'oneRepMax',
  'volume',
  'reps',
  'duration',
  'level',
  'levelReps',
  'eccentricWeight',
  'eccentricLevel',
] as const;
export type ExerciseMetric = (typeof EXERCISE_METRICS)[number];

export interface SeriesPoint {
  date: string;
  values: Partial<Record<ExerciseMetric, number>>;
}

function maxBy(sets: StrengthSet[], pick: (set: StrengthSet) => number | null) {
  let max: number | undefined;
  for (const set of sets) {
    const value = pick(set);
    if (value !== null && (max === undefined || value > max)) max = value;
  }
  return max;
}

/** Stufen und kg stehen in getrennten Kurven; Sätze ohne Wert fehlen, statt 0 zu zählen */
function sessionValues(sets: StrengthSet[], kind: ExerciseKind): SeriesPoint['values'] {
  const working = sets.filter((set) => isWorkingSet(set) && isPerformed(set, kind));
  const byWeight = working.filter((set) => set.level === null);
  const byLevel = working.filter((set) => set.level !== null);
  const candidates: SeriesPoint['values'] = {
    weight: maxBy(byWeight, (set) => set.weight),
    oneRepMax: maxBy(byWeight, (set) => setOneRepMax(set, kind)),
    volume: sessionVolumeKg(byWeight, kind) || undefined,
    reps: kind.isBodyweight ? maxBy(byWeight, (set) => set.reps) : undefined,
    duration: kind.isTimed ? maxBy(working, (set) => set.durationSeconds) : undefined,
    level: maxBy(byLevel, (set) => set.level),
    levelReps: kind.isTimed ? undefined : maxBy(byLevel, (set) => set.reps),
    eccentricWeight: maxBy(byWeight, (set) => set.eccentricWeight),
    eccentricLevel: maxBy(byLevel, (set) => set.eccentricLevel),
  };
  return Object.fromEntries(Object.entries(candidates).filter(([, value]) => value !== undefined));
}

export function exerciseSeries(sessions: SetGroup[], kind: ExerciseKind): SeriesPoint[] {
  return sessions
    .map(({ startedAt, sets }) => ({ date: startedAt, values: sessionValues(sets, kind) }))
    .filter((point) => Object.keys(point.values).length > 0);
}

/** Kennzahlen mit Daten; Zusatzgewicht nur, wenn es je eines gab */
export function availableMetrics(points: SeriesPoint[]): ExerciseMetric[] {
  return EXERCISE_METRICS.filter((metric) =>
    points.some((point) => (point.values[metric] ?? 0) !== 0),
  );
}

export function metricLabel(metric: ExerciseMetric, isBodyweight: boolean): string {
  switch (metric) {
    case 'weight':
      return isBodyweight ? 'Zusatzgewicht' : 'Gewicht';
    case 'oneRepMax':
      return '1RM';
    case 'volume':
      return 'Volumen';
    case 'reps':
      return 'Wdh.';
    case 'levelReps':
      return 'Wdh. (Stufe)';
    case 'duration':
      return 'Dauer';
    case 'level':
      return 'Stufe';
    case 'eccentricWeight':
      return 'Exzentrik';
    case 'eccentricLevel':
      return 'Exzentrik (Stufe)';
  }
}

const KG_METRICS: readonly ExerciseMetric[] = ['weight', 'oneRepMax', 'volume', 'eccentricWeight'];

/** Wert für die Achse: Gewichte in der Anzeigeeinheit, sonst unverändert */
export function metricDisplayValue(metric: ExerciseMetric, value: number, unit: WeightUnit) {
  return KG_METRICS.includes(metric) ? roundTo(kgToDisplay(value, unit), 1) : value;
}

/** Text zu einem Wert aus `metricDisplayValue` */
export function formatMetricValue(metric: ExerciseMetric, value: number, unit: WeightUnit) {
  if (metric === 'duration') return formatClock(value);
  if (KG_METRICS.includes(metric)) {
    return `${formatDecimal(value, metric === 'volume' ? 0 : 1)} ${unit}`;
  }
  return metric === 'reps' || metric === 'levelReps'
    ? `${formatDecimal(value, 0)} Wdh.`
    : formatDecimal(value, 1);
}

// ---------- Heatmap ----------

export interface DaySummary {
  sets: number;
  workoutIds: string[];
}

/** Arbeitssätze und Workouts je lokalem Tag (`YYYY-MM-DD`) */
export function summarizeDays(sessions: StatsSession[]): Map<string, DaySummary> {
  const days = new Map<string, DaySummary>();
  for (const { startedAt, workoutId, sets } of sessions) {
    const key = toDateInput(startedAt);
    const day = days.get(key) ?? { sets: 0, workoutIds: [] };
    day.sets += sets.filter(isWorkingSet).length;
    if (!day.workoutIds.includes(workoutId)) day.workoutIds.push(workoutId);
    days.set(key, day);
  }
  return days;
}

export interface HeatmapDay {
  key: string;
  value: number;
  isFirstOfMonth: boolean;
}

/**
 * Spalten = Wochen (Mo–So), älteste zuerst; die letzte enthält heute.
 * `null` = Tag nach heute. `values` ist nach lokalem Tag (`YYYY-MM-DD`) aufgelöst.
 */
export function heatmapWeeks(
  values: ReadonlyMap<string, number>,
  now: Date,
  weekCount: number,
): Array<Array<HeatmapDay | null>> {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const weeks: Array<Array<HeatmapDay | null>> = [];
  for (let week = weekCount - 1; week >= 0; week--) {
    const days: Array<HeatmapDay | null> = [];
    for (let weekday = 0; weekday < 7; weekday++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() - week * 7 + weekday);
      if (day > today) {
        days.push(null);
        continue;
      }
      const key = toDateInput(day.toISOString());
      days.push({ key, value: values.get(key) ?? 0, isFirstOfMonth: day.getDate() === 1 });
    }
    weeks.push(days);
  }
  return weeks;
}

/** Lokaler Tag (`YYYY-MM-DD`) → Datum */
export function parseDayKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year!, month! - 1, day!);
}

export function formatDayKey(key: string): string {
  return formatWorkoutDate(parseDayKey(key).toISOString());
}

/** Farbstufe 0–4 nach Anzahl der Arbeitssätze */
export function heatLevel(sets: number): 0 | 1 | 2 | 3 | 4 {
  if (sets <= 0) return 0;
  if (sets <= 8) return 1;
  if (sets <= 16) return 2;
  if (sets <= 24) return 3;
  return 4;
}

// ---------- Sätze je Muskelgruppe ----------

/** Hilfsmuskeln werden nur teilweise belastet */
export const SECONDARY_MUSCLE_FACTOR = 0.5;
/** Kleine Gruppen wie Nacken oder Adduktoren stünden sonst immer als vernachlässigt da */
export const MAJOR_MUSCLES: readonly MuscleGroup[] = [
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
];
export const NEGLECTED_SETS_PER_WEEK = 4;
export const HIGH_VOLUME_SETS_PER_WEEK = 10;
const MIN_HISTORY_DAYS = 14;

function muscleSets(session: StatsSession, muscle: MuscleGroup): number {
  const { exercise, sets } = session;
  if (exercise.category !== 'strength') return 0;
  const factor = exercise.primaryMuscles.includes(muscle)
    ? 1
    : exercise.secondaryMuscles.includes(muscle)
      ? SECONDARY_MUSCLE_FACTOR
      : 0;
  return factor * sets.filter(isWorkingSet).length;
}

/** Wochen, über die im Zeitraum gemittelt wird: nicht vor dem allerersten Training, mindestens 1 */
export function averagingWeeks(
  firstSessionAt: string | undefined,
  range: StatsRange,
  now: Date,
): number {
  if (!firstSessionAt) return 1;
  const first = Date.parse(firstSessionAt);
  const start = Math.max(first, rangeStart(range, now)?.getTime() ?? first);
  return Math.max(1, (now.getTime() - start) / (7 * DAY_MS));
}

export interface MuscleVolume {
  muscle: MuscleGroup;
  setsPerWeek: number;
}

/** Durchschnittliche Sätze pro Woche, meiste zuerst; Gruppen ohne Sätze fehlen */
export function muscleVolumes(sessions: StatsSession[], weeks: number): MuscleVolume[] {
  const totals = new Map<MuscleGroup, number>();
  for (const session of sessions) {
    const muscles = [...session.exercise.primaryMuscles, ...session.exercise.secondaryMuscles];
    for (const muscle of new Set(muscles)) {
      const sets = muscleSets(session, muscle);
      if (sets > 0) totals.set(muscle, (totals.get(muscle) ?? 0) + sets);
    }
  }
  return [...totals]
    .map(([muscle, sets]) => ({ muscle, setsPerWeek: sets / weeks }))
    .sort((a, b) => b.setsPerWeek - a.setsPerWeek);
}

const mondayOf = (date: Date) => {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
};

export interface WeeklySets {
  /** Montag der Woche, lokal (`YYYY-MM-DD`) */
  weekStart: string;
  sets: number;
}

/** Sätze einer Muskelgruppe je Woche, lückenlos von der ersten Woche mit Daten bis heute */
export function weeklyMuscleSets(
  sessions: StatsSession[],
  muscle: MuscleGroup,
  now: Date,
): WeeklySets[] {
  const counted = sessions
    .map((session) => ({ session, sets: muscleSets(session, muscle) }))
    .filter(({ sets }) => sets > 0);
  if (counted.length === 0) return [];
  const totals = new Map<string, number>();
  let first = mondayOf(now);
  for (const { session, sets } of counted) {
    const monday = mondayOf(new Date(session.startedAt));
    if (monday < first) first = monday;
    const key = toDateInput(monday.toISOString());
    totals.set(key, (totals.get(key) ?? 0) + sets);
  }
  const weeks: WeeklySets[] = [];
  const last = mondayOf(now);
  for (const week = new Date(first); week <= last; week.setDate(week.getDate() + 7)) {
    const weekStart = toDateInput(week.toISOString());
    weeks.push({ weekStart, sets: totals.get(weekStart) ?? 0 });
  }
  return weeks;
}

// ---------- Fortschritt ----------

/** Vorher/Nachher nehmen je den Bestwert aus so vielen Einheiten, das glättet Tagesform */
const PROGRESS_WINDOW = 2;
export const MIN_PROGRESS_SESSIONS = PROGRESS_WINDOW * 2;
/** Darunter gilt eine Gruppe als stagnierend */
export const STALLED_PERCENT = 1;

export interface ProgressResult {
  percent: number;
  start: number;
  end: number;
  sessionCount: number;
}

/** Vergleichswerte je Einheit, beste Kennzahl zuerst: kg und Stufen werden nie vermischt */
export function progressCandidates(
  sets: StrengthSet[],
  kind: ExerciseKind,
): Array<number | undefined> {
  const working = sets.filter((set) => isWorkingSet(set) && isPerformed(set, kind));
  if (kind.isTimed) return [maxBy(working, (set) => set.durationSeconds)];
  return [
    maxBy(working, (set) => setOneRepMax(set, kind)),
    maxBy(working, (set) =>
      set.level !== null && set.reps !== null ? estimateOneRepMax(set.level, set.reps) : null,
    ),
    kind.isBodyweight ? maxBy(working, (set) => set.reps) : undefined,
  ];
}

/**
 * Fortschritt im Zeitraum in %: Bestwert der ersten gegen den der letzten beiden Einheiten.
 * Verwendet wird die erste Kennzahl mit genug Einheiten; `null` bei zu wenig Daten.
 */
export function exerciseProgress(groups: SetGroup[], kind: ExerciseKind): ProgressResult | null {
  const perSession = groups.map(({ sets }) => progressCandidates(sets, kind));
  const candidateCount = perSession[0]?.length ?? 0;
  for (let candidate = 0; candidate < candidateCount; candidate++) {
    const values = perSession
      .map((session) => session[candidate])
      .filter((value): value is number => value !== undefined && value > 0);
    if (values.length < MIN_PROGRESS_SESSIONS) continue;
    const start = Math.max(...values.slice(0, PROGRESS_WINDOW));
    const end = Math.max(...values.slice(-PROGRESS_WINDOW));
    return {
      percent: ((end - start) / start) * 100,
      start,
      end,
      sessionCount: values.length,
    };
  }
  return null;
}

function groupByExercise(sessions: StatsSession[]): Map<string, StatsSession[]> {
  const groups = new Map<string, StatsSession[]>();
  for (const session of sessions) {
    const list = groups.get(session.exercise.id) ?? [];
    list.push(session);
    groups.set(session.exercise.id, list);
  }
  return groups;
}

export interface ExerciseOverview {
  exercise: StatsExercise;
  sessionCount: number;
  lastAt: string;
  progress: ProgressResult | null;
}

export function exerciseOverviews(
  sessions: StatsSession[],
  bodyWeightKg: number | null,
): ExerciseOverview[] {
  return [...groupByExercise(sessions).values()].map((group) => {
    const exercise = group[0]!.exercise;
    return {
      exercise,
      sessionCount: group.length,
      lastAt: group.at(-1)!.startedAt,
      progress: exerciseProgress(group, exerciseKind(exercise, bodyWeightKg)),
    };
  });
}

export const EXERCISE_SORTS = ['recent', 'progress', 'name'] as const;
export type ExerciseSort = (typeof EXERCISE_SORTS)[number];

export function sortOverviews(items: ExerciseOverview[], sort: ExerciseSort): ExerciseOverview[] {
  const byName = (a: ExerciseOverview, b: ExerciseOverview) =>
    a.exercise.name.localeCompare(b.exercise.name, 'de');
  return [...items].sort((a, b) => {
    if (sort === 'recent') return b.lastAt.localeCompare(a.lastAt) || byName(a, b);
    if (sort === 'name') return byName(a, b);
    const left = a.progress?.percent ?? Number.NEGATIVE_INFINITY;
    const right = b.progress?.percent ?? Number.NEGATIVE_INFINITY;
    return right - left || byName(a, b);
  });
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

export interface MuscleProgress {
  muscle: MuscleGroup;
  /** Median der Übungen, die die Gruppe als Hauptmuskel haben */
  percent: number;
  exerciseCount: number;
}

/** Rangliste, größter Fortschritt zuerst; Gruppen ohne auswertbare Übung fehlen */
export function muscleProgress(items: ExerciseOverview[]): MuscleProgress[] {
  const percents = new Map<MuscleGroup, number[]>();
  for (const { exercise, progress } of items) {
    if (!progress || exercise.category !== 'strength') continue;
    for (const muscle of exercise.primaryMuscles) {
      percents.set(muscle, [...(percents.get(muscle) ?? []), progress.percent]);
    }
  }
  return [...percents]
    .map(([muscle, values]) => ({
      muscle,
      percent: median(values),
      exerciseCount: values.length,
    }))
    .sort((a, b) => b.percent - a.percent);
}

export type FocusKind = 'neglected' | 'stalledLowVolume' | 'stalledHighVolume' | 'lowest';

export interface FocusHint {
  muscle: MuscleGroup;
  kind: FocusKind;
}

const MAX_FOCUS_HINTS = 3;

/** `true`, sobald seit dem allerersten Training genug Zeit für eine Aussage vergangen ist */
export function hasEnoughHistory(firstSessionAt: string | undefined, now: Date): boolean {
  return (
    firstSessionAt !== undefined &&
    now.getTime() - Date.parse(firstSessionAt) >= MIN_HISTORY_DAYS * DAY_MS
  );
}

/**
 * Worauf der Fokus liegen sollte: vernachlässigte, dann stagnierende große Muskelgruppen.
 * Stagniert keine, wird die mit dem geringsten Fortschritt genannt.
 */
export function focusHints({
  volumes,
  progress,
  enoughHistory,
}: {
  volumes: MuscleVolume[];
  progress: MuscleProgress[];
  enoughHistory: boolean;
}): FocusHint[] {
  const setsOf = (muscle: MuscleGroup) =>
    volumes.find((volume) => volume.muscle === muscle)?.setsPerWeek ?? 0;
  const isMajor = (muscle: MuscleGroup) => MAJOR_MUSCLES.includes(muscle);

  const neglected = enoughHistory
    ? MAJOR_MUSCLES.filter((muscle) => setsOf(muscle) < NEGLECTED_SETS_PER_WEEK).sort(
        (a, b) => setsOf(a) - setsOf(b),
      )
    : [];
  const ranked = progress.filter(({ muscle }) => isMajor(muscle) && !neglected.includes(muscle));
  const stalled = ranked.filter(({ percent }) => percent < STALLED_PERCENT).reverse();

  const hints: FocusHint[] = [
    ...neglected.map((muscle): FocusHint => ({ muscle, kind: 'neglected' })),
    ...stalled.map(({ muscle }): FocusHint => ({
      muscle,
      kind: setsOf(muscle) >= HIGH_VOLUME_SETS_PER_WEEK ? 'stalledHighVolume' : 'stalledLowVolume',
    })),
  ];
  const lowest = ranked.at(-1);
  if (hints.length === 0 && lowest && ranked.length >= 2) {
    hints.push({ muscle: lowest.muscle, kind: 'lowest' });
  }
  return hints.slice(0, MAX_FOCUS_HINTS);
}

export function formatFocusHint({ muscle, kind }: FocusHint): string {
  const name = MUSCLE_LABELS[muscle];
  switch (kind) {
    case 'neglected':
      return `${name}: vernachlässigt, mehr Sätze einplanen`;
    case 'stalledLowVolume':
      return `${name}: stagniert, Sätze erhöhen`;
    case 'stalledHighVolume':
      return `${name}: stagniert trotz viel Volumen, Übung oder Wdh.-Bereich wechseln`;
    case 'lowest':
      return `${name}: bisher der geringste Fortschritt`;
  }
}

export function formatPercent(percent: number): string {
  const rounded = roundTo(percent, 1);
  const text = `${formatDecimal(Math.abs(rounded), 1)} %`;
  if (rounded > 0) return `+${text}`;
  return rounded < 0 ? `−${text}` : text;
}

// ---------- Dashboard ----------

export interface WeekSummary {
  workouts: number;
  sets: number;
  volumeKg: number;
}

/** Laufende Kalenderwoche (ab Montag): Aufwärmsätze zählen nicht, Volumen wie `sessionVolumeKg` */
export function weekSummary(
  sessions: StatsSession[],
  bodyWeightKg: number | null,
  now: Date,
): WeekSummary {
  const start = mondayOf(now).getTime();
  const inWeek = sessions.filter((session) => Date.parse(session.startedAt) >= start);
  return {
    workouts: new Set(inWeek.map((session) => session.workoutId)).size,
    sets: inWeek.reduce((sum, { sets }) => sum + sets.filter(isWorkingSet).length, 0),
    volumeKg: inWeek.reduce(
      (sum, { sets, exercise }) =>
        sum + sessionVolumeKg(sets, exerciseKind(exercise, bodyWeightKg)),
      0,
    ),
  };
}

export interface TrainingProgress {
  /** Median der Kraftübungen mit Fortschritt in den letzten 3 Monaten; `null` = zu wenig Daten */
  strengthPercent: number | null;
  /** Übungen, die in den Median eingehen */
  exerciseCount: number;
  workoutsThisMonth: number;
  workoutsLastMonth: number;
  recordsThisMonth: number;
}

/** Widget „Trainingsfortschritt“: Kraftsteigerung, Workouts im Kalendermonat, Rekorde im Monat */
export function trainingProgress(
  sessions: StatsSession[],
  bodyWeightKg: number | null,
  now: Date,
): TrainingProgress {
  const percents = exerciseOverviews(filterByRange(sessions, '3m', now), bodyWeightKg)
    .filter(({ exercise, progress }) => progress && exercise.category === 'strength')
    .map(({ progress }) => progress!.percent);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
  const workoutsBetween = (from: number, to: number) =>
    new Set(
      sessions
        .filter(({ startedAt }) => Date.parse(startedAt) >= from && Date.parse(startedAt) < to)
        .map(({ workoutId }) => workoutId),
    ).size;

  return {
    strengthPercent: percents.length > 0 ? median(percents) : null,
    exerciseCount: percents.length,
    workoutsThisMonth: workoutsBetween(monthStart, Number.POSITIVE_INFINITY),
    workoutsLastMonth: workoutsBetween(lastMonthStart, monthStart),
    recordsThisMonth: countRecordsBetween(
      sessions,
      bodyWeightKg,
      monthStart,
      Number.POSITIVE_INFINITY,
    ),
  };
}

/** Rekorde in Einheiten ab `from` bis vor `to` (ms), verglichen mit allen früheren Einheiten */
export function countRecordsBetween(
  sessions: StatsSession[],
  bodyWeightKg: number | null,
  from: number,
  to: number,
): number {
  return recordsBetween(sessions, bodyWeightKg, from, to).reduce(
    (sum, row) => sum + row.records.length,
    0,
  );
}

/** Einheiten mit Rekord ab `from` bis vor `to` (ms), je Übung und Workout eine Zeile, älteste zuerst */
export function recordsBetween(
  sessions: StatsSession[],
  bodyWeightKg: number | null,
  from: number,
  to: number,
): RecentRecords[] {
  const chronological = [...sessions].sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  const groups = groupByExercise(chronological);
  const rows: RecentRecords[] = [];
  // Rückwärts, damit nur so viel Historie durchgerechnet wird wie nötig
  for (const { workoutId, startedAt, exercise, sets } of chronological.reverse()) {
    const time = Date.parse(startedAt);
    if (time < from) break;
    const group = groups.get(exercise.id)!;
    group.pop();
    if (time >= to) continue;
    const records = sessionRecords(
      sets,
      group.map((session) => session.sets),
      exerciseKind(exercise, bodyWeightKg),
    )
      .flat()
      .sort(byRecordOrder);
    if (records.length > 0) rows.push({ workoutId, startedAt, exercise, records });
  }
  return rows.reverse();
}

/** Rekorde je Einheit mit Rekord als `{ startedAt, count }`, älteste zuerst (für Abzeichen) */
export function recordCounts(
  sessions: readonly StatsSession[],
  bodyWeightKg: number | null,
): Array<{ startedAt: string; count: number }> {
  const chronological = [...sessions].sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  const history = new Map<string, StrengthSet[][]>();
  const result: Array<{ startedAt: string; count: number }> = [];
  for (const { startedAt, exercise, sets } of chronological) {
    const past = history.get(exercise.id) ?? [];
    const count = sessionRecords(sets, past, exerciseKind(exercise, bodyWeightKg)).flat().length;
    if (count > 0) result.push({ startedAt, count });
    past.push(sets);
    history.set(exercise.id, past);
  }
  return result;
}

export interface RecentRecords {
  workoutId: string;
  startedAt: string;
  exercise: StatsExercise;
  records: PersonalRecord[];
}

/** Neueste Einheiten mit Rekord, je Übung und Workout eine Zeile, neueste zuerst */
export function recentRecords(
  sessions: StatsSession[],
  bodyWeightKg: number | null,
  limit: number,
): RecentRecords[] {
  const chronological = [...sessions].sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  const groups = groupByExercise(chronological);
  const rows: RecentRecords[] = [];
  // Rückwärts, damit nur so viel Historie durchgerechnet wird wie nötig
  for (const { workoutId, startedAt, exercise, sets } of chronological.reverse()) {
    if (rows.length === limit) break;
    const group = groups.get(exercise.id)!;
    group.pop();
    const records = sessionRecords(
      sets,
      group.map((session) => session.sets),
      exerciseKind(exercise, bodyWeightKg),
    )
      .flat()
      .sort(byRecordOrder);
    if (records.length > 0) rows.push({ workoutId, startedAt, exercise, records });
  }
  return rows;
}

// ---------- Satzpausen ----------

/** Kürzer = nachträglich abgehakt */
export const MIN_REST_SECONDS = 30;
/** Länger = Unterbrechung */
export const MAX_REST_SECONDS = 900;
/** Über diese Pausenzeit hinaus gibt es keine Empfehlung */
export const REST_LIMIT_SECONDS = 300;
export const MIN_REST_PAIRS = 15;
const MIN_BUCKET_PAIRS = 5;
/** Prozentpunkte weniger Leistungsabfall, ab denen sich eine längere Pause lohnt */
const WORTHWHILE_GAIN = 5;
/** Prozentpunkte, unter denen eine kürzere Pause kaum etwas kostet */
const NEGLIGIBLE_LOSS = 2;
/** Nur eine Pausenlänge vorhanden: Bewertung des Abfalls selbst */
const HIGH_DROP = 20;
const LOW_DROP = 5;

export const REST_BUCKETS = [
  { label: 'unter 1:30', upTo: 90, target: 75 },
  { label: '1:30–2:30', upTo: 150, target: 120 },
  { label: '2:30–3:30', upTo: 210, target: 180 },
  { label: '3:30–5:00', upTo: 300, target: 240 },
  { label: 'über 5:00', upTo: Number.POSITIVE_INFINITY, target: REST_LIMIT_SECONDS },
] as const;

export interface RestPair {
  /** Satzende bis Satzende, enthält also die Ausführung des zweiten Satzes */
  seconds: number;
  /** Rückgang der Wdh. bzw. Dauer in %, negativ = der zweite Satz war besser */
  dropPercent: number;
}

const sameLoad = (a: StrengthSet, b: StrengthSet) =>
  (a.level === null) === (b.level === null) &&
  Math.abs((a.level ?? a.weight ?? 0) - (b.level ?? b.weight ?? 0)) < EPSILON;

/** Aufeinanderfolgende Arbeitssätze derselben Übung mit gleicher Last */
export function restPairs(groups: SetGroup[], isTimed: boolean): RestPair[] {
  const output = (set: StrengthSet) => (isTimed ? set.durationSeconds : set.reps) ?? 0;
  const pairs: RestPair[] = [];
  for (const { sets } of groups) {
    const byItem = new Map<string, StatsSet[]>();
    for (const set of sets) {
      if (set.completedAt === null) continue;
      byItem.set(set.workoutExerciseId, [...(byItem.get(set.workoutExerciseId) ?? []), set]);
    }
    for (const itemSets of byItem.values()) {
      itemSets.forEach((second, index) => {
        const first = itemSets[index - 1];
        if (!first || first.isWarmup || second.isWarmup || !sameLoad(first, second)) return;
        if (output(first) <= 0 || output(second) <= 0) return;
        const seconds = (Date.parse(second.completedAt!) - Date.parse(first.completedAt!)) / 1000;
        if (seconds < MIN_REST_SECONDS || seconds > MAX_REST_SECONDS) return;
        pairs.push({
          seconds,
          dropPercent: ((output(first) - output(second)) / output(first)) * 100,
        });
      });
    }
  }
  return pairs;
}

export interface RestBucket {
  label: string;
  target: number;
  count: number;
  averageDrop: number;
}

export type RestAdvice =
  | { kind: 'notEnoughData'; missingPairs: number }
  | { kind: 'longer' | 'shorter'; targetSeconds: number }
  | { kind: 'keep' };

export interface RestAnalysis {
  pairCount: number;
  /** Nur Pausenlängen mit Daten, kürzeste zuerst */
  buckets: RestBucket[];
  advice: RestAdvice;
}

function restAdvice(buckets: RestBucket[], pairCount: number): RestAdvice {
  const usable = buckets.filter((bucket) => bucket.count >= MIN_BUCKET_PAIRS);
  if (pairCount < MIN_REST_PAIRS || usable.length === 0) {
    return { kind: 'notEnoughData', missingPairs: Math.max(1, MIN_REST_PAIRS - pairCount) };
  }
  const typical = usable.reduce((best, bucket) => (bucket.count > best.count ? bucket : best));
  const index = usable.indexOf(typical);
  const longer = usable[index + 1];
  const shorter = usable[index - 1];

  if (longer && typical.averageDrop - longer.averageDrop >= WORTHWHILE_GAIN) {
    return { kind: 'longer', targetSeconds: longer.target };
  }
  if (shorter && shorter.averageDrop - typical.averageDrop < NEGLIGIBLE_LOSS) {
    return { kind: 'shorter', targetSeconds: shorter.target };
  }
  if (!longer && !shorter) {
    const position = REST_BUCKETS.findIndex((bucket) => bucket.label === typical.label);
    const next = REST_BUCKETS[position + 1];
    const previous = REST_BUCKETS[position - 1];
    if (typical.averageDrop > HIGH_DROP && next) {
      return { kind: 'longer', targetSeconds: next.target };
    }
    if (typical.averageDrop < LOW_DROP && previous) {
      return { kind: 'shorter', targetSeconds: previous.target };
    }
  }
  return { kind: 'keep' };
}

export function analyzeRest(pairs: RestPair[]): RestAnalysis {
  const buckets = REST_BUCKETS.flatMap(({ label, upTo, target }, index) => {
    const from = REST_BUCKETS[index - 1]?.upTo ?? 0;
    const inBucket = pairs.filter((pair) => pair.seconds >= from && pair.seconds < upTo);
    if (inBucket.length === 0) return [];
    const total = inBucket.reduce((sum, pair) => sum + pair.dropPercent, 0);
    return [{ label, target, count: inBucket.length, averageDrop: total / inBucket.length }];
  });
  return { pairCount: pairs.length, buckets, advice: restAdvice(buckets, pairs.length) };
}

export interface ExerciseRest {
  exercise: StatsExercise;
  analysis: RestAnalysis;
}

/** Je Übung, denn über Übungen gemischt verzerren etwa lange Pausen bei schweren Grundübungen */
export function restByExercise(sessions: StatsSession[]): ExerciseRest[] {
  return [...groupByExercise(sessions).values()]
    .map((group) => ({
      exercise: group[0]!.exercise,
      analysis: analyzeRest(restPairs(group, group[0]!.exercise.isTimed)),
    }))
    .filter(({ analysis }) => analysis.advice.kind !== 'notEnoughData')
    .sort((a, b) => b.analysis.pairCount - a.analysis.pairCount);
}

export function formatRestAdvice(advice: RestAdvice): string {
  switch (advice.kind) {
    case 'notEnoughData':
      return `Noch zu wenig Daten, es fehlen ${advice.missingPairs} vergleichbare Satzpaare.`;
    case 'longer':
      return `Pause auf etwa ${formatClock(advice.targetSeconds)} verlängern: Der nächste Satz bricht sonst deutlich ein.`;
    case 'shorter':
      return `Kaum Einbruch: Pause auf etwa ${formatClock(advice.targetSeconds)} kürzen oder härter trainieren.`;
    case 'keep':
      return 'Deine Pausenlänge passt.';
  }
}
