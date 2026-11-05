import { findDuplicateName } from '../domain/exercises';
import { pickNutrients, recipeFoodValues } from '../domain/nutrition';
import { db } from './database';
import { create, nowIso, softDelete, update } from './repository';
import {
  foodInputSchema,
  recipeInputSchema,
  type FoodInput,
  type RecipeInput,
  type RecipeValues,
} from './schemas';
import type { Food, Nutrients, Recipe } from './types';

/** Startwerte der Nutzerfelder; der Seed fasst sie bei mitgelieferten Lebensmitteln nie an */
export const FOOD_USER_DEFAULTS: Pick<Food, 'isFavorite' | 'hiddenAt' | 'recipe' | 'barcode'> = {
  isFavorite: false,
  hiddenAt: null,
  recipe: null,
  barcode: null,
};

/** Alle Lebensmittel, auch gelöschte: Rezepte und Lieblingsmahlzeiten rechnen mit ihnen weiter */
export async function loadFoodMap(): Promise<Map<string, Food>> {
  return new Map((await db.foods.toArray()).map((food) => [food.id, food]));
}

export function listActiveFoods(): Promise<Food[]> {
  return db.foods.filter((food) => food.deletedAt === null).toArray();
}

async function assertUniqueName(name: string, exceptId?: string) {
  const active = await listActiveFoods();
  if (findDuplicateName(name, active, exceptId)) {
    throw new Error(`Es gibt bereits ein Lebensmittel „${name}“`);
  }
}

async function getUserFood(id: string): Promise<Food> {
  const food = await db.foods.get(id);
  if (!food || food.deletedAt !== null) throw new Error('Lebensmittel nicht gefunden');
  if (food.source !== 'user') throw new Error('Mitgelieferte Lebensmittel sind nicht änderbar');
  return food;
}

/** Aktives Lebensmittel mit diesem (normalisierten) Strichcode – funktioniert ohne Internet */
export async function findFoodByBarcode(code: string): Promise<Food | undefined> {
  const matches = await db.foods.where('barcode').equals(code).toArray();
  return matches.find((food) => food.deletedAt === null);
}

async function assertUniqueBarcode(barcode: string | null, exceptId?: string) {
  if (barcode === null) return;
  const existing = await findFoodByBarcode(barcode);
  if (existing && existing.id !== exceptId) {
    throw new Error(`Der Strichcode gehört schon zu „${existing.name}“`);
  }
}

/** `sourceRef` z. B. `off:<Strichcode>`, wenn die Werte von Open Food Facts stammen */
export async function createUserFood(
  input: FoodInput,
  { sourceRef = null }: { sourceRef?: string | null } = {},
): Promise<Food> {
  const values = foodInputSchema.parse(input);
  return db.transaction('rw', db.foods, async () => {
    await assertUniqueName(values.name);
    await assertUniqueBarcode(values.barcode);
    return create<Food>(db.foods, {
      ...FOOD_USER_DEFAULTS,
      ...values,
      source: 'user',
      builtinKey: null,
      sourceRef,
    });
  });
}

/** Rezepte mit diesem Lebensmittel werden neu berechnet */
export async function updateUserFood(id: string, input: FoodInput): Promise<void> {
  const values = foodInputSchema.parse(input);
  return db.transaction('rw', db.foods, async () => {
    const food = await getUserFood(id);
    if (food.recipe) throw new Error('Rezepte über das Rezept-Formular ändern');
    await assertUniqueName(values.name, id);
    await assertUniqueBarcode(values.barcode, id);
    await update(db.foods, id, values);
    await refreshRecipes();
  });
}

/** Soft-Delete: Einträge, Rezepte und Lieblingsmahlzeiten behalten ihre Werte */
export function deleteUserFood(id: string): Promise<void> {
  return db.transaction('rw', db.foods, async () => {
    await getUserFood(id);
    await softDelete(db.foods, id);
  });
}

export function setFoodFavorite(id: string, isFavorite: boolean): Promise<void> {
  return update(db.foods, id, { isFavorite });
}

/** Ausblenden statt Löschen (v. a. für mitgelieferte Lebensmittel) */
export function setFoodHidden(id: string, hidden: boolean): Promise<void> {
  return update(db.foods, id, { hiddenAt: hidden ? nowIso() : null });
}

// ---------- Rezepte ----------

function recipeOf(values: RecipeValues): Recipe {
  const { ingredients, cookedWeightGrams, servings } = values;
  return { ingredients, cookedWeightGrams, servings };
}

function nutrientMap(foods: Map<string, Food>): Map<string, Nutrients> {
  return new Map([...foods].map(([id, food]) => [id, pickNutrients(food)]));
}

async function validateRecipe(input: RecipeInput, exceptId?: string) {
  const values = recipeInputSchema.parse(input);
  await assertUniqueName(values.name, exceptId);
  const foods = await loadFoodMap();
  for (const { foodId } of values.ingredients) {
    const food = foods.get(foodId);
    if (!food) throw new Error('Zutat nicht gefunden');
    if (food.recipe) throw new Error('Rezepte können keine anderen Rezepte enthalten');
  }
  const recipe = recipeOf(values);
  return { name: values.name, recipe, ...recipeFoodValues(recipe, nutrientMap(foods)) };
}

export function createRecipe(input: RecipeInput): Promise<Food> {
  return db.transaction('rw', db.foods, async () => {
    const { name, recipe, ...values } = await validateRecipe(input);
    return create<Food>(db.foods, {
      ...values,
      name,
      aliases: [],
      category: 'dishes',
      source: 'user',
      builtinKey: null,
      sourceRef: null,
      ...FOOD_USER_DEFAULTS,
      recipe,
    });
  });
}

export function updateRecipe(id: string, input: RecipeInput): Promise<void> {
  return db.transaction('rw', db.foods, async () => {
    const food = await getUserFood(id);
    if (!food.recipe) throw new Error('Kein Rezept');
    await update(db.foods, id, await validateRecipe(input, id));
  });
}

/**
 * Berechnet die Nährwerte aller Rezepte aus den aktuellen Zutaten neu (nach Änderungen an einem
 * Lebensmittel oder neuen mitgelieferten Daten). Muss in einer Transaktion mit `db.foods` laufen.
 */
export async function refreshRecipes(): Promise<void> {
  const foods = await loadFoodMap();
  const nutrients = nutrientMap(foods);
  for (const food of foods.values()) {
    if (!food.recipe || food.deletedAt !== null) continue;
    const values = recipeFoodValues(food.recipe, nutrients);
    const record = food as unknown as Record<string, unknown>;
    const changed = Object.entries(values).some(
      ([field, value]) => JSON.stringify(record[field]) !== JSON.stringify(value),
    );
    if (changed) await update(db.foods, food.id, values);
  }
}
