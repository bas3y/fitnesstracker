import { z } from 'zod';
import { builtinExerciseSchema, builtinFoodSchema } from '../db/schemas';
import { isEnergyPlausible } from '../domain/nutrientCheck';
import { createSearch } from '../domain/search';
import exercisesJson from './exercises.json';
import exercisesRaw from './exercises.json?raw';
import foodsJson from './foods.json';
import foodsRaw from './foods.json?raw';

// Gleiche Liste wie ENERGY_CHECK_EXCEPTIONS in scripts/data/foods.mapping.mjs
const ENERGY_CHECK_EXCEPTIONS = ['oat-bran', 'wheat-bran', 'cocoa-powder', 'baking-powder'];

const exercises = z.array(builtinExerciseSchema).parse(exercisesJson);
const foods = z.array(builtinFoodSchema).parse(foodsJson);

function duplicates(keys: string[]): string[] {
  return keys.filter((key, index) => keys.indexOf(key) !== index);
}

describe('mitgelieferte Daten', () => {
  it('haben den erwarteten Umfang und eindeutige Schlüssel', () => {
    expect(exercises.length).toBeGreaterThanOrEqual(150);
    expect(foods.length).toBeGreaterThanOrEqual(500);
    expect(duplicates(exercises.map((e) => e.key))).toEqual([]);
    expect(duplicates(foods.map((f) => f.key))).toEqual([]);
    expect(duplicates(exercises.map((e) => e.name))).toEqual([]);
  });

  it('führen Calisthenics-Grundübungen als Körpergewichtsübungen (Zusatzgewicht = Satzgewicht)', () => {
    const keys = [
      'pull-up',
      'chin-up',
      'triceps-dips',
      'chest-dips',
      'push-up',
      'sit-up',
      'muscle-up',
    ];
    for (const key of keys) {
      expect(exercises.find((e) => e.key === key)?.equipment, key).toBe('bodyweight');
    }
  });

  it('sind zusammen kleiner als 2 MB', () => {
    const bytes = new Blob([exercisesRaw, foodsRaw]).size;
    expect(bytes).toBeLessThan(2 * 1024 * 1024);
  });

  it('haben plausible Brennwerte (kcal ≈ 4·P + 4·KH + 9·F + 2·Ballaststoffe + 7·Alkohol)', () => {
    const implausible = foods.filter((food) => !isEnergyPlausible(food)).map((food) => food.key);
    expect(implausible.sort()).toEqual([...ENERGY_CHECK_EXCEPTIONS].sort());
  });

  it('haben sinnvolle Makros (Summe ≤ 100 g) und Portionen', () => {
    for (const food of foods) {
      const total = food.protein + food.carbs + food.fat + food.fiber + food.alcohol;
      expect(total, food.key).toBeLessThanOrEqual(101);
      for (const portion of food.portions) expect(portion.grams, food.key).toBeLessThan(2000);
    }
  });

  it('enthalten gängige Suchbegriffe', () => {
    const searchExercises = createSearch(exercises);
    const searchFoods = createSearch(foods);
    expect(searchExercises('Bankdrücken')[0]?.key).toBe('barbell-bench-press');
    expect(searchExercises('bankdrucken')[0]?.key).toBe('barbell-bench-press');
    expect(searchExercises('Kreuzheben')[0]?.key).toBe('barbell-deadlift');
    expect(searchExercises('klimmzug')[0]?.key).toBe('pull-up');
    expect(searchExercises('dips')[0]?.key).toBe('triceps-dips');
    expect(searchExercises('weighted pull ups')[0]?.key).toBe('pull-up');
    expect(searchExercises('l sitz')[0]?.key).toBe('l-sit');
    expect(searchFoods('Haferflocken')[0]?.key).toBe('oats');
    expect(searchFoods('magerquark')[0]?.key).toBe('quark-lowfat');
    expect(searchFoods('hahnchenbrust').map((f) => f.key)).toContain('chicken-breast');
  });
});
