import type {
  DayKey,
  DistanceUnit,
  EnduranceSession,
  EnduranceSport,
  Exercise,
  WeightUnit,
  WorkoutSet,
} from '../../db/types';
import {
  formatDistance,
  formatPace,
  hasDistance,
  PACE_KINDS,
  sessionDay,
  sessionTitle,
} from '../endurance';
import {
  bestEffortsOf,
  EFFORT_SPORTS,
  formatEffortDistance,
  formatPaceValue,
  lowerIsFaster,
  pacePoints,
  periodTotals,
  weeklyTotals,
} from '../enduranceStats';
import { formatDecimal } from '../format';
import { formatGoalDate } from '../goals';
import { ENDURANCE_SPORT_LABELS, EQUIPMENT_LABELS, MUSCLE_LABELS } from '../labels';
import { enduranceTotalsPerBucket, monthBuckets } from '../report';
import {
  availableMetrics,
  exerciseSeries,
  formatMetricValue,
  formatPercent,
  metricDisplayValue,
  metricLabel,
  type StatsSet,
} from '../stats';
import {
  bestSet,
  currentBests,
  exerciseKind,
  formatRecord,
  sessionVolumeKg,
  setOneRepMax,
} from '../strength';
import { kgToDisplay, metersToDisplay } from '../units';
import { formatClock, formatSetSummary, formatWorkoutDuration, toDateInput } from '../workout';
import { ReportLayout, type PdfTheme } from './layout';

const dateOf = (iso: string) => formatGoalDate(toDateInput(iso));
const formatTime = (time: number) => dateOf(new Date(time).toISOString());

type ReportSet = StatsSet & Pick<WorkoutSet, 'rpe' | 'rir'>;

export interface ExerciseReportData {
  exercise: Pick<
    Exercise,
    'name' | 'equipment' | 'isTimed' | 'primaryMuscles' | 'secondaryMuscles'
  >;
  /** Alle beendeten Einheiten, älteste zuerst */
  sessions: Array<{ startedAt: string; sets: ReportSet[] }>;
  /** Beginn des gewählten Zeitraums (`null` = alles) und sein Name */
  from: Date | null;
  rangeLabel: string;
  weightUnit: WeightUnit;
  bodyWeightKg: number | null;
  createdAt: Date;
  theme?: PdfTheme;
}

const CHART_METRICS = 2;

/** Statistik einer Übung: Verlauf und Einheiten im Zeitraum, Bestwerte über alles */
export function exerciseReportPdf(data: ExerciseReportData): Uint8Array {
  const { exercise, weightUnit: unit } = data;
  const kind = exerciseKind(exercise, data.bodyWeightKg);
  const ranged = data.sessions.filter(
    (session) => !data.from || Date.parse(session.startedAt) >= data.from.getTime(),
  );
  const report = new ReportLayout({
    kind: 'Übungsstatistik',
    title: exercise.name,
    subtitle: [
      `Zeitraum: ${data.rangeLabel}`,
      exercise.primaryMuscles.length > 0 &&
        exercise.primaryMuscles.map((muscle) => MUSCLE_LABELS[muscle]).join(', '),
      EQUIPMENT_LABELS[exercise.equipment],
      `Erstellt am ${formatGoalDate(toDateInput(data.createdAt.toISOString()))}`,
    ]
      .filter(Boolean)
      .join(' · '),
    createdAt: data.createdAt,
    theme: data.theme,
  });

  const points = exerciseSeries(ranged, kind);
  const metrics = availableMetrics(points);
  const workingSets = ranged.reduce(
    (sum, session) => sum + session.sets.filter((set) => !set.isWarmup).length,
    0,
  );
  const volume = ranged.reduce((sum, session) => sum + sessionVolumeKg(session.sets, kind), 0);
  const main = metrics[0];
  const mainValues = main
    ? points.flatMap((point) => (point.values[main] === undefined ? [] : [point.values[main]!]))
    : [];
  const change =
    mainValues.length > 1 && mainValues[0]! > 0
      ? formatPercent(((mainValues.at(-1)! - mainValues[0]!) / mainValues[0]!) * 100)
      : '–';
  report.tiles([
    { label: 'Einheiten', value: String(ranged.length) },
    { label: 'Arbeitssätze', value: String(workingSets) },
    {
      label: 'Volumen',
      value: volume > 0 ? `${formatDecimal(kgToDisplay(volume, unit), 0)} ${unit}` : '–',
    },
    {
      label: main ? `Veränderung ${metricLabel(main, kind.isBodyweight)}` : 'Veränderung',
      value: change,
    },
  ]);

  if (ranged.length === 0) {
    report.paragraph('Keine Einheiten in diesem Zeitraum.', { size: 11 });
  }

  if (metrics.length > 0 && points.length > 1) {
    report.section('Verlauf', 140);
    for (const metric of metrics.slice(0, CHART_METRICS)) {
      const series = points.flatMap(({ date, values }) =>
        values[metric] === undefined
          ? []
          : [{ x: Date.parse(date), y: metricDisplayValue(metric, values[metric]!, unit) }],
      );
      if (series.length < 2) continue;
      report.subheading(metricLabel(metric, kind.isBodyweight), 130);
      report.lineChart({
        points: series,
        formatY: (value) => formatMetricValue(metric, value, unit),
        formatX: formatTime,
      });
    }
  }

  const bests = currentBests(data.sessions, kind);
  if (bests.length > 0) {
    report.section('Bestwerte');
    report.table(
      [
        { header: 'Bestwert', weight: 5 },
        { header: 'Wert', weight: 2.5, align: 'right' },
        { header: 'Erreicht am', weight: 2.5, align: 'right' },
      ],
      bests.map((best) => {
        const { label, value } = formatRecord(best, { unit, isBodyweight: kind.isBodyweight });
        return [label, { text: value, bold: true }, dateOf(best.achievedAt)];
      }),
    );
    report.paragraph('Über alle Einheiten, unabhängig vom Zeitraum.', { size: 8 });
  }

  if (ranged.length > 0) {
    report.section('Einheiten');
    const showOneRepMax = !kind.isTimed;
    report.table(
      [
        { header: 'Datum', weight: 2 },
        { header: 'Bester Satz', weight: 4 },
        { header: 'Sätze', weight: 1.2, align: 'right' },
        ...(showOneRepMax
          ? [
              { header: 'Volumen', weight: 2, align: 'right' as const },
              { header: '1RM', weight: 1.8, align: 'right' as const },
            ]
          : []),
      ],
      [...ranged].reverse().map(({ startedAt, sets }) => {
        const best = bestSet(sets, kind);
        const sessionVolume = sessionVolumeKg(sets, kind);
        const oneRepMax = best ? setOneRepMax(best, kind) : null;
        return [
          dateOf(startedAt),
          best
            ? formatSetSummary(
                { ...best, rpe: null, rir: null },
                { unit, isTimed: kind.isTimed, isBodyweight: kind.isBodyweight },
              )
            : '–',
          String(sets.filter((set) => !set.isWarmup).length),
          ...(showOneRepMax
            ? [
                sessionVolume > 0
                  ? `${formatDecimal(kgToDisplay(sessionVolume, unit), 0)} ${unit}`
                  : '–',
                oneRepMax ? `${formatDecimal(kgToDisplay(oneRepMax, unit), 1)} ${unit}` : '–',
              ]
            : []),
        ];
      }),
    );
    report.paragraph('Neueste zuerst. Sätze = Arbeitssätze ohne Aufwärmen.', { size: 8 });
  }
  return report.finish();
}

export interface EnduranceReportData {
  /** `null` = alle Sportarten */
  sport: EnduranceSport | null;
  /** Alle Einheiten der Sportart (für Bestzeiten), beliebige Reihenfolge */
  sessions: readonly EnduranceSession[];
  from: DayKey | null;
  rangeLabel: string;
  today: DayKey;
  distanceUnit: DistanceUnit;
  createdAt: Date;
  theme?: PdfTheme;
}

/** Mehr Wochen werden als Monate gezeigt */
const MAX_WEEK_BARS = 26;

/** Ausdauer-Statistik einer Sportart (oder aller) im gewählten Zeitraum */
export function enduranceReportPdf(data: EnduranceReportData): Uint8Array {
  const { sport, distanceUnit: unit, today } = data;
  const ranged = data.sessions
    .filter((session) => !data.from || sessionDay(session) >= data.from)
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  const name = sport ? ENDURANCE_SPORT_LABELS[sport].name : 'Alle Sportarten';
  const report = new ReportLayout({
    kind: 'Ausdauer-Statistik',
    title: name,
    subtitle: `Zeitraum: ${data.rangeLabel} · Erstellt am ${formatGoalDate(toDateInput(data.createdAt.toISOString()))}`,
    createdAt: data.createdAt,
    theme: data.theme,
  });
  const withDistance = sport === null || hasDistance(sport);
  const distance = (meters: number) =>
    meters > 0 ? formatDistance(meters, sport ?? 'run', unit, 1) : '–';

  const totals = periodTotals(ranged);
  report.tiles([
    { label: 'Einheiten', value: String(totals.count) },
    { label: 'Dauer', value: formatWorkoutDuration(totals.durationSeconds) },
    ...(withDistance
      ? [
          { label: 'Strecke', value: distance(totals.distanceMeters) },
          {
            label: 'Höhenmeter',
            value:
              totals.elevationGainMeters > 0
                ? `${formatDecimal(totals.elevationGainMeters, 0)} m`
                : '–',
          },
        ]
      : []),
  ]);
  if (ranged.length === 0) {
    report.paragraph('Keine Einheiten in diesem Zeitraum.', { size: 11 });
    return report.finish();
  }

  report.section('Verlauf', 140);
  const weeks = weeklyTotals(ranged, data.from, today);
  const swim = sport === 'swim';
  const value = (sum: { distanceMeters: number; durationSeconds: number }) =>
    withDistance
      ? swim
        ? sum.distanceMeters
        : metersToDisplay(sum.distanceMeters, unit)
      : sum.durationSeconds / 3600;
  const formatValue = (amount: number) =>
    withDistance
      ? `${formatDecimal(amount, swim ? 0 : 1)} ${swim ? 'm' : unit}`
      : formatWorkoutDuration(amount * 3600);
  const bars =
    weeks.length <= MAX_WEEK_BARS
      ? weeks.map((week) => ({
          label: `${week.weekStart.slice(8)}.${week.weekStart.slice(5, 7)}.`,
          values: [value(week)],
        }))
      : enduranceTotalsPerBucket(ranged, monthBuckets(sessionDay(ranged[0]!), today)).map(
          ({ bucket, totals: sum }) => ({ label: bucket.label, values: [value(sum)] }),
        );
  report.subheading(
    `${withDistance ? 'Strecke' : 'Dauer'} ${weeks.length <= MAX_WEEK_BARS ? 'pro Woche' : 'pro Monat'}`,
    130,
  );
  report.barChart({
    bars,
    series: [{ name: withDistance ? 'Strecke' : 'Dauer', color: report.theme.strong }],
    formatValue,
  });

  if (sport && PACE_KINDS[sport]) {
    const pace = pacePoints(ranged, sport, unit);
    if (pace.length >= 2) {
      report.subheading(
        `${PACE_KINDS[sport] === 'speed' ? 'Geschwindigkeit' : 'Pace'} je Einheit`,
        130,
      );
      report.lineChart({
        points: pace.map((point) => ({ x: point.time, y: point.value })),
        formatY: (amount) => formatPaceValue(sport, amount, unit),
        formatX: formatTime,
        reversed: lowerIsFaster(sport),
      });
      report.paragraph('Schneller = weiter oben.', { size: 8 });
    }
  }

  const efforts = (sport ? [sport] : EFFORT_SPORTS).flatMap((item) =>
    bestEffortsOf(data.sessions, item),
  );
  if (efforts.length > 0) {
    report.section('Bestzeiten');
    report.table(
      [
        ...(sport ? [] : [{ header: 'Sportart', weight: 3 }]),
        { header: 'Strecke', weight: 3 },
        { header: 'Zeit', weight: 2, align: 'right' as const },
        { header: 'Am', weight: 2, align: 'right' as const },
      ],
      efforts.map((effort) => [
        ...(sport ? [] : [ENDURANCE_SPORT_LABELS[effort.sport].name]),
        formatEffortDistance(effort.meters),
        { text: formatClock(effort.seconds), bold: true },
        dateOf(effort.startedAt),
      ]),
    );
    report.paragraph('Über alle Einheiten mit Verlauf, unabhängig vom Zeitraum.', { size: 8 });
  }

  report.section('Einheiten');
  report.table(
    [
      { header: 'Datum', weight: 2 },
      { header: 'Einheit', weight: 3.4 },
      { header: 'Dauer', weight: 1.7, align: 'right' },
      ...(withDistance
        ? [
            { header: 'Strecke', weight: 1.9, align: 'right' as const },
            { header: 'Pace / Tempo', weight: 2.2, align: 'right' as const },
          ]
        : []),
      { header: 'Ø Puls', weight: 1.4, align: 'right' },
    ],
    [...ranged]
      .reverse()
      .map((session) => [
        dateOf(session.startedAt),
        sport
          ? sessionTitle(session)
          : `${sessionTitle(session)}${session.title ? ` (${ENDURANCE_SPORT_LABELS[session.sport].name})` : ''}`,
        formatClock(session.durationSeconds),
        ...(withDistance
          ? [
              session.distanceMeters
                ? formatDistance(session.distanceMeters, session.sport, unit)
                : '–',
              formatPace(session.sport, session.distanceMeters, session.durationSeconds, unit) ??
                '–',
            ]
          : []),
        session.avgHeartRate ? `${session.avgHeartRate} bpm` : '–',
      ]),
  );
  report.paragraph('Neueste zuerst.', { size: 8 });
  return report.finish();
}
