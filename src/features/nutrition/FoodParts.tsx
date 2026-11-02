import type { ReactNode } from 'react';
import { Chip } from '../../components/Chip';
import { FavoriteToggle } from '../../components/FavoriteToggle';
import { Stepper } from '../../components/Stepper';
import { setFoodFavorite } from '../../db/foods';
import { MAX_FOOD_GRAMS, MAX_PORTION_COUNT, type MealAmount } from '../../db/schemas';
import type { Food, FoodPortion, Nutrients } from '../../db/types';
import { formatDecimal } from '../../domain/format';
import { FOOD_CATEGORY_LABELS } from '../../domain/labels';
import {
  formatGrams,
  formatNutrientLine,
  portionAmount,
  scaleNutrients,
} from '../../domain/nutrition';
import { Badge } from '../training/ExerciseBrowser';

export const MUTED = 'text-sm text-slate-500 dark:text-slate-400';

/** Name, Badges und Nährwerte pro 100 g für Listenzeilen */
export function FoodSummary({ food }: { food: Food }) {
  return (
    <span className="block min-w-0">
      <span className="flex items-center gap-1.5 font-medium">
        <span className="truncate">{food.name}</span>
        {food.recipe ? <Badge>Rezept</Badge> : food.source === 'user' && <Badge>Eigenes</Badge>}
        {food.hiddenAt !== null && <Badge>Ausgeblendet</Badge>}
      </span>
      <span className="block truncate text-sm text-slate-500 dark:text-slate-400">
        {formatNutrientLine(food)} pro 100 g · {FOOD_CATEGORY_LABELS[food.category]}
      </span>
    </span>
  );
}

export function FoodFavoriteButton({ food }: { food: Food }) {
  return (
    <FavoriteToggle
      name={food.name}
      isFavorite={food.isFavorite}
      onToggle={(isFavorite) => void setFoodFavorite(food.id, isFavorite)}
    />
  );
}

export function FoodList({ label, children }: { label: string; children: ReactNode }) {
  return (
    <ul
      aria-label={label}
      className="mb-4 divide-y divide-slate-200 overflow-hidden rounded-2xl bg-white shadow-sm dark:divide-slate-700 dark:bg-slate-800"
    >
      {children}
    </ul>
  );
}

/** Menge in Gramm oder als Portion; zeigt die Nährwerte der gewählten Menge */
export function AmountForm({
  portions,
  nutrients,
  value,
  onChange,
}: {
  portions: FoodPortion[];
  /** Pro 100 g */
  nutrients: Nutrients;
  value: MealAmount;
  onChange: (amount: MealAmount) => void;
}) {
  // Eine gespeicherte Portion, die es am Lebensmittel nicht mehr gibt, bleibt wählbar
  const options =
    value.portion && !portions.some((portion) => portion.label === value.portion?.label)
      ? [{ label: value.portion.label, grams: value.portion.grams }, ...portions]
      : portions;
  const current = value.portion;
  const amount = scaleNutrients(nutrients, value.grams);

  return (
    <div className="flex flex-col gap-3">
      {options.length > 0 && (
        <div role="group" aria-label="Einheit" className="flex flex-wrap gap-1">
          <Chip
            pressed={current === null}
            className="px-3"
            onClick={() => onChange({ grams: value.grams, portion: null })}
          >
            Gramm
          </Chip>
          {options.map((portion) => (
            <Chip
              key={portion.label}
              pressed={current?.label === portion.label}
              className="px-3"
              onClick={() => onChange(portionAmount(portion, current?.count ?? 1))}
            >
              {portion.label} ({formatGrams(portion.grams)})
            </Chip>
          ))}
        </div>
      )}
      {current ? (
        <Stepper
          label={`Anzahl (${current.label} = ${formatGrams(current.grams)})`}
          value={current.count}
          step={0.5}
          min={0.25}
          max={MAX_PORTION_COUNT}
          decimals={2}
          onChange={(count) =>
            count !== null &&
            onChange(portionAmount({ label: current.label, grams: current.grams }, count))
          }
        />
      ) : (
        <Stepper
          label="Menge"
          value={value.grams}
          unit="g"
          step={10}
          min={1}
          max={MAX_FOOD_GRAMS}
          decimals={1}
          onChange={(grams) => grams !== null && onChange({ grams, portion: null })}
        />
      )}
      <p data-testid="amount-preview" className="tabular-nums">
        {formatNutrientLine(amount)} · KH {formatDecimal(Math.round(amount.carbs), 0)} g · F{' '}
        {formatDecimal(Math.round(amount.fat), 0)} g
      </p>
    </div>
  );
}
