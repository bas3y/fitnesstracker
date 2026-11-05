import { dayKey } from '../domain/daily';
import { addProtein } from './daily';
import { db } from './database';
import {
  createRecipe,
  createUserFood,
  deleteUserFood,
  setFoodFavorite,
  setFoodHidden,
  updateRecipe,
  updateUserFood,
} from './foods';
import {
  addMealEntry,
  applySavedMeal,
  copyMeal,
  deleteMealEntry,
  deleteSavedMeal,
  listMealEntries,
  listSavedMeals,
  loadFoodUsage,
  loadNutritionDay,
  saveMeal,
  updateMealEntry,
} from './nutrition';
import { EMPTY_FOOD_INPUT, type FoodInput } from './schemas';
import { applySeed, SEED_VERSION } from './seed';
import { resetDatabase } from './testUtils';
import { startWorkout } from './workouts';

beforeEach(resetDatabase);

const OATS: FoodInput = {
  ...EMPTY_FOOD_INPUT,
  name: 'Haferflocken',
  category: 'grains',
  kcal: 379,
  protein: 13.2,
  carbs: 57.6,
  fat: 6.5,
  fiber: 10.1,
  sugar: 1,
  portions: [{ label: '1 Portion', grams: 50 }],
};
const MILK: FoodInput = {
  ...EMPTY_FOOD_INPUT,
  name: 'Milch',
  category: 'dairy',
  kcal: 64,
  protein: 3.3,
  carbs: 4.8,
  fat: 3.5,
  sugar: 4.8,
};

describe('Eigene Lebensmittel', () => {
  it('legt an, ändert, markiert und löscht nur per Soft-Delete', async () => {
    const food = await createUserFood({ ...OATS, aliases: [' Hafer ', ''] });
    expect(food).toMatchObject({
      source: 'user',
      builtinKey: null,
      aliases: ['Hafer'],
      isFavorite: false,
      hiddenAt: null,
      recipe: null,
    });
    await expect(createUserFood({ ...MILK, name: 'haferflocken' })).rejects.toThrow(
      'Es gibt bereits',
    );
    await updateUserFood(food.id, { ...OATS, kcal: 370 });
    await setFoodFavorite(food.id, true);
    await setFoodHidden(food.id, true);
    expect(await db.foods.get(food.id)).toMatchObject({
      kcal: 370,
      isFavorite: true,
      hiddenAt: expect.any(String),
    });
    await deleteUserFood(food.id);
    expect((await db.foods.get(food.id))?.deletedAt).not.toBeNull();
  });

  it('prüft die Nährwerte', async () => {
    await expect(createUserFood({ ...OATS, sugar: 60 })).rejects.toThrow();
    await expect(createUserFood({ ...OATS, fat: 50 })).rejects.toThrow();
  });

  it('erlaubt keine Änderung an mitgelieferten Lebensmitteln', async () => {
    await applySeed(
      {
        exercises: [],
        foods: [{ ...OATS, alcohol: 0, aliases: [], key: 'oats', sourceRef: 'usda:1' }],
      },
      SEED_VERSION,
    );
    const builtin = (await db.foods.toArray())[0]!;
    expect(builtin).toMatchObject({ isFavorite: false, hiddenAt: null, recipe: null });
    await expect(updateUserFood(builtin.id, MILK)).rejects.toThrow('nicht änderbar');
    await expect(deleteUserFood(builtin.id)).rejects.toThrow('nicht änderbar');
  });
});

describe('Rezepte', () => {
  it('berechnet Nährwerte pro 100 g und Portion und rechnet bei Zutatenänderung neu', async () => {
    const oats = await createUserFood(OATS);
    const milk = await createUserFood(MILK);
    const recipe = await createRecipe({
      name: 'Porridge',
      ingredients: [
        { id: 'a', foodId: oats.id, grams: 100 },
        { id: 'b', foodId: milk.id, grams: 300 },
      ],
      cookedWeightGrams: 500,
      servings: 2,
    });
    expect(recipe).toMatchObject({
      category: 'dishes',
      source: 'user',
      kcal: 114.2,
      portions: [{ label: '1 Portion', grams: 250 }],
      recipe: { cookedWeightGrams: 500, servings: 2 },
    });

    await updateUserFood(milk.id, { ...MILK, kcal: 100 });
    expect((await db.foods.get(recipe.id))?.kcal).toBe(135.8);

    // Gelöschte Zutaten zählen weiter
    await deleteUserFood(milk.id);
    await updateRecipe(recipe.id, {
      name: 'Porridge',
      ingredients: recipe.recipe!.ingredients,
      cookedWeightGrams: null,
      servings: 1,
    });
    expect(await db.foods.get(recipe.id)).toMatchObject({
      kcal: 169.8,
      portions: [{ label: '1 Portion', grams: 400 }],
    });
  });

  it('lehnt Rezepte ohne Zutaten und verschachtelte Rezepte ab', async () => {
    const oats = await createUserFood(OATS);
    const base = { cookedWeightGrams: null, servings: 1 };
    await expect(createRecipe({ ...base, name: 'Leer', ingredients: [] })).rejects.toThrow();
    const inner = await createRecipe({
      ...base,
      name: 'Innen',
      ingredients: [{ id: 'a', foodId: oats.id, grams: 50 }],
    });
    await expect(
      createRecipe({
        ...base,
        name: 'Außen',
        ingredients: [{ id: 'a', foodId: inner.id, grams: 50 }],
      }),
    ).rejects.toThrow('keine anderen Rezepte');
  });

  it('wird nach einem Seed mit den neuen Zutatenwerten berechnet', async () => {
    const seedFood = (kcal: number) => ({
      exercises: [],
      foods: [
        {
          ...OATS,
          aliases: [],
          alcohol: 0,
          key: 'oats',
          kcal,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          sugar: 0,
          portions: [],
          sourceRef: null,
        },
      ],
    });
    await applySeed(seedFood(400), 1);
    const oats = (await db.foods.toArray())[0]!;
    const recipe = await createRecipe({
      name: 'Nur Hafer',
      ingredients: [{ id: 'a', foodId: oats.id, grams: 100 }],
      cookedWeightGrams: 200,
      servings: 1,
    });
    expect(recipe.kcal).toBe(200);
    await applySeed(seedFood(300), 2);
    expect((await db.foods.get(recipe.id))?.kcal).toBe(150);
  });
});

describe('Mahlzeiten', () => {
  it('kopiert Name und Nährwerte beim Eintragen, ändert und löscht Einträge', async () => {
    const oats = await createUserFood(OATS);
    const entry = await addMealEntry('2026-11-02', 'breakfast', oats.id, {
      grams: 50,
      portion: { label: '1 Portion', grams: 50, count: 1 },
    });
    expect(entry).toMatchObject({
      name: 'Haferflocken',
      grams: 50,
      nutrients: { kcal: 379, protein: 13.2, alcohol: 0 },
    });
    expect(entry.nutrients).not.toHaveProperty('name');

    // Spätere Änderungen am Lebensmittel ändern den Eintrag nicht
    await updateUserFood(oats.id, { ...OATS, name: 'Hafer neu', kcal: 300 });
    await updateMealEntry(entry.id, { amount: { grams: 80, portion: null }, meal: 'snack' });
    expect(await listMealEntries('2026-11-02')).toMatchObject([
      { name: 'Haferflocken', grams: 80, portion: null, meal: 'snack', nutrients: { kcal: 379 } },
    ]);
    await expect(
      addMealEntry('2026-11-02', 'lunch', oats.id, { grams: 0, portion: null }),
    ).rejects.toThrow();

    await deleteMealEntry(entry.id);
    expect(await listMealEntries('2026-11-02')).toEqual([]);
    await deleteUserFood(oats.id);
    await expect(
      addMealEntry('2026-11-02', 'lunch', oats.id, { grams: 10, portion: null }),
    ).rejects.toThrow('nicht gefunden');
  });

  it('erkennt Trainingstage und lädt den Vortag', async () => {
    const today = dayKey(new Date());
    const oats = await createUserFood(OATS);
    await addMealEntry('2026-11-01', 'dinner', oats.id, { grams: 100, portion: null });
    expect(await loadNutritionDay('2026-11-02')).toMatchObject({
      entries: [],
      previous: [{ meal: 'dinner' }],
      isTrainingDay: false,
    });
    await startWorkout();
    expect((await loadNutritionDay(today)).isTrainingDay).toBe(true);
  });

  it('liefert schnell erfasstes Protein des Tages mit', async () => {
    expect((await loadNutritionDay('2026-11-02')).quickProteinGrams).toBe(0);
    await addProtein('2026-11-02', 30);
    await addProtein('2026-11-02', 20);
    await addProtein('2026-11-03', 10);
    expect((await loadNutritionDay('2026-11-02')).quickProteinGrams).toBe(50);
  });

  it('kopiert eine Mahlzeit vom Vortag („Wie gestern“)', async () => {
    const oats = await createUserFood(OATS);
    const milk = await createUserFood(MILK);
    await addMealEntry('2026-11-01', 'breakfast', oats.id, { grams: 60, portion: null });
    await addMealEntry('2026-11-01', 'breakfast', milk.id, { grams: 200, portion: null });
    await addMealEntry('2026-11-01', 'lunch', milk.id, { grams: 100, portion: null });

    expect(await copyMeal('2026-11-01', '2026-11-02', 'breakfast')).toBe(2);
    const copied = await listMealEntries('2026-11-02');
    expect(copied.map((entry) => [entry.meal, entry.name, entry.grams])).toEqual(
      expect.arrayContaining([
        ['breakfast', 'Haferflocken', 60],
        ['breakfast', 'Milch', 200],
      ]),
    );
    expect(copied).toHaveLength(2);
  });

  it('liefert zuletzt und häufig verwendete Lebensmittel', async () => {
    const oats = await createUserFood(OATS);
    const milk = await createUserFood(MILK);
    await addMealEntry('2026-11-01', 'breakfast', oats.id, { grams: 60, portion: null });
    await addMealEntry('2026-11-02', 'breakfast', oats.id, { grams: 60, portion: null });
    await addMealEntry('2026-11-02', 'breakfast', milk.id, { grams: 200, portion: null });
    // Außerhalb des Zeitraums
    await addMealEntry('2026-01-01', 'breakfast', milk.id, { grams: 200, portion: null });

    expect(await loadFoodUsage('2026-11-02')).toEqual({
      recent: [milk.id, oats.id],
      frequent: [oats.id],
    });
  });
});

describe('Lieblingsmahlzeiten', () => {
  it('speichert eine Mahlzeit und trägt sie mit aktuellen Werten ein', async () => {
    const oats = await createUserFood(OATS);
    const milk = await createUserFood(MILK);
    await addMealEntry('2026-11-01', 'breakfast', oats.id, { grams: 60, portion: null });
    await addMealEntry('2026-11-01', 'breakfast', milk.id, { grams: 200, portion: null });
    await expect(saveMeal('Leer', '2026-11-01', 'dinner')).rejects.toThrow('leer');

    const saved = await saveMeal(' Porridge ', '2026-11-01', 'breakfast');
    expect(saved.name).toBe('Porridge');
    expect(saved.items.map((item) => item.grams)).toEqual([60, 200]);

    await updateUserFood(milk.id, { ...MILK, kcal: 50 });
    const [loaded] = await listSavedMeals();
    expect(loaded).toMatchObject({ names: ['Haferflocken', 'Milch'] });
    expect(loaded!.total.kcal).toBeCloseTo(227.4 + 100);

    expect(await applySavedMeal(saved.id, '2026-11-02', 'snack')).toBe(2);
    const entries = await listMealEntries('2026-11-02');
    expect(entries.every((entry) => entry.meal === 'snack')).toBe(true);
    expect(entries.find((entry) => entry.name === 'Milch')?.nutrients.kcal).toBe(50);

    await deleteSavedMeal(saved.id);
    expect(await listSavedMeals()).toEqual([]);
  });
});
