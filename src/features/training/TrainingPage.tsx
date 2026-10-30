import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { primaryButton } from '../../components/buttons';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Card, LinkRow, Page } from '../../components/Page';
import { startWorkout } from '../../db/workouts';
import { formatClock, formatTime, workoutDurationSeconds } from '../../domain/workout';
import { PlanSuggestionCard } from '../plans/PlanSuggestionCard';
import { useActivePlanSuggestion } from '../plans/usePlans';
import { HISTORY_PATH, PLANS_PATH, WORKOUT_PATH } from './paths';
import { useActiveWorkout, useNow } from './useWorkouts';

export function TrainingPage() {
  const navigate = useNavigate();
  const active = useActiveWorkout();
  const now = useNow(!!active);
  const activePlan = useActivePlanSuggestion();
  const [confirmStart, setConfirmStart] = useState(false);

  return (
    <Page title="Training">
      {active ? (
        <Card>
          <p className="mb-3 text-slate-600 dark:text-slate-400">
            Workout läuft seit {formatTime(active.startedAt)} (
            {formatClock(workoutDurationSeconds(active, now))}).
          </p>
          <Link to={WORKOUT_PATH} className={primaryButton}>
            Workout fortsetzen
          </Link>
        </Card>
      ) : activePlan ? (
        <PlanSuggestionCard active={activePlan} />
      ) : (
        <Card>
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
                navigate(WORKOUT_PATH);
              }}
            >
              Du startest ein leeres Workout und fügst die Übungen selbst hinzu.
            </ConfirmDialog>
          )}
        </Card>
      )}
      <LinkRow to={PLANS_PATH} label="Trainingspläne" hint="Vorlagen, eigene Pläne, aktiver Plan" />
      <LinkRow to={HISTORY_PATH} label="Verlauf" hint="Beendete Workouts ansehen und bearbeiten" />
      <LinkRow
        to="/training/exercises"
        label="Übungen"
        hint="Durchsuchen, Favoriten, eigene Übungen"
      />
    </Page>
  );
}
