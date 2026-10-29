import { estimateKcal, isEnergyPlausible, usdaCarbsToEu } from './nutrientCheck';

describe('estimateKcal', () => {
  it('rechnet mit EU-Faktoren', () => {
    expect(estimateKcal({ protein: 10, carbs: 10, fat: 10, fiber: 10, alcohol: 10 })).toBe(
      40 + 40 + 90 + 20 + 70,
    );
  });
});

describe('isEnergyPlausible', () => {
  const oats = { kcal: 379, protein: 13.2, carbs: 57.6, fat: 6.5, fiber: 10.1, alcohol: 0 };

  it('akzeptiert stimmige Werte', () => {
    expect(isEnergyPlausible(oats)).toBe(true);
    expect(isEnergyPlausible({ ...oats, kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 })).toBe(
      true,
    );
  });

  it('erkennt deutlich abweichende Werte', () => {
    expect(isEnergyPlausible({ ...oats, kcal: 200 })).toBe(false);
    expect(isEnergyPlausible({ ...oats, fat: 30 })).toBe(false);
  });

  it('berücksichtigt Alkohol', () => {
    const beer = { kcal: 43, protein: 0.5, carbs: 3.6, fat: 0, fiber: 0, alcohol: 3.9 };
    expect(isEnergyPlausible(beer)).toBe(true);
    expect(isEnergyPlausible({ ...beer, alcohol: 0, kcal: 100 })).toBe(false);
  });
});

describe('usdaCarbsToEu', () => {
  it('zieht Ballaststoffe ab, nie unter 0', () => {
    expect(usdaCarbsToEu(67.7, 10.1)).toBeCloseTo(57.6);
    expect(usdaCarbsToEu(1, 3)).toBe(0);
  });
});
