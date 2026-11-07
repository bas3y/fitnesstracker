import type {
  DayKey,
  DistanceUnit,
  EnduranceSession,
  Exercise,
  Goal,
  StrengthGoalMetric,
  WeightUnit,
} from '../db/types';
import type { DatedWeight } from './daily';
import { formatDistance, sessionDay, type DayRange } from './endurance';
import { formatEffortDistance } from './enduranceStats';
import { formatDecimal } from './format';
import { ENDURANCE_SPORT_LABELS } from './labels';
import { daysBetween, inRange, periodRange, shiftPeriod } from './periods';
import { parseDayKey, type StatsSession } from './stats';
import { exerciseKind, isPerformed, setOneRepMax, type ExerciseKind } from './strength';
import { kgToDisplay } from './units';
import { formatClock, formatWorkoutDuration, toDateInput } from './workout';

export type GoalEnduranceSession = Pick<
  EnduranceSession,
  'id' | 'sport' | 'startedAt' | 'durationSeconds' | 'distanceMeters' | 'trackSummary'
>;

/** Alles, woraus der Fortschritt berechnet wird */
export interface GoalData {
  /** Beendete Workouts, älteste zuerst (`loadStatsSessions`) */
  strength: readonly StatsSession[];
  endurance: readonly GoalEnduranceSession[];
  /** Aufsteigend nach Datum */
  weights: readonly DatedWeight[];
}

export interface DatedValue {
  date: DayKey;
  value: number;
}

type GoalExercise = Pick<Exercise, 'name' | 'isTimed' | 'equipment'>;

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

const isRecurring = (goal: Pick<Goal, 'kind' | 'period'>) =>
  goal.kind === 'total' && goal.period !== null && goal.period !== 'custom';

/** Bei Bestzeiten ist weniger besser, beim Gewicht hängt es vom Start ab */
export function lowerIsBetter(goal: Pick<Goal, 'kind' | 'target' | 'startValue'>): boolean {
  if (goal.kind === 'effort') return true;
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
  }
  return points.sort((a, b) => a.date.localeCompare(b.date));
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
    default:
      return [];
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
  if (goal.kind !== 'total' || goal.period === null) return null;
  if (goal.period === 'custom') return { from: goal.startDate, to: goal.deadline ?? today };
  return periodRange(goal.period, today);
}

const MAX_HISTORY_PERIODS = 600;

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
  };

  if (goal.kind === 'total') return totalProgress(goal, points, today);

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

function totalProgress(goal: Goal, points: DatedValue[], today: DayKey): GoalProgress {
  const range = goalRange(goal, today)!;
  const inside = points.filter((point) => inRange(point.date, range));
  const current = sum(inside);
  let running = 0;
  const achievedOn =
    inside.find((point) => {
      running += point.value;
      return running >= goal.target;
    })?.date ?? null;
  const recurring = isRecurring(goal);
  const expected = inRange(today, range)
    ? (goal.target * daysBetween(range.from, today)) / daysBetween(range.from, range.to)
    : null;

  let history: GoalProgress['history'] = null;
  if (recurring && goal.period !== null && goal.period !== 'custom') {
    let reachedCount = 0;
    let total = 0;
    let period = periodRange(goal.period, goal.startDate);
    while (period.to < range.from && total < MAX_HISTORY_PERIODS) {
      const { from, to } = period;
      if (sum(points.filter((point) => point.date >= from && point.date <= to)) >= goal.target) {
        reachedCount += 1;
      }
      total += 1;
      period = shiftPeriod(goal.period, period, 1);
    }
    if (total > 0) history = { reached: reachedCount, total };
  }

  return {
    status: recurring ? 'active' : achievedOn ? 'achieved' : range.to < today ? 'missed' : 'active',
    current,
    baseline: null,
    percent: achievedOn ? 100 : toPercent(current / goal.target),
    achievedOn,
    lowerIsBetter: false,
    recurring,
    range,
    expected,
    daysLeft: achievedOn && !recurring ? null : daysUntil(today, range.to),
    perWeek: null,
    history,
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

/** Wert in der Anzeigeeinheit, z. B. „100 kg“, „49:30“, „12 Trainings“, „420,5 km“ */
export function formatGoalValue(
  goal: Pick<Goal, 'kind' | 'strengthMetric' | 'totalMetric' | 'sport'>,
  value: number,
  units: GoalUnits,
  isBodyweight = false,
): string {
  const kg = (amount: number, decimals: number) =>
    `${formatDecimal(kgToDisplay(amount, units.weightUnit), decimals)} ${units.weightUnit}`;
  switch (goal.kind) {
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
        default:
          return formatHours(value);
      }
  }
}

/** Automatischer Name, z. B. „Bankdrücken: 100 kg × 5“ oder „500 km Laufen pro Jahr“ */
export function goalTitle(goal: Goal, exercise: GoalExercise | null, units: GoalUnits): string {
  const isBodyweight = exercise?.equipment === 'bodyweight';
  const value = formatGoalValue(goal, goal.target, units, isBodyweight);
  switch (goal.kind) {
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
      const what =
        goal.totalMetric === 'duration'
          ? `${value}${sport || ' Ausdauer'}`
          : goal.totalMetric === 'distance'
            ? `${value}${sport}`
            : value;
      const when =
        goal.period === 'week'
          ? 'pro Woche'
          : goal.period === 'month'
            ? 'pro Monat'
            : goal.period === 'year'
              ? 'pro Jahr'
              : `bis ${formatGoalDate(goal.deadline ?? goal.startDate)}`;
      return `${what} ${when}`;
    }
  }
}

export function goalName(goal: Goal, exercise: GoalExercise | null, units: GoalUnits): string {
  return goal.title || goalTitle(goal, exercise, units);
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
