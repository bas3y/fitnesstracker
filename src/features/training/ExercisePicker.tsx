import { useEffect, useId, useRef, useState } from 'react';
import { secondaryButton } from '../../components/buttons';
import { StarIcon } from '../../components/icons';
import { createUserExercise } from '../../db/exercises';
import { EMPTY_EXERCISE_INPUT } from '../../db/schemas';
import type { Exercise } from '../../db/types';
import { INITIAL_BROWSER_STATE, type ExerciseBrowserState } from '../../domain/exercises';
import { ExerciseBrowser, ExerciseSummary } from './ExerciseBrowser';
import { ExerciseForm } from './ExerciseForm';
import { useActiveExercises } from './useExercises';

interface ExercisePickerProps {
  title?: string;
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}

/**
 * Vollbild-Auswahl einer Übung (Suche, Filter, Favoriten zuerst). Ausgeblendete Übungen fehlen.
 * Über „Eigene Übung anlegen“ kann direkt eine neue Übung erstellt und ausgewählt werden.
 * Wird vom Aufrufer nur gerendert, solange sie offen ist.
 */
export function ExercisePicker({
  title = 'Übung auswählen',
  onSelect,
  onClose,
}: ExercisePickerProps) {
  const exercises = useActiveExercises();
  const [state, setState] = useState<ExerciseBrowserState>(INITIAL_BROWSER_STATE);
  const [creating, setCreating] = useState(false);
  const titleId = useId();
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose();
      }}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-50 outline-none dark:bg-slate-900"
    >
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 pt-[env(safe-area-inset-top)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-md items-center justify-between gap-2 px-4 py-2">
          <h2 id={titleId} className="text-lg font-semibold">
            {creating ? 'Eigene Übung anlegen' : title}
          </h2>
          <button
            type="button"
            className="min-h-11 px-2 font-medium text-emerald-700 dark:text-emerald-400"
            onClick={creating ? () => setCreating(false) : onClose}
          >
            {creating ? 'Zurück' : 'Schließen'}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {creating ? (
          <ExerciseForm
            initial={{ ...EMPTY_EXERCISE_INPUT, name: state.query.trim() }}
            submitLabel="Anlegen und auswählen"
            onSubmit={async (input) => onSelect(await createUserExercise(input))}
            onCancel={() => setCreating(false)}
          />
        ) : (
          <>
            <button
              type="button"
              className={`${secondaryButton} mb-4`}
              onClick={() => setCreating(true)}
            >
              + Eigene Übung anlegen
            </button>
            <ExerciseBrowser
              exercises={exercises}
              state={state}
              onStateChange={setState}
              renderItem={(exercise) => (
                <button
                  type="button"
                  className="flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left active:bg-slate-50 dark:active:bg-slate-700"
                  onClick={() => onSelect(exercise)}
                >
                  <ExerciseSummary exercise={exercise} />
                  {exercise.isFavorite && (
                    <StarIcon
                      filled
                      aria-label="Favorit"
                      aria-hidden={false}
                      role="img"
                      className="ml-auto h-5 w-5 shrink-0 text-amber-500"
                    />
                  )}
                </button>
              )}
            />
          </>
        )}
      </div>
    </div>
  );
}
