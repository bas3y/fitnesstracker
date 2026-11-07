import type { DayKey, DistanceUnit, Goal, WeightUnit } from '../db/types';
import { dayKey } from './daily';
import { goalProgress } from './goals';
import { habitItemStreak, areaSeries, runReachedOn, type MotivationData } from './streaks';
import type { DayValue } from './habits';
import { recordCounts } from './stats';
import { exerciseKind, sessionVolumeKg } from './strength';
import { kgToDisplay, metersToDisplay } from './units';

export const BADGE_CATEGORIES = ['training', 'daily', 'self'] as const;
export type BadgeCategory = (typeof BADGE_CATEGORIES)[number];

export const BADGE_CATEGORY_LABELS: Record<BadgeCategory, string> = {
  training: 'Training',
  daily: 'Alltag',
  self: 'Persönliche Entwicklung',
};

export const BADGE_IDS = [
  'workouts',
  'endurance',
  'distance',
  'volume',
  'records',
  'trainingStreak',
  'habitStreak',
  'steps',
  'water',
  'sleep',
  'protein',
  'journal',
  'books',
  'meditation',
  'focus',
  'goals',
  'photos',
] as const;
export type BadgeId = (typeof BADGE_IDS)[number];

export interface BadgeUnits {
  weightUnit: WeightUnit;
  distanceUnit: DistanceUnit;
}

export interface BadgeDef {
  id: BadgeId;
  category: BadgeCategory;
  icon: string;
  name: string;
  /** Schwellen je Stufe, intern (Anzahl, Meter, kg, Sekunden, Tage, Wochen) */
  tiers: readonly number[];
}

const HOUR = 3600;

export const BADGES: readonly BadgeDef[] = [
  {
    id: 'workouts',
    category: 'training',
    icon: '🏋️',
    name: 'Krafttraining',
    tiers: [1, 10, 50, 100, 250, 500],
  },
  {
    id: 'endurance',
    category: 'training',
    icon: '🏃',
    name: 'Ausdauer',
    tiers: [1, 10, 50, 100, 250],
  },
  {
    id: 'distance',
    category: 'training',
    icon: '🛣️',
    name: 'Strecke',
    tiers: [10e3, 100e3, 500e3, 1000e3, 5000e3],
  },
  {
    id: 'volume',
    category: 'training',
    icon: '💪',
    name: 'Bewegte Last',
    tiers: [1e3, 1e4, 1e5, 5e5, 1e6],
  },
  {
    id: 'records',
    category: 'training',
    icon: '🏆',
    name: 'Rekordjäger',
    tiers: [1, 10, 50, 100, 250],
  },
  {
    id: 'trainingStreak',
    category: 'training',
    icon: '🔥',
    name: 'Trainingsserie',
    tiers: [4, 12, 26, 52],
  },
  {
    id: 'habitStreak',
    category: 'daily',
    icon: '✅',
    name: 'Gewohnheitsserie',
    tiers: [7, 30, 100, 365],
  },
  { id: 'steps', category: 'daily', icon: '👟', name: 'Schritte', tiers: [1e5, 1e6, 5e6, 1e7] },
  { id: 'water', category: 'daily', icon: '💧', name: 'Wasserziel', tiers: [7, 30, 100, 365] },
  { id: 'sleep', category: 'daily', icon: '😴', name: 'Schlafziel', tiers: [7, 30, 100, 365] },
  { id: 'protein', category: 'daily', icon: '🥩', name: 'Proteinziel', tiers: [7, 30, 100, 365] },
  { id: 'journal', category: 'self', icon: '📓', name: 'Journal', tiers: [1, 7, 30, 100, 365] },
  { id: 'books', category: 'self', icon: '📚', name: 'Bücher', tiers: [1, 5, 10, 25, 50] },
  {
    id: 'meditation',
    category: 'self',
    icon: '🧘',
    name: 'Meditation',
    tiers: [HOUR, 10 * HOUR, 50 * HOUR, 100 * HOUR],
  },
  {
    id: 'focus',
    category: 'self',
    icon: '⏱️',
    name: 'Fokus',
    tiers: [5 * HOUR, 25 * HOUR, 100 * HOUR, 500 * HOUR],
  },
  { id: 'goals', category: 'self', icon: '🎯', name: 'Ziele', tiers: [1, 5, 10, 25] },
  { id: 'photos', category: 'self', icon: '📸', name: 'Fortschrittsfotos', tiers: [1, 10, 50] },
];

export function badgeById(id: string): BadgeDef | undefined {
  return BADGES.find((badge) => badge.id === id);
}

// ---------- Auswertung ----------

export interface BadgeTier {
  threshold: number;
  reached: boolean;
  /** `null` = nicht erreicht oder Tag unbekannt */
  achievedOn: DayKey | null;
}

export interface BadgeState {
  badge: BadgeDef;
  /** Aktueller Wert (Summe bzw. längste Serie) */
  value: number;
  /** Erreichte Stufen (0 = gesperrt) */
  level: number;
  tiers: BadgeTier[];
}

interface Metric {
  value: number;
  reachedOn: (threshold: number) => DayKey | null;
}

/** Summe über datierte Werte (aufsteigend sortiert) */
function sumMetric(points: readonly DayValue[]): Metric {
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const value = sorted.reduce((total, point) => total + point.value, 0);
  return {
    value,
    reachedOn: (threshold) => {
      let running = 0;
      for (const point of sorted) {
        running += point.value;
        if (running >= threshold - 1e-9) return point.date;
      }
      return null;
    },
  };
}

const countOf = (days: readonly DayKey[]) => sumMetric(days.map((date) => ({ date, value: 1 })));

/** Längste Serie, erreicht am Tag, an dem die Serie die Länge hatte */
function seriesMetric(series: readonly DayValue[]): Metric {
  return {
    value: series.reduce((max, point) => Math.max(max, point.value), 0),
    reachedOn: (threshold) => runReachedOn(series, threshold),
  };
}

/** Tage der erreichten einmaligen Ziele (wiederkehrende zählen nicht) */
export function achievedGoalDays(
  goals: readonly Goal[],
  data: MotivationData,
  today: DayKey,
): DayKey[] {
  return goals.flatMap((goal) => {
    const progress = goalProgress(goal, data, today);
    return progress.status === 'achieved' && !progress.recurring && progress.achievedOn
      ? [progress.achievedOn]
      : [];
  });
}

function metricOf(id: BadgeId, data: MotivationData, goals: readonly Goal[], today: DayKey) {
  const day = (timestamp: string) => dayKey(new Date(timestamp));
  switch (id) {
    case 'workouts':
      return countOf([
        ...new Map(data.strength.map((s) => [s.workoutId, day(s.startedAt)])).values(),
      ]);
    case 'endurance':
      return countOf(data.endurance.map((session) => day(session.startedAt)));
    case 'distance':
      return sumMetric(
        data.endurance.map((s) => ({ date: day(s.startedAt), value: s.distanceMeters ?? 0 })),
      );
    case 'volume':
      return sumMetric(
        data.strength.map((s) => ({
          date: day(s.startedAt),
          value: sessionVolumeKg(s.sets, exerciseKind(s.exercise, data.bodyWeightKg)),
        })),
      );
    case 'records':
      return sumMetric(
        recordCounts(data.strength, data.bodyWeightKg).map(({ startedAt, count }) => ({
          date: day(startedAt),
          value: count,
        })),
      );
    case 'trainingStreak':
      return seriesMetric(areaSeries('training', data, today));
    case 'habitStreak': {
      const best = data.habits.reduce((max, item) => {
        const streak = habitItemStreak(item, today);
        return streak.unit === 'days' ? Math.max(max, streak.best) : max;
      }, 0);
      return { value: best, reachedOn: () => null };
    }
    case 'steps':
      return sumMetric(data.logs.map((log) => ({ date: log.date, value: log.steps ?? 0 })));
    case 'water':
    case 'sleep':
    case 'protein':
      return countOf(areaSeries(id, data, today).flatMap((p) => (p.value > 0 ? [p.date] : [])));
    case 'journal':
      return countOf(data.journalDays);
    case 'books':
      return countOf(data.finishedBooks);
    case 'meditation':
    case 'focus':
      return sumMetric(
        data.timerSessions
          .filter((session) => session.kind === id)
          .map((session) => ({ date: session.date, value: session.durationSeconds })),
      );
    case 'goals':
      return countOf(achievedGoalDays(goals, data, today));
    case 'photos':
      return countOf(data.photoDays);
  }
}

/** Alle Abzeichen in fester Reihenfolge; Stufen nur bis heute */
export function evaluateBadges(
  data: MotivationData,
  goals: readonly Goal[],
  today: DayKey,
): BadgeState[] {
  return BADGES.map((badge) => {
    const metric = metricOf(badge.id, data, goals, today);
    const tiers = badge.tiers.map((threshold) => {
      const reached = metric.value >= threshold - 1e-9;
      return { threshold, reached, achievedOn: reached ? metric.reachedOn(threshold) : null };
    });
    return {
      badge,
      value: metric.value,
      level: tiers.filter((tier) => tier.reached).length,
      tiers,
    };
  });
}

/** Nächste Stufe; `null` = alle erreicht */
export function nextTier(state: BadgeState): BadgeTier | null {
  return state.tiers.find((tier) => !tier.reached) ?? null;
}

/** 0–1 bis zur nächsten Stufe (ab der letzten erreichten) */
export function tierShare(state: BadgeState): number {
  const next = nextTier(state);
  if (!next) return 1;
  const previous = state.tiers[state.level - 1]?.threshold ?? 0;
  return Math.min(1, Math.max(0, (state.value - previous) / (next.threshold - previous)));
}

// ---------- Anzeige ----------

function grouped(value: number, decimals = 0): string {
  return value.toLocaleString('de-DE', { maximumFractionDigits: decimals });
}

function plural(count: number, one: string, many: string): string {
  return `${grouped(count)} ${count === 1 ? one : many}`;
}

/** Wert in der Einheit des Abzeichens, z. B. „42 km“, „12,5 t“, „3 h“ */
export function formatBadgeValue(id: BadgeId, value: number, units: BadgeUnits): string {
  switch (id) {
    case 'distance': {
      const shown = metersToDisplay(value, units.distanceUnit);
      return `${grouped(shown, shown < 100 ? 1 : 0)} ${units.distanceUnit}`;
    }
    case 'volume':
      return units.weightUnit === 'kg'
        ? `${grouped(value / 1000, value < 100_000 ? 1 : 0)} t`
        : `${grouped(kgToDisplay(value, 'lb'))} lb`;
    case 'meditation':
    case 'focus': {
      const hours = value / HOUR;
      return `${grouped(hours, hours < 10 ? 1 : 0)} h`;
    }
    case 'trainingStreak':
      return plural(value, 'Woche', 'Wochen');
    case 'habitStreak':
    case 'water':
    case 'sleep':
    case 'protein':
    case 'journal':
      return plural(value, 'Tag', 'Tage');
    default:
      return grouped(value);
  }
}

/** Bezeichnung einer Stufe, z. B. „50 Krafttrainings“, „100 km insgesamt“ */
export function formatBadgeTier(id: BadgeId, threshold: number, units: BadgeUnits): string {
  const value = formatBadgeValue(id, threshold, units);
  switch (id) {
    case 'workouts':
      return threshold === 1 ? 'Erstes Krafttraining' : `${grouped(threshold)} Krafttrainings`;
    case 'endurance':
      return threshold === 1
        ? 'Erste Ausdauer-Einheit'
        : `${grouped(threshold)} Ausdauer-Einheiten`;
    case 'distance':
      return `${value} insgesamt`;
    case 'volume':
      return `${value} bewegt`;
    case 'records':
      return threshold === 1 ? 'Erster Rekord' : `${grouped(threshold)} Rekorde`;
    case 'trainingStreak':
      return `${value} am Stück im Wochenziel`;
    case 'habitStreak':
      return `${value} am Stück`;
    case 'steps':
      return `${grouped(threshold)} Schritte`;
    case 'water':
    case 'sleep':
    case 'protein':
      return `${value} erreicht`;
    case 'journal':
      return threshold === 1 ? 'Erster Eintrag' : `${value} geschrieben`;
    case 'books':
      return threshold === 1 ? 'Erstes Buch gelesen' : `${grouped(threshold)} Bücher gelesen`;
    case 'meditation':
      return `${value} meditiert`;
    case 'focus':
      return `${value} fokussiert`;
    case 'goals':
      return threshold === 1 ? 'Erstes Ziel erreicht' : `${grouped(threshold)} Ziele erreicht`;
    case 'photos':
      return threshold === 1 ? 'Erstes Foto' : `${grouped(threshold)} Fotos`;
  }
}

/** Kurzer Hinweis, was zählt */
export const BADGE_HINTS: Record<BadgeId, string> = {
  workouts: 'Beendete Krafttrainings',
  endurance: 'Ausdauer-Einheiten aller Sportarten',
  distance: 'Strecke aller Ausdauer-Einheiten',
  volume: 'Volumen aller Arbeitssätze (ohne Stufen und Halteübungen)',
  records: 'Neue Kraft-Rekorde (ab der zweiten Einheit einer Übung)',
  trainingStreak: 'Wochen am Stück mit erreichtem Trainings-Wochenziel',
  habitStreak: 'Längste Serie einer Gewohnheit (täglich oder an festen Tagen, Aufhören)',
  steps: 'Alle eingetragenen Schritte',
  water: 'Tage mit erreichtem Wasserziel',
  sleep: 'Tage mit erreichtem Schlafziel',
  protein: 'Tage mit erreichtem Proteinziel',
  journal: 'Tage mit Journal-Eintrag',
  books: 'Als gelesen markierte Bücher',
  meditation: 'Zeit aller Meditations-Sitzungen',
  focus: 'Fokus-Zeit aller Timer-Sitzungen',
  goals: 'Erreichte einmalige Ziele',
  photos: 'Gespeicherte Fortschrittsfotos',
};
