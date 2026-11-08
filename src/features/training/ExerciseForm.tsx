import { useState, type FormEvent } from 'react';
import { inputField, primaryButton, secondaryButton } from '../../components/buttons';
import { Switch } from '../../components/Switch';
import { Chip } from '../../components/Chip';
import { Card } from '../../components/Page';
import { SegmentedControl } from '../../components/SegmentedControl';
import { Select } from '../../components/Select';
import { exerciseInputSchema, type ExerciseInput } from '../../db/schemas';
import { EQUIPMENT, EXERCISE_CATEGORIES, MUSCLE_GROUPS, type MuscleGroup } from '../../db/types';
import { EQUIPMENT_LABELS, EXERCISE_CATEGORY_LABELS, MUSCLE_LABELS } from '../../domain/labels';

type FieldErrors = Partial<Record<keyof ExerciseInput, string>>;

interface ExerciseFormProps {
  initial: ExerciseInput;
  submitLabel: string;
  /** Speichern; Fehler (z. B. doppelter Name) werden im Formular angezeigt */
  onSubmit: (input: ExerciseInput) => Promise<void>;
  onCancel: () => void;
}

export function ExerciseForm({ initial, submitLabel, onSubmit, onCancel }: ExerciseFormProps) {
  const [input, setInput] = useState(initial);
  const [aliasText, setAliasText] = useState(initial.aliases.join(', '));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (changes: Partial<ExerciseInput>) =>
    setInput((current) => ({ ...current, ...changes }));

  const togglePrimary = (muscle: MuscleGroup) => {
    const selected = input.primaryMuscles.includes(muscle);
    set({
      primaryMuscles: selected
        ? input.primaryMuscles.filter((m) => m !== muscle)
        : [...input.primaryMuscles, muscle],
      secondaryMuscles: input.secondaryMuscles.filter((m) => m !== muscle),
    });
  };
  const toggleSecondary = (muscle: MuscleGroup) =>
    set({
      secondaryMuscles: input.secondaryMuscles.includes(muscle)
        ? input.secondaryMuscles.filter((m) => m !== muscle)
        : [...input.secondaryMuscles, muscle],
    });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const candidate = { ...input, aliases: aliasText.split(',') };
    const result = exerciseInputSchema.safeParse(candidate);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof ExerciseInput;
        fieldErrors[field] ??= issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setFormError(null);
    setBusy(true);
    try {
      await onSubmit(candidate);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : String(error));
      setBusy(false);
    }
  };

  return (
    <form noValidate onSubmit={(event) => void handleSubmit(event)}>
      <Card>
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="exercise-name" className="mb-1 block text-sm font-medium">
              Name
            </label>
            <input
              id="exercise-name"
              className={inputField}
              autoComplete="off"
              maxLength={80}
              value={input.name}
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={errors.name ? 'exercise-name-error' : undefined}
              onChange={(event) => set({ name: event.target.value })}
            />
            <FieldError id="exercise-name-error" message={errors.name} />
          </div>
          <div>
            <p className="mb-1 text-sm font-medium">Kategorie</p>
            <SegmentedControl
              label="Kategorie"
              options={EXERCISE_CATEGORIES.map((value) => ({
                value,
                label: EXERCISE_CATEGORY_LABELS[value],
              }))}
              value={input.category}
              onChange={(category) => set({ category })}
            />
          </div>
          <Select
            label="Equipment"
            value={input.equipment}
            options={EQUIPMENT}
            labels={EQUIPMENT_LABELS}
            onChange={(equipment) => equipment && set({ equipment })}
          />
          <Switch
            label="Einseitig (pro Arm/Bein)"
            checked={input.isUnilateral}
            onChange={(isUnilateral) => set({ isUnilateral })}
          />
          <div>
            <p className="mb-1 text-sm font-medium">Erfassung</p>
            <SegmentedControl
              label="Erfassung"
              options={[
                { value: 'reps', label: 'Wiederholungen' },
                { value: 'time', label: 'Dauer' },
              ]}
              value={input.isTimed ? 'time' : 'reps'}
              onChange={(value) => set({ isTimed: value === 'time' })}
            />
          </div>
        </div>
      </Card>

      <Card title="Hauptmuskeln">
        <MuscleChips
          label="Hauptmuskeln"
          selected={input.primaryMuscles}
          onToggle={togglePrimary}
        />
        <FieldError message={errors.primaryMuscles} />
      </Card>
      <Card title="Hilfsmuskeln">
        <MuscleChips
          label="Hilfsmuskeln"
          selected={input.secondaryMuscles}
          disabled={input.primaryMuscles}
          onToggle={toggleSecondary}
        />
        <FieldError message={errors.secondaryMuscles} />
      </Card>

      <Card>
        <label htmlFor="exercise-aliases" className="mb-1 block text-sm font-medium">
          Weitere Namen (optional, mit Komma getrennt)
        </label>
        <input
          id="exercise-aliases"
          className={inputField}
          autoComplete="off"
          value={aliasText}
          onChange={(event) => setAliasText(event.target.value)}
        />
      </Card>

      {formError && (
        <p role="alert" className="mb-3 text-sm text-danger">
          {formError}
        </p>
      )}
      <div className="mb-4 flex gap-2">
        <button type="button" className={secondaryButton} disabled={busy} onClick={onCancel}>
          Abbrechen
        </button>
        <button type="submit" className={primaryButton} disabled={busy}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function MuscleChips({
  label,
  selected,
  disabled = [],
  onToggle,
}: {
  label: string;
  selected: MuscleGroup[];
  disabled?: MuscleGroup[];
  onToggle: (muscle: MuscleGroup) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {MUSCLE_GROUPS.map((muscle) => (
        <Chip
          key={muscle}
          pressed={selected.includes(muscle)}
          disabled={disabled.includes(muscle)}
          onClick={() => onToggle(muscle)}
        >
          {MUSCLE_LABELS[muscle]}
        </Chip>
      ))}
    </div>
  );
}

function FieldError({ id, message }: { id?: string; message: string | undefined }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-sm text-danger">
      {message}
    </p>
  );
}
