import { useId, useState, type FormEvent } from 'react';
import { inputField, primaryButton, secondaryButton } from '../../components/buttons';
import { Chip } from '../../components/Chip';
import { Card } from '../../components/Page';
import { SegmentedControl } from '../../components/SegmentedControl';
import { Stepper } from '../../components/Stepper';
import { habitInputSchema, MAX_HABIT_TIMES_PER_WEEK, type HabitInput } from '../../db/schemas';
import { HABIT_FREQUENCIES, HABIT_GROUPS } from '../../db/types';
import { HABIT_FREQUENCY_LABELS, HABIT_GROUP_LABELS, HABIT_ICONS } from '../../domain/habits';
import { WEEKDAYS } from '../../domain/plans';

const LABEL = 'mb-1 block text-sm font-medium';

export function HabitForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: HabitInput;
  submitLabel: string;
  onSubmit: (input: HabitInput) => Promise<void>;
  onCancel: () => void;
}) {
  const nameId = useId();
  const [input, setInput] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const change = (changes: Partial<HabitInput>) => {
    setInput({ ...input, ...changes });
    setError(null);
  };
  const toggleWeekday = (weekday: number) =>
    change({
      weekdays: input.weekdays.includes(weekday)
        ? input.weekdays.filter((value) => value !== weekday)
        : [...input.weekdays, weekday],
    });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const result = habitInputSchema.safeParse(input);
    if (result.success) await onSubmit(result.data);
    else setError(result.error.issues[0]?.message ?? 'Eingabe prüfen');
  };

  return (
    <form onSubmit={(event) => void submit(event)}>
      <Card>
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor={nameId} className={LABEL}>
              Name
            </label>
            <input
              id={nameId}
              className={inputField}
              maxLength={80}
              value={input.name}
              onChange={(event) => change({ name: event.target.value })}
            />
          </div>

          <div role="group" aria-label="Symbol">
            <p className={LABEL}>Symbol</p>
            <div className="flex flex-wrap gap-1">
              {HABIT_ICONS.map((icon) => (
                <Chip
                  key={icon}
                  pressed={input.icon === icon}
                  className="px-3 text-lg"
                  aria-label={`Symbol ${icon}`}
                  onClick={() => change({ icon })}
                >
                  {icon}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <p className={LABEL}>Gruppe</p>
            <SegmentedControl
              label="Gruppe"
              options={HABIT_GROUPS.map((value) => ({
                value,
                label: HABIT_GROUP_LABELS[value],
              }))}
              value={input.group}
              onChange={(group) => change({ group })}
            />
          </div>

          <div>
            <p className={LABEL}>Häufigkeit</p>
            <SegmentedControl
              label="Häufigkeit"
              options={HABIT_FREQUENCIES.map((value) => ({
                value,
                label: HABIT_FREQUENCY_LABELS[value],
              }))}
              value={input.frequency}
              onChange={(frequency) => change({ frequency })}
            />
          </div>

          {input.frequency === 'weekly' && (
            <Stepper
              label="Mal pro Woche"
              value={input.timesPerWeek}
              step={1}
              min={1}
              max={MAX_HABIT_TIMES_PER_WEEK}
              decimals={0}
              onChange={(value) => value !== null && change({ timesPerWeek: value })}
            />
          )}
          {input.frequency === 'weekdays' && (
            <div role="group" aria-label="Wochentage">
              <p className={LABEL}>Wochentage</p>
              <div className="flex flex-wrap gap-1">
                {WEEKDAYS.map(({ value, label }) => (
                  <Chip
                    key={value}
                    pressed={input.weekdays.includes(value)}
                    className="px-3"
                    onClick={() => toggleWeekday(value)}
                  >
                    {label}
                  </Chip>
                ))}
              </div>
            </div>
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
    </form>
  );
}
