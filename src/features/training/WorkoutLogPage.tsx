import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useBackTo } from '../../components/backNavigation';
import { inputField, primaryButton } from '../../components/buttons';
import { Card, Page } from '../../components/Page';
import { Stepper } from '../../components/Stepper';
import { createPastWorkout } from '../../db/workouts';
import {
  fromDateTimeInput,
  pastWorkoutError,
  pastWorkoutStart,
  toDateInput,
  toTimeInput,
} from '../../domain/workout';
import { HISTORY_PATH, TRAINING_PATH } from './paths';

const DEFAULT_MINUTES = 60;

/** Training nachtragen: Zeitpunkt wählen, danach Übungen und Sätze in der Bearbeiten-Ansicht */
export function WorkoutLogPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const backTo = useBackTo(TRAINING_PATH);
  const [initial] = useState(() => pastWorkoutStart(new Date(), DEFAULT_MINUTES * 60));
  const [date, setDate] = useState(toDateInput(initial));
  const [time, setTime] = useState(toTimeInput(initial));
  const [minutes, setMinutes] = useState<number | null>(DEFAULT_MINUTES);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const startedAt = fromDateTimeInput(date, time);
    const problem = pastWorkoutError(startedAt, minutes, new Date());
    if (problem || !startedAt || !minutes) {
      setError(problem);
      return;
    }
    setSaving(true);
    try {
      const workout = await createPastWorkout({ startedAt, durationSeconds: minutes * 60 });
      navigate(`${HISTORY_PATH}/${workout.id}/edit`, { replace: true, state });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Speichern fehlgeschlagen');
      setSaving(false);
    }
  };

  return (
    <Page title="Training nachtragen" backTo={backTo}>
      <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
        Für Trainings, die du z. B. auf Papier notiert hast. Alle Sätze zählen direkt als erledigt –
        für Statistik, Rekorde und Trainingstage. Ein laufendes Workout bleibt davon unberührt.
      </p>
      <Card>
        <form
          noValidate
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="log-date" className="mb-1 block text-sm font-medium">
                Datum
              </label>
              <input
                id="log-date"
                type="date"
                required
                max={toDateInput(new Date().toISOString())}
                className={inputField}
                value={date}
                onChange={(event) => {
                  setDate(event.target.value);
                  setError(null);
                }}
              />
            </div>
            <div>
              <label htmlFor="log-time" className="mb-1 block text-sm font-medium">
                Beginn
              </label>
              <input
                id="log-time"
                type="time"
                required
                className={inputField}
                value={time}
                onChange={(event) => {
                  setTime(event.target.value);
                  setError(null);
                }}
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
            onChange={(value) => {
              setMinutes(value);
              setError(null);
            }}
          />
          {error && (
            <p role="alert" className="text-sm font-medium text-red-700 dark:text-red-400">
              {error}
            </p>
          )}
          <button type="submit" className={primaryButton} disabled={saving}>
            Weiter zu den Übungen
          </button>
        </form>
      </Card>
    </Page>
  );
}
