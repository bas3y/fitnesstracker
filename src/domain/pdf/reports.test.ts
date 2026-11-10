import type { EnduranceSession } from '../../db/types';
import { pdfStrings, pdfText } from '../../test/pdfText';
import {
  BENCH,
  enduranceSession,
  REPORT_TODAY,
  sampleReportInput,
  statsSet,
} from '../../test/reportInput';
import { comparisonRange, periodRange, type CalendarPeriod } from '../periods';
import { periodReportPdf, type PeriodReportData } from './periodReport';
import { enduranceReportPdf, exerciseReportPdf } from './statsReports';

const CREATED = new Date(2026, 10, 7, 20, 15);

function periodData(period: CalendarPeriod, day = REPORT_TODAY): PeriodReportData {
  const range = periodRange(period, day);
  return {
    period,
    range,
    compare: comparisonRange(period, range, REPORT_TODAY),
    today: REPORT_TODAY,
    input: sampleReportInput(),
    units: { weightUnit: 'kg', distanceUnit: 'km', proteinOnly: false },
    goals: [{ name: '5 km unter 28 min', on: '2026-11-03' }],
    createdAt: CREATED,
  };
}

describe('periodReportPdf', () => {
  it('Monatsbericht mit Überblick, Diagrammen und Details', () => {
    const strings = pdfStrings(periodReportPdf(periodData('month')));
    const all = strings.join('\n');
    for (const expected of [
      'Monatsbericht',
      'November 2026',
      'Überblick',
      'Trainingstage',
      'Vormonat',
      'Erreichte Ziele',
      '5 km unter 28 min',
      'Trainings je Woche',
      'KW 45',
      'Körpergewicht',
      'Krafttraining im Detail',
      'Bankdrücken',
      'Neue Rekorde',
      'Arbeitssätze je Muskelgruppe',
      'Ausdauer im Detail',
      'Radfahren',
      'Neue Bestzeiten',
      '27:30',
    ]) {
      expect(all).toContain(expected);
    }
    expect(all).toMatch(/Seite 1 von \d/);
  });

  it('Jahresbericht mit Monatsachse und Kalender je Monat', () => {
    const strings = pdfStrings(periodReportPdf(periodData('year')));
    expect(strings).toContain('Jahresbericht');
    expect(strings).toContain('Trainings je Monat');
    expect(strings).toContain('Dezember');
    expect(strings).toContain('Je Monat');
  });

  it('ohne Einträge nur ein Hinweis', () => {
    const data = periodData('month', '2025-03-01');
    const text = pdfText(periodReportPdf(data));
    expect(pdfStrings(periodReportPdf(data))).toContain('Keine Einträge in diesem Zeitraum.');
    expect(text).toContain('/Count 1');
  });
});

describe('Einzel-Exporte', () => {
  it('Übungsstatistik mit Verlauf, Bestwerten und Einheiten', () => {
    const sessions = ['2026-10-20', '2026-11-02', '2026-11-05'].map((day, index) => ({
      startedAt: new Date(`${day}T18:00:00`).toISOString(),
      sets: [{ ...statsSet({ weight: 90 + index * 5 }), rpe: null, rir: null }],
    }));
    const strings = pdfStrings(
      exerciseReportPdf({
        exercise: BENCH,
        sessions,
        from: null,
        rangeLabel: 'alle Einheiten',
        weightUnit: 'kg',
        bodyWeightKg: 80,
        createdAt: CREATED,
      }),
    );
    expect(strings).toContain('Übungsstatistik');
    expect(strings).toContain('Bankdrücken');
    expect(strings).toContain('Bestwerte');
    expect(strings).toContain('100 kg × 5');
    expect(strings).toContain('+11,1 %');
  });

  it('Ausdauer-Statistik einer Sportart mit Pace und Einheiten', () => {
    const sessions = [
      enduranceSession('2026-10-15', {
        trackSummary: { bestEfforts: [{ meters: 5000, seconds: 1700 }], heartRateSeconds: [] },
      }),
      enduranceSession('2026-11-03', { durationSeconds: 1500 }),
    ].map(
      (session) =>
        ({
          ...session,
          title: '',
          avgHeartRate: 150,
        }) as EnduranceSession,
    );
    const strings = pdfStrings(
      enduranceReportPdf({
        sport: 'run',
        sessions,
        from: null,
        rangeLabel: 'alle Einheiten',
        today: REPORT_TODAY,
        distanceUnit: 'km',
        createdAt: CREATED,
      }),
    );
    expect(strings).toContain('Ausdauer-Statistik');
    expect(strings).toContain('Pace je Einheit');
    expect(strings).toContain('Bestzeiten');
    expect(strings).toContain('5:00 /km');
    expect(strings).toContain('150 bpm');
  });
});
