import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dangerButton, inputField, primaryButton, secondaryButton } from '../../components/buttons';
import { Card, Page } from '../../components/Page';
import { deleteWorkout, finishWorkout, startWorkout, type WorkoutDetail } from '../../db/workouts';
import { formatClock, formatTime, workoutDurationSeconds } from '../../domain/workout';
import { HISTORY_PATH, TRAINING_PATH, WORKOUT_PATH } from './paths';
import { RestTimerBar } from './RestTimer';
import { WorkoutEditor } from './WorkoutEditor';
import { useActiveWorkout, useNow, useWorkoutDetail } from './useWorkouts';

export function WorkoutPage() {
  const active = useActiveWorkout();
  const detail = useWorkoutDetail(active?.id);

  if (active === undefined || (active && detail === undefined)) {
    return (
      <Page title="Workout" backTo={TRAINING_PATH}>
        {null}
      </Page>
    );
  }
  if (active === null || !detail) return <NoActiveWorkout />;
  return <ActiveWorkout detail={detail} />;
}

function NoActiveWorkout() {
  const navigate = useNavigate();
  return (
    <Page title="Workout" backTo={TRAINING_PATH}>
      <Card>
        <p className="mb-3 text-slate-600 dark:text-slate-400">Gerade läuft kein Workout.</p>
        <button
          type="button"
          className={primaryButton}
          onClick={async () => {
            await startWorkout();
            navigate(WORKOUT_PATH, { replace: true });
          }}
        >
          Workout starten
        </button>
      </Card>
    </Page>
  );
}

function ActiveWorkout({ detail }: { detail: WorkoutDetail }) {
  const { workout } = detail;
  const now = useNow();
  const [finishing, setFinishing] = useState(false);

  return (
    <Page title="Workout" backTo={TRAINING_PATH}>
      <p className="-mt-3 mb-4 text-sm text-slate-500 dark:text-slate-400">
        Gestartet {formatTime(workout.startedAt)} ·{' '}
        <span className="tabular-nums" aria-label="Dauer">
          {formatClock(workoutDurationSeconds(workout, now))}
        </span>
      </p>

      <WorkoutEditor detail={detail} mode="live" />

      {finishing ? (
        <FinishCard detail={detail} onCancel={() => setFinishing(false)} />
      ) : (
        <button
          type="button"
          className={`${primaryButton} mb-4`}
          onClick={() => setFinishing(true)}
        >
          Workout beenden
        </button>
      )}
      {/* Platz, damit die Pausenleiste nichts verdeckt */}
      {workout.restEndsAt && <div className="h-20" />}
      <RestTimerBar workout={workout} />
    </Page>
  );
}

function FinishCard({ detail, onCancel }: { detail: WorkoutDetail; onCancel: () => void }) {
  const navigate = useNavigate();
  const [notes, setNotes] = useState(detail.workout.notes);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const sets = detail.items.flatMap((item) => item.sets);
  const done = sets.filter((set) => set.completedAt !== null).length;
  const open = sets.length - done;

  const discard = async () => {
    await deleteWorkout(detail.workout.id);
    navigate(TRAINING_PATH, { replace: true });
  };

  return (
    <Card title="Workout beenden">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {done === 1 ? '1 Satz' : `${done} Sätze`} abgehakt.
          {open > 0 &&
            ` ${open === 1 ? '1 offener Satz wird' : `${open} offene Sätze werden`} verworfen.`}
        </p>
        {done > 0 ? (
          <>
            <div>
              <label htmlFor="workout-notes" className="mb-1 block text-sm font-medium">
                Notiz (optional)
              </label>
              <textarea
                id="workout-notes"
                rows={3}
                placeholder="z. B. gut geschlafen, Schulter etwas gezwickt"
                className={`${inputField} h-auto py-2`}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button type="button" className={secondaryButton} onClick={onCancel}>
                Weiter trainieren
              </button>
              <button
                type="button"
                className={primaryButton}
                onClick={async () => {
                  await finishWorkout(detail.workout.id, notes);
                  navigate(`${HISTORY_PATH}/${detail.workout.id}`, { replace: true });
                }}
              >
                Speichern
              </button>
            </div>
            {!confirmDiscard ? (
              <button
                type="button"
                className="min-h-11 text-sm font-medium text-red-700 dark:text-red-400"
                onClick={() => setConfirmDiscard(true)}
              >
                Workout verwerfen
              </button>
            ) : (
              <button type="button" className={dangerButton} onClick={() => void discard()}>
                Wirklich verwerfen – alle Sätze löschen
              </button>
            )}
          </>
        ) : (
          <div className="flex gap-2">
            <button type="button" className={secondaryButton} onClick={onCancel}>
              Weiter trainieren
            </button>
            <button type="button" className={dangerButton} onClick={() => void discard()}>
              Workout verwerfen
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
