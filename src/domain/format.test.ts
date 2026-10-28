import { formatBytes, formatDaysAgo, formatDecimal, parseDecimal } from './format';

describe('formatDecimal', () => {
  it('nutzt Komma und begrenzt Nachkommastellen', () => {
    expect(formatDecimal(72.5)).toBe('72,5');
    expect(formatDecimal(72.46)).toBe('72,5');
    expect(formatDecimal(80)).toBe('80');
    expect(formatDecimal(1234.5)).toBe('1234,5');
  });
});

describe('parseDecimal', () => {
  it('akzeptiert Komma und Punkt', () => {
    expect(parseDecimal('72,5')).toBe(72.5);
    expect(parseDecimal(' 72.5 ')).toBe(72.5);
    expect(parseDecimal('80')).toBe(80);
    expect(parseDecimal('80,')).toBe(80);
    expect(parseDecimal(',5')).toBe(0.5);
  });

  it('liefert null bei ungültiger Eingabe', () => {
    expect(parseDecimal('')).toBeNull();
    expect(parseDecimal('abc')).toBeNull();
    expect(parseDecimal('1,2,3')).toBeNull();
    expect(parseDecimal('7a')).toBeNull();
  });
});

describe('formatDaysAgo', () => {
  it('formuliert relative Tage', () => {
    expect(formatDaysAgo(0)).toBe('heute');
    expect(formatDaysAgo(1)).toBe('gestern');
    expect(formatDaysAgo(12)).toBe('vor 12 Tagen');
  });
});

describe('formatBytes', () => {
  it('wählt eine passende Einheit', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1536)).toBe('1,5 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5 MB');
  });
});
