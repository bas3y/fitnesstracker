import { foodInputSchema } from '../db/schemas';
import { offCategory, offProductUrl, parseOffResponse } from './openFoodFacts';

const SKYR = {
  code: '4006381333931',
  status: 1,
  product: {
    product_name: 'Skyr Natur',
    product_name_de: 'Skyr natur',
    brands: 'Milbona, Lidl',
    categories_tags: ['en:dairies', 'en:fermented-foods', 'en:yogurts'],
    serving_quantity: '150',
    serving_quantity_unit: 'g',
    nutriments: {
      'energy-kcal_100g': 63,
      'energy-kj_100g': 266,
      proteins_100g: 11,
      carbohydrates_100g: 4,
      sugars_100g: 4,
      fat_100g: 0.2,
      fiber_100g: '0',
    },
  },
};

describe('Open Food Facts', () => {
  it('fragt nur die Nummer und die nötigen Felder ab', () => {
    const url = offProductUrl('4006381333931');
    expect(url).toMatch(
      /^https:\/\/world\.openfoodfacts\.org\/api\/v2\/product\/4006381333931\.json\?fields=/,
    );
    expect(url).toContain('nutriments');
  });

  it('übernimmt Name, Marke, Nährwerte pro 100 g, Portion und Kategorie', () => {
    const result = parseOffResponse(SKYR);
    expect(result).toEqual({
      status: 'found',
      hasNutrients: true,
      input: {
        name: 'Skyr natur (Milbona)',
        aliases: [],
        category: 'dairy',
        kcal: 63,
        protein: 11,
        carbs: 4,
        sugar: 4,
        fat: 0.2,
        fiber: 0,
        alcohol: 0,
        portions: [{ label: '1 Portion', grams: 150 }],
      },
    });
    if (result.status === 'found')
      expect(foodInputSchema.safeParse(result.input).success).toBe(true);
  });

  it('rechnet kJ in kcal und Alkohol in g um, Zucker höchstens Kohlenhydrate', () => {
    const result = parseOffResponse({
      status: 1,
      product: {
        product_name: 'Pils',
        brands: 'Pils-Brauerei',
        categories_tags: ['en:beverages', 'en:beers'],
        serving_quantity: 330,
        serving_quantity_unit: 'cl',
        nutriments: {
          energy_100g: 176,
          carbohydrates_100g: 2.9,
          sugars_100g: 3.5,
          alcohol_100g: 4.9,
        },
      },
    });
    expect(result).toMatchObject({
      status: 'found',
      input: {
        name: 'Pils (Pils-Brauerei)',
        category: 'beverages',
        kcal: 42,
        carbs: 2.9,
        sugar: 2.9,
        alcohol: 3.9,
        portions: [],
      },
    });
  });

  it('meldet fehlende Produkte und Nährwerte', () => {
    expect(parseOffResponse({ status: 0, status_verbose: 'product not found' })).toEqual({
      status: 'not-found',
    });
    expect(parseOffResponse(null)).toEqual({ status: 'not-found' });
    expect(parseOffResponse({ status: 1, product: { product_name: 'Etwas' } })).toMatchObject({
      status: 'found',
      hasNutrients: false,
      input: { name: 'Etwas', kcal: 0, category: 'dishes' },
    });
  });

  it('nimmt die Marke, wenn der Name fehlt, und kürzt lange Namen', () => {
    expect(parseOffResponse({ status: 1, product: { brands: 'Marke' } })).toMatchObject({
      input: { name: 'Marke' },
    });
    const long = parseOffResponse({ status: 1, product: { product_name: 'x'.repeat(120) } });
    expect(long.status === 'found' && long.input.name.length).toBe(80);
  });

  it('ordnet spezifische Kategorien zuerst zu', () => {
    expect(offCategory(['en:meats', 'en:sausages'])).toBe('sausage');
    expect(offCategory(['en:snacks', 'en:sweet-snacks', 'en:protein-bars'])).toBe('protein');
    expect(offCategory(['en:unknown'])).toBe('dishes');
    expect(offCategory(undefined)).toBe('dishes');
  });
});
