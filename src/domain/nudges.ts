// Kleine „nächster Schritt“-Hinweise für Widgets (22b): lokal, regelbasiert, ohne Speicher.
// Später ergänzen Vorschläge aus 26/27 und die KI (31/32) diese Stellen.
import type { MealAmount } from '../db/schemas';
import type { DayKey, Food, MealType, MuscleGroup } from '../db/types';
import { dayKey } from './daily';
import { defaultMealAmount } from './nutrition';
import { parseDayKey, type StatsSession } from './stats';

// ---------- Trainingslücken ----------

/** Große Bereiche, deren letztes Training angezeigt wird (nur Hauptmuskeln zählen) */
export const TRAINING_AREAS = {
  legs: ['quads', 'hamstrings', 'glutes'],
  chest: ['chest'],
  back: ['lats', 'upperBack'],
  shoulders: ['shoulders'],
} as const satisfies Record<string, readonly MuscleGroup[]>;
export type TrainingArea = keyof typeof TRAINING_AREAS;

export const TRAINING_AREA_LABELS: Record<TrainingArea, string> = {
  legs: 'Beintraining',
  chest: 'Brusttraining',
  back: 'Rückentraining',
  shoulders: 'Schultertraining',
};

/** Ab so vielen Tagen ohne Training des Bereichs gibt es einen Hinweis */
export const TRAINING_GAP_DAYS = 4;

export interface TrainingGap {
  area: TrainingArea;
  days: number;
}

const DAY_MS = 86_400_000;

/** Kalendertage zwischen zwei lokalen Tagen (`to` − `from`) */
export function dayDistance(from: DayKey, to: DayKey): number {
  return Math.round((parseDayKey(to).getTime() - parseDayKey(from).getTime()) / DAY_MS);
}

/**
 * Bereich, der am längsten nicht trainiert wurde (mindestens `TRAINING_GAP_DAYS` her).
 * Bereiche, die noch nie trainiert wurden, zählen nicht (sonst stünde dort ewig „noch nie“).
 */
export function trainingGap(
  sessions: readonly Pick<StatsSession, 'startedAt' | 'exercise'>[],
  today: DayKey,
): TrainingGap | null {
  let gap: TrainingGap | null = null;
  for (const area of Object.keys(TRAINING_AREAS) as TrainingArea[]) {
    const muscles: readonly MuscleGroup[] = TRAINING_AREAS[area];
    let last: DayKey | null = null;
    for (const session of sessions) {
      if (!session.exercise.primaryMuscles.some((muscle) => muscles.includes(muscle))) continue;
      const day = dayKey(new Date(session.startedAt));
      if (last === null || day > last) last = day;
    }
    if (last === null) continue;
    const days = dayDistance(last, today);
    if (days >= TRAINING_GAP_DAYS && (gap === null || days > gap.days)) gap = { area, days };
  }
  return gap;
}

export function formatTrainingGap({ area, days }: TrainingGap): string {
  return `Letztes ${TRAINING_AREA_LABELS[area]} vor ${days} Tagen`;
}

// ---------- Protein ----------

/** Ab so viel Protein je 100 g gilt ein Lebensmittel als proteinreich */
export const PROTEIN_RICH_PER_100G = 10;
/** Ab so viel fehlendem Protein werden Lebensmittel vorgeschlagen */
export const PROTEIN_SUGGEST_FROM_G = 10;

export interface ProteinSuggestion {
  food: Pick<Food, 'id' | 'name'>;
  amount: MealAmount;
  /** Protein der vorgeschlagenen Menge in g */
  protein: number;
}

/**
 * Bis zu `limit` proteinreiche Lebensmittel aus `preferred` (z. B. Favoriten, dann häufig gegessen),
 * je mit der Standardportion. Reihenfolge wie `preferred`, doppelte und ausgeblendete fallen weg.
 */
export function proteinSuggestions(
  preferred: readonly Pick<
    Food,
    'id' | 'name' | 'protein' | 'portions' | 'hiddenAt' | 'deletedAt'
  >[],
  limit = 3,
): ProteinSuggestion[] {
  const seen = new Set<string>();
  const result: ProteinSuggestion[] = [];
  for (const food of preferred) {
    if (result.length >= limit) break;
    if (seen.has(food.id) || food.hiddenAt !== null || food.deletedAt !== null) continue;
    seen.add(food.id);
    if (food.protein < PROTEIN_RICH_PER_100G) continue;
    const amount = defaultMealAmount(food.portions);
    const protein = (food.protein * amount.grams) / 100;
    if (protein < 1) continue;
    result.push({ food: { id: food.id, name: food.name }, amount, protein });
  }
  return result;
}

/** Mahlzeit nach Uhrzeit, für Einträge per Schnellknopf */
export function mealForTime(date: Date): MealType {
  const minutes = date.getHours() * 60 + date.getMinutes();
  if (minutes >= 4 * 60 && minutes < 10 * 60 + 30) return 'breakfast';
  if (minutes >= 11 * 60 + 30 && minutes < 14 * 60 + 30) return 'lunch';
  if (minutes >= 17 * 60 + 30 && minutes < 21 * 60 + 30) return 'dinner';
  return 'snack';
}
