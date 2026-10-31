import { lazy, Suspense, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { dangerButton, inputField, secondaryButton } from '../../components/buttons';
import { StarIcon } from '../../components/icons';
import { Card, Page } from '../../components/Page';
import {
  deleteUserExercise,
  setExerciseFavorite,
  setExerciseHidden,
  setExerciseNotes,
} from '../../db/exercises';
import type { Exercise, MuscleGroup } from '../../db/types';
import { EQUIPMENT_LABELS, EXERCISE_CATEGORY_LABELS, MUSCLE_LABELS } from '../../domain/labels';
import { statsBackPath } from '../stats/statsFilter';
import { Badge } from './ExerciseBrowser';
import { useExercise } from './useExercises';

const LIST_PATH = '/training/exercises';

// Eigener Chunk wegen Recharts
const ExerciseStats = lazy(() =>
  import('../stats/ExerciseStats').then((module) => ({ default: module.ExerciseStats })),
);

export function ExerciseDetailPage() {
  const { id } = useParams();
  const exercise = useExercise(id);

  if (exercise === undefined)
    return (
      <Page title="Übung" backTo={LIST_PATH}>
        {null}
      </Page>
    );
  if (exercise === null) {
    return (
      <Page title="Übung nicht gefunden" backTo={LIST_PATH}>
        <Card>
          <p className="text-slate-600 dark:text-slate-400">Diese Übung gibt es nicht (mehr).</p>
        </Card>
      </Page>
    );
  }
  return <ExerciseDetail exercise={exercise} />;
}

function ExerciseDetail({ exercise }: { exercise: Exercise }) {
  const [params] = useSearchParams();
  const isOwn = exercise.source === 'user';
  const hidden = exercise.hiddenAt !== null;

  return (
    <Page title={exercise.name} backTo={statsBackPath(params) ?? LIST_PATH}>
      <div className="-mt-2 mb-4 flex flex-wrap gap-2">
        <Badge>{isOwn ? 'Eigene Übung' : 'Mitgeliefert'}</Badge>
        {hidden && <Badge>Ausgeblendet</Badge>}
        {exercise.isFavorite && <Badge>Favorit</Badge>}
      </div>

      <Suspense fallback={null}>
        <ExerciseStats exercise={exercise} />
      </Suspense>

      <Card>
        <dl className="flex flex-col gap-3">
          <Detail label="Kategorie">{EXERCISE_CATEGORY_LABELS[exercise.category]}</Detail>
          <Detail label="Equipment">{EQUIPMENT_LABELS[exercise.equipment]}</Detail>
          <Detail label="Hauptmuskeln">{muscleList(exercise.primaryMuscles)}</Detail>
          <Detail label="Hilfsmuskeln">{muscleList(exercise.secondaryMuscles)}</Detail>
          <Detail label="Ausführung">{exercise.isUnilateral ? 'Einseitig' : 'Beidseitig'}</Detail>
          <Detail label="Erfassung">{exercise.isTimed ? 'Dauer' : 'Wiederholungen'}</Detail>
          {exercise.aliases.length > 0 && (
            <Detail label="Auch bekannt als">{exercise.aliases.join(', ')}</Detail>
          )}
        </dl>
      </Card>

      <NotesCard key={exercise.id} exercise={exercise} />

      <Card>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            aria-pressed={exercise.isFavorite}
            className={`${secondaryButton} gap-2`}
            onClick={() => void setExerciseFavorite(exercise.id, !exercise.isFavorite)}
          >
            <StarIcon
              filled={exercise.isFavorite}
              className={`h-5 w-5 ${exercise.isFavorite ? 'text-amber-500' : ''}`}
            />
            {exercise.isFavorite ? 'Favorit entfernen' : 'Als Favorit markieren'}
          </button>
          {isOwn ? (
            <>
              <Link to={`${LIST_PATH}/${exercise.id}/edit`} className={secondaryButton}>
                Bearbeiten
              </Link>
              <DeleteButton exercise={exercise} />
            </>
          ) : (
            <>
              <button
                type="button"
                className={secondaryButton}
                onClick={() => void setExerciseHidden(exercise.id, !hidden)}
              >
                {hidden ? 'Wieder einblenden' : 'Ausblenden'}
              </button>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {hidden
                  ? 'Ausgeblendete Übungen erscheinen nicht in der Übungsauswahl.'
                  : 'Mitgelieferte Übungen können nicht gelöscht, aber ausgeblendet werden.'}
              </p>
            </>
          )}
        </div>
      </Card>
    </Page>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}

function muscleList(muscles: MuscleGroup[]): string {
  return muscles.length ? muscles.map((muscle) => MUSCLE_LABELS[muscle]).join(', ') : '–';
}

function NotesCard({ exercise }: { exercise: Exercise }) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <Card>
      <label htmlFor="exercise-notes" className="mb-1 block text-sm font-medium">
        Eigene Notiz
      </label>
      <textarea
        id="exercise-notes"
        rows={3}
        placeholder="z. B. Sitzhöhe 4, enger Griff"
        className={`${inputField} h-auto py-2`}
        value={draft ?? exercise.notes}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          if (draft !== null && draft.trim() !== exercise.notes) {
            void setExerciseNotes(exercise.id, draft);
          }
          setDraft(null);
        }}
      />
    </Card>
  );
}

function DeleteButton({ exercise }: { exercise: Exercise }) {
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button type="button" className={dangerButton} onClick={() => setConfirming(true)}>
        Löschen
      </button>
    );
  }
  return (
    <div className="rounded-xl border border-red-300 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/40">
      <p className="mb-3 text-sm font-medium">„{exercise.name}“ wirklich löschen?</p>
      <div className="flex gap-2">
        <button type="button" className={secondaryButton} onClick={() => setConfirming(false)}>
          Abbrechen
        </button>
        <button
          type="button"
          className={dangerButton}
          onClick={async () => {
            await deleteUserExercise(exercise.id);
            navigate(LIST_PATH, { replace: true });
          }}
        >
          Endgültig löschen
        </button>
      </div>
    </div>
  );
}
