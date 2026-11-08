import { Link } from 'react-router-dom';
import { useFromHere } from '../../components/backNavigation';
import { secondaryButton } from '../../components/buttons';
import { Icon, type IconName } from '../../components/icons';
import { Card, type CardTone } from '../../components/Page';
import { addWater } from '../../db/daily';
import type { DailyLog, DayKey, Settings, WidgetSize } from '../../db/types';
import { formatSleep } from '../../domain/daily';
import { formatDecimal } from '../../domain/format';
import { lastDays } from '../../domain/week';
import { GoalBar } from '../daily/GoalBar';
import { BODY_PATH } from '../daily/paths';
import { useDailyLog, useDailyLogs } from '../daily/useDaily';
import { MiniBars, SmallWidget } from './WidgetParts';

export type DailyMetric = 'steps' | 'water' | 'sleep';

const QUICK_WATER_ML = 250;

const METRICS: Record<
  DailyMetric,
  {
    label: string;
    icon: IconName;
    value: (log: DailyLog | null | undefined) => number | null;
    goal: (settings: Settings) => number;
    format: (value: number) => string;
  }
> = {
  steps: {
    label: 'Schritte',
    icon: 'footprints',
    value: (log) => log?.steps ?? null,
    goal: (settings) => settings.stepsGoal,
    format: (value) => value.toLocaleString('de-DE', { maximumFractionDigits: 0 }),
  },
  water: {
    label: 'Wasser',
    icon: 'drop',
    value: (log) => log?.waterMl ?? null,
    goal: (settings) => settings.waterGoalMl,
    format: (ml) => `${formatDecimal(ml / 1000, 2)} l`,
  },
  sleep: {
    label: 'Schlaf',
    icon: 'moon',
    value: (log) => log?.sleepSeconds ?? null,
    goal: (settings) => settings.sleepGoalSeconds,
    format: (seconds) => formatSleep(seconds),
  },
};

/** Schritte, Wasser oder Schlaf von heute; groß mit den letzten 7 Tagen */
export function DailyMetricWidget({
  metric,
  size,
  settings,
  today,
  tone,
}: {
  metric: DailyMetric;
  size: WidgetSize;
  settings: Settings;
  today: DayKey;
  tone?: CardTone;
}) {
  const log = useDailyLog(today);
  const from = useFromHere();
  const { label, icon, value: valueOf, goal: goalOf, format } = METRICS[metric];
  const value = valueOf(log);
  const goal = goalOf(settings);
  const shown = value === null ? '–' : format(value);

  if (size === 'small') {
    return (
      <SmallWidget
        to={BODY_PATH}
        state={from}
        icon={icon}
        label={label}
        value={shown}
        bar={{ value, goal }}
        tone={tone}
      />
    );
  }

  const rest = goal - (value ?? 0);
  return (
    <Card>
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-1.5 text-sm text-muted">
          <Icon name={icon} className="h-4 w-4" />
          {label}
        </h2>
        <span className="text-sm text-muted tabular-nums">Ziel {format(goal)}</span>
      </div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-[1.75rem] leading-tight font-bold tracking-tight tabular-nums">
          {shown}
        </span>
        <span className="text-sm text-muted tabular-nums">
          {rest <= 0 ? 'Ziel erreicht' : `noch ${format(rest)}`}
        </span>
      </div>
      <GoalBar label={`Ziel ${label}`} value={value} goal={goal} />
      {size === 'large' && <History metric={metric} goal={goal} today={today} />}
      <div className="mt-3 flex gap-2">
        {metric === 'water' && (
          <button
            type="button"
            className={secondaryButton}
            onClick={() => void addWater(today, QUICK_WATER_ML)}
          >
            +{QUICK_WATER_ML} ml
          </button>
        )}
        <Link to={BODY_PATH} state={from} className={secondaryButton}>
          Eintragen
        </Link>
      </div>
    </Card>
  );
}

function History({ metric, goal, today }: { metric: DailyMetric; goal: number; today: DayKey }) {
  const logs = useDailyLogs();
  if (!logs) return null;
  const { label, value: valueOf } = METRICS[metric];
  const points = lastDays(
    logs.map((log) => ({ date: log.date, value: valueOf(log) })),
    today,
  );
  const reached = points.filter((point) => point.value >= goal).length;
  return (
    <div className="mt-4">
      <MiniBars label={`${label} der letzten 7 Tage`} points={points} goal={goal} />
      <p className="mt-2 text-sm text-muted">Ziel an {reached} von 7 Tagen erreicht</p>
    </div>
  );
}
