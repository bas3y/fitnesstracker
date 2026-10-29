import { useState } from 'react';
import { dangerButton, secondaryButton } from '../../components/buttons';
import { Chip } from '../../components/Chip';
import { CheckIcon } from '../../components/icons';
import { Stepper } from '../../components/Stepper';
import { SegmentedControl } from '../../components/SegmentedControl';
import { LEVEL_EQUIPMENT, type LoadType, type WeightUnit, type WorkoutSet } from '../../db/types';
import {
  addSet,
  completeSet,
  deleteSet,
  removeWorkoutExercise,
  setWorkoutExerciseLoadType,
  uncompleteSet,
  updateSet,
  type WorkoutItem,
} from '../../db/workouts';
import { displayToKg, kgToDisplay, roundTo } from '../../domain/units';
import { formatSetSummary, formatWorkoutDate } from '../../domain/workout';
import { primeAudio } from './restAlarm';
import { useLastPerformance } from './useWorkouts';

export type WorkoutMode = 'live' | 'edit';

interface WorkoutExerciseCardProps {
  item: WorkoutItem;
  /** `live` = laufendes Workout (abhaken + Pausen-Timer), `edit` = nachträglich bearbeiten */
  mode: WorkoutMode;
  unit: WeightUnit;
  restSeconds: number;
}

interface SetFormat {
  unit: WeightUnit;
  isTimed: boolean;
  isBodyweight: boolean;
  /** Umschalter Gewicht/Stufe anbieten (Maschinen, Kabelzug …) */
  canUseLevel: boolean;
  loadType: LoadType;
}

export function WorkoutExerciseCard({ item, mode, unit, restSeconds }: WorkoutExerciseCardProps) {
  const { workoutExercise, exercise, sets } = item;
  const name = exercise?.name ?? 'Unbekannte Übung';
  const format: SetFormat = {
    unit,
    isTimed: exercise?.isTimed ?? false,
    isBodyweight: exercise?.equipment === 'bodyweight',
    canUseLevel: !!exercise && LEVEL_EQUIPMENT.includes(exercise.equipment),
    loadType: exercise?.loadType ?? 'weight',
  };
  // 'auto' = im laufenden Workout den ersten offenen Satz aufklappen
  const [expanded, setExpanded] = useState<string | null | 'auto'>(mode === 'live' ? 'auto' : null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const expandedId =
    expanded === 'auto' ? (sets.find((set) => set.completedAt === null)?.id ?? null) : expanded;

  const labels = setLabels(sets);
  const iconButton =
    'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg text-slate-600 active:bg-slate-100 disabled:opacity-30 dark:text-slate-300 dark:active:bg-slate-700';

  return (
    <section
      aria-label={name}
      className="mb-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800"
    >
      <div className="mb-1 flex items-start gap-1">
        <h2 className="mr-auto min-w-0 pt-2 text-lg leading-tight font-semibold">{name}</h2>
        <button
          type="button"
          className={iconButton}
          aria-label={`${name} entfernen`}
          onClick={() => setConfirmRemove(true)}
        >
          ✕
        </button>
      </div>

      {exercise && (
        <LastTime exerciseId={exercise.id} workoutId={workoutExercise.workoutId} format={format} />
      )}

      {confirmRemove && (
        <div className="my-3 rounded-xl border border-red-300 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/40">
          <p className="mb-3 text-sm font-medium">„{name}“ mit allen Sätzen entfernen?</p>
          <div className="flex gap-2">
            <button
              type="button"
              className={secondaryButton}
              onClick={() => setConfirmRemove(false)}
            >
              Abbrechen
            </button>
            <button
              type="button"
              className={dangerButton}
              onClick={() => void removeWorkoutExercise(workoutExercise.id)}
            >
              Entfernen
            </button>
          </div>
        </div>
      )}

      <ul aria-label={`Sätze ${name}`} className="mt-2 flex flex-col gap-2">
        {sets.map((set, setIndex) => (
          <SetRow
            key={set.id}
            set={set}
            label={labels[setIndex]!}
            format={format}
            mode={mode}
            expanded={expandedId === set.id}
            onToggle={() => setExpanded(expandedId === set.id ? null : set.id)}
            onComplete={async () => {
              primeAudio();
              await completeSet(set.id, restSeconds);
              setExpanded('auto');
            }}
          />
        ))}
      </ul>

      <button
        type="button"
        className={`${secondaryButton} mt-3`}
        onClick={async () => {
          const created = await addSet(workoutExercise.id);
          setExpanded(created.id);
        }}
      >
        + Satz
      </button>
    </section>
  );
}

/** „Satz 1“, „Satz 2“ … für Arbeitssätze, „Aufwärmsatz 1“ … für Aufwärmsätze */
function setLabels(sets: WorkoutSet[]) {
  let working = 0;
  let warmup = 0;
  return sets.map((set) =>
    set.isWarmup
      ? { short: 'A', long: `Aufwärmsatz ${++warmup}` }
      : { short: String(++working), long: `Satz ${working}` },
  );
}

function LastTime({
  exerciseId,
  workoutId,
  format,
}: {
  exerciseId: string;
  workoutId: string;
  format: SetFormat;
}) {
  const last = useLastPerformance(exerciseId, workoutId);
  if (last === undefined) return null;
  const working = last?.sets.filter((set) => !set.isWarmup) ?? [];
  return (
    <p className="text-sm text-slate-500 dark:text-slate-400">
      {last && working.length > 0 ? (
        <>
          Letztes Mal ({formatWorkoutDate(last.workout.startedAt)}):{' '}
          {working.map((set) => formatSetSummary(set, format)).join(' · ')}
        </>
      ) : (
        'Letztes Mal: noch nicht trainiert'
      )}
    </p>
  );
}

function SetRow({
  set,
  label,
  format,
  mode,
  expanded,
  onToggle,
  onComplete,
}: {
  set: WorkoutSet;
  label: { short: string; long: string };
  format: SetFormat;
  mode: WorkoutMode;
  expanded: boolean;
  onToggle: () => void;
  onComplete: () => Promise<void>;
}) {
  const done = set.completedAt !== null;
  return (
    <li
      className={`rounded-xl border ${
        expanded
          ? 'border-emerald-500 dark:border-emerald-600'
          : 'border-slate-200 dark:border-slate-700'
      } ${done && mode === 'live' ? 'bg-emerald-50 dark:bg-emerald-950/30' : ''}`}
    >
      <div className="flex items-center">
        <button
          type="button"
          aria-expanded={expanded}
          aria-label={`${label.long}: ${formatSetSummary(set, format)}`}
          className="flex min-h-12 flex-1 items-center gap-3 px-3 text-left"
          onClick={onToggle}
        >
          <span
            aria-hidden="true"
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
              set.isWarmup
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
            }`}
          >
            {label.short}
          </span>
          <span className="font-medium tabular-nums">{formatSetSummary(set, format)}</span>
        </button>
        {mode === 'live' && (
          <button
            type="button"
            aria-label={`${label.long} abhaken`}
            aria-pressed={done}
            className={`mr-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              done
                ? 'bg-emerald-600 text-white'
                : 'border border-slate-300 text-slate-400 dark:border-slate-600'
            }`}
            onClick={() => void (done ? uncompleteSet(set.id) : onComplete())}
          >
            <CheckIcon className="h-6 w-6" />
          </button>
        )}
      </div>
      {expanded && <SetEditor set={set} format={format} mode={mode} onComplete={onComplete} />}
    </li>
  );
}

function SetEditor({
  set,
  format,
  mode,
  onComplete,
}: {
  set: WorkoutSet;
  format: SetFormat;
  mode: WorkoutMode;
  onComplete: () => Promise<void>;
}) {
  const { unit, isTimed, isBodyweight, canUseLevel } = format;
  const [showExtras, setShowExtras] = useState(set.rpe !== null || set.rir !== null);
  const weight = set.weight === null ? null : roundTo(kgToDisplay(set.weight, unit), 2);
  const save = (changes: Parameters<typeof updateSet>[1]) => void updateSet(set.id, changes);
  const byLevel =
    canUseLevel && (set.level !== null || (set.weight === null && format.loadType === 'level'));

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 p-3 dark:border-slate-700">
      {canUseLevel && (
        <SegmentedControl
          label="Belastung"
          options={[
            { value: 'weight', label: 'Gewicht' },
            { value: 'level', label: 'Stufe' },
          ]}
          value={byLevel ? 'level' : 'weight'}
          onChange={async (loadType) => {
            await setWorkoutExerciseLoadType(set.workoutExerciseId, loadType);
            save(loadType === 'level' ? { weight: null } : { level: null });
          }}
        />
      )}
      {byLevel ? (
        <Stepper
          label="Stufe"
          value={set.level}
          step={1}
          max={100}
          startValue={5}
          allowEmpty
          onChange={(level) => save({ level })}
        />
      ) : (
        <Stepper
          label={isBodyweight ? 'Zusatzgewicht' : 'Gewicht'}
          value={weight}
          unit={unit}
          step={unit === 'kg' ? 2.5 : 5}
          decimals={2}
          min={isBodyweight ? (unit === 'kg' ? -200 : -440) : 0}
          max={unit === 'kg' ? 1000 : 2200}
          startValue={isBodyweight ? 0 : unit === 'kg' ? 20 : 45}
          allowEmpty
          onChange={(value) => save({ weight: value === null ? null : displayToKg(value, unit) })}
        />
      )}
      {isBodyweight && (
        <p className="-mt-2 text-xs text-slate-500 dark:text-slate-400">
          Negativ = Unterstützung (Band, Maschine)
        </p>
      )}
      {isTimed ? (
        <Stepper
          label="Dauer"
          value={set.durationSeconds}
          unit="s"
          step={5}
          decimals={0}
          max={24 * 3600}
          startValue={30}
          allowEmpty
          onChange={(durationSeconds) => save({ durationSeconds })}
        />
      ) : (
        <Stepper
          label="Wiederholungen"
          value={set.reps}
          step={1}
          decimals={0}
          max={1000}
          startValue={8}
          allowEmpty
          onChange={(reps) => save({ reps })}
        />
      )}
      <div className="flex flex-wrap gap-2">
        <Chip pressed={set.isWarmup} onClick={() => save({ isWarmup: !set.isWarmup })}>
          Aufwärmsatz
        </Chip>
        <Chip
          pressed={showExtras}
          aria-expanded={showExtras}
          onClick={() => setShowExtras(!showExtras)}
        >
          RPE/RIR
        </Chip>
        <button
          type="button"
          className="ml-auto min-h-11 px-2 text-sm font-medium text-red-700 dark:text-red-400"
          onClick={() => void deleteSet(set.id)}
        >
          Satz löschen
        </button>
      </div>
      {showExtras && (
        <div className="grid grid-cols-1 gap-3">
          <Stepper
            label="RPE (Anstrengung 1–10)"
            value={set.rpe}
            step={0.5}
            min={1}
            max={10}
            startValue={8}
            allowEmpty
            onChange={(rpe) => save({ rpe })}
          />
          <Stepper
            label="RIR (Wdh. im Tank)"
            value={set.rir}
            step={1}
            decimals={0}
            max={10}
            startValue={2}
            allowEmpty
            onChange={(rir) => save({ rir })}
          />
        </div>
      )}
      {mode === 'live' && set.completedAt === null && (
        <button
          type="button"
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 font-semibold text-white active:bg-emerald-700"
          onClick={() => void onComplete()}
        >
          <CheckIcon className="h-5 w-5" />
          Satz abhaken
        </button>
      )}
    </div>
  );
}
