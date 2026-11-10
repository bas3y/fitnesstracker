import { REPORT_TODAY, sampleReportInput } from '../test/reportInput';
import { comparisonRange, periodRange } from './periods';
import { reviewSummary } from './review';
import {
  dailyRows,
  formatReviewDelta,
  nutritionRows,
  shownRows,
  trainingRows,
  type ReviewRow,
} from './reviewRows';

const row = (values: Partial<ReviewRow>): ReviewRow => ({
  label: 'Test',
  current: 5,
  previous: 3,
  format: String,
  better: 'higher',
  ...values,
});

describe('formatReviewDelta', () => {
  it('Vorzeichen und Richtung', () => {
    expect(formatReviewDelta(row({}))).toEqual({ text: '+2', better: true });
    expect(formatReviewDelta(row({ better: 'lower' }))).toEqual({ text: '+2', better: false });
    expect(formatReviewDelta(row({ current: 1 }))).toEqual({ text: '−2', better: false });
    expect(formatReviewDelta(row({ better: null }))).toEqual({ text: '+2', better: null });
  });

  it('gleich oder ohne Vergleich', () => {
    expect(formatReviewDelta(row({ current: 3 }))).toEqual({ text: '±0', better: null });
    expect(formatReviewDelta(row({ previous: null }))).toBeNull();
  });
});

describe('Zeilen des Rückblicks', () => {
  const input = sampleReportInput();
  const range = periodRange('month', REPORT_TODAY);
  const current = reviewSummary(input, range, REPORT_TODAY);
  const previous = reviewSummary(
    input,
    comparisonRange('month', range, REPORT_TODAY),
    REPORT_TODAY,
  );

  it('Training in Anzeigeeinheiten', () => {
    const rows = trainingRows(current, previous, { weightUnit: 'kg', distanceUnit: 'km' });
    const volume = rows.find((item) => item.label === 'Volumen')!;
    // 95 × 5 + 110 × 5 + 2 × 100 × 5
    expect(volume.format(volume.current!)).toBe('2025 kg');
    const distance = rows.find((item) => item.label === 'Strecke')!;
    expect(distance.format(distance.current!)).toBe('35 km');
  });

  it('nur Zeilen mit Werten werden gezeigt', () => {
    const shown = shownRows(dailyRows(current, previous, { weightUnit: 'kg' }));
    expect(shown.map((item) => item.label)).toContain('Ø Schritte');
    expect(shown.map((item) => item.label)).not.toContain('Ø Ruhepuls');
  });

  it('Ernährung ohne Kalorien bei „nur Protein“', () => {
    const rows = nutritionRows(current, previous, { proteinOnly: true });
    expect(rows.map((item) => item.label)).toEqual(['Tage erfasst', 'Ø Protein']);
  });
});
