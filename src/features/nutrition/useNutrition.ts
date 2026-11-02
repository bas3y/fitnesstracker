import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { listActiveFoods, loadFoodMap } from '../../db/foods';
import { listSavedMeals, loadFoodUsage, loadNutritionDay } from '../../db/nutrition';
import type { DayKey } from '../../db/types';

export function useNutritionDay(date: DayKey) {
  return useLiveQuery(() => loadNutritionDay(date), [date]);
}

export function useActiveFoods() {
  return useLiveQuery(listActiveFoods, []);
}

/** Alle Lebensmittel, auch gelöschte (Namen von Rezept-Zutaten) */
export function useFoodMap() {
  return useLiveQuery(loadFoodMap, []);
}

/** `undefined` = lädt, `null` = gibt es nicht (mehr) */
export function useFood(id: string | undefined) {
  return useLiveQuery(async () => {
    const food = id ? await db.foods.get(id) : undefined;
    return food && food.deletedAt === null ? food : null;
  }, [id]);
}

export function useFoodUsage(today: DayKey) {
  return useLiveQuery(() => loadFoodUsage(today), [today]);
}

export function useSavedMeals() {
  return useLiveQuery(listSavedMeals, []);
}
