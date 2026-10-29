import { Link, useNavigate } from 'react-router-dom';
import { primaryButton } from '../../components/buttons';
import { Card, LinkRow, Page } from '../../components/Page';
import { startWorkout } from '../../db/workouts';
import { formatClock, formatTime, workoutDurationSeconds } from '../../domain/workout';
import { HISTORY_PATH, WORKOUT_PATH } from './paths';
import { useActiveWorkout, useNow } from './useWorkouts';

export function TrainingPage() {
  const navigate = useNavigate();
  const active = useActiveWorkout();
  const now = useNow(!!active);

  return (
    <Page title="Training">
      <Card>
        {active ? (
          <>
            <p className="mb-3 text-slate-600 dark:text-slate-400">
              Workout läuft seit {formatTime(active.startedAt)} (
              {formatClock(workoutDurationSeconds(active, now))}).
            </p>
            <Link to={WORKOUT_PATH} className={primaryButton}>
              Workout fortsetzen
            </Link>
          </>
        ) : (
          <button
            type="button"
            className={primaryButton}
            disabled={active === undefined}
            onClick={async () => {
              await startWorkout();
              navigate(WORKOUT_PATH);
            }}
          >
            Workout starten
          </button>
        )}
      </Card>
      <LinkRow to={HISTORY_PATH} label="Verlauf" hint="Beendete Workouts ansehen und bearbeiten" />
      <LinkRow
        to="/training/exercises"
        label="Übungen"
        hint="Durchsuchen, Favoriten, eigene Übungen"
      />
    </Page>
  );
}
