import { Link, useLocation } from 'react-router-dom';
import { formatClock, restRemainingSeconds, workoutDurationSeconds } from '../../domain/workout';
import { WORKOUT_PATH } from './paths';
import { useActiveWorkout, useNow } from './useWorkouts';

/** Hinweis auf ein laufendes Workout (z. B. nach App-Neustart) auf allen anderen Seiten */
export function ActiveWorkoutBanner({ first }: { first: boolean }) {
  const workout = useActiveWorkout();
  const { pathname } = useLocation();
  const visible = !!workout && pathname !== WORKOUT_PATH;
  const now = useNow(visible);
  if (!visible) return null;

  const rest = restRemainingSeconds(workout.restEndsAt, now);
  return (
    <Link
      to={WORKOUT_PATH}
      role="status"
      className={`block bg-emerald-700 px-4 pb-3 text-center text-sm font-medium text-white ${
        first ? 'pt-[calc(0.75rem+env(safe-area-inset-top))]' : 'pt-3'
      }`}
    >
      Workout läuft · {formatClock(workoutDurationSeconds(workout, now))}
      {rest !== null && rest > 0 && ` · Pause ${formatClock(rest)}`} – fortsetzen
    </Link>
  );
}
