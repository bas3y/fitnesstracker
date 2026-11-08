import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { dangerButton, secondaryButton } from '../../components/buttons';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Card, Page } from '../../components/Page';
import { deleteUserFood, setFoodFavorite, setFoodHidden } from '../../db/foods';
import type { Food, Nutrients } from '../../db/types';
import { formatBarcode } from '../../domain/barcode';
import { formatDecimal } from '../../domain/format';
import { OFF_SOURCE_PREFIX } from '../../domain/openFoodFacts';
import { FOOD_CATEGORY_LABELS } from '../../domain/labels';
import {
  formatGrams,
  pickNutrients,
  recipeNutrition,
  scaleNutrients,
} from '../../domain/nutrition';
import { MUTED } from './FoodParts';
import { FOODS_PATH } from './paths';
import { useFood, useFoodMap } from './useNutrition';

const ROWS: Array<{ key: keyof Nutrients; label: string; sub?: boolean }> = [
  { key: 'kcal', label: 'Brennwert' },
  { key: 'protein', label: 'Protein' },
  { key: 'carbs', label: 'Kohlenhydrate' },
  { key: 'sugar', label: 'davon Zucker', sub: true },
  { key: 'fat', label: 'Fett' },
  { key: 'fiber', label: 'Ballaststoffe' },
  { key: 'alcohol', label: 'Alkohol' },
];

function formatValue(key: keyof Nutrients, value: number): string {
  return key === 'kcal' ? `${formatDecimal(Math.round(value), 0)} kcal` : formatGrams(value);
}

function sourceText(food: Food): string | null {
  if (food.sourceRef?.startsWith(OFF_SOURCE_PREFIX)) return 'Werte von Open Food Facts';
  if (food.source === 'user') return null;
  if (food.sourceRef?.startsWith('usda:')) return 'Quelle: USDA FoodData Central';
  return 'Durchschnittswerte gängiger Produkte';
}

export function FoodDetailPage() {
  const { id } = useParams();
  const food = useFood(id);
  if (food === undefined) return <Page title="Lebensmittel">{null}</Page>;
  if (food === null) {
    return (
      <Page title="Lebensmittel" backTo={FOODS_PATH}>
        <Card>
          <p className="text-muted">Dieses Lebensmittel gibt es nicht mehr.</p>
        </Card>
      </Page>
    );
  }
  return <FoodDetail food={food} />;
}

function FoodDetail({ food }: { food: Food }) {
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const portion = food.portions[0];
  const per100 = pickNutrients(food);
  const perPortion = portion && scaleNutrients(per100, portion.grams);
  const source = sourceText(food);

  return (
    <Page title={food.name} backTo={FOODS_PATH}>
      {food.hiddenAt !== null && (
        <p
          role="status"
          className="mb-4 rounded-xl bg-warn-soft px-4 py-3 text-sm font-medium text-on-warn-soft"
        >
          Ausgeblendet: erscheint nicht in der Auswahl.
        </p>
      )}
      <Card title="Nährwerte">
        <p className={`mb-2 ${MUTED}`}>
          {food.recipe ? 'Rezept' : FOOD_CATEGORY_LABELS[food.category]}
          {source && ` · ${source}`}
        </p>
        <table className="w-full text-left tabular-nums">
          <thead>
            <tr className={MUTED}>
              <th className="py-1 font-medium">
                <span className="sr-only">Nährstoff</span>
              </th>
              <th className="py-1 text-right font-medium">pro 100 g</th>
              {portion && (
                <th className="py-1 text-right font-medium">
                  {portion.label} ({formatGrams(portion.grams)})
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {ROWS.filter(({ key }) => key !== 'alcohol' || food.alcohol > 0).map(
              ({ key, label, sub }) => (
                <tr key={key} className="border-t border-line">
                  <th scope="row" className={`py-1.5 font-normal ${sub ? 'pl-3 text-sm' : ''}`}>
                    {label}
                  </th>
                  <td className="py-1.5 text-right">{formatValue(key, per100[key])}</td>
                  {perPortion && (
                    <td className="py-1.5 text-right">{formatValue(key, perPortion[key])}</td>
                  )}
                </tr>
              ),
            )}
          </tbody>
        </table>
        {food.portions.length > 1 && (
          <p className={`mt-3 ${MUTED}`}>
            Portionen:{' '}
            {food.portions.map((item) => `${item.label} = ${formatGrams(item.grams)}`).join(', ')}
          </p>
        )}
        {food.barcode && (
          <p className={`mt-3 ${MUTED}`}>
            Strichcode <span className="tabular-nums">{formatBarcode(food.barcode)}</span>
          </p>
        )}
      </Card>

      {food.recipe && <RecipeCard food={food} />}

      <div className="mb-4 flex flex-col gap-2">
        <button
          type="button"
          className={secondaryButton}
          aria-pressed={food.isFavorite}
          onClick={() => void setFoodFavorite(food.id, !food.isFavorite)}
        >
          {food.isFavorite ? '★ Favorit' : '☆ Als Favorit markieren'}
        </button>
        {food.source === 'user' ? (
          <>
            <Link to={`${FOODS_PATH}/${food.id}/edit`} className={secondaryButton}>
              Bearbeiten
            </Link>
            <button type="button" className={dangerButton} onClick={() => setConfirmDelete(true)}>
              {food.recipe ? 'Rezept löschen' : 'Lebensmittel löschen'}
            </button>
          </>
        ) : (
          <button
            type="button"
            className={secondaryButton}
            onClick={() => void setFoodHidden(food.id, food.hiddenAt === null)}
          >
            {food.hiddenAt === null ? 'Ausblenden' : 'Wieder einblenden'}
          </button>
        )}
      </div>
      {confirmDelete && (
        <ConfirmDialog
          title={`„${food.name}“ löschen?`}
          confirmLabel="Löschen"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={async () => {
            await deleteUserFood(food.id);
            navigate(FOODS_PATH, { replace: true });
          }}
        >
          Bisherige Einträge in Mahlzeiten behalten ihre Werte.
        </ConfirmDialog>
      )}
    </Page>
  );
}

function RecipeCard({ food }: { food: Food }) {
  const foods = useFoodMap();
  const recipe = food.recipe!;
  if (!foods) return null;
  const nutrition = recipeNutrition(recipe, foods);
  return (
    <Card title="Zutaten">
      <ul aria-label="Zutaten" className="mb-3">
        {recipe.ingredients.map((ingredient) => (
          <li key={ingredient.id} className="flex justify-between gap-2 py-1">
            <span className="min-w-0 truncate">
              {foods.get(ingredient.foodId)?.name ?? 'Unbekannt'}
            </span>
            <span className="shrink-0 tabular-nums">{formatGrams(ingredient.grams)}</span>
          </li>
        ))}
      </ul>
      <p className={MUTED}>
        Zutaten zusammen {formatGrams(nutrition.rawGrams)}
        {recipe.cookedWeightGrams !== null &&
          `, nach dem Kochen ${formatGrams(recipe.cookedWeightGrams)}`}
        . {recipe.servings === 1 ? '1 Portion' : `${recipe.servings} Portionen`} à{' '}
        {formatGrams(nutrition.portionGrams)}.
      </p>
    </Card>
  );
}
