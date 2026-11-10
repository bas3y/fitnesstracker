import type { DistanceUnit, WeightUnit } from '../db/types';
import { formatDistance } from './endurance';
import { formatDecimal } from './format';
import { formatHabitAmount } from './habits';
import { reviewDelta, type ReviewSummary } from './review';
import { kgToDisplay } from './units';
import { formatWorkoutDuration } from './workout';

/** `higher` = mehr ist besser, `lower` = weniger ist besser, `null` = neutral */
export type Better = 'higher' | 'lower' | null;

/** Eine Kennzahl im Rückblick (Bildschirm und PDF-Bericht) */
export interface ReviewRow {
  label: string;
  current: number | null;
  previous: number | null;
  format: (value: number) => string;
  better: Better;
}

export interface ReviewUnits {
  weightUnit: WeightUnit;
  distanceUnit: DistanceUnit;
  proteinOnly: boolean;
}

const count = (value: number) => formatDecimal(value, 0);
const rating = (value: number) => `${formatDecimal(value, 1)} / 5`;

/** Nur Zeilen mit Wert in einem der beiden Zeiträume */
export function shownRows(rows: readonly ReviewRow[]): ReviewRow[] {
  return rows.filter((row) => row.current || row.previous);
}

/** Unterschied als Text; `better` = Richtung ist gut (`null` = neutral oder gleich) */
export function formatReviewDelta(row: ReviewRow): { text: string; better: boolean | null } | null {
  const delta = reviewDelta(row.current, row.previous);
  if (delta === null) return null;
  const text = row.format(Math.abs(delta));
  if (Math.abs(delta) < 1e-9 || text === row.format(0)) return { text: '±0', better: null };
  const better = row.better === null ? null : delta > 0 === (row.better === 'higher');
  return { text: `${delta > 0 ? '+' : '−'}${text}`, better };
}

export function trainingRows(
  current: ReviewSummary,
  previous: ReviewSummary,
  units: Pick<ReviewUnits, 'weightUnit' | 'distanceUnit'>,
): ReviewRow[] {
  const unit = units.weightUnit;
  return [
    {
      label: 'Trainingstage',
      current: current.trainingDays,
      previous: previous.trainingDays,
      format: count,
      better: 'higher',
    },
    {
      label: 'Krafttrainings',
      current: current.strength.workouts,
      previous: previous.strength.workouts,
      format: count,
      better: 'higher',
    },
    {
      label: 'Arbeitssätze',
      current: current.strength.sets,
      previous: previous.strength.sets,
      format: count,
      better: 'higher',
    },
    {
      label: 'Volumen',
      current: current.strength.volumeKg,
      previous: previous.strength.volumeKg,
      format: (kg) => `${formatDecimal(kgToDisplay(kg, unit), 0)} ${unit}`,
      better: 'higher',
    },
    {
      label: 'Kraft-Rekorde',
      current: current.strength.records,
      previous: previous.strength.records,
      format: count,
      better: 'higher',
    },
    {
      label: 'Ausdauer-Einheiten',
      current: current.endurance.count,
      previous: previous.endurance.count,
      format: count,
      better: 'higher',
    },
    {
      label: 'Ausdauer-Zeit',
      current: current.endurance.durationSeconds,
      previous: previous.endurance.durationSeconds,
      format: formatWorkoutDuration,
      better: 'higher',
    },
    {
      label: 'Strecke',
      current: current.endurance.distanceMeters,
      previous: previous.endurance.distanceMeters,
      format: (meters) => formatDistance(meters, 'run', units.distanceUnit, 1),
      better: 'higher',
    },
    {
      label: 'Höhenmeter',
      current: current.endurance.elevationGainMeters,
      previous: previous.endurance.elevationGainMeters,
      format: (meters) => `${formatDecimal(meters, 0)} m`,
      better: 'higher',
    },
    {
      label: 'Neue Bestzeiten',
      current: current.endurance.records,
      previous: previous.endurance.records,
      format: count,
      better: 'higher',
    },
  ];
}

export function dailyRows(
  current: ReviewSummary,
  previous: ReviewSummary,
  units: Pick<ReviewUnits, 'weightUnit'>,
): ReviewRow[] {
  const unit = units.weightUnit;
  const pick = (key: keyof ReviewSummary['daily']) => ({
    current: current.daily[key],
    previous: previous.daily[key],
  });
  return [
    { label: 'Ø Schritte', ...pick('steps'), format: count, better: 'higher' },
    {
      label: 'Ø Schlaf',
      ...pick('sleepSeconds'),
      format: (seconds) => `${formatDecimal(seconds / 3600, 1)} h`,
      better: 'higher',
    },
    {
      label: 'Ø Wasser',
      ...pick('waterMl'),
      format: (ml) => `${formatDecimal(ml / 1000, 1)} l`,
      better: 'higher',
    },
    { label: 'Ø Stimmung', ...pick('mood'), format: rating, better: 'higher' },
    { label: 'Ø Energie', ...pick('energy'), format: rating, better: 'higher' },
    {
      label: 'Ø Ruhepuls',
      ...pick('restingHeartRate'),
      format: (bpm) => `${formatDecimal(bpm, 0)} bpm`,
      better: 'lower',
    },
    {
      label: 'Gewicht (zuletzt)',
      ...pick('weightKg'),
      format: (kg) => `${formatDecimal(kgToDisplay(kg, unit), 1)} ${unit}`,
      better: null,
    },
    {
      label: 'Gewohnheiten erledigt',
      current: current.habitCompletion,
      previous: previous.habitCompletion,
      format: (percent) => `${formatDecimal(percent, 0)} %`,
      better: 'higher',
    },
  ];
}

/** Leer, wenn in keinem der beiden Zeiträume etwas erfasst wurde */
export function nutritionRows(
  current: ReviewSummary,
  previous: ReviewSummary,
  units: Pick<ReviewUnits, 'proteinOnly'>,
): ReviewRow[] {
  if (current.nutrition.days === 0 && previous.nutrition.days === 0) return [];
  return [
    {
      label: 'Tage erfasst',
      current: current.nutrition.days,
      previous: previous.nutrition.days,
      format: count,
      better: 'higher',
    },
    ...(units.proteinOnly
      ? []
      : [
          {
            label: 'Ø Kalorien',
            current: current.nutrition.kcal,
            previous: previous.nutrition.kcal,
            format: (kcal: number) => `${formatDecimal(kcal, 0)} kcal`,
            better: null,
          },
        ]),
    {
      label: 'Ø Protein',
      current: current.nutrition.protein,
      previous: previous.nutrition.protein,
      format: (grams) => `${formatDecimal(grams, 0)} g`,
      better: 'higher',
    },
  ];
}

/** Summen der Gewohnheiten mit Menge und Rückfälle beim Aufhören */
export function habitRows(current: ReviewSummary, previous: ReviewSummary): ReviewRow[] {
  const previousById = new Map(previous.habitTotals.map((habit) => [habit.habitId, habit]));
  return current.habitTotals.map((habit) => ({
    label: `${habit.name}${habit.kind === 'quit' ? ' (Rückfälle)' : ''}`,
    current: habit.amount,
    previous: previousById.get(habit.habitId)?.amount ?? 0,
    format: (value) => formatHabitAmount(value, habit.unit),
    better: habit.kind === 'quit' ? 'lower' : 'higher',
  }));
}

/** Journal, Wochenreflexion, Lesen, Timer */
export function growthRows(current: ReviewSummary, previous: ReviewSummary): ReviewRow[] {
  const pick = (key: keyof ReviewSummary['growth']) => ({
    current: current.growth[key],
    previous: previous.growth[key],
  });
  return [
    { label: 'Tage mit Journal', ...pick('journalDays'), format: count, better: 'higher' },
    { label: 'Wochenreflexionen', ...pick('reflections'), format: count, better: 'higher' },
    {
      label: 'Ø Bewertung der Woche',
      ...pick('weekRating'),
      format: rating,
      better: 'higher',
    },
    { label: 'Gelesene Seiten', ...pick('pages'), format: count, better: 'higher' },
    { label: 'Gelesene Bücher', ...pick('books'), format: count, better: 'higher' },
    {
      label: 'Fokus-Zeit',
      ...pick('focusSeconds'),
      format: formatWorkoutDuration,
      better: 'higher',
    },
    {
      label: 'Meditation',
      ...pick('meditationSeconds'),
      format: formatWorkoutDuration,
      better: 'higher',
    },
  ];
}
