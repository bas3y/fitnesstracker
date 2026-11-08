import { useId, useState, type FormEvent } from 'react';
import { inputField, primaryButton, secondaryButton } from '../../components/buttons';
import { DeleteRowButton } from '../../components/DeleteRowButton';
import { Card } from '../../components/Page';
import { Select } from '../../components/Select';
import { Stepper } from '../../components/Stepper';
import {
  foodInputSchema,
  MAX_FOOD_GRAMS,
  MAX_FOOD_PORTIONS,
  type FoodInput,
  type FoodValues,
} from '../../db/schemas';
import { FOOD_CATEGORIES } from '../../db/types';
import { formatDecimal } from '../../domain/format';
import { FOOD_CATEGORY_LABELS } from '../../domain/labels';
import { estimateKcal } from '../../domain/nutrientCheck';

const LABEL = 'mb-1 block text-sm font-medium';
const HINT = 'text-sm text-muted';

type NutrientField = 'protein' | 'carbs' | 'sugar' | 'fat' | 'fiber' | 'alcohol';

const NUTRIENT_FIELDS: Array<{ field: NutrientField; label: string }> = [
  { field: 'protein', label: 'Protein' },
  { field: 'carbs', label: 'Kohlenhydrate' },
  { field: 'sugar', label: 'davon Zucker' },
  { field: 'fat', label: 'Fett' },
  { field: 'fiber', label: 'Ballaststoffe' },
  { field: 'alcohol', label: 'Alkohol' },
];

/** Eigenes Lebensmittel: Werte pro 100 g wie auf der Verpackung, dazu Portionen */
export function FoodForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: FoodInput;
  submitLabel: string;
  onSubmit: (input: FoodValues) => Promise<void>;
  onCancel: () => void;
}) {
  const nameId = useId();
  const barcodeId = useId();
  const [input, setInput] = useState<FoodInput>(initial);
  const [error, setError] = useState<string | null>(null);
  const change = (changes: Partial<FoodInput>) => {
    setInput({ ...input, ...changes });
    setError(null);
  };
  const changePortion = (index: number, changes: Partial<FoodInput['portions'][number]>) =>
    change({
      portions: input.portions.map((portion, i) =>
        i === index ? { ...portion, ...changes } : portion,
      ),
    });
  const estimated = Math.round(estimateKcal(input));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const result = foodInputSchema.safeParse(input);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Eingabe prüfen');
      return;
    }
    try {
      await onSubmit(result.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Speichern fehlgeschlagen');
    }
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
              placeholder="z. B. Proteinriegel Schoko"
              value={input.name}
              onChange={(event) => change({ name: event.target.value })}
            />
          </div>
          <Select
            label="Kategorie"
            value={input.category}
            options={FOOD_CATEGORIES}
            labels={FOOD_CATEGORY_LABELS}
            onChange={(category) => category && change({ category })}
          />
          <div>
            <label htmlFor={barcodeId} className={LABEL}>
              Strichcode (optional)
            </label>
            <input
              id={barcodeId}
              className={inputField}
              inputMode="numeric"
              autoComplete="off"
              maxLength={20}
              placeholder="Nummer unter dem Strichcode"
              value={input.barcode ?? ''}
              onChange={(event) => change({ barcode: event.target.value.trim() || null })}
            />
          </div>
        </div>
      </Card>

      <Card title="Nährwerte pro 100 g">
        <div className="flex flex-col gap-3">
          <Stepper
            label="Brennwert"
            value={input.kcal}
            unit="kcal"
            step={1}
            max={1000}
            decimals={0}
            onChange={(kcal) => kcal !== null && change({ kcal })}
          />
          {NUTRIENT_FIELDS.map(({ field, label }) => (
            <Stepper
              key={field}
              label={label}
              value={input[field]}
              unit="g"
              step={0.5}
              max={100}
              decimals={1}
              onChange={(value) => value !== null && change({ [field]: value })}
            />
          ))}
          {estimated > 0 && Math.abs(estimated - input.kcal) > 5 && (
            <div className="flex items-center gap-2">
              <p className={`min-w-0 flex-1 ${HINT}`}>
                Aus den Nährstoffen ergeben sich etwa {formatDecimal(estimated, 0)} kcal.
              </p>
              <button
                type="button"
                className="min-h-11 shrink-0 px-2 text-sm font-semibold text-primary-text"
                onClick={() => change({ kcal: estimated })}
              >
                Übernehmen
              </button>
            </div>
          )}
          <p className={HINT}>Kohlenhydrate ohne Ballaststoffe, wie auf deutschen Verpackungen.</p>
        </div>
      </Card>

      <Card title="Portionen">
        <p className={`mb-3 ${HINT}`}>Optional, z. B. „1 Riegel“ = 45 g.</p>
        <ol aria-label="Portionen" className="flex flex-col gap-3">
          {input.portions.map((portion, index) => (
            <PortionFields
              key={index}
              index={index}
              label={portion.label}
              grams={portion.grams}
              onChange={(changes) => changePortion(index, changes)}
              onRemove={() =>
                change({ portions: input.portions.filter((_, other) => other !== index) })
              }
            />
          ))}
        </ol>
        {input.portions.length < MAX_FOOD_PORTIONS && (
          <button
            type="button"
            className={`${secondaryButton} mt-3`}
            onClick={() => change({ portions: [...input.portions, { label: '', grams: 100 }] })}
          >
            + Portion
          </button>
        )}
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
    </form>
  );
}

function PortionFields({
  index,
  label,
  grams,
  onChange,
  onRemove,
}: {
  index: number;
  label: string;
  grams: number;
  onChange: (changes: { label?: string; grams?: number }) => void;
  onRemove: () => void;
}) {
  const id = useId();
  const suffix = ` (${index + 1})`;
  return (
    <li className="rounded-xl border border-line p-3">
      <div className="flex items-end gap-1">
        <div className="min-w-0 flex-1">
          <label htmlFor={id} className={LABEL}>
            Portion{suffix}
          </label>
          <input
            id={id}
            className={inputField}
            maxLength={60}
            placeholder="z. B. 1 Riegel"
            value={label}
            onChange={(event) => onChange({ label: event.target.value })}
          />
        </div>
        <DeleteRowButton name={`Portion ${index + 1}`} onClick={onRemove} />
      </div>
      <div className="mt-3">
        <Stepper
          label={`Gewicht${suffix}`}
          value={grams}
          unit="g"
          step={5}
          min={0.1}
          max={MAX_FOOD_GRAMS}
          decimals={1}
          onChange={(value) => value !== null && onChange({ grams: value })}
        />
      </div>
    </li>
  );
}
