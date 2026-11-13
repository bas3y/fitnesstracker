// Tageshinweis auf der Startseite (22b): morgens, nach dem Training, abends – regelbasiert und
// offline. Ab 24d auch als Push, ab 31 mit KI-Text.
import type { DayKey } from '../db/types';
import { formatDecimal } from './format';
import { formatKcal } from './nutrition';

export const DAY_HINT_PHASES = ['morning', 'afterTraining', 'evening'] as const;
export type DayHintPhase = (typeof DAY_HINT_PHASES)[number];

/** Morgens bis 11 Uhr (ab 4 Uhr), abends ab 18 Uhr; nach dem Training bis 3 h nach dem Ende */
export const MORNING_FROM_HOUR = 4;
export const MORNING_UNTIL_HOUR = 11;
export const EVENING_FROM_HOUR = 18;
export const AFTER_TRAINING_MS = 3 * 60 * 60 * 1000;
/** So viele Namen werden aufgezählt, der Rest als „+ n weitere“ */
const LIST_LIMIT = 3;

export interface DayHintTraining {
  /** z. B. „Oberkörper A“ oder „Laufen“ */
  name: string;
  endedAt: Date;
  /** Kurzfassung, z. B. „52 min · 18 Sätze“ */
  summary: string;
  /** Übungen mit neuem Rekord */
  records: string[];
  /** Wohin „Ansehen“ führt (Pfad) */
  to: string;
}

export interface DayHintInput {
  now: Date;
  today: DayKey;
  name: string;
  sleepSeconds: number | null;
  sleepGoalSeconds: number;
  waterMl: number;
  waterGoalMl: number;
  /**
   * Vorschlag aus dem aktiven Plan, solange heute noch nicht trainiert wurde;
   * `scheduled` = laut Wochenplan heute dran (sonst nächstes in der Reihenfolge)
   */
  plannedDay: { name: string; scheduled: boolean } | null;
  /** Heute fällige Supplements bis Mittag, noch nicht genommen */
  morningSupplements: string[];
  /** Heute fällige Supplements, noch nicht genommen */
  openSupplements: string[];
  /** Heute fällige Gewohnheiten, noch nicht erledigt */
  openHabits: string[];
  lastTraining: DayHintTraining | null;
  nutrition: {
    proteinOnly: boolean;
    hasEntries: boolean;
    kcal: number;
    kcalGoal: number;
    protein: number;
    proteinGoal: number;
  } | null;
}

export type DayHintAction = 'training' | 'sleep' | 'workout' | 'nutrition' | 'habits';

export interface DayHint {
  phase: DayHintPhase;
  /** Kennung zum Wegtippen (`Settings.dayHintDismissed`) */
  key: string;
  title: string;
  lines: string[];
  action: { kind: DayHintAction; label: string; to?: string } | null;
}

export function dayHintKey(today: DayKey, phase: DayHintPhase): string {
  return `${today}:${phase}`;
}

/** Welche Karte gerade dran ist; `null` = tagsüber nichts */
export function dayHintPhase(now: Date, lastTraining: DayHintTraining | null): DayHintPhase | null {
  if (lastTraining) {
    const since = now.getTime() - lastTraining.endedAt.getTime();
    if (since >= 0 && since <= AFTER_TRAINING_MS) return 'afterTraining';
  }
  const hour = now.getHours();
  if (hour >= MORNING_FROM_HOUR && hour < MORNING_UNTIL_HOUR) return 'morning';
  if (hour >= EVENING_FROM_HOUR) return 'evening';
  return null;
}

/** „A, B und C“, bei mehr „A, B, C + 2 weitere“ */
export function listNames(names: readonly string[], limit = LIST_LIMIT): string {
  if (names.length <= 1) return names.join('');
  if (names.length <= limit) return `${names.slice(0, -1).join(', ')} und ${names.at(-1)}`;
  return `${names.slice(0, limit).join(', ')} + ${names.length - limit} weitere`;
}

const grams = (value: number) => `${formatDecimal(Math.round(value), 0)} g`;

/** „6 h 40 min“, „50 min“ */
export function hoursMinutes(seconds: number): string {
  const total = Math.round(seconds / 60);
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours === 0) return `${minutes} min`;
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}
const liters = (ml: number) => `${formatDecimal(ml / 1000, 2)} l`;

function morningHint(input: DayHintInput): Omit<DayHint, 'phase' | 'key'> {
  const lines: string[] = [];
  const { sleepSeconds, sleepGoalSeconds } = input;
  if (sleepSeconds === null) {
    lines.push('Schlaf von letzter Nacht noch nicht eingetragen.');
  } else {
    const diff = sleepGoalSeconds - sleepSeconds;
    lines.push(
      diff > 0
        ? `Schlaf: ${hoursMinutes(sleepSeconds)} – ${hoursMinutes(diff)} unter deinem Ziel.`
        : `Schlaf: ${hoursMinutes(sleepSeconds)} – Ziel erreicht.`,
    );
  }
  const planned = input.plannedDay;
  if (planned) {
    lines.push(`${planned.scheduled ? 'Heute im Plan' : 'Nächstes Training'}: ${planned.name}.`);
  }
  if (input.morningSupplements.length > 0) {
    lines.push(`Supplements: ${listNames(input.morningSupplements)}.`);
  }
  const action: DayHint['action'] = planned
    ? { kind: 'training', label: 'Zum Training' }
    : sleepSeconds === null
      ? { kind: 'sleep', label: 'Schlaf eintragen' }
      : null;
  return { title: input.name ? `Guten Morgen, ${input.name}!` : 'Guten Morgen!', lines, action };
}

function afterTrainingHint(training: DayHintTraining): Omit<DayHint, 'phase' | 'key'> {
  const lines = [training.summary];
  const count = training.records.length;
  if (count > 0) {
    lines.push(
      `${count === 1 ? 'Neuer Rekord' : `${count} neue Rekorde`}: ${listNames(training.records)}.`,
    );
  }
  return {
    title: `${training.name} geschafft`,
    lines,
    action: { kind: 'workout', label: 'Ansehen', to: training.to },
  };
}

function eveningHint(input: DayHintInput): Omit<DayHint, 'phase' | 'key'> {
  const lines: string[] = [];
  let action: DayHint['action'] = null;
  const { nutrition } = input;
  if (nutrition) {
    const missing = nutrition.proteinGoal - nutrition.protein;
    if (!nutrition.proteinOnly) {
      lines.push(
        nutrition.hasEntries
          ? `Kalorien: ${formatDecimal(Math.round(nutrition.kcal), 0)} von ${formatKcal(nutrition.kcalGoal)}.`
          : 'Heute noch keine Mahlzeit eingetragen.',
      );
    }
    if (nutrition.hasEntries || nutrition.protein > 0) {
      lines.push(
        missing > 0
          ? `Protein: ${grams(nutrition.protein)} – ${grams(missing)} fehlen.`
          : `Protein: ${grams(nutrition.protein)} – Ziel erreicht.`,
      );
    }
    if (missing > 0 || (!nutrition.proteinOnly && !nutrition.hasEntries)) {
      action = { kind: 'nutrition', label: 'Zur Ernährung' };
    }
  }
  const waterRest = input.waterGoalMl - input.waterMl;
  if (waterRest > 0) lines.push(`Wasser: noch ${liters(waterRest)} bis zum Ziel.`);
  if (input.openHabits.length > 0) {
    lines.push(`Offen: ${listNames(input.openHabits)}.`);
    action ??= { kind: 'habits', label: 'Gewohnheiten' };
  }
  if (input.openSupplements.length > 0) {
    lines.push(`Supplements offen: ${listNames(input.openSupplements)}.`);
  }
  if (lines.length === 0) lines.push('Alles erledigt – stark!');
  return { title: 'Deine Tagesbilanz', lines, action };
}

/** Karte für jetzt; `null` = nichts zu zeigen (tagsüber oder weggetippt) */
export function buildDayHint(input: DayHintInput, dismissed: string | null): DayHint | null {
  const phase = dayHintPhase(input.now, input.lastTraining);
  if (!phase) return null;
  const key = dayHintKey(input.today, phase);
  if (dismissed === key) return null;
  const content =
    phase === 'morning'
      ? morningHint(input)
      : phase === 'evening'
        ? eveningHint(input)
        : afterTrainingHint(input.lastTraining!);
  return { phase, key, ...content };
}
