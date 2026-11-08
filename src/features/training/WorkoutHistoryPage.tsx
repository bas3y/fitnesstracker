import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DeleteRowButton } from '../../components/DeleteRowButton';
import { TrophyIcon } from '../../components/icons';
import { Card, Page } from '../../components/Page';
import type { Workout } from '../../db/types';
import { deleteWorkout } from '../../db/workouts';
import { formatBlockWeek } from '../../domain/blocks';
import {
  formatTime,
  formatWorkoutDate,
  formatWorkoutDuration,
  workoutDurationSeconds,
} from '../../domain/workout';
import { HISTORY_PATH, LOG_WORKOUT_PATH, TRAINING_PATH } from './paths';
import { useWorkoutHistory, useWorkoutRecordCounts } from './useWorkouts';

export function WorkoutHistoryPage() {
  const history = useWorkoutHistory();
  const recordCounts = useWorkoutRecordCounts();
  const [deleting, setDeleting] = useState<Workout | null>(null);

  return (
    <Page
      title="Verlauf"
      backTo={TRAINING_PATH}
      action={
        <Link
          to={LOG_WORKOUT_PATH}
          state={{ from: HISTORY_PATH }}
          className="flex min-h-11 shrink-0 items-center rounded-xl border border-line-strong px-3 text-sm font-semibold"
        >
          Nachtragen
        </Link>
      }
    >
      {history?.length === 0 && (
        <Card>
          <p className="text-muted">Noch keine Workouts beendet.</p>
        </Card>
      )}
      {history && history.length > 0 && (
        <ul aria-label="Workouts" className="flex flex-col gap-2 pb-4">
          {history.map(({ workout, planDayName, exerciseNames, setCount }) => {
            const records = recordCounts?.get(workout.id) ?? 0;
            const date = formatWorkoutDate(workout.startedAt);
            const time = formatTime(workout.startedAt);
            return (
              <li key={workout.id} className="flex items-center rounded-2xl bg-surface">
                <Link
                  to={`${HISTORY_PATH}/${workout.id}`}
                  className="block min-w-0 flex-1 rounded-2xl px-4 py-3 active:bg-page"
                >
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold">{date}</span>
                    <span className="shrink-0 text-sm text-muted">
                      {time} · {formatWorkoutDuration(workoutDurationSeconds(workout, new Date()))}
                    </span>
                  </span>
                  {(planDayName || workout.block) && (
                    <span className="block font-medium">
                      {planDayName}{' '}
                      {workout.block && (
                        <span className="ml-2 rounded-md bg-primary-soft px-1.5 py-0.5 text-xs font-semibold text-primary-text">
                          {formatBlockWeek(workout.block)}
                        </span>
                      )}
                    </span>
                  )}
                  <span className="block truncate text-sm text-muted">
                    {exerciseNames.join(', ') || 'Keine Übungen'}
                  </span>
                  <span className="flex items-center gap-3 text-sm text-muted">
                    {setCount === 1 ? '1 Satz' : `${setCount} Sätze`}
                    {records > 0 && (
                      <span className="flex items-center gap-1 font-medium text-warn">
                        <TrophyIcon className="h-4 w-4" />
                        {records === 1 ? '1 Rekord' : `${records} Rekorde`}
                      </span>
                    )}
                  </span>
                </Link>
                <DeleteRowButton
                  name={`Workout vom ${date}, ${time} Uhr`}
                  onClick={() => setDeleting(workout)}
                />
              </li>
            );
          })}
        </ul>
      )}
      {deleting && (
        <ConfirmDialog
          title="Workout löschen?"
          confirmLabel="Löschen"
          onCancel={() => setDeleting(null)}
          onConfirm={async () => {
            await deleteWorkout(deleting.id);
            setDeleting(null);
          }}
        >
          Das Workout vom {formatWorkoutDate(deleting.startedAt)}, {formatTime(deleting.startedAt)}{' '}
          Uhr wird mit allen Sätzen gelöscht.
        </ConfirmDialog>
      )}
    </Page>
  );
}
