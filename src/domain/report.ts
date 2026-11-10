import type { DailyLog, DayKey, EnduranceSport } from '../db/types';
import { dayKey, shiftDay } from './daily';
import { sessionDay, sessionTotals, type DayRange } from './endurance';
import {
  newEffortRecords,
  periodTotals,
  type EffortRecord,
  type PeriodTotals,
} from './enduranceStats';
import { isoWeek, type CalendarPeriod } from './periods';
import type { ReviewEnduranceSession, ReviewInput } from './review';
import {
  muscleVolumes,
  parseDayKey,
  progressCandidates,
  recordsBetween,
  type MuscleVolume,
  type RecentRecords,
  type StatsExercise,
  type StatsSession,
} from './stats';
import { exerciseKind } from './strength';
import { toDateInput } from './workout';

/** Abschnitt einer Zeitachse im Bericht (Tag, Woche oder Monat) */
export interface ReportBucket {
  label: string;
  from: DayKey;
  to: DayKey;
}

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

const dayLabel = (day: DayKey) => String(Number(day.slice(8)));

function days({ from, to }: DayRange, label: (day: DayKey, index: number) => string) {
  const buckets: ReportBucket[] = [];
  for (let day = from, index = 0; day <= to; day = shiftDay(day, 1), index++) {
    buckets.push({ label: label(day, index), from: day, to: day });
  }
  return buckets;
}

function months({ from }: DayRange): ReportBucket[] {
  const year = Number(from.slice(0, 4));
  return MONTHS.map((label, month) => ({
    label,
    from: dayKey(new Date(year, month, 1)),
    to: dayKey(new Date(year, month + 1, 0)),
  }));
}

/** Kalenderwochen (Mo–So) im Zeitraum, am Rand abgeschnitten */
function weeks({ from, to }: DayRange): ReportBucket[] {
  const buckets: ReportBucket[] = [];
  let start = from;
  while (start <= to) {
    const offset = (parseDayKey(start).getDay() + 6) % 7;
    const sunday = shiftDay(start, 6 - offset);
    buckets.push({ label: `KW ${isoWeek(start)}`, from: start, to: sunday < to ? sunday : to });
    start = shiftDay(sunday, 1);
  }
  return buckets;
}

/** Kalendermonate von `from` bis `to`, z. B. „Nov 26“ */
export function monthBuckets(from: DayKey, to: DayKey): ReportBucket[] {
  const buckets: ReportBucket[] = [];
  const date = parseDayKey(`${from.slice(0, 7)}-01`);
  while (dayKey(date) <= to) {
    const year = date.getFullYear();
    const month = date.getMonth();
    buckets.push({
      label: `${MONTHS[month]} ${String(year).slice(2)}`,
      from: dayKey(new Date(year, month, 1)),
      to: dayKey(new Date(year, month + 1, 0)),
    });
    date.setMonth(month + 1);
  }
  return buckets;
}

/** Zeitachse für Trainings: Woche → Tage, Monat → Wochen, Jahr → Monate */
export function trainingBuckets(period: CalendarPeriod, range: DayRange): ReportBucket[] {
  if (period === 'week') return days(range, (_, index) => WEEKDAYS[index]!);
  if (period === 'month') return weeks(range);
  return months(range);
}

/** Zeitachse für Tageswerte: Woche/Monat → Tage, Jahr → Monate */
export function dailyBuckets(period: CalendarPeriod, range: DayRange): ReportBucket[] {
  if (period === 'week') return days(range, (_, index) => WEEKDAYS[index]!);
  if (period === 'month') return days(range, dayLabel);
  return months(range);
}

const inBucket = (day: DayKey, bucket: ReportBucket) => day >= bucket.from && day <= bucket.to;

export interface TrainingCount {
  /** Krafttrainings (Workouts) */
  strength: number;
  /** Ausdauer-Einheiten */
  endurance: number;
}

export function trainingPerBucket(
  input: Pick<ReviewInput, 'strength' | 'endurance'>,
  buckets: readonly ReportBucket[],
): TrainingCount[] {
  const workouts = new Map<string, DayKey>();
  for (const session of input.strength) {
    workouts.set(session.workoutId, toDateInput(session.startedAt));
  }
  const workoutDays = [...workouts.values()];
  const enduranceDays = input.endurance.map(sessionDay);
  return buckets.map((bucket) => ({
    strength: workoutDays.filter((day) => inBucket(day, bucket)).length,
    endurance: enduranceDays.filter((day) => inBucket(day, bucket)).length,
  }));
}

/** Ø je Abschnitt über die Tage mit Wert (0 = nicht erfasst); `null` = kein Wert */
export function averagePerBucket(
  logs: readonly DailyLog[],
  buckets: readonly ReportBucket[],
  pick: (log: DailyLog) => number | null,
): Array<number | null> {
  return buckets.map((bucket) => {
    const values = logs
      .filter((log) => inBucket(log.date, bucket))
      .map(pick)
      .filter((value): value is number => value !== null && value > 0);
    return values.length === 0
      ? null
      : values.reduce((sum, value) => sum + value, 0) / values.length;
  });
}

/** Gewicht je Tag mit Eintrag im Zeitraum, älteste zuerst */
export function weightsIn(
  logs: readonly DailyLog[],
  range: DayRange,
): { day: DayKey; kg: number }[] {
  return logs
    .filter((log) => log.weightKg !== null && log.date >= range.from && log.date <= range.to)
    .map((log) => ({ day: log.date, kg: log.weightKg! }))
    .sort((a, b) => a.day.localeCompare(b.day));
}

export type TrainingDayKind = 'strength' | 'endurance' | 'both';

export function trainingDayKinds(
  input: Pick<ReviewInput, 'strength' | 'endurance'>,
  range: DayRange,
): Map<DayKey, TrainingDayKind> {
  const kinds = new Map<DayKey, TrainingDayKind>();
  const put = (day: DayKey, kind: 'strength' | 'endurance') => {
    if (day < range.from || day > range.to) return;
    const current = kinds.get(day);
    kinds.set(day, current && current !== kind ? 'both' : kind);
  };
  for (const session of input.strength) put(toDateInput(session.startedAt), 'strength');
  for (const session of input.endurance) put(sessionDay(session), 'endurance');
  return kinds;
}

// ---------- Kraft ----------

const startOf = (day: DayKey) => parseDayKey(day).getTime();
const inRangeOf = (range: DayRange) => (session: { startedAt: string }) => {
  const day = toDateInput(session.startedAt);
  return day >= range.from && day <= range.to;
};

export interface ExerciseChange {
  exercise: StatsExercise;
  sessions: number;
  /** Arbeitssätze */
  sets: number;
  /** Bestwert im Zeitraum gegenüber dem Vergleichszeitraum in %; `null` = kein Vergleich */
  percent: number | null;
}

/**
 * Übungen im Zeitraum mit Veränderung zum Vergleichszeitraum (bester 1RM, Stufe, Wdh. bzw. Dauer,
 * wie beim Fortschritt). Größter Fortschritt zuerst, ohne Vergleich zuletzt (nach Einheiten).
 */
export function exerciseChanges(
  strength: readonly StatsSession[],
  range: DayRange,
  compare: DayRange,
  bodyWeightKg: number | null,
): ExerciseChange[] {
  const current = strength.filter(inRangeOf(range));
  const before = strength.filter(inRangeOf(compare));
  const ids = [...new Set(current.map((session) => session.exercise.id))];
  return ids
    .map((id) => {
      const own = current.filter((session) => session.exercise.id === id);
      const exercise = own[0]!.exercise;
      const kind = exerciseKind(exercise, bodyWeightKg);
      const best = (sessions: readonly StatsSession[], index: number) => {
        const values = sessions
          .map((session) => progressCandidates(session.sets, kind)[index])
          .filter((value): value is number => value !== undefined && value > 0);
        return values.length > 0 ? Math.max(...values) : null;
      };
      const earlier = before.filter((session) => session.exercise.id === id);
      const count = progressCandidates([], kind).length;
      let percent: number | null = null;
      for (let index = 0; index < count && earlier.length > 0; index++) {
        const now = best(own, index);
        const then = best(earlier, index);
        if (now !== null && then !== null) {
          percent = ((now - then) / then) * 100;
          break;
        }
      }
      return {
        exercise,
        sessions: own.length,
        sets: own.reduce(
          (sum, session) => sum + session.sets.filter((set) => !set.isWarmup).length,
          0,
        ),
        percent,
      };
    })
    .sort(
      (a, b) =>
        (b.percent ?? Number.NEGATIVE_INFINITY) - (a.percent ?? Number.NEGATIVE_INFINITY) ||
        b.sessions - a.sessions ||
        a.exercise.name.localeCompare(b.exercise.name, 'de'),
    );
}

/** Rekorde in Einheiten des Zeitraums (verglichen mit allem davor), älteste zuerst */
export function recordsIn(
  strength: StatsSession[],
  range: DayRange,
  bodyWeightKg: number | null,
): RecentRecords[] {
  return recordsBetween(
    strength,
    bodyWeightKg,
    startOf(range.from),
    startOf(shiftDay(range.to, 1)),
  );
}

/** Arbeitssätze je Muskelgruppe im Zeitraum (Hilfsmuskeln halb), meiste zuerst */
export function muscleSetsIn(strength: readonly StatsSession[], range: DayRange): MuscleVolume[] {
  return muscleVolumes(strength.filter(inRangeOf(range)), 1);
}

// ---------- Ausdauer ----------

export interface SportTotals {
  sport: EnduranceSport;
  totals: PeriodTotals;
}

/** Summen je Sportart, meiste Zeit zuerst */
export function sportTotalsIn(
  sessions: readonly ReviewEnduranceSession[],
  range: DayRange,
): SportTotals[] {
  const inside = sessions.filter((session) => {
    const day = sessionDay(session);
    return day >= range.from && day <= range.to;
  });
  return [...new Set(inside.map((session) => session.sport))]
    .map((sport) => ({
      sport,
      totals: periodTotals(inside.filter((session) => session.sport === sport)),
    }))
    .sort((a, b) => b.totals.durationSeconds - a.totals.durationSeconds);
}

/** Neue Bestzeiten in Einheiten des Zeitraums, älteste zuerst */
export function effortRecordsIn(
  sessions: readonly ReviewEnduranceSession[],
  range: DayRange,
): EffortRecord[] {
  const upToEnd = sessions.filter((session) => sessionDay(session) <= range.to);
  const ids = upToEnd
    .filter((session) => sessionDay(session) >= range.from)
    .map((session) => session.id);
  return newEffortRecords(upToEnd, ids).sort((a, b) => a.startedAt.localeCompare(b.startedAt));
}

/** Einheiten im Zeitraum, älteste zuerst */
export function enduranceSessionsIn<T extends ReviewEnduranceSession>(
  sessions: readonly T[],
  range: DayRange,
): T[] {
  return sessions
    .filter((session) => {
      const day = sessionDay(session);
      return day >= range.from && day <= range.to;
    })
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt));
}

/** Summen je Abschnitt (z. B. Monate eines Jahres) */
export function enduranceTotalsPerBucket(
  sessions: readonly ReviewEnduranceSession[],
  buckets: readonly ReportBucket[],
) {
  return buckets.map((bucket) => ({
    bucket,
    totals: sessionTotals(sessions.filter((session) => inBucket(sessionDay(session), bucket))),
  }));
}

// ---------- Namen ----------

export const REPORT_KINDS: Record<CalendarPeriod, string> = {
  week: 'Wochenbericht',
  month: 'Monatsbericht',
  year: 'Jahresbericht',
};

/** Dateiname ohne Endung, z. B. `basey-bericht-2026-11`, `basey-bericht-2026-kw45` */
export function reportFileName(period: CalendarPeriod, range: DayRange): string {
  if (period === 'year') return `basey-bericht-${range.from.slice(0, 4)}`;
  if (period === 'month') return `basey-bericht-${range.from.slice(0, 7)}`;
  const year = parseDayKey(shiftDay(range.from, 3)).getFullYear();
  return `basey-bericht-${year}-kw${String(isoWeek(range.from)).padStart(2, '0')}`;
}

/** Für Dateinamen: Kleinbuchstaben, Umlaute ausgeschrieben, nur a–z, 0–9 und Bindestrich */
export function fileSlug(text: string): string {
  const slug = text
    .toLowerCase()
    .replaceAll('ä', 'ae')
    .replaceAll('ö', 'oe')
    .replaceAll('ü', 'ue')
    .replaceAll('ß', 'ss')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug.slice(0, 40).replace(/-+$/, '') || 'export';
}
