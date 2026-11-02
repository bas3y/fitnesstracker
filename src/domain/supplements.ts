import type {
  DayKey,
  Habit,
  Supplement,
  SupplementDose,
  SupplementIntake,
  SupplementPeriod,
  SupplementSchedule,
  SupplementTiming,
  Timestamp,
  TrainingKind,
} from '../db/types';
import { dayKey, shiftDay } from './daily';
import { formatHabitAmount } from './habits';
import { formatWeekdays } from './plans';
import { parseDayKey } from './stats';

export const SUPPLEMENT_TIMING_LABELS: Record<SupplementTiming, string> = {
  time: 'Uhrzeit',
  period: 'Tageszeit',
  beforeTraining: 'Vor dem Training',
  afterTraining: 'Nach dem Training',
};

export const SUPPLEMENT_PERIOD_LABELS: Record<SupplementPeriod, string> = {
  morning: 'Morgens',
  noon: 'Mittags',
  evening: 'Abends',
  night: 'Vor dem Schlafen',
};

/** Ab dieser Uhrzeit gilt eine Tageszeit als fällig (Sortierung und Erinnerung) */
export const SUPPLEMENT_PERIOD_START: Record<SupplementPeriod, string> = {
  morning: '07:00',
  noon: '12:00',
  evening: '18:00',
  night: '22:00',
};

export const SUPPLEMENT_SCHEDULE_LABELS: Record<SupplementSchedule, string> = {
  daily: 'Täglich',
  weekdays: 'Wochentage',
  training: 'Trainingstage',
};

export const TRAINING_KIND_LABELS: Record<TrainingKind, string> = {
  any: 'Jedes Training',
  strength: 'Kraft',
  endurance: 'Ausdauer',
};

/** Trainings eines Tages; ohne Eintrag in `TrainingDays` = kein Training */
export interface TrainingDay {
  strength: boolean;
  endurance: boolean;
  /** Beginn des ersten Trainings */
  startedAt: Timestamp;
  /** Ende des letzten beendeten Trainings; `null` = noch keins beendet */
  endedAt: Timestamp | null;
}

export type TrainingDays = ReadonlyMap<DayKey, TrainingDay>;

export function matchesTrainingKind(day: TrainingDay | undefined, kind: TrainingKind): boolean {
  if (!day) return false;
  if (kind === 'strength') return day.strength;
  if (kind === 'endurance') return day.endurance;
  return true;
}

export type SupplementRules = Pick<Supplement, 'schedule' | 'weekdays' | 'trainingKind'>;

export function isSupplementDueOn(
  supplement: SupplementRules,
  date: DayKey,
  trainingDays: TrainingDays,
): boolean {
  switch (supplement.schedule) {
    case 'daily':
      return true;
    case 'weekdays':
      return supplement.weekdays.includes(parseDayKey(date).getDay());
    case 'training':
      return matchesTrainingKind(trainingDays.get(date), supplement.trainingKind);
  }
}

/**
 * `due` = steht an; `optional` = nicht fällig, aber abhakbar (heute noch ohne Training bzw. an dem
 * Tag trotzdem genommen); `hidden` = erscheint nicht.
 */
export type SupplementDayStatus = 'due' | 'optional' | 'hidden';

export function supplementDayStatus(
  supplement: SupplementRules & Pick<Supplement, 'archivedAt'>,
  date: DayKey,
  today: DayKey,
  trainingDays: TrainingDays,
  takenThatDay: boolean,
): SupplementDayStatus {
  if (supplement.archivedAt !== null) return 'hidden';
  if (isSupplementDueOn(supplement, date, trainingDays)) return 'due';
  // Vor dem Training gibt es heute noch kein Workout, das Supplement soll trotzdem abhakbar sein
  if (supplement.schedule === 'training' && date === today) return 'optional';
  return takenThatDay ? 'optional' : 'hidden';
}

// ---------- Zeitpunkte ----------

function minutesOf(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours! * 60 + minutes!;
}

function minutesOfTimestamp(timestamp: Timestamp): number {
  const date = new Date(timestamp);
  return date.getHours() * 60 + date.getMinutes();
}

const END_OF_DAY = 24 * 60;

/** Sortierschlüssel innerhalb eines Tages; Training ohne Workout steht am Ende */
export function doseMinutes(dose: SupplementDose, training: TrainingDay | undefined): number {
  switch (dose.timing) {
    case 'time':
      return minutesOf(dose.time ?? '00:00');
    case 'period':
      return minutesOf(SUPPLEMENT_PERIOD_START[dose.period ?? 'morning']);
    case 'beforeTraining':
      return training ? minutesOfTimestamp(training.startedAt) : END_OF_DAY;
    case 'afterTraining':
      return training?.endedAt ? minutesOfTimestamp(training.endedAt) : END_OF_DAY + 1;
  }
}

/** Ab wann die Dosis fällig ist; rund ums Training erst mit Beginn bzw. Ende des Workouts */
export function doseDueAt(
  dose: SupplementDose,
  date: DayKey,
  training: TrainingDay | undefined,
): Date | null {
  const at = (minutes: number) => {
    const day = parseDayKey(date);
    day.setMinutes(minutes);
    return day;
  };
  switch (dose.timing) {
    case 'time':
    case 'period':
      return at(doseMinutes(dose, training));
    case 'beforeTraining':
      return training ? new Date(training.startedAt) : null;
    case 'afterTraining':
      return training?.endedAt ? new Date(training.endedAt) : null;
  }
}

export function formatDoseTime(dose: SupplementDose): string {
  switch (dose.timing) {
    case 'time':
      return dose.time ?? '';
    case 'period':
      return SUPPLEMENT_PERIOD_LABELS[dose.period ?? 'morning'];
    default:
      return SUPPLEMENT_TIMING_LABELS[dose.timing];
  }
}

export function formatSupplementAmount(amount: number, unit: string): string {
  return formatHabitAmount(amount, unit);
}

/** z. B. „5 g · 08:00“ */
export function formatDose(dose: SupplementDose, unit: string): string {
  return `${formatSupplementAmount(dose.amount, unit)} · ${formatDoseTime(dose)}`;
}

export function formatSupplementSchedule(supplement: SupplementRules): string {
  switch (supplement.schedule) {
    case 'daily':
      return 'Täglich';
    case 'weekdays':
      return formatWeekdays(supplement.weekdays);
    case 'training':
      return supplement.trainingKind === 'any'
        ? 'Trainingstage'
        : `Trainingstage (${TRAINING_KIND_LABELS[supplement.trainingKind]})`;
  }
}

// ---------- Checkliste ----------

export type IntakeEntry = Pick<SupplementIntake, 'doseId' | 'date' | 'takenAt'>;

export interface SupplementWithIntakes<I extends IntakeEntry = IntakeEntry> {
  supplement: Supplement;
  intakes: I[];
}

export interface DoseEntry<I extends IntakeEntry = IntakeEntry> {
  supplement: Supplement;
  dose: SupplementDose;
  intake: I | null;
  status: Exclude<SupplementDayStatus, 'hidden'>;
  dueAt: Date | null;
}

/** Alle Einnahmen eines Tages, nach Zeitpunkt sortiert (bei Gleichstand in Listenreihenfolge) */
export function supplementDay<I extends IntakeEntry>(
  items: readonly SupplementWithIntakes<I>[],
  date: DayKey,
  today: DayKey,
  trainingDays: TrainingDays,
): DoseEntry<I>[] {
  const training = trainingDays.get(date);
  const entries = items.flatMap(({ supplement, intakes }) => {
    const ofDay = intakes.filter((intake) => intake.date === date);
    const taken = ofDay.some((intake) =>
      supplement.doses.some((dose) => dose.id === intake.doseId),
    );
    const status = supplementDayStatus(supplement, date, today, trainingDays, taken);
    if (status === 'hidden') return [];
    return supplement.doses.map((dose) => ({
      supplement,
      dose,
      intake: ofDay.find((intake) => intake.doseId === dose.id) ?? null,
      status,
      dueAt: doseDueAt(dose, date, training),
    }));
  });
  return entries
    .map((entry, index) => ({ entry, index, minutes: doseMinutes(entry.dose, training) }))
    .sort((a, b) => a.minutes - b.minutes || a.index - b.index)
    .map(({ entry }) => entry);
}

/** Fällig und noch nicht genommen (Erinnerung, Hervorhebung) */
export function isDoseOverdue(entry: DoseEntry, now: Date): boolean {
  return (
    entry.status === 'due' &&
    entry.intake === null &&
    entry.dueAt !== null &&
    entry.dueAt.getTime() <= now.getTime()
  );
}

// ---------- Bestand ----------

export const TRAINING_RATE_WINDOW_DAYS = 28;
/** Ohne Trainings in den letzten 4 Wochen wird mit 3 Trainings pro Woche gerechnet */
export const DEFAULT_TRAINING_RATE = 3 / 7;

/** Anteil der Tage mit passendem Training in den letzten 4 Wochen */
export function trainingRate(
  trainingDays: TrainingDays,
  kind: TrainingKind,
  today: DayKey,
): number {
  let count = 0;
  for (let offset = 0; offset < TRAINING_RATE_WINDOW_DAYS; offset++) {
    if (matchesTrainingKind(trainingDays.get(shiftDay(today, -offset)), kind)) count += 1;
  }
  return count === 0 ? DEFAULT_TRAINING_RATE : count / TRAINING_RATE_WINDOW_DAYS;
}

/** Durchschnittlicher Verbrauch pro Kalendertag in der Einheit des Supplements */
export function dailyUse(
  supplement: SupplementRules & Pick<Supplement, 'doses'>,
  trainingDays: TrainingDays,
  today: DayKey,
): number {
  const perDay = supplement.doses.reduce((sum, dose) => sum + dose.amount, 0);
  switch (supplement.schedule) {
    case 'daily':
      return perDay;
    case 'weekdays':
      return (perDay * supplement.weekdays.length) / 7;
    case 'training':
      return perDay * trainingRate(trainingDays, supplement.trainingKind, today);
  }
}

/** Ganze Tage, die der Bestand noch reicht; `null` = Bestand wird nicht erfasst */
export function stockDaysLeft(
  supplement: SupplementRules & Pick<Supplement, 'doses' | 'stock'>,
  trainingDays: TrainingDays,
  today: DayKey,
): number | null {
  if (supplement.stock === null) return null;
  const use = dailyUse(supplement, trainingDays, today);
  if (use <= 0) return null;
  return Math.floor(supplement.stock / use);
}

export function isLowStock(daysLeft: number | null, thresholdDays: number): boolean {
  return daysLeft !== null && daysLeft <= thresholdDays;
}

/** Supplements, deren Bestand höchstens noch `thresholdDays` reicht, in Listenreihenfolge */
export function lowStockSupplements<
  S extends SupplementRules & Pick<Supplement, 'doses' | 'stock'>,
>(
  supplements: readonly S[],
  trainingDays: TrainingDays,
  today: DayKey,
  thresholdDays: number,
): Array<{ supplement: S; days: number }> {
  return supplements.flatMap((supplement) => {
    const days = stockDaysLeft(supplement, trainingDays, today);
    return days !== null && isLowStock(days, thresholdDays) ? [{ supplement, days }] : [];
  });
}

export function formatDaysLeft(days: number): string {
  if (days === 0) return 'Bestand aufgebraucht';
  return days === 1 ? 'Reicht noch 1 Tag' : `Reicht noch ${days} Tage`;
}

// ---------- Verlauf ----------

export const ADHERENCE_DAYS = 30;

function createdDay(supplement: Pick<Supplement, 'createdAt'>): DayKey {
  return dayKey(new Date(supplement.createdAt));
}

/** Anteil genommener Einnahmen je Tag in % (Heatmap); Tage ohne Einnahme fehlen */
export function intakePercentByDay(
  { supplement, intakes }: SupplementWithIntakes,
  today: DayKey,
): Map<DayKey, number> {
  const doseIds = new Set(supplement.doses.map((dose) => dose.id));
  const counts = new Map<DayKey, number>();
  for (const intake of intakes) {
    if (doseIds.has(intake.doseId)) counts.set(intake.date, (counts.get(intake.date) ?? 0) + 1);
  }
  const result = new Map<DayKey, number>();
  const doseCount = Math.max(1, supplement.doses.length);
  for (const [date, count] of counts) {
    if (date <= today) result.set(date, Math.min(100, Math.round((count / doseCount) * 100)));
  }
  return result;
}

export function adherenceLevel(percent: number): 0 | 1 | 2 | 3 | 4 {
  if (percent <= 0) return 0;
  if (percent < 50) return 1;
  if (percent < 100) return 2;
  return 4;
}

/**
 * Genommene von fälligen Einnahmen in den letzten 30 Tagen bis gestern (ab Anlage);
 * `null` = noch kein abgeschlossener Tag. Archivierte Supplements zählen bis zur Archivierung.
 */
export function supplementAdherence(
  { supplement, intakes }: SupplementWithIntakes,
  trainingDays: TrainingDays,
  today: DayKey,
): { taken: number; due: number; percent: number } | null {
  const yesterday = shiftDay(today, -1);
  const windowStart = shiftDay(today, -ADHERENCE_DAYS);
  const created = createdDay(supplement);
  const start = created > windowStart ? created : windowStart;
  const end =
    supplement.archivedAt && dayKey(new Date(supplement.archivedAt)) <= yesterday
      ? shiftDay(dayKey(new Date(supplement.archivedAt)), -1)
      : yesterday;
  let due = 0;
  let taken = 0;
  for (let day = start; day <= end; day = shiftDay(day, 1)) {
    if (!isSupplementDueOn(supplement, day, trainingDays)) continue;
    for (const dose of supplement.doses) {
      due += 1;
      if (intakes.some((intake) => intake.date === day && intake.doseId === dose.id)) taken += 1;
    }
  }
  if (due === 0) return null;
  return { taken, due, percent: Math.round((taken / due) * 100) };
}

// ---------- Übernahme aus Gewohnheiten ----------

/** Gewohnheiten, die sich als Supplements übernehmen lassen (Unterpunkte oder Zählen) */
export function isSupplementHabitCandidate(habit: Pick<Habit, 'kind' | 'archivedAt'>): boolean {
  return habit.archivedAt === null && (habit.kind === 'items' || habit.kind === 'count');
}

export interface HabitConversion {
  /** Unterpunkt der Gewohnheit; `null` = die Gewohnheit selbst (`count`) */
  itemId: string | null;
  name: string;
  unit: string;
  dose: SupplementDose;
  schedule: SupplementSchedule;
  weekdays: number[];
}

/** Unterpunkte → je ein Supplement; Zählen → eins. Gruppe → Tageszeit, „x-mal pro Woche“ → täglich */
export function supplementsFromHabit(
  habit: Pick<
    Habit,
    'kind' | 'name' | 'unit' | 'target' | 'items' | 'group' | 'frequency' | 'weekdays'
  >,
  newId: () => string = () => crypto.randomUUID(),
): HabitConversion[] {
  const period: SupplementPeriod = habit.group === 'evening' ? 'evening' : 'morning';
  const schedule: SupplementSchedule = habit.frequency === 'weekdays' ? 'weekdays' : 'daily';
  const weekdays = schedule === 'weekdays' ? [...habit.weekdays] : [];
  const sources =
    habit.kind === 'items'
      ? habit.items.map((item) => ({
          itemId: item.id,
          name: item.name,
          unit: item.unit,
          amount: item.target,
        }))
      : habit.kind === 'count'
        ? [{ itemId: null, name: habit.name, unit: habit.unit, amount: habit.target }]
        : [];
  return sources.map(({ itemId, name, unit, amount }) => ({
    itemId,
    name,
    unit,
    dose: { id: newId(), amount, timing: 'period', time: null, period },
    schedule,
    weekdays,
  }));
}
