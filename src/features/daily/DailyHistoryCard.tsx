import { useMemo, useState } from 'react';
import { ProgressChart } from '../../components/charts';
import { Chip } from '../../components/Chip';
import { Card } from '../../components/Page';
import { SegmentedControl } from '../../components/SegmentedControl';
import type { HabitWithChecks } from '../../db/habits';
import type { DailyLog, DayKey, Settings } from '../../db/types';
import {
  averageValue,
  DAILY_METRIC_LABELS,
  DAILY_METRICS,
  dailyPoints,
  dayKey,
  filterDaysByRange,
  formatDailyMetric,
  goalDays,
  type DailyMetric,
  type DailyPoint,
} from '../../domain/daily';
import { formatDecimal } from '../../domain/format';
import {
  formatHabitAmount,
  habitCompletion,
  quitAmounts,
  type DayValue,
} from '../../domain/habits';
import {
  formatPercent,
  parseDayKey,
  rangeStart,
  STATS_RANGE_LABELS,
  STATS_RANGES,
} from '../../domain/stats';
import { useStatsFilter } from '../stats/statsFilter';
import { useHabits } from './useHabits';
import { useDailyLogs } from './useDaily';

const HINT = 'text-sm text-slate-500 dark:text-slate-400';

/** Tageswerte, Gewohnheiten (`habits`) oder eine Aufhören-Gewohnheit (`quit:<id>`) */
type HistoryMetric = DailyMetric | 'habits' | `quit:${string}`;

function isQuitMetric(metric: HistoryMetric): metric is `quit:${string}` {
  return metric.startsWith('quit:');
}

interface MetricView {
  points: DailyPoint[];
  format: (value: number) => string;
  summary: string | null;
}

function toPoints(values: DayValue[]): DailyPoint[] {
  return values.map(({ date, value }) => ({ time: parseDayKey(date).getTime(), value }));
}

/**
 * Verlauf als große Karte auf der Alltag-Seite: Zeitraum und Kennzahl wählen, Graph mit
 * Zusammenfassung. Lädt Recharts, deshalb nur per `React.lazy` einbinden.
 */
export function DailyHistoryCard({ settings, today }: { settings: Settings; today: DayKey }) {
  const logs = useDailyLogs();
  const habits = useHabits();
  if (!logs || !habits) return null;
  return <History settings={settings} today={today} logs={logs} habits={habits} />;
}

function History({
  settings,
  today,
  logs,
  habits,
}: {
  settings: Settings;
  today: DayKey;
  logs: DailyLog[];
  habits: HabitWithChecks[];
}) {
  const { range, setRange } = useStatsFilter();
  const [metric, setMetric] = useState<HistoryMetric>('weight');
  const now = useMemo(() => new Date(), []);
  const start = rangeStart(range, now);
  const from = start ? dayKey(start) : null;
  const quits = habits.filter(({ habit }) => habit.kind === 'quit');
  const hasTasks = habits.some(({ habit }) => habit.kind !== 'quit');

  const options: Array<{ value: HistoryMetric; label: string }> = [
    ...DAILY_METRICS.map((value) => ({ value, label: DAILY_METRIC_LABELS[value] })),
    ...(hasTasks ? [{ value: 'habits' as const, label: 'Gewohnheiten' }] : []),
    ...quits.map(({ habit }) => ({
      value: `quit:${habit.id}` as const,
      label: `${habit.icon} ${habit.name}`,
    })),
  ];
  // Gelöschte Gewohnheit oder Wechsel zurück: auf Gewicht zurückfallen
  const selected = options.some((option) => option.value === metric) ? metric : 'weight';
  const label = options.find((option) => option.value === selected)?.label ?? '';

  const view = ((): MetricView => {
    if (selected === 'habits') {
      const points = toPoints(habitCompletion(habits, from, today));
      const average = averageValue(points);
      return {
        points,
        format: (value) => `${formatDecimal(value, 0)} %`,
        summary: average === null ? null : `Ø ${formatDecimal(average, 0)} % erledigt`,
      };
    }
    if (isQuitMetric(selected)) {
      const item = quits.find(({ habit }) => `quit:${habit.id}` === selected)!;
      const values = quitAmounts(item, from, today);
      const { target, unit } = item.habit;
      const average = averageValue(toPoints(values));
      const kept = values.filter(({ value }) => value <= target).length;
      return {
        points: toPoints(values),
        format: (value) => formatHabitAmount(value, unit),
        summary:
          average === null
            ? null
            : `Ø ${formatHabitAmount(Math.round(average * 10) / 10, unit)} pro Tag · ${
                target === 0 ? 'frei' : 'im Limit'
              } an ${kept} von ${values.length} Tagen`,
      };
    }
    const unit = settings.weightUnit;
    const ranged = filterDaysByRange(logs, range, now);
    const points = dailyPoints(ranged, selected, unit);
    const format = (value: number) => formatDailyMetric(selected, value, unit);
    const first = points[0]?.value;
    const last = points.at(-1)?.value;
    const average = averageValue(points);
    const goal = goalDays(ranged, selected, settings);
    const base =
      selected === 'weight' && first !== undefined && last !== undefined
        ? `${format(first)} → ${format(last)} (${formatPercent(((last - first) / first) * 100)})`
        : average === null
          ? null
          : `Ø ${format(average)}`;
    return {
      points,
      format,
      summary: base && (goal ? `${base} · Ziel an ${goal.reached} von ${goal.total} Tagen` : base),
    };
  })();

  return (
    <Card title="Verlauf">
      <div className="flex flex-col gap-3">
        <SegmentedControl
          label="Zeitraum"
          options={STATS_RANGES.map((value) => ({ value, label: STATS_RANGE_LABELS[value] }))}
          value={range}
          onChange={setRange}
        />
        <div role="group" aria-label="Kennzahl" className="flex flex-wrap gap-2">
          {options.map(({ value, label: text }) => (
            <Chip key={value} pressed={value === selected} onClick={() => setMetric(value)}>
              {text}
            </Chip>
          ))}
        </div>
        {view.points.length === 0 ? (
          <p className={HINT}>Keine Einträge in diesem Zeitraum.</p>
        ) : (
          <>
            <ProgressChart
              label={`${label} im Verlauf`}
              points={view.points}
              formatValue={view.format}
            />
            {view.summary && (
              <p className={HINT} data-testid="daily-summary">
                {view.summary}
              </p>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
