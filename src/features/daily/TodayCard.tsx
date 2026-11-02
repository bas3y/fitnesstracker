import { Link } from 'react-router-dom';
import { useFromHere } from '../../components/backNavigation';
import { secondaryButton } from '../../components/buttons';
import { Card } from '../../components/Page';
import { addWater } from '../../db/daily';
import type { Settings } from '../../db/types';
import { dayKey, formatDailyMetric, formatSleep } from '../../domain/daily';
import { formatDecimal } from '../../domain/format';
import { DASHBOARD_WIDGET_LABELS } from '../../domain/labels';
import { kgToDisplay } from '../../domain/units';
import { GoalBar } from './GoalBar';
import { BODY_PATH } from './paths';
import { useDailyLog } from './useDaily';

const QUICK_WATER_ML = 250;

/** Dashboard-Widget; keine Graphen hier, das Dashboard liegt im Hauptbundle */
export function TodayCard({ settings, now }: { settings: Settings; now: Date }) {
  const today = dayKey(now);
  const log = useDailyLog(today);
  const from = useFromHere();
  const weight = log?.weightKg ?? settings.bodyWeightKg;
  const unit = settings.weightUnit;
  const tiles = [
    {
      label: 'Schritte',
      value: formatDecimal(log?.steps ?? 0, 0),
      bar: { value: log?.steps ?? 0, goal: settings.stepsGoal },
    },
    {
      label: 'Wasser',
      value: `${formatDecimal(log?.waterMl ?? 0, 0)} ml`,
      bar: { value: log?.waterMl ?? 0, goal: settings.waterGoalMl },
    },
    {
      label: 'Schlaf',
      value: log?.sleepSeconds ? formatSleep(log.sleepSeconds) : '–',
      bar: { value: log?.sleepSeconds ?? 0, goal: settings.sleepGoalSeconds },
    },
    {
      label: 'Gewicht',
      value: weight === null ? '–' : formatDailyMetric('weight', kgToDisplay(weight, unit), unit),
      bar: null,
    },
  ];

  return (
    <Card title={DASHBOARD_WIDGET_LABELS.daily.name}>
      <dl className="mb-3 grid grid-cols-2 gap-3">
        {tiles.map(({ label, value, bar }) => (
          <div key={label}>
            <dt className="text-sm text-slate-500 dark:text-slate-400">{label}</dt>
            <dd>
              <span className="block text-xl font-bold tabular-nums">{value}</span>
              {bar && <GoalBar label={`Ziel ${label}`} value={bar.value} goal={bar.goal} />}
            </dd>
          </div>
        ))}
      </dl>
      <div className="flex gap-2">
        <button
          type="button"
          className={secondaryButton}
          onClick={() => void addWater(today, QUICK_WATER_ML)}
        >
          +{QUICK_WATER_ML} ml
        </button>
        <Link to={BODY_PATH} state={from} className={secondaryButton}>
          Eintragen
        </Link>
      </div>
    </Card>
  );
}
