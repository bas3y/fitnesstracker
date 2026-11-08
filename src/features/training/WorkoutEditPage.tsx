import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { inputField, primaryButton } from '../../components/buttons';
import { Card, Page } from '../../components/Page';
import { Stepper } from '../../components/Stepper';
import { deleteWorkout, updateWorkoutInfo, type WorkoutDetail } from '../../db/workouts';
import type { Workout } from '../../db/types';
import {
  fromDateTimeInput,
  toDateInput,
  toTimeInput,
  workoutDurationSeconds,
} from '../../domain/workout';
import { HISTORY_PATH, WORKOUT_PATH } from './paths';
import { WorkoutNotFound } from './WorkoutDetailPage';
import { WorkoutEditor } from './WorkoutEditor';
import { useWorkoutDetail } from './useWorkouts';

/** Nachträgliches Bearbeiten – alle Änderungen werden sofort gespeichert */
export function WorkoutEditPage() {
  const { id } = useParams();
  const detail = useWorkoutDetail(id);

  if (detail === undefined) {
    return (
      <Page title="Workout bearbeiten" backTo={HISTORY_PATH}>
        {null}
      </Page>
    );
  }
  if (detail === null) return <WorkoutNotFound />;
  if (detail.workout.endedAt === null) return <Navigate to={WORKOUT_PATH} replace />;
  return <EditWorkout detail={detail} />;
}

function EditWorkout({ detail }: { detail: WorkoutDetail }) {
  const detailPath = `${HISTORY_PATH}/${detail.workout.id}`;
  const { state } = useLocation();
  const navigate = useNavigate();
  const empty = detail.items.length === 0;
  return (
    <Page title="Workout bearbeiten" backTo={detailPath} backState={state}>
      <InfoCard workout={detail.workout} />
      <WorkoutEditor detail={detail} mode="edit" />
      {empty ? (
        <>
          <p className="mb-2 text-sm text-muted">
            Ohne Übungen wird das Workout nicht gespeichert.
          </p>
          <button
            type="button"
            className={`${primaryButton} mb-4`}
            onClick={async () => {
              await deleteWorkout(detail.workout.id);
              navigate(HISTORY_PATH, { replace: true });
            }}
          >
            Fertig
          </button>
        </>
      ) : (
        <Link to={detailPath} state={state} className={`${primaryButton} mb-4`}>
          Fertig
        </Link>
      )}
    </Page>
  );
}

function InfoCard({ workout }: { workout: Workout }) {
  const [date, setDate] = useState(toDateInput(workout.startedAt));
  const [time, setTime] = useState(toTimeInput(workout.startedAt));
  const [notes, setNotes] = useState(workout.notes);
  const minutes = Math.max(1, Math.round(workoutDurationSeconds(workout, new Date()) / 60));

  const save = (changes: { date?: string; time?: string; minutes?: number; notes?: string }) => {
    const startedAt = fromDateTimeInput(changes.date ?? date, changes.time ?? time);
    if (!startedAt) return;
    void updateWorkoutInfo(workout.id, {
      startedAt,
      durationSeconds: (changes.minutes ?? minutes) * 60,
      notes: changes.notes ?? notes,
    });
  };

  return (
    <Card>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="workout-date" className="mb-1 block text-sm font-medium">
              Datum
            </label>
            <input
              id="workout-date"
              type="date"
              className={inputField}
              value={date}
              onChange={(event) => setDate(event.target.value)}
              onBlur={() => save({})}
            />
          </div>
          <div>
            <label htmlFor="workout-time" className="mb-1 block text-sm font-medium">
              Beginn
            </label>
            <input
              id="workout-time"
              type="time"
              className={inputField}
              value={time}
              onChange={(event) => setTime(event.target.value)}
              onBlur={() => save({})}
            />
          </div>
        </div>
        <Stepper
          label="Dauer"
          value={minutes}
          unit="min"
          step={5}
          min={1}
          max={24 * 60}
          decimals={0}
          onChange={(value) => value !== null && save({ minutes: value })}
        />
        <div>
          <label htmlFor="workout-notes" className="mb-1 block text-sm font-medium">
            Notiz
          </label>
          <textarea
            id="workout-notes"
            rows={3}
            className={`${inputField} h-auto py-2`}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            onBlur={() => notes.trim() !== workout.notes && save({ notes })}
          />
        </div>
      </div>
    </Card>
  );
}
