import { useMemo, useState } from 'react';
import { ProgressChart } from '../../components/charts';
import { Chip } from '../../components/Chip';
import { Card, Page } from '../../components/Page';
import { SegmentedControl } from '../../components/SegmentedControl';
import type { DailyLog, Settings } from '../../db/types';
import {
  averageValue,
  DAILY_METRIC_LABELS,
  DAILY_METRICS,
  dailyPoints,
  filterDaysByRange,
  formatDailyMetric,
  goalDays,
  type DailyMetric,
} from '../../domain/daily';
import { formatPercent, STATS_RANGE_LABELS, STATS_RANGES } from '../../domain/stats';
import { useSettings } from '../settings/useSettings';
import { useStatsFilter } from '../stats/statsFilter';
import { useDailyLogs } from './useDaily';

const HINT = 'text-sm text-slate-500 dark:text-slate-400';

export function DailyHistoryPage() {
  const settings = useSettings();
  const logs = useDailyLogs();
  return (
    <Page title="Alltag: Verlauf" backTo="/daily">
      {settings && logs && <History settings={settings} logs={logs} />}
    </Page>
  );
}

function History({ settings, logs }: { settings: Settings; logs: DailyLog[] }) {
  const { range, setRange } = useStatsFilter();
  const [metric, setMetric] = useState<DailyMetric>('weight');
  const now = useMemo(() => new Date(), []);

  const unit = settings.weightUnit;
  const ranged = filterDaysByRange(logs, range, now);
  const points = dailyPoints(ranged, metric, unit);
  const format = (value: number) => formatDailyMetric(metric, value, unit);
  const first = points[0]?.value;
  const last = points.at(-1)?.value;
  const average = averageValue(points);
  const goal = goalDays(ranged, metric, settings);

  return (
    <Card>
      <div className="flex flex-col gap-3">
        <SegmentedControl
          label="Zeitraum"
          options={STATS_RANGES.map((value) => ({ value, label: STATS_RANGE_LABELS[value] }))}
          value={range}
          onChange={setRange}
        />
        <div role="group" aria-label="Kennzahl" className="flex flex-wrap gap-2">
          {DAILY_METRICS.map((value) => (
            <Chip key={value} pressed={value === metric} onClick={() => setMetric(value)}>
              {DAILY_METRIC_LABELS[value]}
            </Chip>
          ))}
        </div>
        {points.length === 0 ? (
          <p className={HINT}>Keine Einträge in diesem Zeitraum.</p>
        ) : (
          <>
            <ProgressChart
              label={`${DAILY_METRIC_LABELS[metric]} im Verlauf`}
              points={points}
              formatValue={format}
            />
            <p className={HINT} data-testid="daily-summary">
              {metric === 'weight' && first !== undefined && last !== undefined
                ? `${format(first)} → ${format(last)} (${formatPercent(((last - first) / first) * 100)})`
                : `Ø ${format(average!)}`}
              {goal && ` · Ziel an ${goal.reached} von ${goal.total} Tagen`}
            </p>
          </>
        )}
      </div>
    </Card>
  );
}
