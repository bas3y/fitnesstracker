import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { Icon } from '../../components/icons';
import { showToast } from '../../components/toastStore';
import { addMealEntry, loadPreferredFoods } from '../../db/nutrition';
import type { DayKey } from '../../db/types';
import { formatDecimal } from '../../domain/format';
import { mealForTime, proteinSuggestions, type ProteinSuggestion } from '../../domain/nudges';

const grams = (value: number) => `${formatDecimal(Math.round(value), 0)} g`;

/**
 * „Protein: 40 g fehlen“ mit bis zu drei proteinreichen Favoriten bzw. oft gegessenen
 * Lebensmitteln; Antippen trägt die Standardportion in die Mahlzeit nach Uhrzeit ein
 */
export function ProteinNudge({ date, missing }: { date: DayKey; missing: number }) {
  const foods = useLiveQuery(() => loadPreferredFoods(date), [date]);
  const suggestions = useMemo(() => (foods ? proteinSuggestions(foods) : []), [foods]);

  const add = async ({ food, amount, protein }: ProteinSuggestion) => {
    await addMealEntry(date, mealForTime(new Date()), food.id, amount);
    showToast({
      variant: 'info',
      title: `${food.name} eingetragen`,
      lines: [`+${grams(protein)} Protein`],
    });
  };

  return (
    <div data-testid="protein-nudge" className="mt-3 rounded-xl bg-subtle p-3">
      <p className="text-sm font-medium">
        Protein: {grams(missing)} fehlen
        {suggestions.length > 0 ? ' – zum Beispiel:' : '.'}
      </p>
      {suggestions.length > 0 && (
        <ul aria-label="Vorschläge für Protein" className="mt-2 flex flex-col gap-1.5">
          {suggestions.map((suggestion) => (
            <li key={suggestion.food.id}>
              <button
                type="button"
                aria-label={`${suggestion.food.name} eintragen`}
                className="flex min-h-11 w-full items-center gap-2 rounded-xl bg-surface px-3 text-left text-sm active:bg-pressed"
                onClick={() => void add(suggestion)}
              >
                <span className="min-w-0 flex-1 truncate font-medium">{suggestion.food.name}</span>
                <span className="shrink-0 text-muted tabular-nums">
                  {suggestion.amount.portion?.label ?? grams(suggestion.amount.grams)} ·{' '}
                  {grams(suggestion.protein)} Protein
                </span>
                <Icon name="plus" className="h-5 w-5 shrink-0 text-primary-text" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
