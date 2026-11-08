import { useLiveQuery } from 'dexie-react-hooks';
import { useId, useState } from 'react';
import { dangerButton, inputField, primaryButton, secondaryButton } from '../../components/buttons';
import { DeleteRowButton } from '../../components/DeleteRowButton';
import { Dialog } from '../../components/Dialog';
import { Card } from '../../components/Page';
import { Select } from '../../components/Select';
import { showToast } from '../../components/toastStore';
import { db } from '../../db/database';
import {
  addMealEntry,
  applySavedMeal,
  copyMeal,
  deleteMealEntry,
  deleteSavedMeal,
  saveMeal,
  updateMealEntry,
} from '../../db/nutrition';
import { MEAL_TYPES, type DayKey, type MealEntry, type MealType } from '../../db/types';
import { shiftDay } from '../../domain/daily';
import { MEAL_TYPE_LABELS } from '../../domain/labels';
import {
  entryNutrients,
  formatMealAmount,
  formatNutrientLine,
  type MealSummary,
} from '../../domain/nutrition';
import { AmountForm, MUTED } from './FoodParts';
import { FoodPicker } from './FoodPicker';
import { useSavedMeals } from './useNutrition';

type OpenDialog = 'picker' | 'saved' | { entry: MealEntry } | null;

/** Eine Mahlzeit eines Tages mit Einträgen, Hinzufügen, „Wie gestern“ und Lieblingsmahlzeiten */
export function MealCard({
  meal,
  date,
  today,
  summary,
  previousCount,
}: {
  meal: MealType;
  date: DayKey;
  today: DayKey;
  summary: MealSummary<MealEntry>;
  /** Einträge dieser Mahlzeit am Vortag */
  previousCount: number;
}) {
  const [open, setOpen] = useState<OpenDialog>(null);
  const label = MEAL_TYPE_LABELS[meal];
  const { entries, total } = summary;

  const copyYesterday = async () => {
    const count = await copyMeal(shiftDay(date, -1), date, meal);
    showToast({
      variant: 'info',
      title: `${label} wie am Vortag`,
      lines: [count === 1 ? '1 Eintrag übernommen' : `${count} Einträge übernommen`],
    });
  };

  return (
    <Card title={label}>
      {entries.length > 0 ? (
        <>
          <p className={`-mt-2 mb-2 ${MUTED}`}>{formatNutrientLine(total)}</p>
          <ul aria-label={label} className="-mx-2 mb-2">
            {entries.map((entry) => (
              <li key={entry.id} className="flex items-center">
                <button
                  type="button"
                  className="flex min-h-14 min-w-0 flex-1 flex-col justify-center rounded-xl px-2 py-1 text-left active:bg-page"
                  onClick={() => setOpen({ entry })}
                >
                  <span className="block truncate font-medium">{entry.name}</span>
                  <span className={`block truncate ${MUTED}`}>
                    {formatMealAmount(entry)} · {formatNutrientLine(entryNutrients(entry))}
                  </span>
                </button>
                <DeleteRowButton
                  name={entry.name}
                  verb="entfernen"
                  onClick={() => void deleteMealEntry(entry.id)}
                />
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className={`mb-3 ${MUTED}`}>Noch nichts eingetragen.</p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          aria-label={`${label}: hinzufügen`}
          className={`${secondaryButton} flex-1`}
          onClick={() => setOpen('picker')}
        >
          + Hinzufügen
        </button>
        {entries.length === 0 && previousCount > 0 && (
          <button
            type="button"
            aria-label={`${label}: wie gestern`}
            className={`${secondaryButton} flex-1`}
            onClick={() => void copyYesterday()}
          >
            Wie gestern
          </button>
        )}
        <button
          type="button"
          aria-label={`${label}: Lieblingsmahlzeiten`}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line-strong text-lg text-star"
          onClick={() => setOpen('saved')}
        >
          ★
        </button>
      </div>

      {open === 'picker' && (
        <FoodPicker
          title={`${label} hinzufügen`}
          today={today}
          onAdd={async (food, amount) => {
            await addMealEntry(date, meal, food.id, amount);
          }}
          onClose={() => setOpen(null)}
        />
      )}
      {open === 'saved' && (
        <SavedMealsDialog
          meal={meal}
          date={date}
          canSave={entries.length > 0}
          onClose={() => setOpen(null)}
        />
      )}
      {open !== null && typeof open === 'object' && (
        <EntryDialog entry={open.entry} onClose={() => setOpen(null)} />
      )}
    </Card>
  );
}
function EntryDialog({ entry, onClose }: { entry: MealEntry; onClose: () => void }) {
  const food = useLiveQuery(() => db.foods.get(entry.foodId), [entry.foodId]);
  // Live mitschreiben; der Dialog zeigt den zuletzt gespeicherten Stand
  const current = useLiveQuery(() => db.mealEntries.get(entry.id), [entry.id]) ?? entry;
  return (
    <Dialog title={entry.name} onClose={onClose}>
      <AmountForm
        portions={food?.portions ?? []}
        nutrients={current.nutrients}
        value={current}
        onChange={(amount) => void updateMealEntry(entry.id, { amount })}
      />
      <Select
        label="Mahlzeit"
        value={current.meal}
        options={MEAL_TYPES}
        labels={MEAL_TYPE_LABELS}
        onChange={(meal) => meal && void updateMealEntry(entry.id, { meal })}
      />
      <button
        type="button"
        className={dangerButton}
        onClick={() => {
          void deleteMealEntry(entry.id);
          onClose();
        }}
      >
        Entfernen
      </button>
    </Dialog>
  );
}

function SavedMealsDialog({
  meal,
  date,
  canSave,
  onClose,
}: {
  meal: MealType;
  date: DayKey;
  canSave: boolean;
  onClose: () => void;
}) {
  const savedMeals = useSavedMeals();
  const nameId = useId();
  const label = MEAL_TYPE_LABELS[meal];
  const [name, setName] = useState(label);
  const [error, setError] = useState<string | null>(null);

  const apply = async (id: string, title: string) => {
    const count = await applySavedMeal(id, date, meal);
    showToast({
      variant: 'info',
      title: `${title} eingetragen`,
      lines: [count === 1 ? '1 Eintrag' : `${count} Einträge`],
    });
    onClose();
  };
  const save = async () => {
    try {
      await saveMeal(name, date, meal);
      setError(null);
      setName(label);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Speichern fehlgeschlagen');
    }
  };

  return (
    <Dialog title="Lieblingsmahlzeiten" onClose={onClose}>
      {savedMeals?.length === 0 && (
        <p className={MUTED}>
          Noch keine gespeichert. Trage eine Mahlzeit ein und speichere sie hier, dann reicht beim
          nächsten Mal ein Tipp.
        </p>
      )}
      {savedMeals && savedMeals.length > 0 && (
        <ul aria-label="Gespeicherte Mahlzeiten" className="-mx-2 max-h-72 overflow-y-auto">
          {savedMeals.map(({ savedMeal, names, total }) => (
            <li key={savedMeal.id} className="flex items-center">
              <button
                type="button"
                className="flex min-h-14 min-w-0 flex-1 flex-col justify-center rounded-xl px-2 py-1 text-left active:bg-page"
                onClick={() => void apply(savedMeal.id, savedMeal.name)}
              >
                <span className="block truncate font-medium">{savedMeal.name}</span>
                <span className={`block truncate ${MUTED}`}>
                  {formatNutrientLine(total)} · {names.join(', ')}
                </span>
              </button>
              <DeleteRowButton
                name={savedMeal.name}
                onClick={() => void deleteSavedMeal(savedMeal.id)}
              />
            </li>
          ))}
        </ul>
      )}
      {canSave && (
        <div className="flex flex-col gap-2 border-t border-line pt-3">
          <label htmlFor={nameId} className="text-sm font-medium">
            {label} von diesem Tag speichern als
          </label>
          <input
            id={nameId}
            className={inputField}
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          {error && (
            <p role="alert" className="text-sm font-medium text-danger">
              {error}
            </p>
          )}
          <button type="button" className={primaryButton} onClick={() => void save()}>
            Speichern
          </button>
        </div>
      )}
    </Dialog>
  );
}
