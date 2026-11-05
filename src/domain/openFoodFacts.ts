import type { FoodInput } from '../db/schemas';
import type { FoodCategory } from '../db/types';

/** Nur diese Felder werden abgefragt (kleine Antwort) */
export const OFF_FIELDS = [
  'product_name',
  'product_name_de',
  'generic_name_de',
  'brands',
  'nutriments',
  'serving_quantity',
  'serving_quantity_unit',
  'categories_tags',
] as const;

/** Gesendet wird nur die Nummer; keine Konto- oder Gerätedaten */
export function offProductUrl(code: string): string {
  return `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${OFF_FIELDS.join(',')}`;
}

export const OFF_SOURCE_PREFIX = 'off:';

export type OffResult =
  { status: 'found'; input: FoodInput; hasNutrients: boolean } | { status: 'not-found' };

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function numberOf(value: unknown): number | null {
  const parsed = typeof value === 'string' ? Number(value.replace(',', '.')) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

const round1 = (value: number) => Math.round(value * 10) / 10;
const clamp = (value: number, max: number) => Math.min(max, Math.max(0, value));

/** Spezifische Kategorien zuerst (Wurst vor Fleisch, Proteinriegel vor Süßem) */
const CATEGORY_TAGS: Array<[FoodCategory, string[]]> = [
  [
    'protein',
    ['en:protein-bars', 'en:protein-powders', 'en:protein-shakes', 'en:bodybuilding-supplements'],
  ],
  ['sausage', ['en:sausages', 'en:hams', 'en:salamis', 'en:cold-cuts']],
  ['fish', ['en:fishes', 'en:seafood', 'en:fish-and-meat-and-eggs-preserves']],
  ['meat', ['en:meats', 'en:poultries']],
  ['eggs', ['en:eggs']],
  ['dairy', ['en:dairies', 'en:cheeses', 'en:yogurts', 'en:milks']],
  ['beverages', ['en:beverages']],
  ['bread', ['en:breads']],
  [
    'sweets',
    [
      'en:sweets',
      'en:chocolates',
      'en:biscuits-and-cakes',
      'en:confectioneries',
      'en:sweet-snacks',
      'en:desserts',
    ],
  ],
  ['nuts', ['en:nuts', 'en:nut-butters']],
  ['legumes', ['en:legumes']],
  [
    'grains',
    ['en:cereals-and-potatoes', 'en:breakfast-cereals', 'en:pastas', 'en:rices', 'en:flours'],
  ],
  ['fats', ['en:fats', 'en:vegetable-oils', 'en:butters']],
  ['condiments', ['en:condiments', 'en:sauces', 'en:spreads', 'en:spices']],
  ['fruit', ['en:fruits', 'en:dried-fruits']],
  ['vegetables', ['en:vegetables']],
];

export function offCategory(tags: unknown): FoodCategory {
  const list = Array.isArray(tags) ? tags.filter((tag) => typeof tag === 'string') : [];
  for (const [category, wanted] of CATEGORY_TAGS) {
    if (wanted.some((tag) => list.includes(tag))) return category;
  }
  return 'dishes';
}

function productName(product: Json): string {
  const name =
    text(product.product_name_de) || text(product.product_name) || text(product.generic_name_de);
  const brand = text(product.brands).split(',')[0]?.trim() ?? '';
  const full =
    brand && !name.toLowerCase().includes(brand.toLowerCase()) ? `${name} (${brand})` : name;
  return (name ? full : brand).slice(0, 80).trim();
}

/**
 * Antwort der Open-Food-Facts-API v2 → Formularwerte pro 100 g. Kohlenhydrate stehen dort wie auf
 * EU-Verpackungen ohne Ballaststoffe; Alkohol in % vol wird grob in g umgerechnet (× 0,789).
 * Werte bleiben vor dem Speichern bearbeitbar.
 */
export function parseOffResponse(data: unknown): OffResult {
  if (!isObject(data) || data.status !== 1 || !isObject(data.product))
    return { status: 'not-found' };
  const product = data.product;
  const nutriments = isObject(product.nutriments) ? product.nutriments : {};
  const value = (key: string) => numberOf(nutriments[`${key}_100g`]);

  const kj = value('energy-kj') ?? value('energy');
  const kcal = value('energy-kcal') ?? (kj !== null ? kj / 4.184 : null);
  const carbs = round1(clamp(value('carbohydrates') ?? 0, 100));
  const alcoholVol = value('alcohol');
  const servingGrams = numberOf(product.serving_quantity);
  const servingUnit = text(product.serving_quantity_unit).toLowerCase();

  const input: FoodInput = {
    name: productName(product),
    aliases: [],
    category: offCategory(product.categories_tags),
    kcal: Math.round(clamp(kcal ?? 0, 1000)),
    protein: round1(clamp(value('proteins') ?? 0, 100)),
    carbs,
    sugar: Math.min(carbs, round1(clamp(value('sugars') ?? 0, 100))),
    fat: round1(clamp(value('fat') ?? 0, 100)),
    fiber: round1(clamp(value('fiber') ?? 0, 100)),
    alcohol: alcoholVol !== null ? round1(clamp(alcoholVol * 0.789, 100)) : 0,
    portions:
      servingGrams !== null &&
      servingGrams > 0 &&
      servingGrams <= 5000 &&
      ['', 'g', 'ml'].includes(servingUnit)
        ? [{ label: '1 Portion', grams: round1(servingGrams) }]
        : [],
  };
  const hasNutrients =
    kcal !== null || value('proteins') !== null || value('carbohydrates') !== null;
  return { status: 'found', input, hasNutrients };
}
