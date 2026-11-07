import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { ProgressChart } from '../../components/charts';
import { Chip } from '../../components/Chip';
import { Card } from '../../components/Page';
import { SegmentedControl } from '../../components/SegmentedControl';
import { loadFinishedExerciseSessions } from '../../db/records';
import type { Exercise, WeightUnit } from '../../db/types';
import { formatBlockWeek } from '../../domain/blocks';
import { formatDecimal } from '../../domain/format';
import {
  analyzeRest,
  availableMetrics,
  exerciseSeries,
  filterByRange,
  formatMetricValue,
  formatPercent,
  formatRestAdvice,
  metricDisplayValue,
  metricLabel,
  restPairs,
  STATS_RANGE_LABELS,
  STATS_RANGES,
  type ExerciseMetric,
  type RestAnalysis,
  type SetGroup,
} from '../../domain/stats';
import {
  annotateSessions,
  currentBests,
  exerciseKind,
  formatRecord,
  type ExerciseKind,
  type StrengthSet,
} from '../../domain/strength';
import { formatWorkoutDate } from '../../domain/workout';
import { useSettings } from '../settings/useSettings';
import { useStatsFilter } from './statsFilter';

const HINT = 'text-sm text-slate-500 dark:text-slate-400';
const RECORD_HISTORY_LIMIT = 10;

/** Verlauf, Bestwerte und (im erweiterten Modus) Pausen einer Übung; ohne Einheiten unsichtbar */
export function ExerciseStats({ exercise }: { exercise: Exercise }) {
  const settings = useSettings();
  const sessions = useLiveQuery(() => loadFinishedExerciseSessions(exercise.id), [exercise.id]);
  const groups = useMemo<SetGroup[]>(
    () => (sessions ?? []).map(({ workout, sets }) => ({ startedAt: workout.startedAt, sets })),
    [sessions],
  );
  // Angepasste Blöcke (Deload, Peak …) sind im Verlauf markiert
  const blocks = useMemo(
    () =>
      new Map(
        (sessions ?? []).flatMap(({ workout }) =>
          workout.block?.adjusted ? [[workout.startedAt, formatBlockWeek(workout.block)]] : [],
        ),
      ),
    [sessions],
  );
  if (!settings || groups.length === 0) return null;

  const unit = settings.weightUnit;
  const kind = exerciseKind(exercise, settings.bodyWeightKg);
  return (
    <>
      <HistoryCard groups={groups} kind={kind} unit={unit} name={exercise.name} blocks={blocks} />
      <BestsCard groups={groups} kind={kind} unit={unit} />
      {settings.restAnalysisEnabled && <RestCard groups={groups} isTimed={exercise.isTimed} />}
    </>
  );
}

function HistoryCard({
  groups,
  kind,
  unit,
  name,
  blocks,
}: {
  groups: SetGroup[];
  kind: ExerciseKind;
  unit: WeightUnit;
  name: string;
  /** Beginn des Workouts → Block, falls angepasst */
  blocks: Map<string, string>;
}) {
  const { range, setRange } = useStatsFilter();
  const [chosen, setChosen] = useState<ExerciseMetric | null>(null);
  const now = useMemo(() => new Date(), []);

  const points = exerciseSeries(filterByRange(groups, range, now), kind);
  const metrics = availableMetrics(points);
  const metric = chosen && metrics.includes(chosen) ? chosen : metrics[0];
  const chartPoints = metric
    ? points.flatMap(({ date, values }) => {
        const value = values[metric];
        return value === undefined
          ? []
          : [
              {
                time: Date.parse(date),
                value: metricDisplayValue(metric, value, unit),
                marker: blocks.get(date),
              },
            ];
      })
    : [];
  const hasMarkers = chartPoints.some((point) => point.marker);
  const format = (value: number) => formatMetricValue(metric!, value, unit);
  const first = chartPoints[0]?.value;
  const last = chartPoints.at(-1)?.value;

  return (
    <Card title="Verlauf">
      <div className="flex flex-col gap-3">
        <SegmentedControl
          label="Zeitraum"
          options={STATS_RANGES.map((value) => ({ value, label: STATS_RANGE_LABELS[value] }))}
          value={range}
          onChange={setRange}
        />
        {metric ? (
          <>
            {metrics.length > 1 && (
              <div role="group" aria-label="Kennzahl" className="flex flex-wrap gap-2">
                {metrics.map((value) => (
                  <Chip key={value} pressed={value === metric} onClick={() => setChosen(value)}>
                    {metricLabel(value, kind.isBodyweight)}
                  </Chip>
                ))}
              </div>
            )}
            <ProgressChart
              label={`${metricLabel(metric, kind.isBodyweight)} im Verlauf: ${name}`}
              points={chartPoints}
              formatValue={format}
            />
            {hasMarkers && (
              <p className={HINT} data-testid="block-legend">
                <span
                  aria-hidden="true"
                  className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-amber-500"
                />
                Orange: Trainingsblock mit angepassten Sätzen (z. B. Deload)
              </p>
            )}
            {first !== undefined && last !== undefined && chartPoints.length > 1 ? (
              <p className={HINT} data-testid="history-summary">
                {format(first)} → {format(last)}
                {first > 0 && ` (${formatPercent(((last - first) / first) * 100)})`}
              </p>
            ) : (
              <p className={HINT}>Ab der zweiten Einheit entsteht eine Kurve.</p>
            )}
          </>
        ) : (
          <p className={HINT}>Keine Einheiten in diesem Zeitraum.</p>
        )}
        {kind.isBodyweight && !kind.isTimed && kind.bodyWeightKg === null && (
          <p className={HINT}>
            Mit deinem Körpergewicht in den Einstellungen gibt es auch 1RM und Volumen.
          </p>
        )}
      </div>
    </Card>
  );
}

function BestsCard({
  groups,
  kind,
  unit,
}: {
  groups: SetGroup[];
  kind: ExerciseKind;
  unit: WeightUnit;
}) {
  const formatting = { unit, isBodyweight: kind.isBodyweight };
  const bests = currentBests(groups, kind);
  const sets: StrengthSet[][] = groups.map((group) => group.sets);
  const history = annotateSessions(sets, kind)
    .flatMap((perSet, index) =>
      perSet.flat().map((record) => ({ record, date: groups[index]!.startedAt })),
    )
    .reverse()
    .slice(0, RECORD_HISTORY_LIMIT);

  return (
    <Card title="Bestwerte">
      {bests.length === 0 ? (
        <p className={HINT}>Noch keine Bestwerte.</p>
      ) : (
        <ul aria-label="Bestwerte" className="flex flex-col gap-2">
          {bests.map((best) => {
            const { label, value } = formatRecord(best, formatting);
            return (
              <li key={`${best.type}-${best.byLevel}`} className="flex justify-between gap-3">
                <span className="min-w-0">
                  <span className="block">{label}</span>
                  <span className={`block ${HINT}`}>{formatWorkoutDate(best.achievedAt)}</span>
                </span>
                <span className="shrink-0 font-semibold">{value}</span>
              </li>
            );
          })}
        </ul>
      )}
      {history.length > 0 && (
        <>
          <h3 className="mt-4 mb-2 font-semibold">Letzte Rekorde</h3>
          <ul aria-label="Letzte Rekorde" className="flex flex-col gap-2">
            {history.map(({ record, date }, index) => {
              const { label, value } = formatRecord(record, formatting);
              return (
                <li key={index} className="flex justify-between gap-3 text-sm">
                  <span className="min-w-0">
                    {formatWorkoutDate(date)} · {label}
                  </span>
                  <span className="shrink-0 font-medium">{value}</span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Card>
  );
}

function RestCard({ groups, isTimed }: { groups: SetGroup[]; isTimed: boolean }) {
  const { range } = useStatsFilter();
  const now = useMemo(() => new Date(), []);
  const analysis = analyzeRest(restPairs(filterByRange(groups, range, now), isTimed));
  return (
    <Card title="Satzpausen">
      <p className="mb-2">{formatRestAdvice(analysis.advice)}</p>
      {analysis.buckets.length > 0 && <RestTable analysis={analysis} />}
      <p className={`${HINT} mt-2`}>
        Gemessen von Satzende zu Satzende, enthält also die Ausführung des nächsten Satzes.
      </p>
    </Card>
  );
}

function RestTable({ analysis }: { analysis: RestAnalysis }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-slate-500 dark:text-slate-400">
          <th className="py-1 font-medium">Pause</th>
          <th className="py-1 text-right font-medium">Satzpaare</th>
          <th className="py-1 text-right font-medium">Ø Abfall</th>
        </tr>
      </thead>
      <tbody>
        {analysis.buckets.map(({ label, count, averageDrop }) => (
          <tr key={label}>
            <td className="py-1">{label}</td>
            <td className="py-1 text-right tabular-nums">{count}</td>
            <td className="py-1 text-right tabular-nums">{formatDecimal(averageDrop, 1)} %</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
