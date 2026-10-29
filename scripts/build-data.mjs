// Erzeugt src/data/exercises.json und src/data/foods.json aus den Quelldaten.
// Läuft nur beim Entwickeln: `npm run data`. Downloads landen in scripts/.cache/ (nicht im git).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateRawSync } from 'node:zlib';
import { isEnergyPlausible, usdaCarbsToEu } from '../src/domain/nutrientCheck.ts';
import { EXERCISES } from './data/exercises.mapping.mjs';
import { ENERGY_CHECK_EXCEPTIONS, FOODS, MANUAL_FOODS } from './data/foods.mapping.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cacheDir = join(root, 'scripts', '.cache');
const outDir = join(root, 'src', 'data');

const SOURCES = {
  exercises: {
    url: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json',
    file: 'free-exercise-db.json',
  },
  usda: {
    url: 'https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_json_2018-04.zip',
    file: 'usda-sr-legacy.zip',
  },
};

const MUSCLES = {
  abdominals: 'abs',
  abductors: 'abductors',
  adductors: 'adductors',
  biceps: 'biceps',
  calves: 'calves',
  chest: 'chest',
  forearms: 'forearms',
  glutes: 'glutes',
  hamstrings: 'hamstrings',
  lats: 'lats',
  'lower back': 'lowerBack',
  'middle back': 'upperBack',
  neck: 'neck',
  quadriceps: 'quads',
  shoulders: 'shoulders',
  traps: 'traps',
  triceps: 'triceps',
};

const EQUIPMENT = {
  barbell: 'barbell',
  dumbbell: 'dumbbell',
  kettlebells: 'kettlebell',
  cable: 'cable',
  machine: 'machine',
  'body only': 'bodyweight',
  bands: 'bands',
  'e-z curl bar': 'ezBar',
  'medicine ball': 'medicineBall',
  'exercise ball': 'exerciseBall',
  'foam roll': 'foamRoller',
  other: 'other',
  '': 'none',
};

const CATEGORIES = {
  strength: 'strength',
  powerlifting: 'strength',
  'olympic weightlifting': 'strength',
  strongman: 'strength',
  plyometrics: 'strength',
  cardio: 'cardio',
  stretching: 'mobility',
};

const USDA_NUTRIENTS = {
  kcal: '208',
  protein: '203',
  carbs: '205',
  fat: '204',
  fiber: '291',
  sugar: '269',
  alcohol: '221',
};

async function download({ url, file }) {
  const path = join(cacheDir, file);
  if (!existsSync(path)) {
    console.log(`Lade ${url} …`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Download fehlgeschlagen: ${response.status} ${url}`);
    writeFileSync(path, Buffer.from(await response.arrayBuffer()));
  }
  return path;
}

/** Entpackt die erste Datei eines ZIP-Archivs (Deflate), ohne Zusatzpakete */
function unzipFirstEntry(zipPath) {
  const buf = readFileSync(zipPath);
  const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocd < 0) throw new Error('Keine gültige ZIP-Datei');
  const central = buf.readUInt32LE(eocd + 16);
  const method = buf.readUInt16LE(central + 10);
  const compressedSize = buf.readUInt32LE(central + 20);
  const localHeader = buf.readUInt32LE(central + 42);
  const nameLength = buf.readUInt16LE(localHeader + 26);
  const extraLength = buf.readUInt16LE(localHeader + 28);
  const start = localHeader + 30 + nameLength + extraLength;
  const data = buf.subarray(start, start + compressedSize);
  return method === 0 ? data : inflateRawSync(data);
}

const round1 = (value) => Math.round(value * 10) / 10;

function buildExercises(source) {
  const byId = new Map(source.map((e) => [e.id, e]));
  return EXERCISES.map(([key, sourceId, name, aliases, opts = {}]) => {
    const src = sourceId === null ? null : byId.get(sourceId);
    if (sourceId !== null && !src)
      throw new Error(`Übung ${sourceId} (${key}) fehlt in der Quelle`);
    const mapMuscles = (list) =>
      list.map((m) => {
        if (!MUSCLES[m]) throw new Error(`Unbekannter Muskel ${m}`);
        return MUSCLES[m];
      });
    let equipment = opts.equipment ?? EQUIPMENT[src?.equipment ?? ''];
    if (src?.id.startsWith('Smith')) equipment = 'smith';
    if (src?.id.startsWith('Trap_Bar')) equipment = 'trapBar';
    const exercise = {
      key,
      name,
      aliases,
      category: opts.category ?? CATEGORIES[src?.category ?? ''],
      primaryMuscles: opts.primary ?? mapMuscles(src?.primaryMuscles ?? []),
      secondaryMuscles: opts.secondary ?? mapMuscles(src?.secondaryMuscles ?? []),
      equipment,
      isUnilateral: opts.u === true,
    };
    if (!exercise.category || !exercise.equipment || exercise.primaryMuscles.length === 0) {
      throw new Error(`Übung ${key} unvollständig`);
    }
    return exercise;
  });
}

function buildFoods(usdaFoods) {
  const byId = new Map(usdaFoods.map((f) => [f.fdcId, f]));
  const foods = [];
  const warnings = [];

  for (const [category, rows] of Object.entries(FOODS)) {
    for (const [key, fdcId, name, aliases, portions = []] of rows) {
      const src = byId.get(fdcId);
      if (!src) throw new Error(`Lebensmittel ${fdcId} (${key}) fehlt in der Quelle`);
      const amounts = {};
      for (const n of src.foodNutrients) amounts[n.nutrient.number] = n.amount;
      const value = (field) => amounts[USDA_NUTRIENTS[field]] ?? 0;
      if (amounts[USDA_NUTRIENTS.kcal] === undefined) throw new Error(`${key}: kcal fehlen`);
      const fiber = value('fiber');
      foods.push({
        key,
        name,
        aliases,
        category,
        kcal: Math.round(value('kcal')),
        protein: round1(value('protein')),
        carbs: round1(usdaCarbsToEu(value('carbs'), fiber)),
        fat: round1(value('fat')),
        fiber: round1(fiber),
        sugar: round1(value('sugar')),
        alcohol: round1(value('alcohol')),
        portions: portions.map(([label, grams]) => ({ label, grams })),
        sourceRef: `usda:${fdcId}`,
        sourceName: src.description,
      });
    }
  }

  for (const manual of MANUAL_FOODS) {
    const { portions = [], ...rest } = manual;
    foods.push({
      ...rest,
      alcohol: 0,
      portions: portions.map(([label, grams]) => ({ label, grams })),
      sourceRef: 'manual',
      sourceName: null,
    });
  }

  for (const food of foods) {
    if (!isEnergyPlausible(food) && !ENERGY_CHECK_EXCEPTIONS.includes(food.key)) {
      warnings.push(food);
    }
  }
  return { foods, warnings };
}

function writeCompactJson(path, items) {
  // Ein Eintrag pro Zeile: kleine Dateien, lesbare Diffs
  writeFileSync(path, `[\n${items.map((item) => JSON.stringify(item)).join(',\n')}\n]\n`);
}

function assertUniqueKeys(items, label) {
  const seen = new Set();
  for (const { key } of items) {
    if (seen.has(key)) throw new Error(`${label}: doppelter Schlüssel ${key}`);
    seen.add(key);
  }
}

mkdirSync(cacheDir, { recursive: true });

const exerciseSource = JSON.parse(readFileSync(await download(SOURCES.exercises), 'utf8'));
const exercises = buildExercises(exerciseSource);
assertUniqueKeys(exercises, 'Übungen');

console.log('Entpacke USDA SR Legacy …');
const usda = JSON.parse(unzipFirstEntry(await download(SOURCES.usda)).toString('utf8'));
const { foods, warnings } = buildFoods(usda.SRLegacyFoods);
assertUniqueKeys(foods, 'Lebensmittel');

// Quellbeschreibung nur fürs Prüfen ausgeben, nicht ausliefern
const shippedFoods = foods.map(({ sourceName: _sourceName, ...food }) => food);

writeCompactJson(join(outDir, 'exercises.json'), exercises);
writeCompactJson(join(outDir, 'foods.json'), shippedFoods);

console.log(`${exercises.length} Übungen, ${foods.length} Lebensmittel geschrieben.`);
for (const food of warnings) {
  console.warn(
    `Brennwert unplausibel: ${food.key} (${food.sourceName ?? 'manuell'}) ` +
      `${food.kcal} kcal, P ${food.protein}, KH ${food.carbs}, F ${food.fat}, Bst ${food.fiber}, Alk ${food.alcohol}`,
  );
}
if (warnings.length > 0) process.exitCode = 1;
