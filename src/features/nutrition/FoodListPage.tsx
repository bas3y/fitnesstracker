import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { secondaryButton } from '../../components/buttons';
import { Chip } from '../../components/Chip';
import { StarIcon } from '../../components/icons';
import { Page } from '../../components/Page';
import { SearchInput } from '../../components/SearchInput';
import type { Food } from '../../db/types';
import { findByBarcode } from '../../domain/barcode';
import { createSearch } from '../../domain/search';
import { ScanButton } from './barcode/ScanButton';
import { FoodFavoriteButton, FoodList, FoodSummary, MUTED } from './FoodParts';
import { foodPath, NEW_FOOD_PATH, NEW_RECIPE_PATH, NUTRITION_PATH, SCAN_FOOD_PATH } from './paths';
import { useActiveFoods } from './useNutrition';

const MAX_RESULTS = 50;

const FILTERS = {
  favorites: { label: 'Favoriten', test: (food: Food) => food.isFavorite },
  own: { label: 'Eigene', test: (food: Food) => food.source === 'user' && !food.recipe },
  recipes: { label: 'Rezepte', test: (food: Food) => food.recipe !== null },
  hidden: { label: 'Ausgeblendete', test: (food: Food) => food.hiddenAt !== null },
} as const;
type FilterId = keyof typeof FILTERS;

const isFilterId = (value: string | null): value is FilterId => !!value && value in FILTERS;

/** Lebensmittel und Rezepte verwalten; Suche und Filter stehen in der URL (bleiben beim Zurück) */
export function FoodListPage() {
  const foods = useActiveFoods();
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const rawFilter = params.get('filter');
  const filter = isFilterId(rawFilter) ? rawFilter : null;
  const setParam = (key: string, value: string | null) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );

  const search = useMemo(() => createSearch(foods ?? []), [foods]);
  const results = useMemo(() => {
    // Ausgeblendete nur mit dem passenden Filter
    const test = filter ? FILTERS[filter].test : (food: Food) => food.hiddenAt === null;
    const byBarcode = findByBarcode(foods ?? [], query);
    if (byBarcode) return [byBarcode];
    if (query.trim()) return search(query).filter(test);
    if (!filter) return [];
    return (foods ?? []).filter(test).sort((a, b) => a.name.localeCompare(b.name, 'de'));
  }, [search, foods, query, filter]);
  const shown = results.slice(0, MAX_RESULTS);

  return (
    <Page title="Lebensmittel" backTo={NUTRITION_PATH}>
      <div className="mb-4 flex gap-2">
        <Link to={NEW_FOOD_PATH} className={secondaryButton}>
          + Lebensmittel
        </Link>
        <Link to={NEW_RECIPE_PATH} className={secondaryButton}>
          + Rezept
        </Link>
      </div>
      <ScanButton to={SCAN_FOOD_PATH} />
      <SearchInput
        label="Lebensmittel suchen"
        placeholder="Name oder Strichcode-Nummer"
        value={query}
        onChange={(value) => setParam('q', value)}
      />
      <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {(Object.keys(FILTERS) as FilterId[]).map((id) => (
          <Chip
            key={id}
            pressed={filter === id}
            onClick={() => setParam('filter', filter === id ? null : id)}
          >
            {id === 'favorites' && <StarIcon className="h-4 w-4" filled={filter === id} />}
            {FILTERS[id].label}
          </Chip>
        ))}
      </div>

      {foods === undefined || foods.length === 0 ? (
        <p role="status" className={MUTED}>
          Datenbank wird eingerichtet …
        </p>
      ) : !query.trim() && !filter ? (
        <p className={MUTED}>{foods.length} Lebensmittel offline verfügbar.</p>
      ) : shown.length === 0 ? (
        <p role="status" className={MUTED}>
          {query.trim() ? `Keine Treffer für „${query.trim()}“.` : 'Keine passenden Einträge.'}
        </p>
      ) : (
        <>
          <FoodList label="Suchergebnisse">
            {shown.map((food) => (
              <li key={food.id} className="flex items-center">
                <Link
                  to={foodPath(food.id)}
                  className="flex min-h-14 min-w-0 flex-1 items-center py-2 pl-4 active:bg-page"
                >
                  <FoodSummary food={food} />
                </Link>
                <FoodFavoriteButton food={food} />
              </li>
            ))}
          </FoodList>
          {results.length > MAX_RESULTS && (
            <p className={`mb-4 ${MUTED}`}>
              Nur die ersten {MAX_RESULTS} Treffer – Suche genauer eingeben.
            </p>
          )}
        </>
      )}
    </Page>
  );
}
