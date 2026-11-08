import { useEffect, useId, useRef, useState } from 'react';
import { primaryButton, secondaryButton } from '../../components/buttons';
import { createUserExercise } from '../../db/exercises';
import { EMPTY_EXERCISE_INPUT } from '../../db/schemas';
import type { Exercise } from '../../db/types';
import { INITIAL_BROWSER_STATE, type ExerciseBrowserState } from '../../domain/exercises';
import { Badge, ExerciseBrowser, ExerciseSummary } from './ExerciseBrowser';
import { ExerciseForm } from './ExerciseForm';
import { FavoriteButton } from './FavoriteButton';
import { useActiveExercises } from './useExercises';

interface ExercisePickerBaseProps {
  title?: string;
  /** Wird über der Liste angezeigt, solange nicht gesucht wird (z. B. Alternativen) */
  suggestions?: Exercise[];
  /** Schon enthaltene Übungen: Sie werden markiert, bleiben aber wählbar */
  addedIds?: ReadonlySet<string>;
  onClose: () => void;
}

type ExercisePickerProps = ExercisePickerBaseProps &
  (
    | { onSelect: (exercise: Exercise) => void; onSelectMany?: undefined }
    /** Mehrfachauswahl: Antippen wählt aus, bestätigt wird unten; Reihenfolge wie angetippt */
    | { onSelect?: undefined; onSelectMany: (exercises: Exercise[]) => void }
  );

/**
 * Vollbild-Auswahl einer Übung (Suche, Filter, Favoriten zuerst). Ausgeblendete Übungen fehlen.
 * Über „Eigene Übung anlegen“ kann direkt eine neue Übung erstellt und ausgewählt werden.
 * Wird vom Aufrufer nur gerendert, solange sie offen ist.
 */
export function ExercisePicker({
  title = 'Übung auswählen',
  suggestions = [],
  addedIds,
  onSelect,
  onSelectMany,
  onClose,
}: ExercisePickerProps) {
  const exercises = useActiveExercises();
  const [state, setState] = useState<ExerciseBrowserState>(INITIAL_BROWSER_STATE);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Exercise[]>([]);
  const titleId = useId();
  const dialog = useRef<HTMLDivElement>(null);

  const toggle = (exercise: Exercise) =>
    setSelected((current) =>
      current.some((item) => item.id === exercise.id)
        ? current.filter((item) => item.id !== exercise.id)
        : [...current, exercise],
    );

  const renderOption = (exercise: Exercise) => {
    const position = selected.findIndex((item) => item.id === exercise.id);
    return (
      <div className="flex items-center">
        <button
          type="button"
          aria-pressed={onSelectMany ? position >= 0 : undefined}
          className="flex min-h-14 min-w-0 flex-1 items-center gap-3 py-2 pl-4 text-left active:bg-page"
          onClick={() => (onSelect ? onSelect(exercise) : toggle(exercise))}
        >
          {onSelectMany && (
            <span
              aria-hidden="true"
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                position >= 0 ? 'border-primary bg-primary text-on-primary' : 'border-line-strong'
              }`}
            >
              {position >= 0 && position + 1}
            </span>
          )}
          <ExerciseSummary exercise={exercise} />
          {addedIds?.has(exercise.id) && (
            <span className="ml-auto shrink-0">
              <Badge>Im Training</Badge>
            </span>
          )}
        </button>
        <FavoriteButton exercise={exercise} />
      </div>
    );
  };

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
      className="fixed inset-0 z-50 overflow-y-auto bg-page outline-none"
    >
      <div className="sticky top-0 z-10 border-b border-line bg-page/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between gap-2 px-4 py-2">
          <h2 id={titleId} className="text-lg font-semibold">
            {creating ? 'Eigene Übung anlegen' : title}
          </h2>
          <button
            type="button"
            className="min-h-11 px-2 font-medium text-primary-text"
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
            onSubmit={async (input) => {
              const created = await createUserExercise(input);
              if (onSelect) {
                onSelect(created);
              } else {
                setSelected((current) => [...current, created]);
                setCreating(false);
              }
            }}
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
            {suggestions.length > 0 && state.query.trim() === '' && (
              <>
                <h3 className="mb-2 font-semibold">Vorschläge</h3>
                <ul
                  aria-label="Vorschläge"
                  className="mb-4 divide-y divide-line overflow-hidden rounded-2xl bg-surface"
                >
                  {suggestions.map((exercise) => (
                    <li key={exercise.id}>{renderOption(exercise)}</li>
                  ))}
                </ul>
              </>
            )}
            <ExerciseBrowser
              exercises={exercises}
              state={state}
              onStateChange={setState}
              renderItem={renderOption}
            />
          </>
        )}
      </div>

      {onSelectMany && !creating && selected.length > 0 && (
        <div className="sticky bottom-0 z-10 border-t border-line bg-page/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
          <div className="mx-auto max-w-md px-4 py-3">
            <button type="button" className={primaryButton} onClick={() => onSelectMany(selected)}>
              {selected.length === 1 ? '1 Übung' : `${selected.length} Übungen`} hinzufügen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
