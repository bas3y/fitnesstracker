import { useId, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { dangerButton, inputField, primaryButton, secondaryButton } from '../../components/buttons';
import { Chip } from '../../components/Chip';
import { DurationInput } from '../../components/DurationInput';
import { IconPicker } from '../../components/IconPicker';
import { ChevronRightIcon, Icon } from '../../components/icons';
import { Card } from '../../components/Page';
import { SegmentedControl } from '../../components/SegmentedControl';
import { Select } from '../../components/Select';
import { Stepper } from '../../components/Stepper';
import {
  DISTANCE_SPORTS,
  MAX_GOAL_MIN_REPS,
  MAX_GOAL_UNIT_LENGTH,
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
import { formatDecimal } from '../../domain/format';
import {
  HABIT_GOAL_METRIC_LABELS,
  formatGoalDate,
  formatGoalValue,
  goalProgress,
  goalTitle,
  habitMetricsFor,
  hasPeriod,
  strengthMetricLabel,
  strengthMetricsFor,
  type GoalData,
  type GoalHabit,
  type GoalProgress,
  type GoalSubject,
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
import { formatWorkoutDuration } from '../../domain/workout';
import { HABITS_PATH } from '../daily/useHabits';
import { ExercisePicker } from '../training/ExercisePicker';

const LABEL = 'mb-1 block text-sm font-medium';
const HINT = 'text-sm text-muted';

const PERIOD_OPTIONS: { value: GoalPeriod; label: string }[] = GOAL_PERIODS.map((period) => ({
  value: period,
  label: { week: 'Woche', month: 'Monat', year: 'Jahr', custom: 'Eigener' }[period],
}));
const SPORT_NAMES = Object.fromEntries(
  ENDURANCE_SPORTS.map((sport) => [sport, ENDURANCE_SPORT_LABELS[sport].name]),
) as Record<EnduranceSport, string>;

/** Vorschläge für eigene Ziele */

/** Tage je Zeitraum für Vorschläge */
const PERIOD_DAYS: Record<GoalPeriod, number> = { week: 7, month: 30, year: 365, custom: 30 };

const isLimitInput = (input: GoalInput) => input.kind === 'habit' && input.habitMetric === 'limit';

/** Für Vorschau und „Bisher“: Eingabe als Ziel, falls sie schon vollständig genug ist */
function previewGoal(input: GoalInput): Goal | null {
  const target = input.target || (isLimitInput(input) ? 0 : 1);
  const result = goalInputSchema.safeParse({ ...input, target, title: input.title || 'Vorschau' });
  if (!result.success) return null;
  return {
    ...result.data,
    title: input.title,
    id: 'preview',
    createdAt: '',
    updatedAt: '',
    deletedAt: null,
  };
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
  goalId,
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
  /** Beim Bearbeiten: für den bisher eingetragenen Fortschritt eigener Ziele */
  goalId?: string;
}) {
  const titleId = useId();
  const deadlineId = useId();
  const unitId = useId();
  const [input, setInput] = useState(initial);
  const [exercise, setExercise] = useState(initialExercise);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const units = settings;
  const change = (changes: Partial<GoalInput>) => {
    setInput((current) => ({ ...current, ...changes }));
    setError(null);
  };

  const selectableHabits = data.habits
    .map(({ habit }) => habit)
    .filter((habit) => habit.archivedAt === null || habit.id === input.habitId);
  const habit = data.habits.find((item) => item.habit.id === input.habitId)?.habit ?? null;
  const subject: GoalSubject = { exercise, habit };

  const habitDefaults = (selected: GoalHabit | null): Partial<GoalInput> => ({
    habitId: selected?.id ?? null,
    habitMetric: selected ? habitMetricsFor(selected.kind)[0]! : null,
    target: 0,
  });

  const changeKind = (kind: GoalKind) => {
    if (kind === input.kind) return;
    const firstHabit = selectableHabits.find((item) => item.archivedAt === null) ?? null;
    setInput({
      ...emptyGoalInput(kind, input.startDate),
      title: input.title,
      deadline: input.deadline,
      startValue: kind === 'bodyWeight' ? settings.bodyWeightKg : null,
      exerciseId: kind === 'strength' ? (exercise?.id ?? null) : null,
      strengthMetric: kind === 'strength' && exercise ? strengthMetricsFor(exercise)[0]! : null,
      ...(kind === 'habit' ? habitDefaults(firstHabit) : {}),
    });
    setError(null);
  };

  const preview = useMemo(() => previewGoal(input), [input]);
  const progress = useMemo(
    () => (preview ? goalProgress({ ...preview, id: goalId ?? 'preview' }, data, today) : null),
    [preview, data, today, goalId],
  );
  const isBodyweight = exercise?.equipment === 'bodyweight';
  const autoTitle =
    preview && (input.target > 0 || isLimitInput(input)) ? goalTitle(preview, subject, units) : '';

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

  const periodFields = (
    <PeriodFields input={input} today={today} onChange={change} deadlineId={deadlineId} />
  );

  return (
    <form onSubmit={(event) => void submit(event)}>
      <Card>
        <div className="flex flex-col gap-3">
          <div role="group" aria-label="Art des Ziels" className="grid grid-cols-3 gap-2">
            {GOAL_KINDS.map((kind) => (
              <button
                key={kind}
                type="button"
                aria-pressed={input.kind === kind}
                className={`flex min-h-14 flex-col items-center justify-center rounded-xl border-2 px-1 py-1 text-sm font-semibold ${
                  input.kind === kind
                    ? 'border-primary bg-primary-soft text-primary-text'
                    : 'border-line'
                }`}
                onClick={() => changeKind(kind)}
              >
                <Icon name={GOAL_KIND_LABELS[kind].icon} className="mb-0.5 h-5 w-5" />
                {GOAL_KIND_LABELS[kind].name}
              </button>
            ))}
          </div>
          <p className={HINT}>{GOAL_KIND_LABELS[input.kind].hint}</p>
        </div>
      </Card>

      {input.kind === 'strength' && (
        <Card title="Übung">
          <div className="flex flex-col gap-4">
            <button
              type="button"
              className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-line-strong px-4 text-left font-semibold"
              onClick={() => setPicking(true)}
            >
              <span className="truncate">{exercise?.name ?? 'Übung wählen'}</span>
              <ChevronRightIcon className="h-4 w-4" />
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
                label: ENDURANCE_SPORT_LABELS[sport].name,
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
            {periodFields}
            <TotalTarget input={input} units={units} onChange={(target) => change({ target })} />
            <DailyGoalHint input={input} settings={settings} />
          </div>
        </Card>
      )}

      {input.kind === 'habit' && (
        <Card title="Gewohnheit">
          {selectableHabits.length === 0 ? (
            <p className={HINT}>
              Noch keine Gewohnheiten.{' '}
              <Link to={HABITS_PATH} className="font-semibold text-primary-text underline">
                Gewohnheit anlegen
              </Link>
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              <Select
                label="Gewohnheit"
                value={input.habitId ?? null}
                options={selectableHabits.map((item) => item.id)}
                labels={Object.fromEntries(selectableHabits.map((item) => [item.id, item.name]))}
                emptyLabel="Bitte wählen"
                onChange={(habitId) =>
                  change(
                    habitDefaults(selectableHabits.find((item) => item.id === habitId) ?? null),
                  )
                }
              />
              {habit && habitMetricsFor(habit.kind).length > 1 && (
                <SegmentedControl
                  label="Kennzahl"
                  options={habitMetricsFor(habit.kind).map((metric) => ({
                    value: metric,
                    label: HABIT_GOAL_METRIC_LABELS[metric],
                  }))}
                  value={input.habitMetric ?? habitMetricsFor(habit.kind)[0]!}
                  onChange={(habitMetric) =>
                    change({
                      habitMetric,
                      target: 0,
                      period: habitMetric === 'streak' ? null : (input.period ?? 'month'),
                    })
                  }
                />
              )}
              {habit && <p className={HINT}>{habitMetricHint(input, habit)}</p>}
              {habit && input.habitMetric !== 'streak' && periodFields}
              {habit && (
                <HabitTarget
                  input={input}
                  habit={habit}
                  onChange={(target) => change({ target })}
                />
              )}
            </div>
          )}
        </Card>
      )}

      {input.kind === 'custom' && (
        <Card title="Eigenes Ziel">
          <div className="flex flex-col gap-4">
            <div>
              <label htmlFor={titleId} className={LABEL}>
                Name
              </label>
              <input
                id={titleId}
                className={inputField}
                maxLength={80}
                placeholder="z. B. Spanisch lernen"
                value={input.title}
                onChange={(event) => change({ title: event.target.value })}
              />
            </div>
            <IconPicker
              value={input.icon ?? ''}
              optional
              fallback={GOAL_KIND_LABELS.custom.icon}
              onChange={(icon) => change({ icon })}
            />
            <SegmentedControl
              label="Form"
              options={[
                { value: 'number' as const, label: 'Mit Zahl' },
                { value: 'check' as const, label: 'Ja/Nein' },
              ]}
              value={input.customType ?? 'number'}
              onChange={(customType) => change({ customType, target: 0 })}
            />
            {input.customType === 'check' ? (
              <p className={HINT}>
                Wird auf der Ziele-Seite und im Widget abgehakt, z. B. „Führerschein machen“.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-[1fr_7rem] items-end gap-2">
                  <Stepper
                    label="Ziel"
                    value={input.target || null}
                    step={1}
                    min={0.01}
                    max={1_000_000}
                    decimals={2}
                    startValue={10}
                    allowEmpty
                    onChange={(target) => change({ target: target ?? 0 })}
                  />
                  <div>
                    <label htmlFor={unitId} className={LABEL}>
                      Einheit
                    </label>
                    <input
                      id={unitId}
                      className={inputField}
                      maxLength={MAX_GOAL_UNIT_LENGTH}
                      placeholder="Lektionen"
                      value={input.unit ?? ''}
                      onChange={(event) => change({ unit: event.target.value })}
                    />
                  </div>
                </div>
                <p className={HINT}>
                  Fortschritt trägst du selbst ein (+1, beliebige Menge, Rückgängig).
                </p>
              </>
            )}
          </div>
        </Card>
      )}

      <Card>
        <div className="flex flex-col gap-4">
          {!hasPeriod({ kind: input.kind, habitMetric: input.habitMetric ?? null }) && (
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
          {input.kind !== 'custom' && (
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
          )}
          {progress && preview && (
            <CurrentHint
              goal={preview}
              progress={progress}
              units={units}
              subject={subject}
              hasTarget={input.target > 0}
            />
          )}
        </div>
      </Card>

      {error && (
        <p role="alert" className="mb-3 text-sm font-medium text-danger">
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

/** Zeitraum (Woche/Monat/Jahr wiederkehrend oder eigener mit Beginn und Ende) */
function PeriodFields({
  input,
  today,
  deadlineId,
  onChange,
}: {
  input: GoalInput;
  today: string;
  deadlineId: string;
  onChange: (changes: Partial<GoalInput>) => void;
}) {
  const startId = useId();
  return (
    <>
      <SegmentedControl
        label="Zeitraum"
        options={PERIOD_OPTIONS}
        value={input.period ?? 'month'}
        onChange={(period) =>
          onChange({
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
                event.target.value && onChange({ startDate: event.target.value })
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
              onChange={(event) => onChange({ deadline: event.target.value || null })}
            />
          </div>
        </div>
      )}
    </>
  );
}

function habitMetricHint(input: GoalInput, habit: GoalHabit): string {
  switch (input.habitMetric) {
    case 'amount':
      return `Zählt die Summe im Zeitraum${habit.unit ? ` (${habit.unit})` : ''}.`;
    case 'days':
      return 'Zählt die Tage, an denen die Gewohnheit erledigt war.';
    case 'streak':
      return 'Tage am Stück ohne Überschreiten des Tageslimits. Ein Rückfall setzt die Serie zurück.';
    case 'limit':
      return 'Höchstens so viel im Zeitraum – weniger ist besser. 0 = ganz ohne.';
    default:
      return '';
  }
}

function HabitTarget({
  input,
  habit,
  onChange,
}: {
  input: GoalInput;
  habit: GoalHabit;
  onChange: (target: number) => void;
}) {
  const days = PERIOD_DAYS[input.period ?? 'month'];
  switch (input.habitMetric) {
    case 'amount':
      return (
        <Stepper
          label="Ziel"
          value={input.target || null}
          unit={habit.unit || undefined}
          step={habit.step > 0 ? habit.step : 1}
          min={0.01}
          max={1_000_000}
          decimals={2}
          startValue={Math.round(habit.target * days)}
          allowEmpty
          onChange={(target) => onChange(target ?? 0)}
        />
      );
    case 'limit':
      return (
        <Stepper
          label="Höchstens"
          value={input.target}
          unit={habit.unit || undefined}
          step={habit.step > 0 ? habit.step : 1}
          min={0}
          max={1_000_000}
          decimals={2}
          startValue={Math.round(habit.target * days)}
          allowEmpty
          onChange={(target) => onChange(target ?? 0)}
        />
      );
    default:
      return (
        <Stepper
          label="Ziel"
          value={input.target || null}
          unit="Tage"
          step={1}
          min={1}
          max={10_000}
          decimals={0}
          startValue={
            input.habitMetric === 'streak' ? 30 : Math.min(days, input.period === 'week' ? 5 : 20)
          }
          allowEmpty
          onChange={(target) => onChange(target ?? 0)}
        />
      );
  }
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
  const days = PERIOD_DAYS[input.period ?? 'month'];
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
    case 'steps':
      return (
        <Stepper
          label="Ziel"
          value={value}
          unit="Schritte"
          step={10_000}
          min={1}
          max={100_000_000}
          decimals={0}
          startValue={Math.round((units.stepsGoal * days) / 10_000) * 10_000}
          allowEmpty
          onChange={(target) => onChange(target ?? 0)}
        />
      );
    case 'pages':
      return (
        <Stepper
          label="Ziel"
          value={value}
          unit="Seiten"
          step={100}
          min={1}
          max={10_000_000}
          decimals={0}
          startValue={input.period === 'week' ? 100 : input.period === 'year' ? 5000 : 500}
          allowEmpty
          onChange={(target) => onChange(target ?? 0)}
        />
      );
    case 'books':
      return (
        <Stepper
          label="Ziel"
          value={value}
          unit="Bücher"
          step={1}
          min={1}
          max={10_000}
          decimals={0}
          startValue={input.period === 'year' ? 12 : input.period === 'week' ? 1 : 2}
          allowEmpty
          onChange={(target) => onChange(target ?? 0)}
        />
      );
    case 'focusTime':
    case 'meditationTime':
      return (
        <Stepper
          label="Ziel"
          value={value === null ? null : Math.round(value / 60)}
          unit="min"
          step={input.period === 'week' ? 30 : 60}
          min={1}
          max={1_000_000}
          decimals={0}
          startValue={
            (input.totalMetric === 'focusTime' ? 120 : 30) *
            (input.period === 'week' ? 1 : input.period === 'year' ? 50 : 4)
          }
          allowEmpty
          onChange={(minutes) => onChange(minutes === null ? 0 : minutes * 60)}
        />
      );
    case 'stepsGoalDays':
    case 'waterGoalDays':
    case 'sleepGoalDays':
      return (
        <Stepper
          label="Ziel"
          value={value}
          unit="Tage"
          step={1}
          min={1}
          max={10_000}
          decimals={0}
          startValue={input.period === 'week' ? 5 : input.period === 'year' ? 250 : 20}
          allowEmpty
          onChange={(target) => onChange(target ?? 0)}
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

/** Welches Tagesziel zählt (aus den Einstellungen) */
function DailyGoalHint({ input, settings }: { input: GoalInput; settings: Settings }) {
  const goal =
    input.totalMetric === 'stepsGoalDays'
      ? `${formatDecimal(settings.stepsGoal, 0)} Schritte`
      : input.totalMetric === 'waterGoalDays'
        ? `${formatDecimal(settings.waterGoalMl / 1000, 2)} l Wasser`
        : input.totalMetric === 'sleepGoalDays'
          ? `${formatWorkoutDuration(settings.sleepGoalSeconds)} Schlaf`
          : null;
  if (input.totalMetric === 'steps') {
    return <p className={HINT}>Summe der Schritte aus dem Alltag (Körper).</p>;
  }
  if (input.totalMetric === 'pages') {
    return <p className={HINT}>Summe der eingetragenen Seiten aller Bücher (Alltag › Lesen).</p>;
  }
  if (input.totalMetric === 'books') {
    return <p className={HINT}>Zählt Bücher, die im Zeitraum als gelesen markiert wurden.</p>;
  }
  if (input.totalMetric === 'focusTime' || input.totalMetric === 'meditationTime') {
    return (
      <p className={HINT}>
        Summe der {input.totalMetric === 'focusTime' ? 'Fokus-Zeit' : 'Meditationszeit'} aus dem
        Timer (Alltag › Fokus & Meditation), ohne Pausen.
      </p>
    );
  }
  if (!goal) return null;
  return (
    <p className={HINT}>
      Zählt Tage mit mindestens {goal} (Tagesziel aus den Einstellungen; eine Änderung gilt auch
      rückwirkend).
    </p>
  );
}

/** Wo man gerade steht – hilft beim Wählen eines realistischen Ziels */
function CurrentHint({
  goal,
  progress,
  units,
  subject,
  hasTarget,
}: {
  goal: Goal;
  progress: GoalProgress;
  units: Settings;
  subject: GoalSubject;
  hasTarget: boolean;
}) {
  if (progress.current === null) return null;
  const format = (value: number) => formatGoalValue(goal, value, units, subject);
  const value = format(progress.current);
  let text: string;
  if (goal.kind === 'custom') {
    if (goal.customType === 'check' || progress.current === 0) return null;
    text = `Bisher eingetragen: ${value}`;
  } else if (goal.kind === 'habit' && goal.habitMetric === 'streak') {
    text = `Aktuelle Serie: ${value}${progress.best ? ` (beste: ${format(progress.best)})` : ''}`;
  } else if (hasPeriod(goal)) {
    text = `Im ${progress.recurring ? 'laufenden' : 'gewählten'} Zeitraum bisher: ${value}`;
  } else if (goal.kind === 'bodyWeight') {
    text = `Aktuelles Gewicht: ${value}`;
  } else {
    text = `Bisher bester Wert: ${value}`;
  }
  const reached =
    hasTarget && progress.achievedOn && !hasPeriod(goal) && goal.kind !== 'custom'
      ? ` (Ziel schon am ${formatGoalDate(progress.achievedOn)} erreicht)`
      : '';
  return (
    <p data-testid="goal-current" className={HINT}>
      {text}
      {reached}
    </p>
  );
}
