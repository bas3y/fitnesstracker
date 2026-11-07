import {
  comparisonRange,
  daysBetween,
  formatDayRange,
  formatPeriod,
  isoWeek,
  periodRange,
  shiftPeriod,
  untilToday,
} from './periods';

describe('periodRange', () => {
  it('liefert Kalenderwoche, -monat und -jahr', () => {
    expect(periodRange('week', '2026-11-07')).toEqual({ from: '2026-11-02', to: '2026-11-08' });
    expect(periodRange('month', '2026-02-10')).toEqual({ from: '2026-02-01', to: '2026-02-28' });
    expect(periodRange('year', '2026-07-01')).toEqual({ from: '2026-01-01', to: '2026-12-31' });
  });
});

describe('shiftPeriod', () => {
  it('springt um ganze Zeiträume, auch über Jahresgrenzen', () => {
    const week = periodRange('week', '2026-01-01');
    expect(shiftPeriod('week', week, -1)).toEqual({ from: '2025-12-22', to: '2025-12-28' });
    const march = periodRange('month', '2026-03-31');
    expect(shiftPeriod('month', march, -1)).toEqual({ from: '2026-02-01', to: '2026-02-28' });
    expect(shiftPeriod('month', periodRange('month', '2026-12-05'), 1).from).toBe('2027-01-01');
    expect(shiftPeriod('year', periodRange('year', '2026-05-05'), -2).from).toBe('2024-01-01');
  });
});

describe('comparisonRange', () => {
  it('vergleicht einen abgeschlossenen Zeitraum mit dem ganzen vorigen', () => {
    const october = periodRange('month', '2026-10-10');
    expect(comparisonRange('month', october, '2026-11-07')).toEqual({
      from: '2026-09-01',
      to: '2026-09-30',
    });
  });

  it('vergleicht den laufenden Zeitraum nur bis zum gleichen Tag', () => {
    const week = periodRange('week', '2026-11-04');
    expect(comparisonRange('week', week, '2026-11-04')).toEqual({
      from: '2026-10-26',
      to: '2026-10-28',
    });
    const march = periodRange('month', '2026-03-31');
    expect(comparisonRange('month', march, '2026-03-31')).toEqual({
      from: '2026-02-01',
      to: '2026-02-28',
    });
  });
});

describe('Hilfen', () => {
  it('zählt Tage einschließlich und begrenzt auf heute', () => {
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(3);
    expect(daysBetween('2026-01-01', '2026-12-31')).toBe(365);
    expect(untilToday({ from: '2026-11-01', to: '2026-11-30' }, '2026-11-07').to).toBe(
      '2026-11-07',
    );
  });

  it('berechnet die Kalenderwoche nach ISO', () => {
    expect(isoWeek('2026-11-02')).toBe(45);
    expect(isoWeek('2026-01-01')).toBe(1);
    expect(isoWeek('2027-01-01')).toBe(53);
    expect(isoWeek('2024-12-30')).toBe(1);
  });

  it('beschriftet Zeiträume', () => {
    expect(formatPeriod('year', periodRange('year', '2026-05-01'))).toBe('2026');
    expect(formatPeriod('month', periodRange('month', '2026-11-07'))).toBe('November 2026');
    expect(formatPeriod('week', periodRange('week', '2026-11-07'))).toBe('KW 45: 2.–8. Nov. 2026');
    expect(formatDayRange({ from: '2026-10-26', to: '2026-11-01' })).toBe(
      '26. Okt. – 1. Nov. 2026',
    );
  });
});
