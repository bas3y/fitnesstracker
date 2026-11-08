import { useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useBackTo } from '../../components/backNavigation';
import { dangerButton, primaryButton, secondaryButton } from '../../components/buttons';
import { TrophyIcon } from '../../components/icons';
import { Card, Page } from '../../components/Page';
import { deleteWorkout, type WorkoutDetail } from '../../db/workouts';
import { formatAdjustment, formatBlockWeek } from '../../domain/blocks';
import { workoutShareContent } from '../../domain/shareCard';
import { formatRecord } from '../../domain/strength';
import {
  formatSetSummary,
  formatTime,
  formatWorkoutDate,
  formatWorkoutDuration,
  workoutDurationSeconds,
} from '../../domain/workout';
import { useSettings } from '../settings/useSettings';
import { ShareImageDialog } from '../share/ShareImageDialog';
import { HISTORY_PATH, WORKOUT_PATH } from './paths';
import { useWorkoutDetail, useWorkoutRecords } from './useWorkouts';

export function WorkoutDetailPage() {
  const { id } = useParams();
  const detail = useWorkoutDetail(id);
  const backTo = useBackTo(HISTORY_PATH);

  if (detail === undefined) {
    return (
      <Page title="Workout" backTo={backTo}>
        {null}
      </Page>
    );
  }
  if (detail === null) return <WorkoutNotFound />;
  if (detail.workout.endedAt === null) return <Navigate to={WORKOUT_PATH} replace />;
  return <WorkoutSummary detail={detail} />;
}

export function WorkoutNotFound() {
  const backTo = useBackTo(HISTORY_PATH);
  return (
    <Page title="Workout nicht gefunden" backTo={backTo}>
      <Card>
        <p className="text-slate-600 dark:text-slate-400">Dieses Workout gibt es nicht (mehr).</p>
      </Card>
    </Page>
  );
}

function WorkoutSummary({ detail }: { detail: WorkoutDetail }) {
  const { workout, planDayName, items } = detail;
  const settings = useSettings();
  const unit = settings?.weightUnit ?? 'kg';
  const bodyWeightKg = settings?.bodyWeightKg ?? null;
  const records = useWorkoutRecords(workout.id);
  const { state } = useLocation();
  const backTo = useBackTo(HISTORY_PATH);
  const [sharing, setSharing] = useState(false);
  const shareContent = useMemo(
    () =>
      workoutShareContent({
        title: planDayName,
        startedAt: workout.startedAt,
        durationSeconds: workoutDurationSeconds(workout, new Date()),
        items,
        recordCount: [...(records?.values() ?? [])].reduce((sum, list) => sum + list.length, 0),
        bodyWeightKg,
        unit,
      }),
    [workout, planDayName, items, records, bodyWeightKg, unit],
  );

  return (
    <Page title={formatWorkoutDate(workout.startedAt)} backTo={backTo}>
      <p className="-mt-3 mb-4 text-sm text-slate-500 dark:text-slate-400">
        {planDayName && `${planDayName} · `}
        {formatTime(workout.startedAt)} Uhr · Dauer{' '}
        {formatWorkoutDuration(workoutDurationSeconds(workout, new Date()))}
        {workout.block && (
          <span className="block font-medium text-emerald-800 dark:text-emerald-300">
            {formatBlockWeek(workout.block)}
            {workout.block.adjusted && ` · ${formatAdjustment(workout.block)}`}
          </span>
        )}
      </p>
      {workout.notes && (
        <Card>
          <p className="whitespace-pre-line">{workout.notes}</p>
        </Card>
      )}
      {items.map(({ workoutExercise, exercise, sets }) => {
        const format = {
          unit,
          isTimed: exercise?.isTimed ?? false,
          isBodyweight: exercise?.equipment === 'bodyweight',
        };
        let working = 0;
        const exerciseRecords = sets.flatMap((set) => records?.get(set.id) ?? []);
        return (
          <Card key={workoutExercise.id} title={exercise?.name ?? 'Unbekannte Übung'}>
            <ol className="flex flex-col gap-1">
              {sets.map((set) => (
                <li key={set.id} className="flex items-center gap-3 tabular-nums">
                  <span className="w-6 shrink-0 text-slate-500 dark:text-slate-400">
                    {set.isWarmup ? 'A' : ++working}
                  </span>
                  <span>{formatSetSummary(set, format)}</span>
                  {records?.has(set.id) && (
                    <TrophyIcon
                      role="img"
                      aria-hidden={false}
                      aria-label="Rekord"
                      className="h-5 w-5 text-amber-500"
                    />
                  )}
                </li>
              ))}
            </ol>
            {exerciseRecords.length > 0 && (
              <ul
                aria-label={`Rekorde ${exercise?.name ?? ''}`.trim()}
                className="mt-3 flex flex-col gap-1 rounded-xl bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100"
              >
                {exerciseRecords.map((record) => {
                  const { label, value } = formatRecord(record, format);
                  return (
                    <li key={`${record.type}-${record.load}`} className="flex gap-2">
                      <TrophyIcon className="h-4 w-4 shrink-0 translate-y-0.5 text-amber-500" />
                      <span>
                        {label}: <span className="font-semibold">{value}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        );
      })}
      <Card>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            className={secondaryButton}
            disabled={records === undefined}
            onClick={() => setSharing(true)}
          >
            Teilen-Bild
          </button>
          <Link to={`${HISTORY_PATH}/${workout.id}/edit`} state={state} className={secondaryButton}>
            Bearbeiten
          </Link>
          <DeleteWorkoutButton id={workout.id} />
        </div>
      </Card>
      <Link to={backTo} className={`${primaryButton} mb-4`}>
        Fertig
      </Link>
      {sharing && (
        <ShareImageDialog
          content={shareContent}
          startedAt={workout.startedAt}
          onClose={() => setSharing(false)}
        />
      )}
    </Page>
  );
}

function DeleteWorkoutButton({ id }: { id: string }) {
  const navigate = useNavigate();
  const backTo = useBackTo(HISTORY_PATH);
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button type="button" className={dangerButton} onClick={() => setConfirming(true)}>
        Löschen
      </button>
    );
  }
  return (
    <div className="rounded-xl border border-red-300 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/40">
      <p className="mb-3 text-sm font-medium">Workout mit allen Sätzen wirklich löschen?</p>
      <div className="flex gap-2">
        <button type="button" className={secondaryButton} onClick={() => setConfirming(false)}>
          Abbrechen
        </button>
        <button
          type="button"
          className={dangerButton}
          onClick={async () => {
            await deleteWorkout(id);
            navigate(backTo, { replace: true });
          }}
        >
          Endgültig löschen
        </button>
      </div>
    </div>
  );
}
