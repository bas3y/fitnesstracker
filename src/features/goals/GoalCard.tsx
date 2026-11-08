import { useState } from 'react';
import { Link } from 'react-router-dom';
import { primaryButton } from '../../components/buttons';
import { Dialog } from '../../components/Dialog';
import { Stepper } from '../../components/Stepper';
import { addGoalEntry, setGoalChecked, undoGoalEntry } from '../../db/goals';
import { MAX_GOAL_ENTRY_AMOUNT } from '../../db/schemas';
import type { Goal } from '../../db/types';
import { formatDecimal } from '../../domain/format';
import {
  formatDaysLeft,
  formatGoalDate,
  formatGoalValue,
  goalIcon,
  goalName,
  hasPeriod,
  isCountGoal,
  type GoalProgress,
  type GoalSubject,
  type GoalUnits,
} from '../../domain/goals';
import { kgToDisplay } from '../../domain/units';
import { goalEditPath } from './paths';
import { Icon } from '../../components/icons';

const HINT = 'text-sm text-muted';
const ACTION =
  'flex min-h-11 items-center justify-center rounded-xl bg-subtle px-3 text-sm font-semibold text-fg active:bg-subtle-strong';

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
  color,
}: {
  label: string;
  percent: number;
  expectedPercent: number | null;
  status: GoalProgress['status'];
  /** Überschreibt die Farbe nach Status */
  color?: string;
}) {
  const fill =
    color ??
    (status === 'achieved' ? 'bg-primary' : status === 'missed' ? 'bg-faint' : 'bg-primary');
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className="relative h-3 overflow-hidden rounded-full bg-subtle-strong"
    >
      <div className={`bar-fill h-full rounded-full ${fill}`} style={{ width: `${percent}%` }} />
      {expectedPercent !== null && (
        <div
          aria-hidden="true"
          className="absolute inset-y-0 w-0.5 bg-scrim"
          style={{ left: `${Math.min(100, expectedPercent)}%` }}
        />
      )}
    </div>
  );
}

const isLimitGoal = (goal: Goal) => goal.kind === 'habit' && goal.habitMetric === 'limit';
const isStreakGoal = (goal: Goal) => goal.kind === 'habit' && goal.habitMetric === 'streak';

function recurringPeriod(goal: Goal, progress: GoalProgress) {
  return progress.recurring && progress.range && goal.period && goal.period !== 'custom'
    ? goal.period
    : null;
}

function limitStatus(
  goal: Goal,
  progress: GoalProgress,
  format: (value: number) => string,
): string | null {
  const remaining = progress.remaining ?? 0;
  const period = recurringPeriod(goal, progress);
  if (progress.status === 'achieved' && progress.achievedOn) {
    return `✓ Geschafft (bis ${formatGoalDate(progress.achievedOn)})`;
  }
  if (remaining < 0) {
    const when = period ? `${PERIOD_NOW[period]} ` : '';
    return `${when}um ${format(-remaining)} überschritten`;
  }
  const parts = [remaining === 0 ? 'Nichts mehr übrig' : `Noch ${format(remaining)} übrig`];
  if (progress.daysLeft !== null) parts.push(formatDaysLeft(progress.daysLeft));
  return parts.join(' · ');
}

function statusLine(
  goal: Goal,
  progress: GoalProgress,
  units: GoalUnits,
  subject: GoalSubject,
): string | null {
  const format = (value: number) => formatGoalValue(goal, value, units, subject);
  if (isLimitGoal(goal)) return limitStatus(goal, progress, format);
  const { status, achievedOn, daysLeft, expected, current, perWeek } = progress;
  const period = recurringPeriod(goal, progress);
  if (period) {
    if (achievedOn) return `✓ ${PERIOD_DONE[period]}`;
  } else if (status === 'achieved' && achievedOn) {
    return `✓ Erreicht am ${formatGoalDate(achievedOn)}`;
  } else if (status === 'missed') {
    return hasPeriod(goal)
      ? `Zeitraum vorbei (bis ${formatGoalDate(goal.deadline ?? goal.startDate)})`
      : `Zieldatum ${formatGoalDate(goal.deadline!)} verpasst`;
  }
  const parts: string[] = [];
  if (isStreakGoal(goal) && progress.best !== null && progress.best > (current ?? 0)) {
    parts.push(`Beste Serie: ${format(progress.best)}`);
  }
  if (daysLeft !== null) parts.push(formatDaysLeft(daysLeft));
  if (expected !== null && current !== null && !achievedOn) {
    const diff = current - expected;
    const counted = isCountGoal(goal);
    const amount = format(counted ? Math.round(Math.abs(diff)) : Math.abs(diff));
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
  subject: GoalSubject,
): string {
  const format = (value: number) => formatGoalValue(goal, value, units, subject);
  const current = progress.current ?? 0;
  if (goal.kind === 'custom' && goal.customType === 'check') {
    return current >= 1 ? 'Erledigt' : 'Noch nicht erledigt';
  }
  if (isLimitGoal(goal)) {
    return `${current === 0 ? 'Nichts' : format(current)} · höchstens ${format(goal.target)}`;
  }
  if (isStreakGoal(goal)) {
    return `Jetzt ${format(current)} am Stück · Ziel ${format(goal.target)}`;
  }
  const summed = goal.kind === 'total' || goal.kind === 'habit' || goal.kind === 'custom';
  if (progress.current === null || (summed && progress.current === 0)) {
    const target = `Ziel ${format(goal.target)}`;
    if (goal.kind === 'custom') return `Noch nichts eingetragen · ${target}`;
    return summed ? `Noch nichts · ${target}` : `Noch keine Werte · ${target}`;
  }
  const parts = [
    `${summed ? 'Bisher' : 'Jetzt'} ${format(progress.current)}`,
    `Ziel ${format(goal.target)}`,
  ];
  if (progress.baseline !== null) parts.push(`Start ${format(progress.baseline)}`);
  return parts.join(' · ');
}

function barColor(goal: Goal, progress: GoalProgress): string | undefined {
  if (!isLimitGoal(goal)) return undefined;
  if ((progress.remaining ?? 0) < 0) return 'bg-danger';
  const ahead =
    progress.expected !== null && progress.current !== null && progress.current > progress.expected;
  return ahead ? 'bg-warn' : 'bg-primary';
}

/** Ziel mit Balken; `compact` für das Startseiten-Widget */
export function GoalCard({
  goal,
  progress,
  subject,
  units,
  compact = false,
  linkState,
}: {
  goal: Goal;
  progress: GoalProgress;
  subject: GoalSubject;
  units: GoalUnits;
  compact?: boolean;
  linkState?: unknown;
}) {
  const name = goalName(goal, subject, units);
  const status = statusLine(goal, progress, units, subject);
  const limit = isLimitGoal(goal);
  const expectedPercent =
    progress.expected !== null && !progress.achievedOn && goal.target > 0
      ? (progress.expected / goal.target) * 100
      : null;
  const period = recurringPeriod(goal, progress);
  const exceeded = limit && (progress.remaining ?? 0) < 0;
  return (
    <div className={`rounded-2xl ${compact ? 'mb-2 border border-line' : 'mb-3 bg-surface'}`}>
      <Link
        to={goalEditPath(goal.id)}
        state={linkState}
        aria-label={`Ziel: ${name}`}
        className={`block rounded-2xl active:bg-page ${compact ? 'p-3' : 'p-4'}`}
      >
        <div className="mb-2 flex items-start gap-2">
          <Icon name={goalIcon(goal, subject)} className="mt-0.5 h-5 w-5 text-primary-text" />
          <span className="min-w-0 flex-1 font-semibold leading-6">{name}</span>
          <span className="shrink-0 font-bold tabular-nums leading-6">
            {limit
              ? `${formatDecimal(progress.current ?? 0, 2)} / ${formatDecimal(goal.target, 2)}`
              : `${progress.percent} %`}
          </span>
        </div>
        <GoalBar
          label={name}
          percent={progress.percent}
          expectedPercent={expectedPercent}
          status={progress.status}
          color={barColor(goal, progress)}
        />
        <p className={`mt-2 tabular-nums ${HINT}`}>
          {period ? `${PERIOD_NOW[period]}: ` : ''}
          {valueLine(goal, progress, units, subject)}
        </p>
        {status && (
          <p
            className={`text-sm ${
              exceeded
                ? 'font-medium text-danger'
                : progress.achievedOn
                  ? 'font-medium text-primary-text'
                  : 'text-muted'
            }`}
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
      {goal.kind === 'custom' && (
        <GoalEntryActions
          goal={goal}
          name={name}
          current={progress.current ?? 0}
          compact={compact}
        />
      )}
    </div>
  );
}

/** Eigenes Ziel: Fortschritt direkt an der Karte eintragen */
function GoalEntryActions({
  goal,
  name,
  current,
  compact,
}: {
  goal: Goal;
  name: string;
  current: number;
  compact: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [amount, setAmount] = useState<number | null>(null);
  const padding = compact ? 'px-3 pb-3' : 'px-4 pb-4';

  if (goal.customType === 'check') {
    const done = current >= 1;
    return (
      <div className={`flex gap-2 ${padding}`}>
        <button
          type="button"
          aria-label={`${done ? 'Zurücknehmen' : 'Erledigt'}: ${name}`}
          className={done ? ACTION : `${ACTION} bg-primary text-on-primary active:bg-primary-press`}
          onClick={() => void setGoalChecked(goal.id, !done)}
        >
          {done ? 'Zurücknehmen' : '✓ Erledigt'}
        </button>
      </div>
    );
  }

  const unit = goal.unit ? ` ${goal.unit}` : '';
  return (
    <div className={`flex flex-wrap gap-2 ${padding}`}>
      <button
        type="button"
        aria-label={`+1${unit}: ${name}`}
        className={ACTION}
        onClick={() => void addGoalEntry(goal.id, 1)}
      >
        +1
      </button>
      <button
        type="button"
        aria-label={`Menge eintragen: ${name}`}
        className={ACTION}
        onClick={() => {
          setAmount(null);
          setAdding(true);
        }}
      >
        +x
      </button>
      {current > 0 && (
        <button
          type="button"
          aria-label={`Rückgängig: ${name}`}
          className={ACTION}
          onClick={() => void undoGoalEntry(goal.id)}
        >
          Rückgängig
        </button>
      )}
      {adding && (
        <Dialog title={name} onClose={() => setAdding(false)}>
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!amount) return;
              void addGoalEntry(goal.id, amount).then(() => setAdding(false));
            }}
          >
            <Stepper
              label="Menge"
              value={amount}
              unit={goal.unit || undefined}
              step={1}
              min={0.01}
              max={MAX_GOAL_ENTRY_AMOUNT}
              decimals={2}
              startValue={1}
              allowEmpty
              onChange={setAmount}
            />
            <button type="submit" className={primaryButton} disabled={!amount}>
              Eintragen
            </button>
          </form>
        </Dialog>
      )}
    </div>
  );
}
