import type { MealAmount } from '../db/schemas';
import type {
  FoodPortion,
  MealEntry,
  MealType,
  Nutrients,
  NutritionGoal,
  NutritionGoals,
  Recipe,
  Settings,
} from '../db/types';
import { MEAL_TYPES } from '../db/types';
import { formatDecimal } from './format';
import { roundTo } from './units';

export const NUTRIENT_KEYS = [
  'kcal',
  'protein',
  'carbs',
  'fat',
  'fiber',
  'sugar',
  'alcohol',
] as const satisfies readonly (keyof Nutrients)[];

export const ZERO_NUTRIENTS: Nutrients = {
  kcal: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
  sugar: 0,
  alcohol: 0,
};

function mapNutrients(fn: (key: keyof Nutrients) => number): Nutrients {
  return Object.fromEntries(NUTRIENT_KEYS.map((key) => [key, fn(key)])) as unknown as Nutrients;
}

/** Nur die Nährwerte eines Lebensmittels (ohne weitere Felder) */
export function pickNutrients(source: Nutrients): Nutrients {
  return mapNutrients((key) => source[key]);
}

/** Werte pro 100 g → Werte für `grams` */
export function scaleNutrients(per100: Nutrients, grams: number): Nutrients {
  return mapNutrients((key) => (per100[key] * grams) / 100);
}

export function sumNutrients(list: Nutrients[]): Nutrients {
  return mapNutrients((key) => list.reduce((sum, item) => sum + item[key], 0));
}

export function roundNutrients(values: Nutrients, decimals = 1): Nutrients {
  return mapNutrients((key) => roundTo(values[key], decimals));
}

export function entryNutrients(entry: Pick<MealEntry, 'grams' | 'nutrients'>): Nutrients {
  return scaleNutrients(entry.nutrients, entry.grams);
}

// ---------- Tag ----------

export interface MealSummary<T> {
  entries: T[];
  total: Nutrients;
}

export interface NutritionDay<T> {
  total: Nutrients;
  meals: Record<MealType, MealSummary<T>>;
}

/** Summen je Mahlzeit und Tag; Einträge in der Reihenfolge des Eintragens */
export function nutritionDay<
  T extends Pick<MealEntry, 'meal' | 'grams' | 'nutrients' | 'createdAt'>,
>(entries: T[]): NutritionDay<T> {
  const sorted = [...entries].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const meals = Object.fromEntries(
    MEAL_TYPES.map((meal) => {
      const items = sorted.filter((entry) => entry.meal === meal);
      return [meal, { entries: items, total: sumNutrients(items.map(entryNutrients)) }];
    }),
  ) as Record<MealType, MealSummary<T>>;
  return { total: sumNutrients(MEAL_TYPES.map((meal) => meals[meal].total)), meals };
}

/** Summe des Tages: Mahlzeiten plus schnell erfasstes Protein (zählt nicht zu den Kalorien) */
export function dayNutrients(
  entries: Pick<MealEntry, 'meal' | 'grams' | 'nutrients' | 'createdAt'>[],
  quickProteinGrams: number,
): Nutrients {
  const { total } = nutritionDay(entries);
  return { ...total, protein: total.protein + quickProteinGrams };
}

/** Trainingstag = an dem Tag gibt es ein Workout oder eine Ausdauer-Einheit */
export function goalForDay(goals: NutritionGoals, isTrainingDay: boolean): NutritionGoal {
  return isTrainingDay ? goals.training : goals.rest;
}

/** Ziel des Tages; mit `addBurnedCalories` steigt das kcal-Ziel um die verbrannten Kalorien */
export function dayGoal(
  settings: Pick<Settings, 'nutritionGoals' | 'addBurnedCalories'>,
  day: { isTrainingDay: boolean; burnedKcal: number },
): NutritionGoal {
  const goal = goalForDay(settings.nutritionGoals, day.isTrainingDay);
  return settings.addBurnedCalories && day.burnedKcal > 0
    ? { ...goal, kcal: goal.kcal + day.burnedKcal }
    : goal;
}

/** Kalorien der Ausdauer-Einheiten (laut Uhr oder eingetragen) */
export function burnedCalories(sessions: readonly { calories: number | null }[]): number {
  return sessions.reduce((sum, session) => sum + (session.calories ?? 0), 0);
}

/** Protein in g pro kg Körpergewicht; `null` ohne Körpergewicht */
export function proteinPerKg(proteinGrams: number, bodyWeightKg: number | null): number | null {
  if (!bodyWeightKg || bodyWeightKg <= 0) return null;
  return roundTo(proteinGrams / bodyWeightKg, 1);
}

// ---------- Rezepte ----------

export interface RecipeNutrition {
  /** Summe der Zutaten */
  total: Nutrients;
  per100: Nutrients;
  rawGrams: number;
  /** Gewicht nach dem Kochen bzw. Summe der Zutaten */
  totalGrams: number;
  portionGrams: number;
  /** Zutaten, deren Lebensmittel es nicht mehr gibt (zählen nicht mit) */
  missing: number;
}

/**
 * Nährwerte eines Rezepts. Wasser, das beim Kochen verdampft oder aufgenommen wird, ändert nur das
 * Gewicht: Die Nährwerte der Zutaten verteilen sich auf das Gewicht nach dem Kochen.
 */
export function recipeNutrition(
  recipe: Recipe,
  foods: ReadonlyMap<string, Nutrients>,
): RecipeNutrition {
  const found = recipe.ingredients.flatMap((ingredient) => {
    const food = foods.get(ingredient.foodId);
    return food ? [{ food, grams: ingredient.grams }] : [];
  });
  const total = sumNutrients(found.map(({ food, grams }) => scaleNutrients(food, grams)));
  const rawGrams = found.reduce((sum, { grams }) => sum + grams, 0);
  const totalGrams = recipe.cookedWeightGrams ?? rawGrams;
  return {
    total,
    per100: totalGrams > 0 ? scaleNutrients(total, 10_000 / totalGrams) : { ...ZERO_NUTRIENTS },
    rawGrams,
    totalGrams,
    portionGrams: totalGrams / Math.max(1, recipe.servings),
    missing: recipe.ingredients.length - found.length,
  };
}

export const RECIPE_PORTION_LABEL = '1 Portion';

/** Gespeicherte Felder eines Rezepts als Lebensmittel (pro 100 g, eine Portion) */
export function recipeFoodValues(
  recipe: Recipe,
  foods: ReadonlyMap<string, Nutrients>,
): Nutrients & { portions: FoodPortion[] } {
  const nutrition = recipeNutrition(recipe, foods);
  const portionGrams = roundTo(nutrition.portionGrams, 1);
  return {
    ...roundNutrients(nutrition.per100),
    portions: portionGrams > 0 ? [{ label: RECIPE_PORTION_LABEL, grams: portionGrams }] : [],
  };
}

// ---------- Mengen ----------

/** Startmenge beim Auswählen: erste Portion, sonst 100 g */
export function defaultMealAmount(portions: FoodPortion[]): MealAmount {
  const [portion] = portions;
  return portion ? portionAmount(portion, 1) : { grams: 100, portion: null };
}

export function portionAmount(portion: FoodPortion, count: number): MealAmount {
  return {
    grams: roundTo(portion.grams * count, 1),
    portion: { label: portion.label, grams: portion.grams, count },
  };
}

export function formatGrams(grams: number): string {
  return `${formatDecimal(grams, grams < 10 ? 1 : 0)} g`;
}

export function formatMealAmount({ grams, portion }: MealAmount): string {
  if (!portion) return formatGrams(grams);
  const label =
    portion.count === 1 ? portion.label : `${formatDecimal(portion.count, 2)} × ${portion.label}`;
  return `${label} (${formatGrams(grams)})`;
}

export function formatKcal(kcal: number): string {
  return `${formatDecimal(Math.round(kcal), 0)} kcal`;
}

/** Kurzinfo „250 kcal · P 12 g“ */
export function formatNutrientLine(values: Nutrients): string {
  return `${formatKcal(values.kcal)} · P ${formatGrams(values.protein)}`;
}

// ---------- Schnellauswahl ----------

/** Zeitraum für „Häufig verwendet“ */
export const FREQUENT_DAYS = 90;
export const QUICK_LIST_LIMIT = 8;

type Usage = Pick<MealEntry, 'foodId' | 'createdAt'>;

/** Zuletzt eingetragene Lebensmittel, neueste zuerst, ohne Doppelte */
export function recentFoodIds(entries: Usage[], limit = QUICK_LIST_LIMIT): string[] {
  const sorted = [...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return [...new Set(sorted.map((entry) => entry.foodId))].slice(0, limit);
}

/** Am häufigsten eingetragene Lebensmittel (ab 2 Einträgen), bei Gleichstand das zuletzt verwendete */
export function frequentFoodIds(entries: Usage[], limit = QUICK_LIST_LIMIT, minUses = 2): string[] {
  const stats = new Map<string, { count: number; last: string }>();
  for (const { foodId, createdAt } of entries) {
    const current = stats.get(foodId);
    stats.set(foodId, {
      count: (current?.count ?? 0) + 1,
      last: current && current.last > createdAt ? current.last : createdAt,
    });
  }
  return [...stats]
    .filter(([, { count }]) => count >= minUses)
    .sort(([, a], [, b]) => b.count - a.count || b.last.localeCompare(a.last))
    .slice(0, limit)
    .map(([foodId]) => foodId);
}
