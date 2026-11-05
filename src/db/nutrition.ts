import { shiftDay } from '../domain/daily';
import { sessionDay } from '../domain/endurance';
import {
  burnedCalories,
  FREQUENT_DAYS,
  frequentFoodIds,
  pickNutrients,
  recentFoodIds,
  scaleNutrients,
  sumNutrients,
} from '../domain/nutrition';
import { getDailyLog } from './daily';
import { db } from './database';
import { loadFoodMap } from './foods';
import { create, listActive, softDelete, update } from './repository';
import { dayKeySchema, mealAmountSchema, savedMealNameSchema, type MealAmount } from './schemas';
import { loadTrainingDays } from './supplements';
import type { DayKey, MealEntry, MealType, Nutrients, SavedMeal } from './types';

const isActive = (entity: { deletedAt: string | null }) => entity.deletedAt === null;

export function listMealEntries(date: DayKey): Promise<MealEntry[]> {
  return db.mealEntries.where('date').equals(date).filter(isActive).toArray();
}

export interface NutritionDayData {
  entries: MealEntry[];
  /** Für „Wie gestern“ */
  previous: MealEntry[];
  isTrainingDay: boolean;
  /** Kalorien der Ausdauer-Einheiten an dem Tag */
  burnedKcal: number;
  /** Schnell erfasstes Protein ohne Lebensmittel (`DailyLog.proteinGrams`) */
  quickProteinGrams: number;
}

export async function loadNutritionDay(date: DayKey): Promise<NutritionDayData> {
  const [entries, previous, trainingDays, sessions, log] = await Promise.all([
    listMealEntries(date),
    listMealEntries(shiftDay(date, -1)),
    loadTrainingDays(),
    listActive(db.enduranceSessions),
    getDailyLog(date),
  ]);
  return {
    entries,
    previous,
    isTrainingDay: trainingDays.has(date),
    burnedKcal: burnedCalories(sessions.filter((session) => sessionDay(session) === date)),
    quickProteinGrams: log?.proteinGrams ?? 0,
  };
}

/** Name und Nährwerte werden kopiert; spätere Änderungen am Lebensmittel ändern den Eintrag nicht */
export async function addMealEntry(
  date: DayKey,
  meal: MealType,
  foodId: string,
  amount: MealAmount,
): Promise<MealEntry> {
  const key = dayKeySchema.parse(date);
  const { grams, portion } = mealAmountSchema.parse(amount);
  return db.transaction('rw', [db.foods, db.mealEntries], async () => {
    const food = await db.foods.get(foodId);
    if (!food || !isActive(food)) throw new Error('Lebensmittel nicht gefunden');
    return create<MealEntry>(db.mealEntries, {
      date: key,
      meal,
      foodId,
      name: food.name,
      grams,
      portion,
      nutrients: pickNutrients(food),
    });
  });
}

export async function updateMealEntry(
  id: string,
  changes: { amount?: MealAmount; meal?: MealType },
): Promise<void> {
  const amount = changes.amount && mealAmountSchema.parse(changes.amount);
  await update(db.mealEntries, id, {
    ...(amount ?? {}),
    ...(changes.meal ? { meal: changes.meal } : {}),
  });
}

export function deleteMealEntry(id: string): Promise<void> {
  return softDelete(db.mealEntries, id);
}

/** „Wie gestern“: kopiert die Einträge einer Mahlzeit unverändert; gibt die Anzahl zurück */
export async function copyMeal(from: DayKey, to: DayKey, meal: MealType): Promise<number> {
  const key = dayKeySchema.parse(to);
  return db.transaction('rw', db.mealEntries, async () => {
    const source = (await listMealEntries(from))
      .filter((entry) => entry.meal === meal)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    for (const { foodId, name, grams, portion, nutrients } of source) {
      await create<MealEntry>(db.mealEntries, {
        date: key,
        meal,
        foodId,
        name,
        grams,
        portion,
        nutrients,
      });
    }
    return source.length;
  });
}

export interface FoodUsage {
  recent: string[];
  frequent: string[];
}

/** Für die Schnellauswahl: Einträge der letzten `FREQUENT_DAYS` Tage */
export async function loadFoodUsage(today: DayKey): Promise<FoodUsage> {
  const entries = await db.mealEntries
    .where('date')
    .aboveOrEqual(shiftDay(today, -FREQUENT_DAYS))
    .filter(isActive)
    .toArray();
  return { recent: recentFoodIds(entries), frequent: frequentFoodIds(entries) };
}

// ---------- Lieblingsmahlzeiten ----------

export interface LoadedSavedMeal {
  savedMeal: SavedMeal;
  names: string[];
  total: Nutrients;
}

export async function listSavedMeals(): Promise<LoadedSavedMeal[]> {
  const [meals, foods] = await Promise.all([
    db.savedMeals.filter(isActive).toArray(),
    loadFoodMap(),
  ]);
  return meals
    .sort((a, b) => a.name.localeCompare(b.name, 'de'))
    .map((savedMeal) => {
      const items = savedMeal.items.flatMap((item) => {
        const food = foods.get(item.foodId);
        return food ? [{ food, grams: item.grams }] : [];
      });
      return {
        savedMeal,
        names: items.map(({ food }) => food.name),
        total: sumNutrients(items.map(({ food, grams }) => scaleNutrients(food, grams))),
      };
    });
}

/** Speichert die Einträge einer Mahlzeit als Lieblingsmahlzeit */
export async function saveMeal(name: string, date: DayKey, meal: MealType): Promise<SavedMeal> {
  const title = savedMealNameSchema.parse(name);
  return db.transaction('rw', [db.mealEntries, db.savedMeals], async () => {
    const entries = (await listMealEntries(date))
      .filter((entry) => entry.meal === meal)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    if (entries.length === 0) throw new Error('Die Mahlzeit ist leer');
    return create<SavedMeal>(db.savedMeals, {
      name: title,
      items: entries.map(({ foodId, grams, portion }) => ({
        id: crypto.randomUUID(),
        foodId,
        grams,
        portion,
      })),
    });
  });
}

/** Trägt eine Lieblingsmahlzeit mit den aktuellen Nährwerten ein; gibt die Anzahl zurück */
export async function applySavedMeal(id: string, date: DayKey, meal: MealType): Promise<number> {
  const key = dayKeySchema.parse(date);
  return db.transaction('rw', [db.foods, db.savedMeals, db.mealEntries], async () => {
    const savedMeal = await db.savedMeals.get(id);
    if (!savedMeal || !isActive(savedMeal)) throw new Error('Lieblingsmahlzeit nicht gefunden');
    const foods = await loadFoodMap();
    let count = 0;
    for (const { foodId, grams, portion } of savedMeal.items) {
      const food = foods.get(foodId);
      if (!food) continue;
      await create<MealEntry>(db.mealEntries, {
        date: key,
        meal,
        foodId,
        name: food.name,
        grams,
        portion,
        nutrients: pickNutrients(food),
      });
      count++;
    }
    return count;
  });
}

export function deleteSavedMeal(id: string): Promise<void> {
  return softDelete(db.savedMeals, id);
}
