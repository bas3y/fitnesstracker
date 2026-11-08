import type { IconName } from '../components/iconPaths';
import type {
  DailyLog,
  DayKey,
  DistanceUnit,
  EnduranceSession,
  Exercise,
  Goal,
  GoalEntry,
  Habit,
  HabitGoalMetric,
  HabitKind,
  Settings,
  StrengthGoalMetric,
  TimerSession,
  WeightUnit,
} from '../db/types';
import type { DatedWeight } from './daily';
import { formatDistance, sessionDay, type DayRange } from './endurance';
import { formatEffortDistance } from './enduranceStats';
import { formatDecimal } from './format';
import { doneDates, formatHabitAmount, quitStreakDays, type HabitEntry } from './habits';
import { ENDURANCE_SPORT_LABELS, GOAL_KIND_LABELS } from './labels';
import { daysBetween, inRange, periodRange, shiftPeriod } from './periods';
import { parseDayKey, type StatsSession } from './stats';
import { exerciseKind, isPerformed, setOneRepMax, type ExerciseKind } from './strength';
import { kgToDisplay } from './units';
import { formatClock, formatWorkoutDuration, toDateInput } from './workout';

export type GoalEnduranceSession = Pick<
  EnduranceSession,
  'id' | 'sport' | 'startedAt' | 'durationSeconds' | 'distanceMeters' | 'trackSummary'
>;

export type GoalHabit = Pick<
  Habit,
  | 'id'
  | 'name'
  | 'icon'
  | 'kind'
  | 'target'
  | 'unit'
  | 'step'
  | 'items'
  | 'startDate'
  | 'pauses'
  | 'archivedAt'
  | 'frequency'
  | 'timesPerWeek'
  | 'weekdays'
>;

export interface GoalHabitData {
  habit: GoalHabit;
  entries: readonly HabitEntry[];
}

export type GoalDailyLog = Pick<DailyLog, 'date' | 'steps' | 'waterMl' | 'sleepSeconds'>;
export type GoalDailyGoals = Pick<Settings, 'stepsGoal' | 'waterGoalMl' | 'sleepGoalSeconds'>;
export type GoalEntryValue = Pick<GoalEntry, 'goalId' | 'date' | 'amount'>;

/** Alles, woraus der Fortschritt berechnet wird */
export interface GoalData {
  /** Beendete Workouts, älteste zuerst (`loadStatsSessions`) */
  strength: readonly StatsSession[];
  endurance: readonly GoalEnduranceSession[];
  /** Aufsteigend nach Datum */
  weights: readonly DatedWeight[];
  logs: readonly GoalDailyLog[];
  /** Aktuelle Tagesziele (für „Tage mit erreichtem Tagesziel“) */
  dailyGoals: GoalDailyGoals;
  /** Auch archivierte */
  habits: readonly GoalHabitData[];
  /** Selbst eingetragener Fortschritt eigener Ziele */
  entries: readonly GoalEntryValue[];
  /** Gelesene Seiten je Eintrag */
  reading: readonly DatedValue[];
  /** Tage, an denen ein Buch beendet wurde (je Buch einer) */
  finishedBooks: readonly DayKey[];
  /** Fokus- und Meditations-Sitzungen */
  timerSessions: readonly Pick<TimerSession, 'kind' | 'date' | 'durationSeconds'>[];
}

export interface DatedValue {
  date: DayKey;
  value: number;
}

type GoalExercise = Pick<Exercise, 'name' | 'isTimed' | 'equipment'>;

/** Wozu das Ziel gehört: Übung (Kraft) bzw. Gewohnheit */
export interface GoalSubject {
  exercise?: GoalExercise | null;
  habit?: Pick<GoalHabit, 'name' | 'icon' | 'unit' | 'kind'> | null;
}

export function goalSubject(
  goal: Pick<Goal, 'exerciseId' | 'habitId'>,
  exercises: ReadonlyMap<string, GoalExercise>,
  data: Pick<GoalData, 'habits'>,
): GoalSubject {
  return {
    exercise: goal.exerciseId ? (exercises.get(goal.exerciseId) ?? null) : null,
    habit: goal.habitId ? (habitOfGoal(goal, data)?.habit ?? null) : null,
  };
}

export function habitOfGoal(
  goal: Pick<Goal, 'habitId'>,
  data: Pick<GoalData, 'habits'>,
): GoalHabitData | null {
  return data.habits.find(({ habit }) => habit.id === goal.habitId) ?? null;
}

// ---------- Gewohnheit ----------

/** Kennzahlen, die zur Art der Gewohnheit passen; die erste ist der Vorschlag */
export function habitMetricsFor(kind: HabitKind): HabitGoalMetric[] {
  switch (kind) {
    case 'count':
      return ['amount', 'days'];
    case 'quit':
      return ['streak', 'limit'];
    default:
      return ['days'];
  }
}

export const HABIT_GOAL_METRIC_LABELS: Record<HabitGoalMetric, string> = {
  amount: 'Menge',
  days: 'Tage',
  streak: 'Serie',
  limit: 'Obergrenze',
};

function habitPoints(goal: Goal, data: GoalData): DatedValue[] {
  const item = habitOfGoal(goal, data);
  if (!item) return [];
  const own = item.entries.filter((entry) => entry.itemId === null);
  switch (goal.habitMetric) {
    case 'amount':
    case 'limit':
      return own.map(({ date, amount }) => ({ date, value: amount }));
    case 'days':
      return doneDates(item.habit, item.entries).map((date) => ({ date, value: 1 }));
    default:
      return [];
  }
}

// ---------- Kraft ----------

/** Kennzahlen, die zur Übung passen; die erste ist der Vorschlag */
export function strengthMetricsFor(
  exercise: Pick<Exercise, 'isTimed' | 'equipment'>,
): StrengthGoalMetric[] {
  if (exercise.isTimed) return ['duration'];
  if (exercise.equipment === 'bodyweight') return ['reps', 'weight'];
  return ['weight', 'oneRepMax'];
}

export function strengthMetricLabel(metric: StrengthGoalMetric, isBodyweight: boolean): string {
  switch (metric) {
    case 'weight':
      return isBodyweight ? 'Zusatzgewicht' : 'Gewicht';
    case 'oneRepMax':
      return '1RM (geschätzt)';
    case 'reps':
      return 'Wiederholungen';
    case 'duration':
      return 'Dauer';
  }
}

/** Bester Wert einer Einheit; Stufen zählen nie (kein kg) */
function strengthValue(
  sets: StatsSession['sets'],
  metric: StrengthGoalMetric,
  kind: ExerciseKind,
  minReps: number | null,
): number | null {
  let best: number | null = null;
  for (const set of sets) {
    if (set.isWarmup || !isPerformed(set, kind)) continue;
    let value: number | null;
    if (metric === 'weight') {
      const enoughReps = kind.isTimed || (set.reps ?? 0) >= (minReps ?? 1);
      value = set.level === null && enoughReps ? set.weight : null;
    } else if (metric === 'oneRepMax') {
      value = setOneRepMax(set, kind);
    } else if (metric === 'reps') {
      value = kind.isTimed ? null : set.reps;
    } else {
      value = kind.isTimed ? set.durationSeconds : null;
    }
    if (value !== null && (best === null || value > best)) best = value;
  }
  return best;
}

// ---------- Bestzeit ----------

/**
 * Zeit über die Strecke: aus dem Verlauf, sonst die ganze Einheit mit ihrer Ø-Pace hochgerechnet
 * (z. B. manuell erfasste 10,5 km in 52 min zählen für 10 km als 49:31)
 */
export function effortSeconds(session: GoalEnduranceSession, meters: number): number | null {
  const effort = session.trackSummary?.bestEfforts.find((item) => item.meters === meters);
  if (effort) return effort.seconds;
  if (session.distanceMeters === null || session.distanceMeters < meters) return null;
  return (session.durationSeconds * meters) / session.distanceMeters;
}

// ---------- Werte ----------

/** Zählt in einem Zeitraum (Menge, Gewohnheit außer Serie) */
export const hasPeriod = (goal: Pick<Goal, 'kind' | 'habitMetric'>) =>
  goal.kind === 'total' || (goal.kind === 'habit' && goal.habitMetric !== 'streak');

const isRecurring = (goal: Pick<Goal, 'kind' | 'period' | 'habitMetric'>) =>
  hasPeriod(goal) && goal.period !== null && goal.period !== 'custom';

const isLimit = (goal: Pick<Goal, 'kind' | 'habitMetric'>) =>
  goal.kind === 'habit' && goal.habitMetric === 'limit';

/** Zielwert ist eine Anzahl (Trainings, Tage, Schritte) */
export function isCountGoal(goal: Pick<Goal, 'kind' | 'totalMetric' | 'habitMetric'>): boolean {
  if (goal.kind === 'total')
    return goal.totalMetric !== 'distance' && goal.totalMetric !== 'duration';
  return goal.kind === 'habit' && (goal.habitMetric === 'days' || goal.habitMetric === 'streak');
}

/** Bei Bestzeiten und Obergrenzen ist weniger besser, beim Gewicht hängt es vom Start ab */
export function lowerIsBetter(
  goal: Pick<Goal, 'kind' | 'target' | 'startValue' | 'habitMetric'>,
): boolean {
  if (goal.kind === 'effort' || isLimit(goal)) return true;
  return goal.kind === 'bodyWeight' && goal.startValue !== null && goal.target < goal.startValue;
}

/** Werte je Einheit bzw. Tag, älteste zuerst; bei `total` der Beitrag je Einheit */
export function goalPoints(goal: Goal, data: GoalData): DatedValue[] {
  const points: DatedValue[] = [];
  switch (goal.kind) {
    case 'strength':
      for (const session of data.strength) {
        if (session.exercise.id !== goal.exerciseId || goal.strengthMetric === null) continue;
        const kind = exerciseKind(session.exercise, null);
        const value = strengthValue(session.sets, goal.strengthMetric, kind, goal.minReps);
        if (value !== null) points.push({ date: toDateInput(session.startedAt), value });
      }
      break;
    case 'effort':
      for (const session of data.endurance) {
        if (session.sport !== goal.sport || goal.effortMeters === null) continue;
        const value = effortSeconds(session, goal.effortMeters);
        if (value !== null) points.push({ date: sessionDay(session), value });
      }
      break;
    case 'bodyWeight':
      for (const { date, weightKg } of data.weights) points.push({ date, value: weightKg });
      break;
    case 'total':
      points.push(...totalPoints(goal, data));
      break;
    case 'habit':
      points.push(...habitPoints(goal, data));
      break;
    case 'custom':
      for (const entry of data.entries) {
        if (entry.goalId === goal.id) points.push({ date: entry.date, value: entry.amount });
      }
      break;
  }
  return points.sort((a, b) => a.date.localeCompare(b.date));
}

function dailyPoints(goal: Goal, data: GoalData): DatedValue[] {
  const { stepsGoal, waterGoalMl, sleepGoalSeconds } = data.dailyGoals;
  const reached = (value: number | null, goalValue: number) => value !== null && value >= goalValue;
  return data.logs.flatMap((log): DatedValue[] => {
    switch (goal.totalMetric) {
      case 'steps':
        return log.steps ? [{ date: log.date, value: log.steps }] : [];
      case 'stepsGoalDays':
        return reached(log.steps, stepsGoal) ? [{ date: log.date, value: 1 }] : [];
      case 'waterGoalDays':
        return reached(log.waterMl, waterGoalMl) ? [{ date: log.date, value: 1 }] : [];
      case 'sleepGoalDays':
        return reached(log.sleepSeconds, sleepGoalSeconds) ? [{ date: log.date, value: 1 }] : [];
      default:
        return [];
    }
  });
}

function totalPoints(goal: Goal, data: GoalData): DatedValue[] {
  const ofSport = data.endurance.filter((session) => !goal.sport || session.sport === goal.sport);
  switch (goal.totalMetric) {
    case 'workouts':
    case 'trainings': {
      const workouts = new Map<string, DayKey>();
      for (const session of data.strength) {
        workouts.set(session.workoutId, toDateInput(session.startedAt));
      }
      const points = [...workouts.values()].map((date) => ({ date, value: 1 }));
      if (goal.totalMetric === 'workouts') return points;
      return [
        ...points,
        ...data.endurance.map((session) => ({ date: sessionDay(session), value: 1 })),
      ];
    }
    case 'distance':
      return ofSport.flatMap((session) =>
        session.distanceMeters
          ? [{ date: sessionDay(session), value: session.distanceMeters }]
          : [],
      );
    case 'duration':
      return ofSport.map((session) => ({
        date: sessionDay(session),
        value: session.durationSeconds,
      }));
    case 'pages':
      return [...data.reading];
    case 'books':
      return data.finishedBooks.map((date) => ({ date, value: 1 }));
    case 'focusTime':
    case 'meditationTime': {
      const kind = goal.totalMetric === 'focusTime' ? 'focus' : 'meditation';
      return data.timerSessions
        .filter((session) => session.kind === kind)
        .map((session) => ({ date: session.date, value: session.durationSeconds }));
    }
    default:
      return dailyPoints(goal, data);
  }
}

// ---------- Fortschritt ----------

export type GoalStatus = 'active' | 'achieved' | 'missed';

export interface GoalProgress {
  status: GoalStatus;
  /** `null` = noch keine Daten */
  current: number | null;
  /** Ausgangswert für den Balken (Bestwert vor dem Anlegen bzw. Startgewicht) */
  baseline: number | null;
  /** 0–100; 100 nur, wenn erreicht */
  percent: number;
  /** Erster Tag, an dem das Ziel erreicht war (wiederkehrend: im laufenden Zeitraum) */
  achievedOn: DayKey | null;
  lowerIsBetter: boolean;
  /** Wiederkehrend je Woche/Monat/Jahr */
  recurring: boolean;
  /** Nur `total`: gezählter Zeitraum */
  range: DayRange | null;
  /** Nur `total`, solange der Zeitraum läuft: gleichmäßig verteilt wäre man heute hier */
  expected: number | null;
  /** Tage bis zum Zieldatum bzw. Ende des Zeitraums (0 = heute); `null` = ohne oder vorbei */
  daysLeft: number | null;
  /** Nur Gewicht mit Zieldatum: nötige Änderung pro Woche (Betrag, kg) */
  perWeek: number | null;
  /** Wiederkehrend: abgeschlossene Zeiträume seit dem Anlegen; `null` = noch keiner */
  history: { reached: number; total: number } | null;
  /** Nur Obergrenze: noch erlaubt (negativ = überschritten) */
  remaining: number | null;
  /** Nur Serie: längste Serie bisher */
  best: number | null;
}

function share(
  current: number | null,
  baseline: number | null,
  target: number,
  lower: boolean,
): number {
  if (current === null || current <= 0) return 0;
  if (lower ? current <= target : current >= target) return 100;
  const usable = baseline !== null && (lower ? baseline > target : baseline < target);
  const ratio = usable
    ? (current - baseline) / (target - baseline)
    : lower
      ? target / current
      : current / target;
  return toPercent(ratio);
}

/** Abgerundet (99,9 % ist noch nicht erreicht), Rechenungenauigkeit ausgeglichen */
function toPercent(ratio: number): number {
  return Math.min(99, Math.max(0, Math.floor(ratio * 100 + 1e-9)));
}

function daysUntil(today: DayKey, day: DayKey | null): number | null {
  if (day === null || day < today) return null;
  return daysBetween(today, day) - 1;
}

const sum = (points: readonly DatedValue[]) =>
  points.reduce((total, point) => total + point.value, 0);

/** Zeitraum eines Mengen-Ziels, in dem `today` liegt (eigener Zeitraum: fest) */
export function goalRange(goal: Goal, today: DayKey): DayRange | null {
  if (!hasPeriod(goal) || goal.period === null) return null;
  if (goal.period === 'custom') return { from: goal.startDate, to: goal.deadline ?? today };
  return periodRange(goal.period, today);
}

const MAX_HISTORY_PERIODS = 600;

const EMPTY_EXTRAS = { remaining: null, best: null } as const;

/** Statt `active`: Zieldatum vorbei */
function deadlineStatus(goal: Goal, achievedOn: DayKey | null, today: DayKey): GoalStatus {
  if (achievedOn) return 'achieved';
  return goal.deadline !== null && goal.deadline < today ? 'missed' : 'active';
}

/** Gleichmäßig vom Beginn bis zum Zieldatum verteilt wäre man heute hier */
function expectedUntil(target: number, range: DayRange, today: DayKey): number | null {
  if (!inRange(today, range)) return null;
  return (target * daysBetween(range.from, today)) / daysBetween(range.from, range.to);
}

export function goalProgress(goal: Goal, data: GoalData, today: DayKey): GoalProgress {
  const points = goalPoints(goal, data).filter((point) => point.date <= today);
  const lower = lowerIsBetter(goal);
  const reached = (value: number) => (lower ? value <= goal.target : value >= goal.target);
  const base = {
    lowerIsBetter: lower,
    recurring: isRecurring(goal),
    range: null,
    expected: null,
    perWeek: null,
    history: null,
    ...EMPTY_EXTRAS,
  };

  if (isLimit(goal)) return limitProgress(goal, points, today);
  if (goal.kind === 'habit' && goal.habitMetric === 'streak') {
    return { ...base, ...streakProgress(goal, data, today) };
  }
  if (hasPeriod(goal)) return totalProgress(goal, points, today);
  if (goal.kind === 'custom') return { ...base, ...customProgress(goal, points, today) };

  let current: number | null;
  let baseline: number | null;
  let achievedOn: DayKey | null;
  if (goal.kind === 'bodyWeight') {
    current = points.at(-1)?.value ?? null;
    baseline = goal.startValue;
    achievedOn =
      points.find((point) => point.date >= goal.startDate && reached(point.value))?.date ?? null;
  } else {
    const best = (list: DatedValue[]) =>
      list.reduce<number | null>(
        (result, { value }) =>
          result === null || (lower ? value < result : value > result) ? value : result,
        null,
      );
    current = best(points);
    baseline = best(points.filter((point) => point.date < goal.startDate));
    achievedOn = points.find((point) => reached(point.value))?.date ?? null;
  }

  const daysLeft = achievedOn ? null : daysUntil(today, goal.deadline);
  const perWeek =
    goal.kind === 'bodyWeight' && current !== null && daysLeft !== null && daysLeft > 0
      ? Math.abs(current - goal.target) / (daysLeft / 7)
      : null;
  return {
    ...base,
    status: achievedOn
      ? 'achieved'
      : goal.deadline !== null && goal.deadline < today
        ? 'missed'
        : 'active',
    current,
    baseline,
    percent: achievedOn ? 100 : share(current, baseline, goal.target, lower),
    achievedOn,
    daysLeft,
    perWeek,
  };
}

/** Bis heute erreicht, sobald die Summe den Zielwert erreicht */
function reachedOnBySum(points: readonly DatedValue[], target: number): DayKey | null {
  let running = 0;
  return (
    points.find((point) => {
      running += point.value;
      return running >= target;
    })?.date ?? null
  );
}

/** Abgeschlossene Zeiträume seit dem Anlegen, `isReached` bekommt die Summe */
function periodHistory(
  goal: Goal,
  points: readonly DatedValue[],
  current: DayRange,
  isReached: (total: number) => boolean,
): GoalProgress['history'] {
  if (!isRecurring(goal) || goal.period === null || goal.period === 'custom') return null;
  let reachedCount = 0;
  let total = 0;
  let period = periodRange(goal.period, goal.startDate);
  while (period.to < current.from && total < MAX_HISTORY_PERIODS) {
    const { from, to } = period;
    if (isReached(sum(points.filter((point) => point.date >= from && point.date <= to)))) {
      reachedCount += 1;
    }
    total += 1;
    period = shiftPeriod(goal.period, period, 1);
  }
  return total > 0 ? { reached: reachedCount, total } : null;
}

function totalProgress(goal: Goal, points: DatedValue[], today: DayKey): GoalProgress {
  const range = goalRange(goal, today)!;
  const inside = points.filter((point) => inRange(point.date, range));
  const current = sum(inside);
  const achievedOn = reachedOnBySum(inside, goal.target);
  const recurring = isRecurring(goal);

  return {
    status: recurring ? 'active' : achievedOn ? 'achieved' : range.to < today ? 'missed' : 'active',
    current,
    baseline: null,
    percent: achievedOn ? 100 : toPercent(current / goal.target),
    achievedOn,
    lowerIsBetter: false,
    recurring,
    range,
    expected: expectedUntil(goal.target, range, today),
    daysLeft: achievedOn && !recurring ? null : daysUntil(today, range.to),
    perWeek: null,
    history: periodHistory(goal, points, range, (total) => total >= goal.target),
    ...EMPTY_EXTRAS,
  };
}

/**
 * Obergrenze (Aufhören): Balken = verbrauchter Anteil. Wiederkehrend bleibt das Ziel aktiv,
 * ein eigener Zeitraum ist erreicht, wenn er ohne Überschreiten zu Ende geht.
 */
function limitProgress(goal: Goal, points: DatedValue[], today: DayKey): GoalProgress {
  const range = goalRange(goal, today)!;
  const inside = points.filter((point) => inRange(point.date, range));
  const current = sum(inside);
  const recurring = isRecurring(goal);
  const exceeded = current > goal.target;
  const over = recurring ? false : exceeded;
  const achievedOn = !recurring && !exceeded && range.to < today ? range.to : null;
  const used = goal.target > 0 ? current / goal.target : current > 0 ? 1 : 0;
  return {
    status: over ? 'missed' : achievedOn ? 'achieved' : 'active',
    current,
    baseline: null,
    percent: Math.min(100, Math.floor(used * 100 + 1e-9)),
    achievedOn,
    lowerIsBetter: true,
    recurring,
    range,
    expected: over || achievedOn ? null : expectedUntil(goal.target, range, today),
    daysLeft: over || achievedOn ? null : daysUntil(today, range.to),
    perWeek: null,
    history: periodHistory(goal, points, range, (total) => total <= goal.target),
    remaining: goal.target - current,
    best: null,
  };
}

/** Serie (Aufhören): Tage am Stück im Limit; erreicht, sobald eine Serie den Zielwert erreicht */
function streakProgress(goal: Goal, data: GoalData, today: DayKey) {
  const item = habitOfGoal(goal, data);
  const days = item ? quitStreakDays(item.habit, item.entries, today) : [];
  const current = days.at(-1)?.value ?? 0;
  const best = days.reduce((max, day) => Math.max(max, day.value), 0);
  const achievedOn = days.find((day) => day.value >= goal.target)?.date ?? null;
  return {
    status: deadlineStatus(goal, achievedOn, today),
    current,
    baseline: null,
    percent: achievedOn ? 100 : toPercent(current / goal.target),
    achievedOn,
    daysLeft: achievedOn ? null : daysUntil(today, goal.deadline),
    best,
  };
}

/** Eigenes Ziel: Summe der Einträge (Ja/Nein: ein Eintrag) */
function customProgress(goal: Goal, points: DatedValue[], today: DayKey) {
  const current = sum(points);
  const achievedOn = reachedOnBySum(points, goal.target);
  const range = goal.deadline ? { from: goal.startDate, to: goal.deadline } : null;
  return {
    status: deadlineStatus(goal, achievedOn, today),
    current,
    baseline: null,
    percent: achievedOn ? 100 : toPercent(current / goal.target),
    achievedOn,
    expected:
      range && !achievedOn && goal.customType === 'number'
        ? expectedUntil(goal.target, range, today)
        : null,
    daysLeft: achievedOn ? null : daysUntil(today, goal.deadline),
  };
}

/** Aktive zuerst nach Zieldatum (ohne zuletzt), abgeschlossene zuletzt erreicht/verpasst zuerst */
export function sortGoalsByDeadline<T extends { goal: Goal; progress: GoalProgress }>(
  items: readonly T[],
): T[] {
  const endOf = ({ goal, progress }: T) => progress.range?.to ?? goal.deadline ?? '9999-12-31';
  return [...items].sort(
    (a, b) => endOf(a).localeCompare(endOf(b)) || a.goal.createdAt.localeCompare(b.goal.createdAt),
  );
}

// ---------- Anzeige ----------

export interface GoalUnits {
  weightUnit: WeightUnit;
  distanceUnit: DistanceUnit;
}

function formatCount(count: number, one: string, many: string): string {
  return `${formatDecimal(count, 0)} ${count === 1 ? one : many}`;
}

function formatHours(seconds: number): string {
  return seconds % 3600 === 0 ? `${seconds / 3600} h` : formatWorkoutDuration(seconds);
}

const formatDays = (count: number) => formatCount(count, 'Tag', 'Tage');

/** Wert in der Anzeigeeinheit, z. B. „100 kg“, „49:30“, „12 Trainings“, „420,5 km“, „30 Seiten“ */
export function formatGoalValue(
  goal: Pick<
    Goal,
    'kind' | 'strengthMetric' | 'totalMetric' | 'sport' | 'habitMetric' | 'customType' | 'unit'
  >,
  value: number,
  units: GoalUnits,
  subject: GoalSubject = {},
): string {
  const isBodyweight = subject.exercise?.equipment === 'bodyweight';
  const kg = (amount: number, decimals: number) =>
    `${formatDecimal(kgToDisplay(amount, units.weightUnit), decimals)} ${units.weightUnit}`;
  switch (goal.kind) {
    case 'habit':
      return goal.habitMetric === 'days' || goal.habitMetric === 'streak'
        ? formatDays(value)
        : formatHabitAmount(value, subject.habit?.unit ?? '');
    case 'custom':
      if (goal.customType === 'check') return value >= 1 ? 'Erledigt' : 'Offen';
      return formatHabitAmount(value, goal.unit);
    case 'strength':
      switch (goal.strengthMetric) {
        case 'reps':
          return `${formatDecimal(value, 0)} Wdh.`;
        case 'duration':
          return formatClock(value);
        default:
          return `${isBodyweight && goal.strengthMetric === 'weight' ? '+' : ''}${kg(value, 1)}`;
      }
    case 'effort':
      return formatClock(value);
    case 'bodyWeight':
      return kg(value, 1);
    case 'total':
      switch (goal.totalMetric) {
        case 'workouts':
          return formatCount(value, 'Krafttraining', 'Krafttrainings');
        case 'trainings':
          return formatCount(value, 'Training', 'Trainings');
        case 'distance':
          return formatDistance(value, goal.sport ?? 'run', units.distanceUnit, 1);
        case 'duration':
          return formatHours(value);
        case 'steps':
          return `${Math.round(value).toLocaleString('de-DE')} ${value === 1 ? 'Schritt' : 'Schritte'}`;
        case 'pages':
          return formatCount(value, 'Seite', 'Seiten');
        case 'books':
          return formatCount(value, 'Buch', 'Bücher');
        case 'focusTime':
        case 'meditationTime':
          return `${Math.round(value / 60).toLocaleString('de-DE')} min`;
        default:
          return formatDays(value);
      }
  }
}

const DAILY_GOAL_NAMES = {
  stepsGoalDays: 'Schrittziel',
  waterGoalDays: 'Wasserziel',
  sleepGoalDays: 'Schlafziel',
} as const;

/** „pro Woche“ … bzw. „bis 31.12.2026“ */
function periodSuffix(goal: Pick<Goal, 'period' | 'deadline' | 'startDate'>): string {
  switch (goal.period) {
    case 'week':
      return 'pro Woche';
    case 'month':
      return 'pro Monat';
    case 'year':
      return 'pro Jahr';
    default:
      return `bis ${formatGoalDate(goal.deadline ?? goal.startDate)}`;
  }
}

/** Symbol für Karte und Liste: eigenes Symbol, Symbol der Gewohnheit oder der Art */
export function goalIcon(goal: Pick<Goal, 'kind' | 'icon'>, subject: GoalSubject = {}): IconName {
  if (goal.kind === 'custom') return goal.icon || 'target';
  if (goal.kind === 'habit' && subject.habit) return subject.habit.icon;
  return GOAL_KIND_LABELS[goal.kind].icon;
}

/** Automatischer Name, z. B. „Bankdrücken: 100 kg × 5“ oder „500 km Laufen pro Jahr“ */
export function goalTitle(goal: Goal, subject: GoalSubject, units: GoalUnits): string {
  const value = formatGoalValue(goal, goal.target, units, subject);
  const exercise = subject.exercise ?? null;
  switch (goal.kind) {
    case 'habit': {
      const name = subject.habit?.name ?? 'Gewohnheit';
      switch (goal.habitMetric) {
        case 'streak':
          return `${name}: ${value} am Stück`;
        case 'limit':
          return `${name}: höchstens ${value} ${periodSuffix(goal)}`;
        case 'days':
          return `${name}: an ${formatCount(goal.target, 'Tag', 'Tagen')} ${periodSuffix(goal)}`;
        default:
          return `${name}: ${value} ${periodSuffix(goal)}`;
      }
    }
    case 'custom':
      return goal.customType === 'check' ? 'Eigenes Ziel' : `Eigenes Ziel: ${value}`;
    case 'strength': {
      const name = exercise?.name ?? 'Übung';
      const reps = goal.minReps && goal.minReps > 1 ? ` × ${goal.minReps}` : '';
      const prefix = goal.strengthMetric === 'oneRepMax' ? '1RM ' : '';
      return `${name}: ${prefix}${value}${goal.strengthMetric === 'weight' ? reps : ''}`;
    }
    case 'effort': {
      const sport = goal.sport ? `${ENDURANCE_SPORT_LABELS[goal.sport].name}: ` : '';
      return `${sport}${formatEffortDistance(goal.effortMeters ?? 0)} in ${value}`;
    }
    case 'bodyWeight':
      return `Gewicht ${value}`;
    case 'total': {
      const sport = goal.sport ? ` ${ENDURANCE_SPORT_LABELS[goal.sport].name}` : '';
      const daily =
        goal.totalMetric === 'stepsGoalDays' ||
        goal.totalMetric === 'waterGoalDays' ||
        goal.totalMetric === 'sleepGoalDays'
          ? DAILY_GOAL_NAMES[goal.totalMetric]
          : null;
      const what =
        goal.totalMetric === 'duration'
          ? `${value}${sport || ' Ausdauer'}`
          : goal.totalMetric === 'distance'
            ? `${value}${sport}`
            : daily
              ? `${value} mit ${daily}`
              : goal.totalMetric === 'focusTime'
                ? `${value} Fokus`
                : goal.totalMetric === 'meditationTime'
                  ? `${value} Meditation`
                  : value;
      return `${what} ${periodSuffix(goal)}`;
    }
  }
}

export function goalName(goal: Goal, subject: GoalSubject, units: GoalUnits): string {
  return goal.title || goalTitle(goal, subject, units);
}

/** z. B. „31.12.2026“ */
export function formatGoalDate(day: DayKey): string {
  return parseDayKey(day).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDaysLeft(days: number): string {
  if (days === 0) return 'Heute ist der letzte Tag';
  return days === 1 ? 'Noch 1 Tag' : `Noch ${days} Tage`;
}
