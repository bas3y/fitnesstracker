import { useMemo } from 'react';
import { ProgressChart } from '../../components/charts';
import { Chip } from '../../components/Chip';
import { Card } from '../../components/Page';
import { SegmentedControl } from '../../components/SegmentedControl';
import type { HabitWithChecks } from '../../db/habits';
import type { DailyLog, DayKey, Settings, SleepPhases } from '../../db/types';
import {
  averageSleepPhases,
  averageValue,
  DAILY_METRIC_LABELS,
  DAILY_METRICS,
  dailyOverview,
  dailyPoints,
  dayKey,
  filterDaysByRange,
  formatDailyMetric,
  goalDays,
  type DailyMetric,
  type DailyOverviewItem,
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
import { SleepPhasesBar } from '../daily/SleepPhasesBar';
import { useDailyLogs } from '../daily/useDaily';
import { useHabits } from '../daily/useHabits';
import { useSettings } from '../settings/useSettings';
import { useStatsFilter } from './statsFilter';

const HINT = 'text-sm text-muted';

/** Tageswerte, Gewohnheiten (`habits`) oder eine Aufhören-Gewohnheit (`quit:<id>`) */
type HistoryMetric = DailyMetric | 'habits' | `quit:${string}`;

const DEFAULT_METRIC: HistoryMetric = 'weight';

function isQuitMetric(metric: HistoryMetric): metric is `quit:${string}` {
  return metric.startsWith('quit:');
}

interface MetricView {
  points: DailyPoint[];
  format: (value: number) => string;
  summary: string | null;
  sleepPhases?: SleepPhases | null;
}

function toPoints(values: DayValue[]): DailyPoint[] {
  return values.map(({ date, value }) => ({ time: parseDayKey(date).getTime(), value }));
}

/**
 * Statistik → Alltag: Übersicht im Zeitraum und Verlauf je Kennzahl (Zeitraum und Kennzahl in
 * der URL). Lädt Recharts, liegt deshalb nur in der lazy geladenen Statistik.
 */
export function DailyStats() {
  const today = useMemo(() => dayKey(new Date()), []);
  const settings = useSettings();
  const logs = useDailyLogs();
  const habits = useHabits();
  if (!settings || !logs || !habits) return null;
  return <DailyContent settings={settings} today={today} logs={logs} habits={habits} />;
}

function DailyContent({
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
  const { range, setRange, metric, setMetric } = useStatsFilter();
  const now = useMemo(() => new Date(), []);
  const start = rangeStart(range, now);
  const from = start ? dayKey(start) : null;
  const ranged = filterDaysByRange(logs, range, now);
  const unit = settings.weightUnit;
  const quits = habits.filter(({ habit }) => habit.kind === 'quit');
  const hasTasks = habits.some(({ habit }) => habit.kind !== 'quit');

  const options: Array<{ value: HistoryMetric; label: string }> = [
    ...DAILY_METRICS.map((value) => ({ value, label: DAILY_METRIC_LABELS[value] })),
    ...(hasTasks ? [{ value: 'habits' as const, label: 'Gewohnheiten' }] : []),
    ...quits.map(({ habit }) => ({
      value: `quit:${habit.id}` as const,
      label: habit.name,
    })),
  ];
  // Unbekannter Wert in der URL oder gelöschte Gewohnheit: auf Gewicht zurückfallen
  const selected = options.find((option) => option.value === metric)?.value ?? DEFAULT_METRIC;
  const label = options.find((option) => option.value === selected)?.label ?? '';
  const choose = (value: HistoryMetric) => setMetric(value === DEFAULT_METRIC ? null : value);

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
      const { target, unit: amountUnit } = item.habit;
      const average = averageValue(toPoints(values));
      const kept = values.filter(({ value }) => value <= target).length;
      return {
        points: toPoints(values),
        format: (value) => formatHabitAmount(value, amountUnit),
        summary:
          average === null
            ? null
            : `Ø ${formatHabitAmount(Math.round(average * 10) / 10, amountUnit)} pro Tag · ${
                target === 0 ? 'frei' : 'im Limit'
              } an ${kept} von ${values.length} Tagen`,
      };
    }
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
      sleepPhases: selected === 'sleep' ? averageSleepPhases(ranged) : null,
    };
  })();

  const overview = dailyOverview(ranged, unit, settings);

  return (
    <>
      <div className="mb-4">
        <SegmentedControl
          label="Zeitraum"
          options={STATS_RANGES.map((value) => ({ value, label: STATS_RANGE_LABELS[value] }))}
          value={range}
          onChange={setRange}
        />
      </div>
      {overview.length > 0 && (
        <OverviewTiles items={overview} selected={selected} onSelect={choose} />
      )}
      <Card title="Verlauf">
        <div className="flex flex-col gap-3">
          <div role="group" aria-label="Kennzahl" className="flex flex-wrap gap-2">
            {options.map(({ value, label: text }) => (
              <Chip key={value} pressed={value === selected} onClick={() => choose(value)}>
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
              {view.sleepPhases && (
                <SleepPhasesBar phases={view.sleepPhases} label="Ø Schlafphasen pro Nacht" />
              )}
            </>
          )}
        </div>
      </Card>
    </>
  );
}

/** Ø je Kennzahl im Zeitraum; Antippen zeigt sie im Verlauf */
function OverviewTiles({
  items,
  selected,
  onSelect,
}: {
  items: DailyOverviewItem[];
  selected: HistoryMetric;
  onSelect: (metric: DailyMetric) => void;
}) {
  return (
    <ul aria-label="Übersicht im Zeitraum" className="mb-4 grid grid-cols-2 gap-3">
      {items.map(({ metric, value, detail }) => (
        <li key={metric} className="grid">
          <button
            type="button"
            aria-pressed={metric === selected}
            onClick={() => onSelect(metric)}
            className={`flex min-h-24 min-w-0 flex-col gap-0.5 rounded-2xl p-4 text-left active:opacity-90 ${
              metric === selected ? 'tone-soft bg-surface ring-2 ring-primary' : 'bg-surface'
            }`}
          >
            <span className="text-sm font-semibold">{DAILY_METRIC_LABELS[metric]}</span>
            <span className="text-xl leading-tight font-bold tracking-tight tabular-nums">
              {value}
            </span>
            <span className={HINT}>{detail}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
