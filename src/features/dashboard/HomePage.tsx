import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { Card, LinkRow } from '../../components/Page';
import { loadStatsSessions } from '../../db/stats';
import type { WeightUnit } from '../../db/types';
import { formatDecimal } from '../../domain/format';
import { recentRecords, weekSummary, type StatsSession } from '../../domain/stats';
import { formatRecord, type PersonalRecord } from '../../domain/strength';
import { kgToDisplay } from '../../domain/units';
import {
  formatWorkoutDate,
  formatWorkoutDuration,
  workoutDurationSeconds,
} from '../../domain/workout';
import { useSettings } from '../settings/useSettings';
import { ActivityCard } from '../stats/ActivityCard';
import { HISTORY_PATH } from '../training/paths';
import { TrainingStartCard } from '../training/TrainingStartCard';
import { useNow, useWorkoutHistory } from '../training/useWorkouts';

const RECENT_RECORD_ROWS = 3;
const RECORDS_PER_ROW = 2;

export function HomePage() {
  const settings = useSettings();
  const sessions = useLiveQuery(loadStatsSessions);
  const now = useNow(true, 60_000);

  return (
    <div className="mx-auto max-w-md px-4 pt-[calc(1.5rem+env(safe-area-inset-top))]">
      <div className="mb-4 flex items-center gap-3">
        <img src="./favicon.svg" alt="" className="h-12 w-12" />
        <div>
          <h1 className="text-2xl font-bold">Fitnesstracker</h1>
          <p className="text-slate-600 dark:text-slate-400">
            {settings?.name ? `Hallo, ${settings.name}!` : 'Hallo!'}
          </p>
        </div>
      </div>
      <TrainingStartCard compact />
      {sessions?.length === 0 && (
        <Card>
          <p className="text-slate-600 dark:text-slate-400">
            Nach deinem ersten Workout siehst du hier deine Woche, deine Rekorde und deine
            Trainingstage.
          </p>
        </Card>
      )}
      {sessions && sessions.length > 0 && settings && (
        <>
          <WeekCard
            sessions={sessions}
            bodyWeightKg={settings.bodyWeightKg}
            unit={settings.weightUnit}
            now={now}
          />
          <LastWorkout now={now} />
          <RecentRecordsSection
            sessions={sessions}
            bodyWeightKg={settings.bodyWeightKg}
            unit={settings.weightUnit}
          />
          <ActivityCard sessions={sessions} now={now} span="3m" />
        </>
      )}
    </div>
  );
}

function WeekCard({
  sessions,
  bodyWeightKg,
  unit,
  now,
}: {
  sessions: StatsSession[];
  bodyWeightKg: number | null;
  unit: WeightUnit;
  now: Date;
}) {
  const { workouts, sets, volumeKg } = weekSummary(sessions, bodyWeightKg, now);
  const tiles = [
    { label: 'Workouts', value: String(workouts) },
    { label: 'Sätze', value: String(sets) },
    { label: `Volumen (${unit})`, value: formatDecimal(kgToDisplay(volumeKg, unit), 0) },
  ];
  return (
    <Card title="Diese Woche">
      <dl className="grid grid-cols-3 gap-2 text-center">
        {tiles.map(({ label, value }) => (
          <div key={label} className="flex flex-col-reverse">
            <dt className="text-sm text-slate-500 dark:text-slate-400">{label}</dt>
            <dd className="text-xl font-bold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Ohne Aufwärmsätze; Stufen und Halteübungen zählen nicht zum Volumen.
      </p>
    </Card>
  );
}

function LastWorkout({ now }: { now: Date }) {
  const last = useWorkoutHistory()?.[0];
  if (!last) return null;
  const { workout, planDayName, exerciseNames, setCount } = last;
  return (
    <section className="mb-4">
      <h2 className="mb-3 text-lg font-semibold">Letztes Workout</h2>
      <LinkRow
        to={`${HISTORY_PATH}/${workout.id}`}
        label={planDayName ?? (exerciseNames.join(', ') || 'Workout')}
        hint={[
          formatWorkoutDate(workout.startedAt),
          formatWorkoutDuration(workoutDurationSeconds(workout, now)),
          setCount === 1 ? '1 Satz' : `${setCount} Sätze`,
        ].join(' · ')}
      />
    </section>
  );
}

function recordsHint(records: PersonalRecord[], unit: WeightUnit, isBodyweight: boolean) {
  const shown = records.slice(0, RECORDS_PER_ROW).map((record) => {
    const { label, value } = formatRecord(record, { unit, isBodyweight });
    return `${label}: ${value}`;
  });
  const more = records.length - shown.length;
  return shown.join(', ') + (more > 0 ? ` (+${more})` : '');
}

function RecentRecordsSection({
  sessions,
  bodyWeightKg,
  unit,
}: {
  sessions: StatsSession[];
  bodyWeightKg: number | null;
  unit: WeightUnit;
}) {
  const rows = useMemo(
    () => recentRecords(sessions, bodyWeightKg, RECENT_RECORD_ROWS),
    [sessions, bodyWeightKg],
  );
  if (rows.length === 0) return null;
  return (
    <section className="mb-4">
      <h2 className="mb-3 text-lg font-semibold">Neueste Rekorde</h2>
      {rows.map(({ workoutId, startedAt, exercise, records }) => (
        <LinkRow
          key={`${workoutId}-${exercise.id}`}
          to={`${HISTORY_PATH}/${workoutId}`}
          label={exercise.name}
          hint={`${recordsHint(records, unit, exercise.equipment === 'bodyweight')} · ${formatWorkoutDate(startedAt)}`}
        />
      ))}
    </section>
  );
}
