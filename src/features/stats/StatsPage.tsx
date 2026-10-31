import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { WeeklyBarChart } from '../../components/charts';
import { Card, LinkRow, Page } from '../../components/Page';
import { SegmentedControl } from '../../components/SegmentedControl';
import { Select } from '../../components/Select';
import { loadStatsSessions } from '../../db/stats';
import { MUSCLE_GROUPS, type MuscleGroup } from '../../db/types';
import { formatDecimal } from '../../domain/format';
import { MUSCLE_LABELS } from '../../domain/labels';
import {
  averagingWeeks,
  exerciseOverviews,
  filterByRange,
  focusHints,
  formatFocusHint,
  formatPercent,
  formatRestAdvice,
  hasEnoughHistory,
  MAJOR_MUSCLES,
  MIN_PROGRESS_SESSIONS,
  MIN_REST_PAIRS,
  muscleProgress,
  muscleVolumes,
  NEGLECTED_SETS_PER_WEEK,
  restByExercise,
  sortOverviews,
  STATS_RANGE_LABELS,
  STATS_RANGES,
  trainsMuscle,
  weeklyMuscleSets,
  type ExerciseOverview,
  type ExerciseSort,
  type MuscleProgress,
  type MuscleVolume,
  type StatsSession,
} from '../../domain/stats';
import { useSettings } from '../settings/useSettings';
import { ActivityCard } from './ActivityCard';
import { exerciseStatsPath, useStatsFilter } from './statsFilter';

const HINT = 'text-sm text-slate-500 dark:text-slate-400';

const SORT_OPTIONS: Array<{ value: ExerciseSort; label: string }> = [
  { value: 'recent', label: 'Zuletzt' },
  { value: 'progress', label: 'Fortschritt' },
  { value: 'name', label: 'Name' },
];

export function StatsPage() {
  const sessions = useLiveQuery(loadStatsSessions);
  const settings = useSettings();
  const { range, muscle, setRange, setMuscle } = useStatsFilter();

  return (
    <Page title="Statistik">
      {sessions?.length === 0 && (
        <Card>
          <p className="text-slate-600 dark:text-slate-400">
            Noch keine beendeten Trainings. Nach dem ersten Workout siehst du hier deinen
            Fortschritt.
          </p>
        </Card>
      )}
      {sessions && sessions.length > 0 && (
        <>
          <Card>
            <div className="flex flex-col gap-3">
              <SegmentedControl
                label="Zeitraum"
                options={STATS_RANGES.map((value) => ({
                  value,
                  label: STATS_RANGE_LABELS[value],
                }))}
                value={range}
                onChange={setRange}
              />
              <Select
                label="Muskelgruppe"
                value={muscle}
                options={MUSCLE_GROUPS}
                labels={MUSCLE_LABELS}
                emptyLabel="Alle Muskelgruppen"
                onChange={setMuscle}
              />
            </div>
          </Card>
          <StatsContent
            sessions={sessions}
            bodyWeightKg={settings?.bodyWeightKg ?? null}
            restAnalysis={settings?.restAnalysisEnabled ?? false}
            muscle={muscle}
            range={range}
          />
        </>
      )}
    </Page>
  );
}

function StatsContent({
  sessions,
  bodyWeightKg,
  restAnalysis,
  muscle,
  range,
}: {
  sessions: StatsSession[];
  bodyWeightKg: number | null;
  restAnalysis: boolean;
  muscle: MuscleGroup | null;
  range: (typeof STATS_RANGES)[number];
}) {
  const now = useMemo(() => new Date(), []);
  const firstAt = sessions[0]?.startedAt;
  const ofMuscle = (list: StatsSession[]) =>
    muscle ? list.filter((session) => trainsMuscle(session.exercise, muscle)) : list;

  const ranged = filterByRange(sessions, range, now);
  const overviews = exerciseOverviews(ranged, bodyWeightKg);
  const volumes = muscleVolumes(ranged, averagingWeeks(firstAt, range, now));
  const progress = muscleProgress(overviews);
  const hints = focusHints({
    volumes,
    progress,
    enoughHistory: hasEnoughHistory(firstAt, now),
  }).filter((hint) => !muscle || hint.muscle === muscle);

  return (
    <>
      {hints.length > 0 && (
        <Card title="Fokus">
          <ul className="flex list-disc flex-col gap-1 pl-5">
            {hints.map((hint) => (
              <li key={hint.muscle}>{formatFocusHint(hint)}</li>
            ))}
          </ul>
          <p className={`${HINT} mt-2`}>
            Grobe Orientierung: Kleine Muskeln und Fortgeschrittene steigern sich langsamer.
          </p>
        </Card>
      )}
      <ActivityCard sessions={ofMuscle(sessions)} now={now} />
      {muscle ? (
        <MuscleWeeksCard sessions={ranged} muscle={muscle} now={now} />
      ) : (
        <VolumeCard volumes={volumes} />
      )}
      <ProgressCard
        progress={muscle ? progress.filter((item) => item.muscle === muscle) : progress}
      />
      <ExercisesCard
        key={muscle ?? 'all'}
        overviews={
          muscle ? overviews.filter(({ exercise }) => trainsMuscle(exercise, muscle)) : overviews
        }
        initialSort={muscle ? 'progress' : 'recent'}
      />
      {restAnalysis && <RestCard sessions={ofMuscle(ranged)} />}
    </>
  );
}

function Bar({
  label,
  value,
  share,
  tone = 'good',
}: {
  label: string;
  value: string;
  /** Balkenlänge 0–1 */
  share: number;
  tone?: 'good' | 'warn' | 'bad';
}) {
  const color = { good: 'bg-emerald-500', warn: 'bg-amber-500', bad: 'bg-red-500' }[tone];
  return (
    <li>
      <div className="flex justify-between gap-3 text-sm">
        <span>{label}</span>
        <span className="shrink-0 font-medium tabular-nums">{value}</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-slate-100 dark:bg-slate-700">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${share * 100}%` }} />
      </div>
    </li>
  );
}

function VolumeCard({ volumes }: { volumes: MuscleVolume[] }) {
  const top = volumes[0]?.setsPerWeek ?? 1;
  return (
    <Card title="Sätze pro Woche">
      {volumes.length === 0 ? (
        <p className={HINT}>Keine Krafttrainings in diesem Zeitraum.</p>
      ) : (
        <>
          <ul aria-label="Sätze pro Muskelgruppe" className="flex flex-col gap-2">
            {volumes.map(({ muscle, setsPerWeek }) => (
              <Bar
                key={muscle}
                label={MUSCLE_LABELS[muscle]}
                value={formatDecimal(setsPerWeek, 1)}
                share={setsPerWeek / top}
                tone={
                  MAJOR_MUSCLES.includes(muscle) && setsPerWeek < NEGLECTED_SETS_PER_WEEK
                    ? 'warn'
                    : 'good'
                }
              />
            ))}
          </ul>
          <p className={`${HINT} mt-2`}>
            Durchschnitt im Zeitraum, Hilfsmuskeln zählen halb. Orange = unter{' '}
            {NEGLECTED_SETS_PER_WEEK} Sätzen.
          </p>
        </>
      )}
    </Card>
  );
}

function MuscleWeeksCard({
  sessions,
  muscle,
  now,
}: {
  sessions: StatsSession[];
  muscle: MuscleGroup;
  now: Date;
}) {
  const weeks = weeklyMuscleSets(sessions, muscle, now);
  return (
    <Card title={`Sätze pro Woche: ${MUSCLE_LABELS[muscle]}`}>
      {weeks.length === 0 ? (
        <p className={HINT}>Keine Sätze in diesem Zeitraum.</p>
      ) : (
        <>
          <WeeklyBarChart
            label={`Sätze pro Woche für ${MUSCLE_LABELS[muscle]}`}
            bars={weeks.map(({ weekStart, sets }) => ({
              name: `${weekStart.slice(8)}.${weekStart.slice(5, 7)}.`,
              value: sets,
            }))}
            formatValue={(value) => `${formatDecimal(value, 1)} Sätze`}
          />
          <p className={`${HINT} mt-2`}>Hilfsmuskeln zählen halb.</p>
        </>
      )}
    </Card>
  );
}

function ProgressCard({ progress }: { progress: MuscleProgress[] }) {
  const top = Math.max(1, ...progress.map(({ percent }) => Math.abs(percent)));
  return (
    <Card title="Fortschritt je Muskelgruppe">
      {progress.length === 0 ? (
        <p className={HINT}>
          Noch zu wenig Daten: Eine Übung braucht mindestens {MIN_PROGRESS_SESSIONS} Einheiten im
          Zeitraum.
        </p>
      ) : (
        <>
          <ul aria-label="Fortschritt je Muskelgruppe" className="flex flex-col gap-2">
            {progress.map(({ muscle, percent, exerciseCount }) => (
              <Bar
                key={muscle}
                label={`${MUSCLE_LABELS[muscle]} (${exerciseCount === 1 ? '1 Übung' : `${exerciseCount} Übungen`})`}
                value={formatPercent(percent)}
                share={Math.abs(percent) / top}
                tone={percent < 0 ? 'bad' : 'good'}
              />
            ))}
          </ul>
          <p className={`${HINT} mt-2`}>
            Bestwert der ersten gegen die letzten zwei Einheiten im Zeitraum.
          </p>
        </>
      )}
    </Card>
  );
}

function ExercisesCard({
  overviews,
  initialSort,
}: {
  overviews: ExerciseOverview[];
  initialSort: ExerciseSort;
}) {
  const [params] = useSearchParams();
  const [sort, setSort] = useState(initialSort);
  return (
    <section className="mb-4">
      <h2 className="mb-3 text-lg font-semibold">Übungen</h2>
      {overviews.length === 0 ? (
        <p className={HINT}>Keine Übungen in diesem Zeitraum.</p>
      ) : (
        <>
          <div className="mb-3">
            <SegmentedControl
              label="Sortierung"
              options={SORT_OPTIONS}
              value={sort}
              onChange={setSort}
            />
          </div>
          {sortOverviews(overviews, sort).map(({ exercise, sessionCount, progress }) => (
            <LinkRow
              key={exercise.id}
              to={exerciseStatsPath(exercise.id, params)}
              label={exercise.name}
              hint={[
                sessionCount === 1 ? '1 Einheit' : `${sessionCount} Einheiten`,
                progress && formatPercent(progress.percent),
              ]
                .filter(Boolean)
                .join(' · ')}
            />
          ))}
        </>
      )}
    </section>
  );
}

function RestCard({ sessions }: { sessions: StatsSession[] }) {
  const [params] = useSearchParams();
  const items = restByExercise(sessions);
  return (
    <section className="mb-4">
      <h2 className="mb-3 text-lg font-semibold">Satzpausen</h2>
      {items.length === 0 ? (
        <p className={HINT}>
          Noch zu wenig Daten: Eine Übung braucht mindestens {MIN_REST_PAIRS} vergleichbare
          Satzpaare im Zeitraum.
        </p>
      ) : (
        items.map(({ exercise, analysis }) => (
          <LinkRow
            key={exercise.id}
            to={exerciseStatsPath(exercise.id, params)}
            label={exercise.name}
            hint={formatRestAdvice(analysis.advice)}
          />
        ))
      )}
    </section>
  );
}
