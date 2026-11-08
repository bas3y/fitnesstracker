import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFromHere } from '../../components/backNavigation';
import { primaryButton } from '../../components/buttons';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Card } from '../../components/Page';
import { startWorkout } from '../../db/workouts';
import { formatClock, formatTime, workoutDurationSeconds } from '../../domain/workout';
import { PlanSuggestionCard } from '../plans/PlanSuggestionCard';
import { useActivePlanSuggestion } from '../plans/usePlans';
import { WORKOUT_PATH } from './paths';
import { useActiveWorkout, useNow } from './useWorkouts';

/** Laufendes Workout fortsetzen, sonst Plan-Vorschlag oder leeres Workout starten */
export function TrainingStartCard({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate();
  const active = useActiveWorkout();
  const now = useNow(!!active);
  const activePlan = useActivePlanSuggestion();
  const [confirmStart, setConfirmStart] = useState(false);
  const from = useFromHere();
  const backState = compact ? from : undefined;

  if (active) {
    return (
      <Card tone="hero">
        <p className="mb-3 text-muted">
          Workout läuft seit {formatTime(active.startedAt)} (
          {formatClock(workoutDurationSeconds(active, now))}).
        </p>
        <Link to={WORKOUT_PATH} state={backState} className={primaryButton}>
          Workout fortsetzen
        </Link>
      </Card>
    );
  }
  if (activePlan) return <PlanSuggestionCard active={activePlan} compact={compact} />;

  return (
    <Card tone="hero">
      <button
        type="button"
        className={primaryButton}
        disabled={active === undefined || activePlan === undefined}
        onClick={() => setConfirmStart(true)}
      >
        Workout starten
      </button>
      {confirmStart && (
        <ConfirmDialog
          title="Workout starten?"
          confirmLabel="Starten"
          onCancel={() => setConfirmStart(false)}
          onConfirm={async () => {
            await startWorkout();
            navigate(WORKOUT_PATH, { state: backState });
          }}
        >
          Du startest ein leeres Workout und fügst die Übungen selbst hinzu.
        </ConfirmDialog>
      )}
    </Card>
  );
}
