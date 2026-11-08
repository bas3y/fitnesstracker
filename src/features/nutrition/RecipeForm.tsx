import { useId, useState, type FormEvent } from 'react';
import { inputField, primaryButton, secondaryButton } from '../../components/buttons';
import { Switch } from '../../components/Switch';
import { DeleteRowButton } from '../../components/DeleteRowButton';
import { Card } from '../../components/Page';
import { Stepper } from '../../components/Stepper';
import {
  MAX_RECIPE_GRAMS,
  MAX_RECIPE_INGREDIENTS,
  MAX_RECIPE_SERVINGS,
  recipeInputSchema,
  type RecipeInput,
} from '../../db/schemas';
import { dayKey } from '../../domain/daily';
import {
  formatGrams,
  formatNutrientLine,
  recipeNutrition,
  scaleNutrients,
} from '../../domain/nutrition';
import { MUTED } from './FoodParts';
import { FoodPicker } from './FoodPicker';
import { useFoodMap } from './useNutrition';

const LABEL = 'mb-1 block text-sm font-medium';

/** Rezept: Zutaten mit Menge, optional Gewicht nach dem Kochen, Anzahl Portionen */
export function RecipeForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: RecipeInput;
  submitLabel: string;
  onSubmit: (input: RecipeInput) => Promise<void>;
  onCancel: () => void;
}) {
  const nameId = useId();
  const foods = useFoodMap();
  const [input, setInput] = useState<RecipeInput>(initial);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const change = (changes: Partial<RecipeInput>) => {
    setInput((current) => ({ ...current, ...changes }));
    setError(null);
  };
  const nutrition = foods && recipeNutrition(input, foods);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const result = recipeInputSchema.safeParse(input);
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
    <>
      <form onSubmit={(event) => void submit(event)}>
        <Card>
          <label htmlFor={nameId} className={LABEL}>
            Name
          </label>
          <input
            id={nameId}
            className={inputField}
            maxLength={80}
            placeholder="z. B. Chili con Carne"
            value={input.name}
            onChange={(event) => change({ name: event.target.value })}
          />
        </Card>

        <Card title="Zutaten">
          {input.ingredients.length === 0 ? (
            <p className={`mb-3 ${MUTED}`}>Noch keine Zutaten. Mengen roh bzw. wie eingekauft.</p>
          ) : (
            <ol aria-label="Zutaten" className="mb-3 flex flex-col gap-3">
              {input.ingredients.map((ingredient) => {
                const name = foods?.get(ingredient.foodId)?.name ?? 'Zutat';
                return (
                  <li key={ingredient.id} className="flex items-end gap-1">
                    <div className="min-w-0 flex-1">
                      <Stepper
                        label={name}
                        value={ingredient.grams}
                        unit="g"
                        step={10}
                        min={0.1}
                        max={MAX_RECIPE_GRAMS}
                        decimals={1}
                        onChange={(grams) =>
                          grams !== null &&
                          change({
                            ingredients: input.ingredients.map((item) =>
                              item.id === ingredient.id ? { ...item, grams } : item,
                            ),
                          })
                        }
                      />
                    </div>
                    <DeleteRowButton
                      name={name}
                      verb="entfernen"
                      onClick={() =>
                        change({
                          ingredients: input.ingredients.filter(
                            (item) => item.id !== ingredient.id,
                          ),
                        })
                      }
                    />
                  </li>
                );
              })}
            </ol>
          )}
          {input.ingredients.length < MAX_RECIPE_INGREDIENTS && (
            <button type="button" className={secondaryButton} onClick={() => setPicking(true)}>
              + Zutat
            </button>
          )}
        </Card>

        <Card title="Gewicht & Portionen">
          <div className="flex flex-col gap-3">
            <Switch
              label="Gewicht nach dem Kochen angeben"
              checked={input.cookedWeightGrams !== null}
              onChange={(checked) =>
                change({
                  cookedWeightGrams: checked ? Math.round(nutrition?.rawGrams || 500) : null,
                })
              }
            />
            {input.cookedWeightGrams !== null && (
              <Stepper
                label="Gewicht nach dem Kochen"
                value={input.cookedWeightGrams}
                unit="g"
                step={10}
                min={1}
                max={MAX_RECIPE_GRAMS}
                decimals={0}
                onChange={(grams) => grams !== null && change({ cookedWeightGrams: grams })}
              />
            )}
            <p className={MUTED}>
              Beim Kochen verdampft oder bindet sich Wasser. Mit dem fertigen Gewicht stimmen die
              Werte pro 100 g, wenn du später eine Menge abwiegst.
            </p>
            <Stepper
              label="Portionen"
              value={input.servings}
              step={1}
              min={1}
              max={MAX_RECIPE_SERVINGS}
              decimals={0}
              onChange={(servings) => servings !== null && change({ servings })}
            />
          </div>
        </Card>

        {nutrition && nutrition.totalGrams > 0 && (
          <Card title="Ergebnis">
            <dl data-testid="recipe-preview" className="flex flex-col gap-1 tabular-nums">
              <div className="flex justify-between gap-2">
                <dt>Pro 100 g</dt>
                <dd>{formatNutrientLine(nutrition.per100)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Pro Portion ({formatGrams(nutrition.portionGrams)})</dt>
                <dd>
                  {formatNutrientLine(scaleNutrients(nutrition.per100, nutrition.portionGrams))}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Gesamt ({formatGrams(nutrition.totalGrams)})</dt>
                <dd>{formatNutrientLine(nutrition.total)}</dd>
              </div>
            </dl>
          </Card>
        )}

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

      {/* Außerhalb des Formulars: Enter in der Suche soll das Rezept nicht speichern */}
      {picking && (
        <FoodPicker
          title="Zutat hinzufügen"
          today={dayKey(new Date())}
          withRecipes={false}
          onAdd={(food, amount) => {
            setInput((current) => ({
              ...current,
              ingredients: [
                ...current.ingredients,
                { id: crypto.randomUUID(), foodId: food.id, grams: amount.grams },
              ],
            }));
            setError(null);
          }}
          onClose={() => setPicking(false)}
        />
      )}
    </>
  );
}
