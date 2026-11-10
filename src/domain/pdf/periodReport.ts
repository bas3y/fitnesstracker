import type { DayKey } from '../../db/types';
import { formatDistance, formatPace, hasDistance, type DayRange } from '../endurance';
import { formatEffortDistance } from '../enduranceStats';
import { formatDecimal } from '../format';
import { formatGoalDate } from '../goals';
import { ENDURANCE_SPORT_LABELS, MUSCLE_LABELS } from '../labels';
import {
  CALENDAR_PERIOD_LABELS,
  formatDayRange,
  formatPeriod,
  inRange,
  type CalendarPeriod,
} from '../periods';
import {
  averagePerBucket,
  dailyBuckets,
  effortRecordsIn,
  enduranceSessionsIn,
  enduranceTotalsPerBucket,
  exerciseChanges,
  muscleSetsIn,
  recordsIn,
  REPORT_KINDS,
  sportTotalsIn,
  trainingBuckets,
  trainingDayKinds,
  trainingPerBucket,
  weightsIn,
  type TrainingDayKind,
} from '../report';
import { hasReviewData, reviewSummary, type ReviewInput, type ReviewSummary } from '../review';
import {
  dailyRows,
  formatReviewDelta,
  growthRows,
  habitRows,
  nutritionRows,
  shownRows,
  trainingRows,
  type ReviewRow,
  type ReviewUnits,
} from '../reviewRows';
import { formatPercent, parseDayKey } from '../stats';
import { exerciseKind, formatRecord } from '../strength';
import { kgToDisplay } from '../units';
import { formatClock, formatWorkoutDuration, toDateInput } from '../workout';
import { PDF_COLORS, ReportLayout, type Cell, type PdfTheme } from './layout';
import type { Rgb } from './pdfWriter';

export interface PeriodReportData {
  period: CalendarPeriod;
  range: DayRange;
  compare: DayRange;
  today: DayKey;
  input: ReviewInput;
  units: ReviewUnits;
  /** Erreichte Ziele mit Namen; `null` = keine Ziele angelegt */
  goals: { name: string; on: DayKey }[] | null;
  createdAt: Date;
  theme?: PdfTheme;
}

const PREVIOUS_LABELS: Record<CalendarPeriod, string> = {
  week: 'Vorwoche',
  month: 'Vormonat',
  year: 'Vorjahr',
};

const BUCKET_NAMES: Record<CalendarPeriod, string> = {
  week: 'je Tag',
  month: 'je Woche',
  year: 'je Monat',
};

const RECORD_LIMIT = 40;
const EXERCISE_LIMIT = 15;

const count = (value: number) => formatDecimal(value, 1);
const dateOf = (iso: string) => formatGoalDate(toDateInput(iso));

/** Monats-, Jahres- oder Wochenbericht als PDF */
export function periodReportPdf(data: PeriodReportData): Uint8Array {
  const { period, range, compare, today, input } = data;
  const current = reviewSummary(input, range, today);
  const previous = reviewSummary(input, compare, today);
  const running = inRange(today, range);
  const report = new ReportLayout({
    kind: REPORT_KINDS[period],
    title: formatPeriod(period, range),
    subtitle: [
      period === 'week' ? null : formatDayRange(range),
      running ? `Stand ${formatDayRange({ from: today, to: today })}` : null,
      `Vergleich: ${running ? `${PREVIOUS_LABELS[period]} bis zum gleichen Tag` : formatPeriod(period, compare)}`,
      `Erstellt am ${formatGoalDate(toDateInput(data.createdAt.toISOString()))}`,
    ]
      .filter(Boolean)
      .join(' · '),
    createdAt: data.createdAt,
    theme: data.theme,
  });

  if (!hasReviewData(current)) {
    report.paragraph('Keine Einträge in diesem Zeitraum.', { size: 11 });
  } else {
    report.tiles([
      { label: 'Trainingstage', value: String(current.trainingDays) },
      { label: 'Krafttrainings', value: String(current.strength.workouts) },
      {
        label: 'Ausdauer-Zeit',
        value: formatWorkoutDuration(current.endurance.durationSeconds),
      },
      {
        label: 'Neue Rekorde',
        value: String(current.strength.records + current.endurance.records),
      },
    ]);
  }

  overview(report, data, current, previous);
  charts(report, data);
  strengthDetails(report, data);
  enduranceDetails(report, data);
  return report.finish();
}

function deltaCell(row: ReviewRow, theme: PdfTheme): Cell {
  const delta = formatReviewDelta(row);
  if (!delta) return '';
  const color: Rgb =
    delta.better === true
      ? theme.strong
      : delta.better === false
        ? PDF_COLORS.danger
        : PDF_COLORS.muted;
  return { text: delta.text, color, bold: delta.better !== null };
}

function overview(
  report: ReportLayout,
  { period, units, goals }: PeriodReportData,
  current: ReviewSummary,
  previous: ReviewSummary,
) {
  const sports = current.endurance.bySport
    .map(
      ({ sport, totals }) =>
        `${ENDURANCE_SPORT_LABELS[sport].name} ${formatWorkoutDuration(totals.durationSeconds)}`,
    )
    .join(' · ');
  const groups: { title: string; rows: ReviewRow[]; hint?: string }[] = [
    {
      title: 'Training',
      rows: trainingRows(current, previous, units),
      hint: sports ? `Ausdauer je Sportart: ${sports}` : undefined,
    },
    {
      title: 'Alltag',
      rows: dailyRows(current, previous, units),
      hint: 'Ø über die Tage mit Eintrag.',
    },
    { title: 'Ernährung', rows: nutritionRows(current, previous, units) },
    { title: 'Gewohnheiten', rows: habitRows(current, previous) },
    { title: 'Persönliche Entwicklung', rows: growthRows(current, previous) },
  ]
    .map((group) => ({ ...group, rows: shownRows(group.rows) }))
    .filter((group) => group.rows.length > 0);
  if (groups.length === 0 && !goals?.length) return;

  report.section('Überblick');
  for (const group of groups) {
    report.subheading(group.title);
    report.table(
      [
        { header: 'Kennzahl', weight: 4 },
        { header: CALENDAR_PERIOD_LABELS[period], weight: 2, align: 'right' },
        { header: PREVIOUS_LABELS[period], weight: 2, align: 'right' },
        { header: 'Änderung', weight: 2, align: 'right' },
      ],
      group.rows.map((row) => [
        row.label,
        { text: row.current === null ? '–' : row.format(row.current), bold: true },
        row.previous === null ? '–' : row.format(row.previous),
        deltaCell(row, report.theme),
      ]),
    );
    if (group.hint) report.paragraph(group.hint, { size: 8 });
  }

  if (goals) {
    report.subheading('Erreichte Ziele', 20);
    if (goals.length === 0) report.paragraph('Kein Ziel in diesem Zeitraum erreicht.');
    else {
      report.table(
        [
          { header: 'Ziel', weight: 7 },
          { header: 'Erreicht am', weight: 2, align: 'right' },
        ],
        goals.map(({ name, on }) => [name, formatGoalDate(on)]),
      );
    }
  }
}

function charts(report: ReportLayout, { period, range, today, input, units }: PeriodReportData) {
  const { theme } = report;
  const kinds = trainingDayKinds(input, range);
  const logs = input.logs.filter((log) => log.date >= range.from && log.date <= range.to);
  const weights = weightsIn(logs, range);
  const daily = dailyBuckets(period, range);
  const steps = averagePerBucket(logs, daily, (log) => log.steps);
  const sleep = averagePerBucket(logs, daily, (log) => log.sleepSeconds);
  const hasSteps = steps.some((value) => value !== null);
  const hasSleep = sleep.some((value) => value !== null);
  if (kinds.size === 0 && weights.length < 2 && !hasSteps && !hasSleep) return;

  report.section('Verlauf', 140);
  if (kinds.size > 0) {
    const buckets = trainingBuckets(period, range);
    const counts = trainingPerBucket(input, buckets);
    report.subheading(`Trainings ${BUCKET_NAMES[period]}`, 140);
    report.barChart({
      bars: buckets.map((bucket, index) => ({
        label: bucket.label,
        values: [counts[index]!.strength, counts[index]!.endurance],
      })),
      series: [
        { name: 'Krafttraining', color: theme.strong },
        { name: 'Ausdauer', color: theme.mid },
      ],
      formatValue: count,
      showTotals: true,
    });

    if (period !== 'week') {
      const colors: Record<TrainingDayKind, Rgb> = {
        strength: theme.strong,
        endurance: theme.mid,
        both: theme.deep,
      };
      const months =
        period === 'month'
          ? [range.from.slice(0, 7)]
          : Array.from(
              { length: 12 },
              (_, index) => `${range.from.slice(0, 4)}-${String(index + 1).padStart(2, '0')}`,
            );
      report.subheading('Trainingstage', period === 'month' ? 190 : 120);
      report.calendars(
        months.map((month) => ({
          month,
          title: parseDayKey(`${month}-01`).toLocaleDateString('de-DE', {
            month: 'long',
            ...(period === 'month' ? { year: 'numeric' } : {}),
          }),
        })),
        (day) => {
          const kind = kinds.get(day);
          return kind ? colors[kind] : null;
        },
      );
      report.legend([
        { label: 'Krafttraining', color: colors.strength },
        { label: 'Ausdauer', color: colors.endurance },
        { label: 'Beides', color: colors.both },
      ]);
      report.spacer(8);
    }
  }

  if (weights.length >= 2) {
    const unit = units.weightUnit;
    report.subheading('Körpergewicht', 130);
    report.lineChart({
      points: weights.map(({ day, kg }) => ({
        x: parseDayKey(day).getTime(),
        y: kgToDisplay(kg, unit),
      })),
      // Im Jahr ab dem ersten Eintrag, sonst drängen sich die Punkte am Ende
      xDomain:
        period === 'year'
          ? undefined
          : [
              parseDayKey(range.from).getTime(),
              parseDayKey(range.to < today ? range.to : today).getTime(),
            ],
      formatY: (value) => `${formatDecimal(value, 1)} ${unit}`,
      formatX: (time) => formatGoalDate(toDateInput(new Date(time).toISOString())),
    });
  }

  const average = period === 'year' ? 'Ø je Tag, nach Monat' : 'je Tag';
  if (hasSteps) {
    report.subheading(`Schritte (${average})`, 130);
    report.barChart({
      bars: daily.map((bucket, index) => ({ label: bucket.label, values: [steps[index] ?? 0] })),
      series: [{ name: 'Schritte', color: theme.strong }],
      formatValue: (value) => formatDecimal(value, 0),
    });
  }
  if (hasSleep) {
    report.subheading(`Schlaf (${average})`, 130);
    report.barChart({
      bars: daily.map((bucket, index) => ({
        label: bucket.label,
        values: [(sleep[index] ?? 0) / 3600],
      })),
      series: [{ name: 'Schlaf', color: theme.mid }],
      formatValue: (value) => `${formatDecimal(value, 1)} h`,
    });
  }
}

function strengthDetails(
  report: ReportLayout,
  { range, compare, period, input, units }: PeriodReportData,
) {
  const changes = exerciseChanges(input.strength, range, compare, input.bodyWeightKg);
  if (changes.length === 0) return;
  report.section('Krafttraining im Detail');

  report.subheading('Übungen');
  report.table(
    [
      { header: 'Übung', weight: 6 },
      { header: 'Einheiten', weight: 1.6, align: 'right' },
      { header: 'Arbeitssätze', weight: 1.8, align: 'right' },
      { header: `Bestwert ggü. ${PREVIOUS_LABELS[period]}`, weight: 3, align: 'right' },
    ],
    changes.slice(0, EXERCISE_LIMIT).map(({ exercise, sessions, sets, percent }) => [
      exercise.name,
      String(sessions),
      String(sets),
      percent === null
        ? { text: '–', color: PDF_COLORS.muted }
        : {
            text: formatPercent(percent),
            color:
              percent > 0.05
                ? report.theme.strong
                : percent < -0.05
                  ? PDF_COLORS.danger
                  : PDF_COLORS.muted,
            bold: true,
          },
    ]),
  );
  report.paragraph(
    `Bestwert = bestes geschätztes 1RM (sonst Stufe, Wiederholungen oder Dauer) im Zeitraum gegenüber dem ${PREVIOUS_LABELS[period]}.` +
      (changes.length > EXERCISE_LIMIT
        ? ` ${changes.length - EXERCISE_LIMIT} weitere Übungen nicht aufgeführt.`
        : ''),
    { size: 8 },
  );

  const records = recordsIn(input.strength, range, input.bodyWeightKg).flatMap((row) =>
    row.records.map((record) => ({ row, record })),
  );
  report.subheading('Neue Rekorde', 40);
  if (records.length === 0) report.paragraph('Keine neuen Rekorde in diesem Zeitraum.');
  else {
    report.table(
      [
        { header: 'Datum', weight: 1.8 },
        { header: 'Übung', weight: 4.4 },
        { header: 'Rekord', weight: 3.6 },
        { header: 'Wert', weight: 2, align: 'right' },
      ],
      records.slice(0, RECORD_LIMIT).map(({ row, record }) => {
        const kind = exerciseKind(row.exercise, input.bodyWeightKg);
        const { label, value } = formatRecord(record, {
          unit: units.weightUnit,
          isBodyweight: kind.isBodyweight,
        });
        return [dateOf(row.startedAt), row.exercise.name, label, { text: value, bold: true }];
      }),
    );
    if (records.length > RECORD_LIMIT) {
      report.paragraph(`${records.length - RECORD_LIMIT} weitere Rekorde nicht aufgeführt.`, {
        size: 8,
      });
    }
  }

  const muscles = muscleSetsIn(input.strength, range);
  if (muscles.length > 0) {
    report.subheading('Arbeitssätze je Muskelgruppe', 60);
    report.horizontalBars(
      muscles.map(({ muscle, setsPerWeek }) => ({
        label: MUSCLE_LABELS[muscle],
        value: setsPerWeek,
        text: formatDecimal(setsPerWeek, 1),
      })),
    );
    report.paragraph('Hilfsmuskeln zählen halb.', { size: 8 });
  }
}

function enduranceDetails(report: ReportLayout, { period, range, input, units }: PeriodReportData) {
  const sports = sportTotalsIn(input.endurance, range);
  if (sports.length === 0) return;
  const unit = units.distanceUnit;
  const distance = (meters: number, sport: (typeof sports)[number]['sport'] | 'all') =>
    meters > 0 ? formatDistance(meters, sport === 'all' ? 'run' : sport, unit, 1) : '–';
  report.section('Ausdauer im Detail');

  report.subheading('Je Sportart');
  report.table(
    [
      { header: 'Sportart', weight: 3 },
      { header: 'Einheiten', weight: 1.6, align: 'right' },
      { header: 'Dauer', weight: 2, align: 'right' },
      { header: 'Strecke', weight: 2, align: 'right' },
      { header: 'Höhenmeter', weight: 2, align: 'right' },
    ],
    sports.map(({ sport, totals }) => [
      ENDURANCE_SPORT_LABELS[sport].name,
      String(totals.count),
      formatWorkoutDuration(totals.durationSeconds),
      hasDistance(sport) ? distance(totals.distanceMeters, sport) : '–',
      totals.elevationGainMeters > 0 ? `${formatDecimal(totals.elevationGainMeters, 0)} m` : '–',
    ]),
  );

  const efforts = effortRecordsIn(input.endurance, range);
  report.subheading('Neue Bestzeiten', 40);
  if (efforts.length === 0) {
    report.paragraph(
      'Keine neuen Bestzeiten in diesem Zeitraum (zählen nur Einheiten mit Verlauf).',
    );
  } else {
    report.table(
      [
        { header: 'Datum', weight: 2 },
        { header: 'Sportart', weight: 3 },
        { header: 'Strecke', weight: 3 },
        { header: 'Zeit', weight: 2, align: 'right' },
      ],
      efforts.map((effort) => [
        dateOf(effort.startedAt),
        ENDURANCE_SPORT_LABELS[effort.sport].name,
        formatEffortDistance(effort.meters),
        { text: formatClock(effort.seconds), bold: true },
      ]),
    );
  }

  if (period === 'year') {
    const months = enduranceTotalsPerBucket(
      enduranceSessionsIn(input.endurance, range),
      trainingBuckets('year', range),
    ).filter(({ totals }) => totals.count > 0);
    report.subheading('Je Monat');
    report.table(
      [
        { header: 'Monat', weight: 3 },
        { header: 'Einheiten', weight: 2, align: 'right' },
        { header: 'Dauer', weight: 2, align: 'right' },
        { header: 'Strecke', weight: 2, align: 'right' },
      ],
      months.map(({ bucket, totals }) => [
        parseDayKey(bucket.from).toLocaleDateString('de-DE', { month: 'long' }),
        String(totals.count),
        formatWorkoutDuration(totals.durationSeconds),
        distance(totals.distanceMeters, 'all'),
      ]),
    );
    report.paragraph('Strecke aller Sportarten zusammen (Schwimmen in km).', { size: 8 });
  } else {
    report.subheading('Einheiten');
    report.table(
      [
        { header: 'Datum', weight: 2 },
        { header: 'Sportart', weight: 2.6 },
        { header: 'Dauer', weight: 1.8, align: 'right' },
        { header: 'Strecke', weight: 2, align: 'right' },
        { header: 'Pace / Tempo', weight: 2.4, align: 'right' },
      ],
      enduranceSessionsIn(input.endurance, range).map((session) => [
        dateOf(session.startedAt),
        ENDURANCE_SPORT_LABELS[session.sport].name,
        formatClock(session.durationSeconds),
        session.distanceMeters ? formatDistance(session.distanceMeters, session.sport, unit) : '–',
        formatPace(session.sport, session.distanceMeters, session.durationSeconds, unit) ?? '–',
      ]),
    );
  }
}
