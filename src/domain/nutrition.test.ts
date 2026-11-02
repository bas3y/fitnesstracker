import { NUTRITION_GOAL_DEFAULTS } from '../db/schemas';
import type { MealEntry, Nutrients } from '../db/types';
import {
  defaultMealAmount,
  formatMealAmount,
  formatNutrientLine,
  frequentFoodIds,
  goalForDay,
  nutritionDay,
  portionAmount,
  proteinPerKg,
  recentFoodIds,
  recipeFoodValues,
  recipeNutrition,
  scaleNutrients,
  sumNutrients,
  ZERO_NUTRIENTS,
} from './nutrition';

const oats: Nutrients = {
  kcal: 379,
  protein: 13.2,
  carbs: 57.6,
  fat: 6.5,
  fiber: 10.1,
  sugar: 1,
  alcohol: 0,
};
const milk: Nutrients = {
  kcal: 64,
  protein: 3.3,
  carbs: 4.8,
  fat: 3.5,
  fiber: 0,
  sugar: 4.8,
  alcohol: 0,
};
const egg: Nutrients = { ...ZERO_NUTRIENTS, kcal: 143, protein: 12.6, fat: 9.5, carbs: 0.7 };

function entry(
  meal: MealEntry['meal'],
  nutrients: Nutrients,
  grams: number,
  createdAt = '2026-11-02T08:00:00.000Z',
): Pick<MealEntry, 'meal' | 'grams' | 'nutrients' | 'createdAt'> {
  return { meal, nutrients, grams, createdAt };
}

describe('Nährwerte', () => {
  it('rechnet Werte pro 100 g auf die Menge um', () => {
    expect(scaleNutrients(oats, 50)).toMatchObject({ kcal: 189.5, protein: 6.6, fiber: 5.05 });
    expect(scaleNutrients(oats, 0)).toEqual(ZERO_NUTRIENTS);
  });

  it('summiert mehrere Werte', () => {
    expect(sumNutrients([])).toEqual(ZERO_NUTRIENTS);
    expect(sumNutrients([oats, milk]).kcal).toBe(443);
  });
});

describe('nutritionDay', () => {
  it('summiert je Mahlzeit und den ganzen Tag (3 Mahlzeiten)', () => {
    const day = nutritionDay([
      entry('breakfast', oats, 60, '2026-11-02T07:00:00.000Z'),
      entry('breakfast', milk, 200, '2026-11-02T07:01:00.000Z'),
      entry('lunch', egg, 120),
      entry('dinner', oats, 100),
    ]);
    expect(day.meals.breakfast.total.kcal).toBeCloseTo(227.4 + 128);
    expect(day.meals.breakfast.total.protein).toBeCloseTo(7.92 + 6.6);
    expect(day.meals.lunch.total.kcal).toBeCloseTo(171.6);
    expect(day.meals.dinner.total.kcal).toBe(379);
    expect(day.meals.snack).toEqual({ entries: [], total: ZERO_NUTRIENTS });
    expect(day.total.kcal).toBeCloseTo(227.4 + 128 + 171.6 + 379);
    expect(day.total.protein).toBeCloseTo(7.92 + 6.6 + 15.12 + 13.2);
  });

  it('sortiert Einträge in der Reihenfolge des Eintragens', () => {
    const later = entry('snack', milk, 100, '2026-11-02T10:00:00.000Z');
    const earlier = entry('snack', egg, 60, '2026-11-02T09:00:00.000Z');
    expect(nutritionDay([later, earlier]).meals.snack.entries).toEqual([earlier, later]);
  });
});

describe('Ziele', () => {
  it('wählt die Ziele für Trainings- und Ruhetag', () => {
    expect(goalForDay(NUTRITION_GOAL_DEFAULTS, true)).toBe(NUTRITION_GOAL_DEFAULTS.training);
    expect(goalForDay(NUTRITION_GOAL_DEFAULTS, false)).toBe(NUTRITION_GOAL_DEFAULTS.rest);
  });

  it('rechnet Protein in g pro kg Körpergewicht', () => {
    expect(proteinPerKg(150, 80)).toBe(1.9);
    expect(proteinPerKg(150, null)).toBeNull();
  });
});

describe('Rezepte', () => {
  const foods = new Map([
    ['oats', oats],
    ['milk', milk],
  ]);

  it('verteilt die Nährwerte auf das Gewicht nach dem Kochen', () => {
    const nutrition = recipeNutrition(
      {
        ingredients: [
          { id: 'a', foodId: 'oats', grams: 100 },
          { id: 'b', foodId: 'milk', grams: 300 },
        ],
        cookedWeightGrams: 500,
        servings: 2,
      },
      foods,
    );
    expect(nutrition.total.kcal).toBe(379 + 192);
    expect(nutrition.rawGrams).toBe(400);
    expect(nutrition.totalGrams).toBe(500);
    expect(nutrition.per100.kcal).toBeCloseTo(114.2);
    expect(nutrition.portionGrams).toBe(250);
    expect(nutrition.missing).toBe(0);
  });

  it('nimmt ohne Gewicht nach dem Kochen die Summe der Zutaten und zählt fehlende Zutaten', () => {
    const nutrition = recipeNutrition(
      {
        ingredients: [
          { id: 'a', foodId: 'oats', grams: 50 },
          { id: 'b', foodId: 'gone', grams: 30 },
        ],
        cookedWeightGrams: null,
        servings: 1,
      },
      foods,
    );
    expect(nutrition.totalGrams).toBe(50);
    expect(nutrition.per100.kcal).toBeCloseTo(379);
    expect(nutrition.missing).toBe(1);
  });

  it('liefert gerundete Werte pro 100 g und eine Portion', () => {
    const values = recipeFoodValues(
      {
        ingredients: [{ id: 'a', foodId: 'milk', grams: 300 }],
        cookedWeightGrams: 270,
        servings: 4,
      },
      foods,
    );
    expect(values.kcal).toBe(71.1);
    expect(values.protein).toBe(3.7);
    expect(values.portions).toEqual([{ label: '1 Portion', grams: 67.5 }]);
  });
});

describe('Mengen', () => {
  it('rechnet Portionen in Gramm um', () => {
    expect(portionAmount({ label: '1 Ei', grams: 60 }, 2)).toEqual({
      grams: 120,
      portion: { label: '1 Ei', grams: 60, count: 2 },
    });
  });

  it('startet mit der ersten Portion, sonst mit 100 g', () => {
    expect(defaultMealAmount([{ label: '1 Ei', grams: 60 }])).toEqual(
      portionAmount({ label: '1 Ei', grams: 60 }, 1),
    );
    expect(defaultMealAmount([])).toEqual({ grams: 100, portion: null });
  });

  it('formatiert Mengen', () => {
    expect(formatMealAmount({ grams: 150, portion: null })).toBe('150 g');
    expect(formatMealAmount({ grams: 2.5, portion: null })).toBe('2,5 g');
    expect(formatMealAmount(portionAmount({ label: '1 Ei', grams: 60 }, 1))).toBe('1 Ei (60 g)');
    expect(formatMealAmount(portionAmount({ label: '1 EL', grams: 10 }, 1.5))).toBe(
      '1,5 × 1 EL (15 g)',
    );
    expect(formatNutrientLine(scaleNutrients(oats, 50))).toBe('190 kcal · P 6,6 g');
  });
});

describe('Schnellauswahl', () => {
  const uses = [
    { foodId: 'oats', createdAt: '2026-11-01T07:00:00.000Z' },
    { foodId: 'milk', createdAt: '2026-11-01T07:01:00.000Z' },
    { foodId: 'egg', createdAt: '2026-11-02T08:00:00.000Z' },
    { foodId: 'oats', createdAt: '2026-11-02T07:00:00.000Z' },
    { foodId: 'milk', createdAt: '2026-10-30T07:00:00.000Z' },
  ];

  it('listet zuletzt verwendete ohne Doppelte, neueste zuerst', () => {
    expect(recentFoodIds(uses)).toEqual(['egg', 'oats', 'milk']);
    expect(recentFoodIds(uses, 2)).toEqual(['egg', 'oats']);
  });

  it('listet häufig verwendete ab 2 Einträgen, bei Gleichstand das zuletzt verwendete', () => {
    expect(frequentFoodIds(uses)).toEqual(['oats', 'milk']);
    expect(frequentFoodIds(uses, 8, 1)).toEqual(['oats', 'milk', 'egg']);
  });
});
