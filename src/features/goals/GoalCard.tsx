import { Link } from 'react-router-dom';
import type { Exercise, Goal } from '../../db/types';
import { formatDecimal } from '../../domain/format';
import {
  formatDaysLeft,
  formatGoalDate,
  formatGoalValue,
  goalName,
  type GoalProgress,
  type GoalUnits,
} from '../../domain/goals';
import { GOAL_KIND_LABELS } from '../../domain/labels';
import { kgToDisplay } from '../../domain/units';
import { goalEditPath } from './paths';

const HINT = 'text-sm text-slate-500 dark:text-slate-400';

const PERIOD_NAMES = { week: 'Woche', month: 'Monat', year: 'Jahr' } as const;
const PERIOD_DONE = {
  week: 'Diese Woche geschafft',
  month: 'Diesen Monat geschafft',
  year: 'Dieses Jahr geschafft',
} as const;
const PERIOD_PLURAL = { week: 'Wochen', month: 'Monaten', year: 'Jahren' } as const;
const PERIOD_NOW = { week: 'Diese Woche', month: 'Diesen Monat', year: 'Dieses Jahr' } as const;

/** Balken mit Soll-Marke (gleichmäßig verteilt wäre man heute hier) */
export function GoalBar({
  label,
  percent,
  expectedPercent,
  status,
}: {
  label: string;
  percent: number;
  expectedPercent: number | null;
  status: GoalProgress['status'];
}) {
  const color =
    status === 'achieved'
      ? 'bg-emerald-600'
      : status === 'missed'
        ? 'bg-slate-400 dark:bg-slate-500'
        : 'bg-emerald-500';
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className="relative h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
    >
      <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
      {expectedPercent !== null && (
        <div
          aria-hidden="true"
          className="absolute inset-y-0 w-0.5 bg-slate-900/60 dark:bg-white/70"
          style={{ left: `${Math.min(100, expectedPercent)}%` }}
        />
      )}
    </div>
  );
}

function statusLine(goal: Goal, progress: GoalProgress, units: GoalUnits): string | null {
  const { status, achievedOn, daysLeft, expected, current, perWeek, recurring } = progress;
  if (recurring && goal.period && goal.period !== 'custom') {
    if (achievedOn) return `✓ ${PERIOD_DONE[goal.period]}`;
  } else if (status === 'achieved' && achievedOn) {
    return `✓ Erreicht am ${formatGoalDate(achievedOn)}`;
  } else if (status === 'missed') {
    return goal.kind === 'total'
      ? `Zeitraum vorbei (bis ${formatGoalDate(goal.deadline ?? goal.startDate)})`
      : `Zieldatum ${formatGoalDate(goal.deadline!)} verpasst`;
  }
  const parts: string[] = [];
  if (daysLeft !== null) parts.push(formatDaysLeft(daysLeft));
  if (expected !== null && current !== null && !achievedOn) {
    const diff = current - expected;
    const counted = goal.totalMetric === 'workouts' || goal.totalMetric === 'trainings';
    const amount = formatGoalValue(
      goal,
      counted ? Math.round(Math.abs(diff)) : Math.abs(diff),
      units,
    );
    const tolerance =
      goal.totalMetric === 'distance' ? 500 : goal.totalMetric === 'duration' ? 300 : 0.5;
    parts.push(
      Math.abs(diff) < tolerance
        ? 'genau im Plan'
        : diff > 0
          ? `${amount} vor dem Plan`
          : `${amount} hinter dem Plan`,
    );
  }
  if (perWeek !== null) {
    parts.push(
      `nötig: ${formatDecimal(kgToDisplay(perWeek, units.weightUnit), 1)} ${units.weightUnit} pro Woche`,
    );
  }
  return parts.length > 0 ? parts.join(' · ') : null;
}

function valueLine(
  goal: Goal,
  progress: GoalProgress,
  units: GoalUnits,
  isBodyweight: boolean,
): string {
  const format = (value: number) => formatGoalValue(goal, value, units, isBodyweight);
  if (progress.current === null || (goal.kind === 'total' && progress.current === 0)) {
    const target = `Ziel ${format(goal.target)}`;
    return goal.kind === 'total' ? `Noch nichts · ${target}` : `Noch keine Werte · ${target}`;
  }
  const parts = [
    `${goal.kind === 'total' ? 'Bisher' : 'Jetzt'} ${format(progress.current)}`,
    `Ziel ${format(goal.target)}`,
  ];
  if (progress.baseline !== null) parts.push(`Start ${format(progress.baseline)}`);
  return parts.join(' · ');
}

/** Ziel mit Balken; `compact` für das Startseiten-Widget */
export function GoalCard({
  goal,
  progress,
  exercise,
  units,
  compact = false,
  linkState,
}: {
  goal: Goal;
  progress: GoalProgress;
  exercise: Exercise | null;
  units: GoalUnits;
  compact?: boolean;
  linkState?: unknown;
}) {
  const name = goalName(goal, exercise, units);
  const status = statusLine(goal, progress, units);
  const expectedPercent =
    progress.expected !== null && !progress.achievedOn
      ? (progress.expected / goal.target) * 100
      : null;
  const period =
    progress.recurring && progress.range && goal.period && goal.period !== 'custom'
      ? goal.period
      : null;
  return (
    <Link
      to={goalEditPath(goal.id)}
      state={linkState}
      aria-label={`Ziel: ${name}`}
      className={`block rounded-2xl active:bg-slate-50 dark:active:bg-slate-700 ${compact ? 'mb-2 border border-slate-200 p-3 dark:border-slate-700' : 'mb-3 bg-white p-4 shadow-sm dark:bg-slate-800'}`}
    >
      <div className="mb-2 flex items-start gap-2">
        <span aria-hidden="true" className="text-lg leading-6">
          {GOAL_KIND_LABELS[goal.kind].icon}
        </span>
        <span className="min-w-0 flex-1 font-semibold leading-6">{name}</span>
        <span className="shrink-0 font-bold tabular-nums leading-6">{progress.percent} %</span>
      </div>
      <GoalBar
        label={name}
        percent={progress.percent}
        expectedPercent={expectedPercent}
        status={progress.status}
      />
      <p className={`mt-2 tabular-nums ${HINT}`}>
        {period ? `${PERIOD_NOW[period]}: ` : ''}
        {valueLine(goal, progress, units, exercise?.equipment === 'bodyweight')}
      </p>
      {status && (
        <p
          className={`text-sm ${progress.achievedOn ? 'font-medium text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`}
        >
          {status}
        </p>
      )}
      {!compact && progress.history && period && (
        <p className={HINT}>
          Bisher in {progress.history.reached} von {progress.history.total}{' '}
          {progress.history.total === 1 ? PERIOD_NAMES[period] : PERIOD_PLURAL[period]} geschafft
        </p>
      )}
    </Link>
  );
}
