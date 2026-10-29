import { useLiveQuery } from 'dexie-react-hooks';
import { CatalogSearch } from '../../components/CatalogSearch';
import { Page } from '../../components/Page';
import { db } from '../../db/database';
import { listActive } from '../../db/repository';
import type { Food } from '../../db/types';
import { formatDecimal } from '../../domain/format';
import { FOOD_CATEGORY_LABELS } from '../../domain/labels';

// Einfache Suchseite für die mitgelieferte Lebensmitteldatenbank; Ernährungstracking folgt in Schritt 12
export function FoodSearchPage() {
  const foods = useLiveQuery(() => listActive(db.foods), []);

  return (
    <Page title="Lebensmittel" backTo="/daily">
      <CatalogSearch
        items={foods}
        label="Lebensmittel suchen"
        placeholder="z. B. Haferflocken, Quark …"
        noun="Lebensmittel"
        renderItem={(food) => <FoodRow food={food} />}
      />
    </Page>
  );
}

function FoodRow({ food }: { food: Food }) {
  return (
    <>
      <p className="font-medium">{food.name}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {FOOD_CATEGORY_LABELS[food.category]}
      </p>
      <p className="text-sm">
        {Math.round(food.kcal)} kcal · P {formatDecimal(food.protein)} g · KH{' '}
        {formatDecimal(food.carbs)} g · F {formatDecimal(food.fat)} g
        <span className="text-slate-500 dark:text-slate-400"> pro 100 g</span>
      </p>
    </>
  );
}
