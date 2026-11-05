import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { primaryButton, secondaryButton } from '../../components/buttons';
import { SearchInput } from '../../components/SearchInput';
import { createUserFood } from '../../db/foods';
import { EMPTY_FOOD_INPUT, type MealAmount } from '../../db/schemas';
import type { DayKey, Food } from '../../db/types';
import { defaultMealAmount, formatNutrientLine } from '../../domain/nutrition';
import { findByBarcode } from '../../domain/barcode';
import { createSearch } from '../../domain/search';
import { BarcodeFoodFlow } from './barcode/BarcodeFoodFlow';
import { ScanButton } from './barcode/ScanButton';
import { AmountForm, FoodFavoriteButton, FoodList, FoodSummary, MUTED } from './FoodParts';
import { FoodForm } from './FoodForm';
import { useActiveFoods, useFoodUsage } from './useNutrition';

const MAX_RESULTS = 50;

/**
 * Vollbild-Auswahl von Lebensmitteln mit Menge. Bleibt nach dem Hinzufügen offen, damit sich eine
 * Mahlzeit in einem Zug eintragen lässt. Ohne Suchbegriff: Favoriten, zuletzt und häufig verwendet.
 * Wird vom Aufrufer nur gerendert, solange sie offen ist.
 */
export function FoodPicker({
  title,
  today,
  withRecipes = true,
  onAdd,
  onClose,
}: {
  title: string;
  today: DayKey;
  /** Aus = Rezepte fehlen (Zutaten eines Rezepts) */
  withRecipes?: boolean;
  onAdd: (food: Food, amount: MealAmount) => Promise<void> | void;
  onClose: () => void;
}) {
  const allFoods = useActiveFoods();
  const usage = useFoodUsage(today);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<{ food: Food; amount: MealAmount } | null>(null);
  const [creating, setCreating] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [added, setAdded] = useState<string[]>([]);
  const titleId = useId();
  const dialog = useRef<HTMLDivElement>(null);

  const foods = useMemo(
    () =>
      (allFoods ?? []).filter(
        (food) => food.hiddenAt === null && (withRecipes || food.recipe === null),
      ),
    [allFoods, withRecipes],
  );
  const byId = useMemo(() => new Map(foods.map((food) => [food.id, food])), [foods]);
  const search = useMemo(() => createSearch(foods), [foods]);
  const results = useMemo(() => {
    const byBarcode = findByBarcode(foods, query);
    return byBarcode ? [byBarcode] : search(query, MAX_RESULTS);
  }, [foods, search, query]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const select = (food: Food) => setSelected({ food, amount: defaultMealAmount(food.portions) });
  const pick = (ids: string[]) => ids.flatMap((id) => byId.get(id) ?? []);
  const sections = [
    {
      label: 'Favoriten',
      items: foods
        .filter((food) => food.isFavorite)
        .sort((a, b) => a.name.localeCompare(b.name, 'de')),
    },
    { label: 'Zuletzt verwendet', items: pick(usage?.recent ?? []) },
    { label: 'Häufig verwendet', items: pick(usage?.frequent ?? []) },
  ].filter((section) => section.items.length > 0);

  const option = (food: Food) => (
    <li key={food.id} className="flex items-center">
      <button
        type="button"
        className="flex min-h-14 min-w-0 flex-1 items-center py-2 pl-4 text-left active:bg-slate-50 dark:active:bg-slate-700"
        onClick={() => select(food)}
      >
        <FoodSummary food={food} />
      </button>
      <FoodFavoriteButton food={food} />
    </li>
  );

  const add = async () => {
    if (!selected) return;
    await onAdd(selected.food, selected.amount);
    setAdded((current) => [...current, selected.food.name]);
    setSelected(null);
    setQuery('');
  };

  const heading = creating
    ? 'Eigenes Lebensmittel'
    : scanning
      ? 'Strichcode scannen'
      : (selected?.food.name ?? title);
  const back = creating
    ? () => setCreating(false)
    : scanning
      ? () => setScanning(false)
      : selected
        ? () => setSelected(null)
        : null;
  const scanned = useCallback(
    (food: Food) => {
      setScanning(false);
      // Ausgeblendete oder (beim Rezept) andere Rezepte nicht auswählen
      if (food.hiddenAt === null && (withRecipes || food.recipe === null)) {
        setSelected({ food, amount: defaultMealAmount(food.portions) });
      } else {
        setQuery(food.name);
      }
    },
    [withRecipes],
  );

  return (
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose();
      }}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-50 outline-none dark:bg-slate-900"
    >
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 pt-[env(safe-area-inset-top)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-md items-center justify-between gap-2 px-4 py-2">
          <h2 id={titleId} className="min-w-0 truncate text-lg font-semibold">
            {heading}
          </h2>
          <button
            type="button"
            className="min-h-11 shrink-0 px-2 font-medium text-emerald-700 dark:text-emerald-400"
            onClick={back ?? onClose}
          >
            {back ? 'Zurück' : added.length > 0 ? 'Fertig' : 'Schließen'}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {added.length > 0 && !selected && !creating && !scanning && (
          <p
            role="status"
            className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
          >
            Hinzugefügt: {added.join(', ')}
          </p>
        )}
        {creating ? (
          <FoodForm
            initial={{ ...EMPTY_FOOD_INPUT, name: query.trim() }}
            submitLabel="Anlegen und auswählen"
            onSubmit={async (input) => {
              select(await createUserFood(input));
              setCreating(false);
            }}
            onCancel={() => setCreating(false)}
          />
        ) : scanning ? (
          <BarcodeFoodFlow
            submitLabel="Speichern und auswählen"
            onFood={scanned}
            onCancel={() => setScanning(false)}
          />
        ) : selected ? (
          <div className="flex flex-col gap-4">
            <p className={MUTED}>{formatNutrientLine(selected.food)} pro 100 g</p>
            <AmountForm
              portions={selected.food.portions}
              nutrients={selected.food}
              value={selected.amount}
              onChange={(amount) => setSelected({ ...selected, amount })}
            />
            <button type="button" className={primaryButton} onClick={() => void add()}>
              Hinzufügen
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              className={`${secondaryButton} mb-4`}
              onClick={() => setCreating(true)}
            >
              + Eigenes Lebensmittel anlegen
            </button>
            <ScanButton onClick={() => setScanning(true)} />
            <SearchInput
              label="Lebensmittel suchen"
              placeholder="Name oder Strichcode-Nummer"
              value={query}
              onChange={setQuery}
            />
            {allFoods === undefined ? null : query.trim() !== '' ? (
              results.length === 0 ? (
                <p role="status" className={MUTED}>
                  Keine Treffer für „{query.trim()}“.
                </p>
              ) : (
                <FoodList label="Suchergebnisse">{results.map(option)}</FoodList>
              )
            ) : sections.length === 0 ? (
              <p className={MUTED}>
                Suche nach einem Lebensmittel. Favoriten (Stern) und zuletzt verwendete erscheinen
                hier ohne Suchen.
              </p>
            ) : (
              sections.map(({ label, items }) => (
                <section key={label}>
                  <h3 className="mb-2 font-semibold">{label}</h3>
                  <FoodList label={label}>{items.map(option)}</FoodList>
                </section>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
