import { useMemo, useState, type ReactNode } from 'react';
import { secondaryButton } from '../../components/buttons';
import { Chip } from '../../components/Chip';
import { StarIcon } from '../../components/icons';
import { Card } from '../../components/Page';
import { SearchInput } from '../../components/SearchInput';
import { Select } from '../../components/Select';
import { EQUIPMENT, EXERCISE_CATEGORIES, MUSCLE_GROUPS, type Exercise } from '../../db/types';
import {
  countDetailFilters,
  INITIAL_BROWSER_STATE,
  matchesExerciseFilter,
  sortExercises,
  type ExerciseBrowserState,
  type ExerciseFilter,
} from '../../domain/exercises';
import { EQUIPMENT_LABELS, EXERCISE_CATEGORY_LABELS, MUSCLE_LABELS } from '../../domain/labels';
import { createSearch } from '../../domain/search';

interface ExerciseBrowserProps {
  /** Aktive (nicht gelöschte) Übungen, `undefined` während des Ladens */
  exercises: Exercise[] | undefined;
  state: ExerciseBrowserState;
  onStateChange: (state: ExerciseBrowserState) => void;
  /** Option „Ausgeblendete anzeigen“ anbieten (nur in der Verwaltung, nicht in der Auswahl) */
  allowHidden?: boolean;
  renderItem: (exercise: Exercise) => ReactNode;
}

/** Suche, Filter und Trefferliste für Übungen – Grundlage von Übungsliste und `ExercisePicker` */
export function ExerciseBrowser({
  exercises,
  state,
  onStateChange,
  allowHidden = false,
  renderItem,
}: ExerciseBrowserProps) {
  const { query, filter } = state;
  const [panelOpen, setPanelOpen] = useState(() => countDetailFilters(filter) > 0);
  const search = useMemo(() => createSearch(exercises ?? []), [exercises]);
  const effectiveFilter = useMemo(
    () => (allowHidden ? filter : { ...filter, includeHidden: false }),
    [filter, allowHidden],
  );
  const results = useMemo(() => {
    const ordered = query.trim() ? search(query) : sortExercises(exercises ?? []);
    return ordered.filter((exercise) => matchesExerciseFilter(exercise, effectiveFilter));
  }, [search, exercises, query, effectiveFilter]);

  const setFilter = (changes: Partial<ExerciseFilter>) =>
    onStateChange({ query, filter: { ...filter, ...changes } });
  const detailCount = countDetailFilters(effectiveFilter);
  const isFiltered =
    query.trim() !== '' || detailCount > 0 || filter.favoritesOnly || filter.ownOnly;

  return (
    <>
      <SearchInput
        label="Übung suchen"
        placeholder="z. B. Bankdrücken, Kniebeuge …"
        value={query}
        onChange={(value) => onStateChange({ query: value, filter })}
      />
      <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1">
        <Chip
          pressed={filter.favoritesOnly}
          onClick={() => setFilter({ favoritesOnly: !filter.favoritesOnly })}
        >
          <StarIcon className="h-4 w-4" filled={filter.favoritesOnly} />
          Favoriten
        </Chip>
        <Chip pressed={filter.ownOnly} onClick={() => setFilter({ ownOnly: !filter.ownOnly })}>
          Eigene
        </Chip>
        <Chip
          pressed={detailCount > 0}
          aria-expanded={panelOpen}
          onClick={() => setPanelOpen(!panelOpen)}
        >
          Filter{detailCount > 0 && ` (${detailCount})`}
        </Chip>
      </div>

      {panelOpen && (
        <Card>
          <div className="flex flex-col gap-3">
            <Select
              label="Muskelgruppe"
              value={filter.muscle}
              options={MUSCLE_GROUPS}
              labels={MUSCLE_LABELS}
              emptyLabel="Alle"
              onChange={(muscle) => setFilter({ muscle })}
            />
            <Select
              label="Equipment"
              value={filter.equipment}
              options={EQUIPMENT}
              labels={EQUIPMENT_LABELS}
              emptyLabel="Alle"
              onChange={(equipment) => setFilter({ equipment })}
            />
            <Select
              label="Kategorie"
              value={filter.category}
              options={EXERCISE_CATEGORIES}
              labels={EXERCISE_CATEGORY_LABELS}
              emptyLabel="Alle"
              onChange={(category) => setFilter({ category })}
            />
            {allowHidden && (
              <label className="flex min-h-11 items-center gap-3">
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-primary"
                  checked={filter.includeHidden}
                  onChange={(event) => setFilter({ includeHidden: event.target.checked })}
                />
                Ausgeblendete anzeigen
              </label>
            )}
          </div>
        </Card>
      )}

      {exercises === undefined || exercises.length === 0 ? (
        <p role="status" className="text-sm text-muted">
          Übungen werden geladen …
        </p>
      ) : (
        <>
          <div className="mb-2 flex min-h-11 items-center justify-between gap-2">
            <p role="status" className="text-sm text-muted">
              {results.length === 1 ? '1 Übung' : `${results.length} Übungen`}
            </p>
            {isFiltered && (
              <button
                type="button"
                className="min-h-11 px-2 text-sm font-medium text-primary-text"
                onClick={() => onStateChange(INITIAL_BROWSER_STATE)}
              >
                Alle zurücksetzen
              </button>
            )}
          </div>
          {results.length === 0 ? (
            <Card>
              <p className="mb-3 text-muted">Keine passenden Übungen.</p>
              <button
                type="button"
                className={secondaryButton}
                onClick={() => onStateChange(INITIAL_BROWSER_STATE)}
              >
                Suche und Filter zurücksetzen
              </button>
            </Card>
          ) : (
            <ul
              aria-label="Übungsliste"
              className="mb-4 divide-y divide-line overflow-hidden rounded-2xl bg-surface"
            >
              {results.map((exercise) => (
                <li key={exercise.id}>{renderItem(exercise)}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </>
  );
}

/** Name, Badges und Kurzinfo einer Übung für Listenzeilen */
export function ExerciseSummary({ exercise }: { exercise: Exercise }) {
  const muscles = exercise.primaryMuscles.map((muscle) => MUSCLE_LABELS[muscle]).join(', ');
  return (
    <span className="block min-w-0">
      <span className="flex items-center gap-1.5 font-medium">
        <span className="truncate">{exercise.name}</span>
        {exercise.source === 'user' && <Badge>Eigene</Badge>}
        {exercise.hiddenAt !== null && <Badge>Ausgeblendet</Badge>}
      </span>
      <span className="block truncate text-sm text-muted">
        {EQUIPMENT_LABELS[exercise.equipment]}
        {muscles && ` · ${muscles}`}
      </span>
    </span>
  );
}

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="shrink-0 rounded-full bg-subtle px-2 py-0.5 text-xs font-medium text-muted">
      {children}
    </span>
  );
}
