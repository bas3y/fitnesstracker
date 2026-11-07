import { useId, useMemo, useState, type FormEvent } from 'react';
import { dangerButton, inputField, primaryButton, secondaryButton } from '../../components/buttons';
import { Chip } from '../../components/Chip';
import { DurationInput } from '../../components/DurationInput';
import { Card } from '../../components/Page';
import { SegmentedControl } from '../../components/SegmentedControl';
import { Select } from '../../components/Select';
import { Stepper } from '../../components/Stepper';
import {
  DISTANCE_SPORTS,
  MAX_GOAL_MIN_REPS,
  emptyGoalInput,
  goalInputSchema,
  type GoalInput,
  type GoalValues,
} from '../../db/schemas';
import {
  ENDURANCE_SPORTS,
  GOAL_KINDS,
  GOAL_PERIODS,
  TOTAL_GOAL_METRICS,
  type EnduranceSport,
  type Exercise,
  type Goal,
  type GoalKind,
  type GoalPeriod,
  type Settings,
} from '../../db/types';
import { EFFORT_SPORTS, formatEffortDistance, sportEfforts } from '../../domain/enduranceStats';
import {
  formatGoalDate,
  formatGoalValue,
  goalProgress,
  goalTitle,
  strengthMetricLabel,
  strengthMetricsFor,
  type GoalData,
  type GoalProgress,
} from '../../domain/goals';
import {
  ENDURANCE_SPORT_LABELS,
  GOAL_KIND_LABELS,
  TOTAL_GOAL_METRIC_LABELS,
} from '../../domain/labels';
import {
  displayToKg,
  displayToMeters,
  kgToDisplay,
  metersToDisplay,
  roundTo,
} from '../../domain/units';
import { ExercisePicker } from '../training/ExercisePicker';

const LABEL = 'mb-1 block text-sm font-medium';
const HINT = 'text-sm text-slate-500 dark:text-slate-400';

const KIND_OPTIONS = GOAL_KINDS.map((kind) => ({
  value: kind,
  label: GOAL_KIND_LABELS[kind].name,
}));
const PERIOD_OPTIONS: { value: GoalPeriod; label: string }[] = GOAL_PERIODS.map((period) => ({
  value: period,
  label: { week: 'Woche', month: 'Monat', year: 'Jahr', custom: 'Eigener' }[period],
}));
const SPORT_NAMES = Object.fromEntries(
  ENDURANCE_SPORTS.map((sport) => [sport, ENDURANCE_SPORT_LABELS[sport].name]),
) as Record<EnduranceSport, string>;

/** Für Vorschau und „Bisher“: Eingabe als Ziel, falls sie schon vollständig genug ist */
function previewGoal(input: GoalInput): Goal | null {
  const result = goalInputSchema.safeParse({ ...input, target: input.target || 1 });
  if (!result.success) return null;
  return { ...result.data, id: 'preview', createdAt: '', updatedAt: '', deletedAt: null };
}

export function GoalForm({
  initial,
  initialExercise,
  settings,
  data,
  today,
  submitLabel,
  onSubmit,
  onCancel,
  onDelete,
}: {
  initial: GoalInput;
  initialExercise: Exercise | null;
  settings: Settings;
  data: GoalData;
  today: string;
  submitLabel: string;
  onSubmit: (values: GoalValues) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const titleId = useId();
  const deadlineId = useId();
  const startId = useId();
  const [input, setInput] = useState(initial);
  const [exercise, setExercise] = useState(initialExercise);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const units = settings;
  const change = (changes: Partial<GoalInput>) => {
    setInput((current) => ({ ...current, ...changes }));
    setError(null);
  };

  const changeKind = (kind: GoalKind) => {
    if (kind === input.kind) return;
    setInput({
      ...emptyGoalInput(kind, input.startDate),
      title: input.title,
      deadline: input.deadline,
      startValue: kind === 'bodyWeight' ? settings.bodyWeightKg : null,
      exerciseId: kind === 'strength' ? (exercise?.id ?? null) : null,
      strengthMetric: kind === 'strength' && exercise ? strengthMetricsFor(exercise)[0]! : null,
    });
    setError(null);
  };

  const preview = useMemo(() => previewGoal(input), [input]);
  const progress = useMemo(
    () => (preview ? goalProgress(preview, data, today) : null),
    [preview, data, today],
  );
  const isBodyweight = exercise?.equipment === 'bodyweight';
  const autoTitle = preview && input.target > 0 ? goalTitle(preview, exercise, units) : '';

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const result = goalInputSchema.safeParse(input);
    if (result.success) await onSubmit(result.data);
    else setError(result.error.issues[0]?.message ?? 'Eingabe prüfen');
  };

  const kgStepper = (label: string, value: number | null, onValue: (kg: number | null) => void) => (
    <Stepper
      label={label}
      value={
        value === null || value === 0 ? null : roundTo(kgToDisplay(value, units.weightUnit), 2)
      }
      unit={units.weightUnit}
      step={units.weightUnit === 'kg' ? 2.5 : 5}
      min={0.5}
      max={1000}
      decimals={2}
      startValue={
        progress?.current && input.kind === 'strength'
          ? roundTo(kgToDisplay(progress.current, units.weightUnit), 0)
          : roundTo(kgToDisplay(settings.bodyWeightKg ?? 80, units.weightUnit), 0)
      }
      allowEmpty
      onChange={(display) =>
        onValue(display === null ? null : displayToKg(display, units.weightUnit))
      }
    />
  );

  return (
    <form onSubmit={(event) => void submit(event)}>
      <Card>
        <div className="flex flex-col gap-3">
          <SegmentedControl
            label="Art des Ziels"
            options={KIND_OPTIONS}
            value={input.kind}
            onChange={changeKind}
          />
          <p className={HINT}>{GOAL_KIND_LABELS[input.kind].hint}</p>
        </div>
      </Card>

      {input.kind === 'strength' && (
        <Card title="Übung">
          <div className="flex flex-col gap-4">
            <button
              type="button"
              className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-slate-300 px-4 text-left font-semibold dark:border-slate-600"
              onClick={() => setPicking(true)}
            >
              <span className="truncate">{exercise?.name ?? 'Übung wählen'}</span>
              <span aria-hidden="true">›</span>
            </button>
            {exercise && strengthMetricsFor(exercise).length > 1 && (
              <SegmentedControl
                label="Kennzahl"
                options={strengthMetricsFor(exercise).map((metric) => ({
                  value: metric,
                  label: strengthMetricLabel(metric, isBodyweight),
                }))}
                value={input.strengthMetric ?? strengthMetricsFor(exercise)[0]!}
                onChange={(strengthMetric) => change({ strengthMetric, target: 0, minReps: null })}
              />
            )}
            {exercise && input.strengthMetric === 'duration' && (
              <DurationInput
                label="Zieldauer"
                value={input.target}
                onChange={(target) => change({ target })}
              />
            )}
            {exercise && input.strengthMetric === 'reps' && (
              <Stepper
                label="Ziel"
                value={input.target || null}
                unit="Wdh."
                step={1}
                min={1}
                max={1000}
                decimals={0}
                startValue={progress?.current ? progress.current + 1 : 10}
                allowEmpty
                onChange={(target) => change({ target: target ?? 0 })}
              />
            )}
            {exercise &&
              (input.strengthMetric === 'weight' || input.strengthMetric === 'oneRepMax') && (
                <>
                  {kgStepper(
                    input.strengthMetric === 'oneRepMax'
                      ? 'Ziel (1RM)'
                      : isBodyweight
                        ? 'Ziel (Zusatzgewicht)'
                        : 'Ziel',
                    input.target,
                    (target) => change({ target: target ?? 0 }),
                  )}
                  {input.strengthMetric === 'weight' && (
                    <Stepper
                      label="Wiederholungen je Satz (mindestens)"
                      value={input.minReps ?? null}
                      step={1}
                      min={1}
                      max={MAX_GOAL_MIN_REPS}
                      decimals={0}
                      startValue={5}
                      allowEmpty
                      onChange={(minReps) => change({ minReps })}
                    />
                  )}
                  {input.strengthMetric === 'oneRepMax' && (
                    <p className={HINT}>Geschätzt aus Sätzen mit 1–12 Wiederholungen.</p>
                  )}
                </>
              )}
          </div>
        </Card>
      )}

      {input.kind === 'effort' && (
        <Card title="Bestzeit">
          <div className="flex flex-col gap-4">
            <SegmentedControl
              label="Sportart"
              options={EFFORT_SPORTS.map((sport) => ({
                value: sport,
                label: `${ENDURANCE_SPORT_LABELS[sport].icon} ${ENDURANCE_SPORT_LABELS[sport].name}`,
              }))}
              value={input.sport ?? 'run'}
              onChange={(sport) => {
                const options = sportEfforts(sport);
                change({
                  sport,
                  effortMeters: options.includes(input.effortMeters ?? -1)
                    ? input.effortMeters
                    : (options[0] ?? null),
                });
              }}
            />
            <div>
              <span className={LABEL}>Strecke</span>
              <div role="group" aria-label="Strecke" className="flex flex-wrap gap-1">
                {sportEfforts(input.sport ?? 'run').map((meters) => (
                  <Chip
                    key={meters}
                    pressed={input.effortMeters === meters}
                    className="px-3"
                    onClick={() => change({ effortMeters: meters })}
                  >
                    {formatEffortDistance(meters)}
                  </Chip>
                ))}
              </div>
            </div>
            <DurationInput
              label="Zielzeit"
              value={input.target}
              onChange={(target) => change({ target })}
            />
            <p className={HINT}>
              Zählt die schnellste Zeit über die Strecke aus importierten Verläufen. Ohne Verlauf
              zählt eine Einheit ab dieser Strecke mit ihrer Ø-Pace.
            </p>
          </div>
        </Card>
      )}

      {input.kind === 'bodyWeight' && (
        <Card title="Gewicht">
          <div className="flex flex-col gap-4">
            {kgStepper('Startgewicht', input.startValue ?? null, (startValue) =>
              change({ startValue }),
            )}
            {kgStepper('Zielgewicht', input.target, (target) => change({ target: target ?? 0 }))}
            <p className={HINT}>
              Der Fortschritt kommt aus dem Gewicht im Alltag (Körper). Liegt das Ziel unter dem
              Start, geht es ums Abnehmen, sonst ums Zunehmen.
            </p>
          </div>
        </Card>
      )}

      {input.kind === 'total' && (
        <Card title="Menge">
          <div className="flex flex-col gap-4">
            <Select
              label="Was zählt"
              value={input.totalMetric ?? 'trainings'}
              options={TOTAL_GOAL_METRICS}
              labels={TOTAL_GOAL_METRIC_LABELS}
              onChange={(totalMetric) =>
                totalMetric && change({ totalMetric, target: 0, sport: null })
              }
            />
            {(input.totalMetric === 'distance' || input.totalMetric === 'duration') && (
              <Select
                label="Sportart"
                value={input.sport ?? null}
                options={input.totalMetric === 'distance' ? DISTANCE_SPORTS : ENDURANCE_SPORTS}
                labels={SPORT_NAMES}
                emptyLabel="Alle Sportarten"
                onChange={(sport) => change({ sport })}
              />
            )}
            <SegmentedControl
              label="Zeitraum"
              options={PERIOD_OPTIONS}
              value={input.period ?? 'month'}
              onChange={(period) =>
                change({
                  period,
                  startDate: period === 'custom' ? input.startDate : today,
                  deadline: period === 'custom' ? (input.deadline ?? null) : null,
                })
              }
            />
            {input.period === 'custom' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor={startId} className={LABEL}>
                    Beginn
                  </label>
                  <input
                    id={startId}
                    type="date"
                    className={inputField}
                    value={input.startDate}
                    onChange={(event) =>
                      event.target.value && change({ startDate: event.target.value })
                    }
                  />
                </div>
                <div>
                  <label htmlFor={deadlineId} className={LABEL}>
                    Ende
                  </label>
                  <input
                    id={deadlineId}
                    type="date"
                    className={inputField}
                    min={input.startDate}
                    value={input.deadline ?? ''}
                    onChange={(event) => change({ deadline: event.target.value || null })}
                  />
                </div>
              </div>
            )}
            <TotalTarget input={input} units={units} onChange={(target) => change({ target })} />
          </div>
        </Card>
      )}

      <Card>
        <div className="flex flex-col gap-4">
          {input.kind !== 'total' && (
            <div>
              <label htmlFor={deadlineId} className={LABEL}>
                Zieldatum (optional)
              </label>
              <input
                id={deadlineId}
                type="date"
                className={inputField}
                min={input.startDate}
                value={input.deadline ?? ''}
                onChange={(event) => change({ deadline: event.target.value || null })}
              />
            </div>
          )}
          <div>
            <label htmlFor={titleId} className={LABEL}>
              Name (optional)
            </label>
            <input
              id={titleId}
              className={inputField}
              maxLength={80}
              placeholder={autoTitle || 'Wird automatisch vergeben'}
              value={input.title}
              onChange={(event) => change({ title: event.target.value })}
            />
          </div>
          {progress && preview && (
            <CurrentHint
              goal={preview}
              progress={progress}
              units={units}
              isBodyweight={isBodyweight}
              hasTarget={input.target > 0}
            />
          )}
        </div>
      </Card>

      {error && (
        <p role="alert" className="mb-3 text-sm font-medium text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
      <div className="mb-4 flex gap-2">
        <button type="button" className={secondaryButton} onClick={onCancel}>
          Abbrechen
        </button>
        <button type="submit" className={primaryButton}>
          {submitLabel}
        </button>
      </div>
      {onDelete && (
        <button type="button" className={`${dangerButton} mb-4`} onClick={onDelete}>
          Ziel löschen
        </button>
      )}

      {picking && (
        <ExercisePicker
          onSelect={(selected) => {
            setExercise(selected);
            change({
              exerciseId: selected.id,
              strengthMetric: strengthMetricsFor(selected)[0]!,
              minReps: null,
              target: 0,
            });
            setPicking(false);
          }}
          onClose={() => setPicking(false)}
        />
      )}
    </form>
  );
}

function TotalTarget({
  input,
  units,
  onChange,
}: {
  input: GoalInput;
  units: Settings;
  onChange: (target: number) => void;
}) {
  const value = input.target || null;
  switch (input.totalMetric) {
    case 'distance': {
      if (input.sport === 'swim') {
        return (
          <Stepper
            label="Ziel"
            value={value}
            unit="m"
            step={1000}
            min={1}
            max={10_000_000}
            decimals={0}
            startValue={10_000}
            allowEmpty
            onChange={(target) => onChange(target ?? 0)}
          />
        );
      }
      const unit = units.distanceUnit;
      return (
        <Stepper
          label="Ziel"
          value={value === null ? null : roundTo(metersToDisplay(value, unit), 1)}
          unit={unit}
          step={10}
          min={1}
          max={100_000}
          decimals={1}
          startValue={100}
          allowEmpty
          onChange={(target) => onChange(target === null ? 0 : displayToMeters(target, unit))}
        />
      );
    }
    case 'duration':
      return (
        <Stepper
          label="Ziel"
          value={value === null ? null : roundTo(value / 3600, 1)}
          unit="h"
          step={1}
          min={0.5}
          max={10_000}
          decimals={1}
          startValue={10}
          allowEmpty
          onChange={(hours) => onChange(hours === null ? 0 : Math.round(hours * 3600))}
        />
      );
    default:
      return (
        <Stepper
          label="Ziel"
          value={value}
          unit={input.totalMetric === 'workouts' ? 'Krafttrainings' : 'Trainings'}
          step={1}
          min={1}
          max={10_000}
          decimals={0}
          startValue={input.period === 'week' ? 3 : input.period === 'year' ? 100 : 12}
          allowEmpty
          onChange={(target) => onChange(target ?? 0)}
        />
      );
  }
}

/** Wo man gerade steht – hilft beim Wählen eines realistischen Ziels */
function CurrentHint({
  goal,
  progress,
  units,
  isBodyweight,
  hasTarget,
}: {
  goal: Goal;
  progress: GoalProgress;
  units: Settings;
  isBodyweight: boolean;
  hasTarget: boolean;
}) {
  if (progress.current === null) return null;
  const value = formatGoalValue(goal, progress.current, units, isBodyweight);
  const text =
    goal.kind === 'total'
      ? `Im ${progress.recurring ? 'laufenden' : 'gewählten'} Zeitraum bisher: ${value}`
      : goal.kind === 'bodyWeight'
        ? `Aktuelles Gewicht: ${value}`
        : `Bisher bester Wert: ${value}`;
  const reached =
    hasTarget && progress.achievedOn && goal.kind !== 'total'
      ? ` (Ziel schon am ${formatGoalDate(progress.achievedOn)} erreicht)`
      : '';
  return (
    <p data-testid="goal-current" className={HINT}>
      {text}
      {reached}
    </p>
  );
}
