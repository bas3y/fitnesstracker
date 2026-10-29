import { Link } from 'react-router-dom';
import { TrophyIcon } from '../../components/icons';
import { Card, Page } from '../../components/Page';
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

  return (
    <Page title="Verlauf" backTo={TRAINING_PATH}>
      {history?.length === 0 && (
        <Card>
          <p className="text-slate-600 dark:text-slate-400">Noch keine Workouts beendet.</p>
        </Card>
      )}
      {history && history.length > 0 && (
        <ul aria-label="Workouts" className="flex flex-col gap-2 pb-4">
          {history.map(({ workout, exerciseNames, setCount }) => {
            const records = recordCounts?.get(workout.id) ?? 0;
            return (
              <li key={workout.id}>
                <Link
                  to={`${HISTORY_PATH}/${workout.id}`}
                  className="block rounded-2xl bg-white px-4 py-3 shadow-sm active:bg-slate-50 dark:bg-slate-800 dark:active:bg-slate-700"
                >
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold">{formatWorkoutDate(workout.startedAt)}</span>
                    <span className="shrink-0 text-sm text-slate-500 dark:text-slate-400">
                      {formatTime(workout.startedAt)} ·{' '}
                      {formatWorkoutDuration(workoutDurationSeconds(workout, new Date()))}
                    </span>
                  </span>
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
              </li>
            );
          })}
        </ul>
      )}
    </Page>
  );
}
