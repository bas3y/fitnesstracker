import { useState, type ReactNode } from 'react';
import { dangerButton, secondaryButton } from '../../components/buttons';
import { Chip } from '../../components/Chip';
import { CheckIcon, TrophyIcon } from '../../components/icons';
import { Stepper } from '../../components/Stepper';
import { SegmentedControl } from '../../components/SegmentedControl';
import { showToast } from '../../components/toastStore';
import { getSetRecords } from '../../db/records';
import {
  LEVEL_EQUIPMENT,
  type Exercise,
  type LoadType,
  type WeightUnit,
  type WorkoutSet,
} from '../../db/types';
import {
  addSet,
  applyToOpenSets,
  completeSet,
  deleteSet,
  removeWorkoutExercise,
  replaceWorkoutExercise,
  setWorkoutExerciseLoadType,
  skipWorkoutExercise,
  uncompleteSet,
  updateSet,
  type WorkoutExerciseTargets,
  type WorkoutItem,
} from '../../db/workouts';
import { suggestAlternatives } from '../../domain/exercises';
import { formatRepRange } from '../../domain/plans';
import {
  DEFAULT_REP_RANGE,
  formatRecord,
  progressionWeightStepKg,
  suggestProgression,
  type PersonalRecord,
  type RepRange,
} from '../../domain/strength';
import { displayToKg, kgToDisplay, roundTo } from '../../domain/units';
import { formatClock, formatSetSummary, formatWorkoutDate } from '../../domain/workout';
import { ExercisePicker } from './ExercisePicker';
import { primeAudio } from './restAlarm';
import { useActiveExercises } from './useExercises';
import { useLastPerformance } from './useWorkouts';

export type WorkoutMode = 'live' | 'edit';

interface WorkoutExerciseCardProps {
  item: WorkoutItem;
  /** `live` = laufendes Workout (abhaken + Pausen-Timer), `edit` = nachträglich bearbeiten */
  mode: WorkoutMode;
  unit: WeightUnit;
  /** `0` = kein Pausen-Timer */
  restSeconds: number;
  /** Rekorde je Satz-ID */
  records: Map<string, PersonalRecord[]> | undefined;
  /** Übungen, die sonst im Workout vorkommen (nicht als Alternative vorschlagen) */
  otherExerciseIds: string[];
  /** Griff zum Umsortieren */
  handle: ReactNode;
}

interface SetFormat {
  unit: WeightUnit;
  isTimed: boolean;
  isBodyweight: boolean;
  /** Umschalter Gewicht/Stufe anbieten (Maschinen, Kabelzug …) */
  canUseLevel: boolean;
  loadType: LoadType;
}

export function WorkoutExerciseCard({
  item,
  mode,
  unit,
  restSeconds,
  records,
  otherExerciseIds,
  handle,
}: WorkoutExerciseCardProps) {
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
  const [replacing, setReplacing] = useState(false);
  const canSwap = mode === 'live' && sets.some((set) => set.completedAt === null);
  const target = formatTarget(workoutExercise, format.isTimed, restSeconds > 0);
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
      <div className="-ml-3 flex items-center gap-1">
        {handle}
        <h2 className="mr-auto min-w-0 text-lg leading-tight font-semibold">{name}</h2>
        <button
          type="button"
          className={iconButton}
          aria-label={`${name} entfernen`}
          onClick={() => setConfirmRemove(true)}
        >
          ✕
        </button>
      </div>

      {target && <p className="text-sm text-slate-500 dark:text-slate-400">{target}</p>}
      {exercise?.category === 'cardio' && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Tipp: Mit Distanz, Pace und Puls erfasst du das unter Training → Ausdauer-Kacheln.
        </p>
      )}

      {exercise && (
        <LastTime
          exerciseId={exercise.id}
          workoutId={workoutExercise.workoutId}
          workoutExerciseId={workoutExercise.id}
          format={format}
          mode={mode}
          range={
            workoutExercise.repMin !== null && workoutExercise.repMax !== null
              ? { min: workoutExercise.repMin, max: workoutExercise.repMax }
              : DEFAULT_REP_RANGE
          }
        />
      )}

      {canSwap && (
        <div className="mt-1 flex gap-4">
          <button
            type="button"
            className="min-h-11 text-sm font-medium text-emerald-700 dark:text-emerald-400"
            onClick={() => setReplacing(true)}
          >
            Ersetzen
          </button>
          <button
            type="button"
            className="min-h-11 text-sm font-medium text-emerald-700 dark:text-emerald-400"
            onClick={() => void skipWorkoutExercise(workoutExercise.id)}
          >
            Überspringen
          </button>
        </div>
      )}

      {replacing && exercise && (
        <ReplaceExercisePicker
          exercise={exercise}
          excludeIds={otherExerciseIds}
          onClose={() => setReplacing(false)}
          onSelect={async (replacement) => {
            setReplacing(false);
            await replaceWorkoutExercise(workoutExercise.id, replacement.id);
          }}
        />
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
            isRecord={!!records?.has(set.id)}
            expanded={expandedId === set.id}
            onToggle={() => setExpanded(expandedId === set.id ? null : set.id)}
            onComplete={async () => {
              primeAudio();
              await completeSet(set.id, restSeconds);
              setExpanded('auto');
              const found = await getSetRecords(set.id);
              if (found.length > 0) {
                showToast({
                  title: `Neuer Rekord: ${name}`,
                  lines: found.map((record) => {
                    const { label, value } = formatRecord(record, format);
                    return `${label}: ${value}`;
                  }),
                });
              }
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

/** Planziel und eigene Pausenzeit, z. B. „Ziel: 8–12 Wdh. · Pause 1:30“; `null` ohne Plan */
function formatTarget(
  { repMin, repMax, targetDurationSeconds, restSeconds }: WorkoutExerciseTargets,
  isTimed: boolean,
  showRest: boolean,
): string | null {
  const parts: string[] = [];
  if (isTimed && targetDurationSeconds !== null) {
    parts.push(`Ziel: ${formatClock(targetDurationSeconds)}`);
  } else if (!isTimed && repMin !== null && repMax !== null) {
    parts.push(`Ziel: ${formatRepRange({ repMin, repMax })} Wdh.`);
  }
  if (showRest && restSeconds !== null) parts.push(`Pause ${formatClock(restSeconds)}`);
  return parts.length > 0 ? parts.join(' · ') : null;
}

function ReplaceExercisePicker({
  exercise,
  excludeIds,
  onSelect,
  onClose,
}: {
  exercise: Exercise;
  excludeIds: string[];
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}) {
  const exercises = useActiveExercises();
  return (
    <ExercisePicker
      title={`${exercise.name} ersetzen`}
      suggestions={suggestAlternatives(exercise, exercises ?? [], { excludeIds })}
      onSelect={onSelect}
      onClose={onClose}
    />
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
  workoutExerciseId,
  format,
  mode,
  range,
}: {
  exerciseId: string;
  workoutId: string;
  workoutExerciseId: string;
  format: SetFormat;
  mode: WorkoutMode;
  range: RepRange;
}) {
  const last = useLastPerformance(exerciseId, workoutId);
  if (last === undefined) return null;
  const working = last?.sets.filter((set) => !set.isWarmup) ?? [];
  const suggestion =
    mode === 'live'
      ? suggestProgression(working, {
          isTimed: format.isTimed,
          isBodyweight: format.isBodyweight,
          range,
          weightStepKg: progressionWeightStepKg(format.unit),
        })
      : null;
  return (
    <>
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
      {suggestion && (
        <div className="mt-1 flex items-center gap-2 text-sm">
          <p className="mr-auto text-emerald-800 dark:text-emerald-300">
            Vorschlag:{' '}
            <span className="font-semibold">
              {formatSetSummary(
                {
                  ...suggestion,
                  eccentricWeight: null,
                  eccentricLevel: null,
                  rpe: null,
                  rir: null,
                },
                format,
              )}
            </span>{' '}
            ({PROGRESSION_HINTS[suggestion.kind]})
          </p>
          <button
            type="button"
            aria-label="Vorschlag übernehmen"
            className="min-h-11 shrink-0 px-2 font-medium text-emerald-700 dark:text-emerald-400"
            onClick={() => {
              const { weight, level, reps, durationSeconds } = suggestion;
              void applyToOpenSets(
                workoutExerciseId,
                format.isTimed ? { weight, level, durationSeconds } : { weight, level, reps },
              );
            }}
          >
            Übernehmen
          </button>
        </div>
      )}
    </>
  );
}

const PROGRESSION_HINTS = {
  increaseLoad: 'mehr Last',
  addReps: '+1 Wdh.',
  addTime: 'etwas länger',
} as const;

function SetRow({
  set,
  label,
  format,
  mode,
  isRecord,
  expanded,
  onToggle,
  onComplete,
}: {
  set: WorkoutSet;
  label: { short: string; long: string };
  format: SetFormat;
  mode: WorkoutMode;
  isRecord: boolean;
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
          aria-label={`${label.long}: ${formatSetSummary(set, format)}${isRecord ? ' (Rekord)' : ''}`}
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
          {isRecord && <TrophyIcon className="h-5 w-5 shrink-0 text-amber-500" />}
        </button>
        {mode === 'live' && (
          <button
            type="button"
            aria-label={`${label.long} abhaken`}
            aria-pressed={done}
            className={`mr-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              done
                ? 'bg-emerald-700 text-white'
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
  const hasEccentric = set.eccentricWeight !== null || set.eccentricLevel !== null;
  const [showEccentric, setShowEccentric] = useState(hasEccentric);
  const toDisplay = (kg: number | null) => (kg === null ? null : roundTo(kgToDisplay(kg, unit), 2));
  const weight = toDisplay(set.weight);
  const save = (changes: Parameters<typeof updateSet>[1]) => void updateSet(set.id, changes);
  const byLevel =
    canUseLevel && (set.level !== null || (set.weight === null && format.loadType === 'level'));
  const canUseEccentric = !isTimed && !isBodyweight;
  const weightStep = unit === 'kg' ? 2.5 : 5;

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
            save(
              loadType === 'level'
                ? { weight: null, eccentricWeight: null }
                : { level: null, eccentricLevel: null },
            );
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
          step={weightStep}
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
        {canUseEccentric && (
          <Chip
            pressed={showEccentric}
            aria-expanded={showEccentric}
            onClick={() => {
              // Ausschalten entfernt den Wert, sonst stünde er weiter in der Satzanzeige
              if (showEccentric && hasEccentric)
                save({ eccentricWeight: null, eccentricLevel: null });
              setShowEccentric(!showEccentric);
            }}
          >
            Exzentrik
          </Chip>
        )}
        <button
          type="button"
          className="ml-auto min-h-11 px-2 text-sm font-medium text-red-700 dark:text-red-400"
          onClick={() => void deleteSet(set.id)}
        >
          Satz löschen
        </button>
      </div>
      {canUseEccentric && showEccentric && (
        <div>
          {byLevel ? (
            <Stepper
              label="Negativ-Stufe"
              value={set.eccentricLevel}
              step={1}
              max={100}
              startValue={(set.level ?? 5) + 1}
              allowEmpty
              onChange={(eccentricLevel) => save({ eccentricLevel })}
            />
          ) : (
            <Stepper
              label="Negativ-Gewicht"
              value={toDisplay(set.eccentricWeight)}
              unit={unit}
              step={weightStep}
              decimals={2}
              max={unit === 'kg' ? 1000 : 2200}
              startValue={(weight ?? 0) + weightStep}
              allowEmpty
              onChange={(value) =>
                save({ eccentricWeight: value === null ? null : displayToKg(value, unit) })
              }
            />
          )}
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Last in der negativen Phase, falls die Maschine dort mehr gibt
          </p>
        </div>
      )}
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
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 font-semibold text-white active:bg-emerald-800"
          onClick={() => void onComplete()}
        >
          <CheckIcon className="h-5 w-5" />
          Satz abhaken
        </button>
      )}
    </div>
  );
}
