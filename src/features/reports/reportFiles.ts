import { loadExerciseReport, loadPeriodReport } from '../../db/reports';
import { listEnduranceSessions } from '../../db/endurance';
import { getSettings } from '../../db/settings';
import type { DayKey, EnduranceSport, Exercise } from '../../db/types';
import { enduranceFileName } from '../../db/workoutExport';
import { dayKey } from '../../domain/daily';
import { DEFAULT_PDF_THEME, hexToRgb, type PdfTheme } from '../../domain/pdf/layout';
import { periodReportPdf } from '../../domain/pdf/periodReport';
import { enduranceReportPdf, exerciseReportPdf } from '../../domain/pdf/statsReports';
import type { CalendarPeriod } from '../../domain/periods';
import { fileSlug, reportFileName } from '../../domain/report';
import { rangeStart, type StatsRange } from '../../domain/stats';
import { toDateInput } from '../../domain/workout';

/** Grundfarben der gewählten Palette (PDF kennt keine CSS-Variablen) */
function currentPdfTheme(): PdfTheme {
  const style = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: PdfTheme[keyof PdfTheme]) =>
    hexToRgb(style.getPropertyValue(name)) ?? fallback;
  return {
    light: read('--p-light', DEFAULT_PDF_THEME.light),
    mid: read('--p-mid', DEFAULT_PDF_THEME.mid),
    strong: read('--p-strong', DEFAULT_PDF_THEME.strong),
    deep: read('--p-deep', DEFAULT_PDF_THEME.deep),
    pop: read('--p-pop', DEFAULT_PDF_THEME.pop),
  };
}

const RANGE_NAMES: Record<StatsRange, string> = {
  '4w': 'letzte 4 Wochen',
  '3m': 'letzte 3 Monate',
  '1y': 'letztes Jahr',
  all: 'alle Einheiten',
};

const pdfFile = (bytes: Uint8Array, name: string) =>
  new File([bytes as Uint8Array<ArrayBuffer>], `${name}.pdf`, { type: 'application/pdf' });

/** Wochen-, Monats- oder Jahresbericht für den Zeitraum, in dem `day` liegt */
export async function createPeriodReportFile(
  period: CalendarPeriod,
  day: DayKey,
  today: DayKey,
): Promise<File> {
  const data = await loadPeriodReport(period, day, today);
  const bytes = periodReportPdf({ ...data, createdAt: new Date(), theme: currentPdfTheme() });
  return pdfFile(bytes, reportFileName(period, data.range));
}

/** Übungsstatistik im gewählten Zeitraum; `null` ohne beendete Einheiten */
export async function createExerciseReportFile(
  exercise: Exercise,
  range: StatsRange,
): Promise<File | null> {
  const data = await loadExerciseReport(exercise);
  if (data.sessions.length === 0) return null;
  const now = new Date();
  const bytes = exerciseReportPdf({
    ...data,
    from: rangeStart(range, now),
    rangeLabel: RANGE_NAMES[range],
    createdAt: now,
    theme: currentPdfTheme(),
  });
  return pdfFile(bytes, `basey-${fileSlug(exercise.name)}-${toDateInput(now.toISOString())}`);
}

/** Ausdauer-Statistik (Sportart oder alle) im gewählten Zeitraum; `null` ohne Einheiten */
export async function createEnduranceReportFile(
  sport: EnduranceSport | null,
  range: StatsRange,
): Promise<File | null> {
  const [all, settings] = await Promise.all([listEnduranceSessions(), getSettings()]);
  const sessions = sport ? all.filter((session) => session.sport === sport) : all;
  if (sessions.length === 0) return null;
  const now = new Date();
  const start = rangeStart(range, now);
  const bytes = enduranceReportPdf({
    sport,
    sessions,
    from: start ? dayKey(start) : null,
    rangeLabel: RANGE_NAMES[range],
    today: dayKey(now),
    distanceUnit: settings?.distanceUnit ?? 'km',
    createdAt: now,
    theme: currentPdfTheme(),
  });
  return pdfFile(bytes, enduranceFileName(sport, now));
}
