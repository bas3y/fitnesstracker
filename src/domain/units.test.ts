import { displayToKg, displayToMeters, kgToDisplay, metersToDisplay, roundTo } from './units';

describe('units', () => {
  it('rechnet kg und lb um', () => {
    expect(kgToDisplay(100, 'kg')).toBe(100);
    expect(roundTo(kgToDisplay(100, 'lb'), 2)).toBe(220.46);
    expect(roundTo(displayToKg(220.46, 'lb'), 2)).toBe(100);
    expect(displayToKg(80, 'kg')).toBe(80);
  });

  it('rechnet Meter in km und mi um', () => {
    expect(metersToDisplay(5000, 'km')).toBe(5);
    expect(roundTo(metersToDisplay(5000, 'mi'), 3)).toBe(3.107);
    expect(displayToMeters(1, 'mi')).toBe(1609.344);
    expect(displayToMeters(2.5, 'km')).toBe(2500);
  });

  it('rundet auf Nachkommastellen', () => {
    expect(roundTo(1.005, 1)).toBe(1);
    expect(roundTo(72.349, 1)).toBe(72.3);
  });
});
