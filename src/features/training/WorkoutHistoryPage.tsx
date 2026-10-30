import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DeleteRowButton } from '../../components/DeleteRowButton';
import { TrophyIcon } from '../../components/icons';
import { Card, Page } from '../../components/Page';
import type { Workout } from '../../db/types';
import { deleteWorkout } from '../../db/workouts';
import {
  formatTime,
  formatWorkoutDate,
  formatWorkoutDuration,
  workoutDurationSeconds,
} from '../../domain/workout';
import { HISTORY_PATH, TRAINING_PATH } from './paths';
import { useWorkoutHistory, useWorkoutRecordCounts } from './useWorkouts';

export function WorkoutHistoryPage() {
  const history = useWorkoutHistory();
  const recordCounts = useWorkoutRecordCounts();
  const [deleting, setDeleting] = useState<Workout | null>(null);

  return (
    <Page title="Verlauf" backTo={TRAINING_PATH}>
      {history?.length === 0 && (
        <Card>
          <p className="text-slate-600 dark:text-slate-400">Noch keine Workouts beendet.</p>
        </Card>
      )}
      {history && history.length > 0 && (
        <ul aria-label="Workouts" className="flex flex-col gap-2 pb-4">
          {history.map(({ workout, planDayName, exerciseNames, setCount }) => {
            const records = recordCounts?.get(workout.id) ?? 0;
            const date = formatWorkoutDate(workout.startedAt);
            const time = formatTime(workout.startedAt);
            return (
              <li
                key={workout.id}
                className="flex items-center rounded-2xl bg-white shadow-sm dark:bg-slate-800"
              >
                <Link
                  to={`${HISTORY_PATH}/${workout.id}`}
                  className="block min-w-0 flex-1 rounded-2xl px-4 py-3 active:bg-slate-50 dark:active:bg-slate-700"
                >
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold">{date}</span>
                    <span className="shrink-0 text-sm text-slate-500 dark:text-slate-400">
                      {time} · {formatWorkoutDuration(workoutDurationSeconds(workout, new Date()))}
                    </span>
                  </span>
                  {planDayName && <span className="block font-medium">{planDayName}</span>}
                  <span className="block truncate text-sm text-slate-600 dark:text-slate-300">
                    {exerciseNames.join(', ') || 'Keine Übungen'}
                  </span>
                  <span className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                    {setCount === 1 ? '1 Satz' : `${setCount} Sätze`}
                    {records > 0 && (
                      <span className="flex items-center gap-1 font-medium text-amber-700 dark:text-amber-400">
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
