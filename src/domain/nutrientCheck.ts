// Keine Imports: wird auch vom Daten-Script in scripts/ direkt mit Node geladen

export interface EnergyNutrients {
  kcal: number;
  protein: number;
  /** Kohlenhydrate nach deutscher Angabe, also ohne Ballaststoffe */
  carbs: number;
  fat: number;
  fiber: number;
  alcohol: number;
}

/** Brennwert nach EU-Faktoren (LMIV): Protein/KH 4, Fett 9, Ballaststoffe 2, Alkohol 7 kcal/g */
export function estimateKcal(n: Omit<EnergyNutrients, 'kcal'>): number {
  return 4 * n.protein + 4 * n.carbs + 9 * n.fat + 2 * n.fiber + 7 * n.alcohol;
}

// USDA rechnet mit lebensmittelspezifischen Atwater-Faktoren, daher etwas Toleranz
const ABSOLUTE_TOLERANCE_KCAL = 25;
const RELATIVE_TOLERANCE = 0.2;

export function isEnergyPlausible(n: EnergyNutrients): boolean {
  const deviation = Math.abs(n.kcal - estimateKcal(n));
  return deviation <= Math.max(ABSOLUTE_TOLERANCE_KCAL, RELATIVE_TOLERANCE * n.kcal);
}

/** USDA zählt Ballaststoffe zu den Kohlenhydraten, in der EU werden sie getrennt angegeben */
export function usdaCarbsToEu(carbsByDifference: number, fiber: number): number {
  return Math.max(0, carbsByDifference - fiber);
}
