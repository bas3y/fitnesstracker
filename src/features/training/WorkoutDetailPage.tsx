import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { dangerButton, secondaryButton } from '../../components/buttons';
import { Card, Page } from '../../components/Page';
import { deleteWorkout, type WorkoutDetail } from '../../db/workouts';
import {
  formatSetSummary,
  formatTime,
  formatWorkoutDate,
  formatWorkoutDuration,
  workoutDurationSeconds,
} from '../../domain/workout';
import { useSettings } from '../settings/useSettings';
import { HISTORY_PATH, WORKOUT_PATH } from './paths';
import { useWorkoutDetail } from './useWorkouts';

export function WorkoutDetailPage() {
  const { id } = useParams();
  const detail = useWorkoutDetail(id);

  if (detail === undefined) {
    return (
      <Page title="Workout" backTo={HISTORY_PATH}>
        {null}
      </Page>
    );
  }
  if (detail === null) return <WorkoutNotFound />;
  if (detail.workout.endedAt === null) return <Navigate to={WORKOUT_PATH} replace />;
  return <WorkoutSummary detail={detail} />;
}

export function WorkoutNotFound() {
  return (
    <Page title="Workout nicht gefunden" backTo={HISTORY_PATH}>
      <Card>
        <p className="text-slate-600 dark:text-slate-400">Dieses Workout gibt es nicht (mehr).</p>
      </Card>
    </Page>
  );
}

function WorkoutSummary({ detail }: { detail: WorkoutDetail }) {
  const { workout, items } = detail;
  const unit = useSettings()?.weightUnit ?? 'kg';

  return (
    <Page title={formatWorkoutDate(workout.startedAt)} backTo={HISTORY_PATH}>
      <p className="-mt-3 mb-4 text-sm text-slate-500 dark:text-slate-400">
        {formatTime(workout.startedAt)} Uhr · Dauer{' '}
        {formatWorkoutDuration(workoutDurationSeconds(workout, new Date()))}
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
        return (
          <Card key={workoutExercise.id} title={exercise?.name ?? 'Unbekannte Übung'}>
            <ol className="flex flex-col gap-1">
              {sets.map((set) => (
                <li key={set.id} className="flex gap-3 tabular-nums">
                  <span className="w-6 shrink-0 text-slate-500 dark:text-slate-400">
                    {set.isWarmup ? 'A' : ++working}
                  </span>
                  <span>{formatSetSummary(set, format)}</span>
                </li>
              ))}
            </ol>
          </Card>
        );
      })}
      <Card>
        <div className="flex flex-col gap-2">
          <Link to={`${HISTORY_PATH}/${workout.id}/edit`} className={secondaryButton}>
            Bearbeiten
          </Link>
          <DeleteWorkoutButton id={workout.id} />
        </div>
      </Card>
    </Page>
  );
}

function DeleteWorkoutButton({ id }: { id: string }) {
  const navigate = useNavigate();
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
            navigate(HISTORY_PATH, { replace: true });
          }}
        >
          Endgültig löschen
        </button>
      </div>
    </div>
  );
}
