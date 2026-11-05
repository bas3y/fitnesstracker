import {
  findByBarcode,
  formatBarcode,
  gtinCheckDigit,
  isValidBarcode,
  normalizeBarcode,
  parseBarcode,
} from './barcode';

describe('barcode', () => {
  it('berechnet die Prüfziffer', () => {
    expect(gtinCheckDigit('400638133393')).toBe(1);
    expect(gtinCheckDigit('9638507')).toBe(4);
  });

  it('prüft EAN-13, EAN-8 und GTIN-14', () => {
    expect(isValidBarcode('4006381333931')).toBe(true);
    expect(isValidBarcode('96385074')).toBe(true);
    expect(isValidBarcode('4006381333932')).toBe(false);
    expect(isValidBarcode('123')).toBe(false);
    expect(isValidBarcode('40063813339a1')).toBe(false);
  });

  it('normalisiert Eingaben und macht aus UPC-A eine EAN-13', () => {
    expect(normalizeBarcode(' 4 006381 333931 ')).toBe('4006381333931');
    expect(normalizeBarcode('036000291452')).toBe('0036000291452');
    expect(parseBarcode('036000291452')).toBe('0036000291452');
    expect(parseBarcode('4006381333932')).toBeNull();
    expect(parseBarcode('')).toBeNull();
  });

  it('findet Lebensmittel über den Strichcode', () => {
    const items = [
      { name: 'A', barcode: null },
      { name: 'B', barcode: '4006381333931' },
    ];
    expect(findByBarcode(items, '4 006381 333931')?.name).toBe('B');
    expect(findByBarcode(items, 'Quark')).toBeUndefined();
    expect(findByBarcode(items, '96385074')).toBeUndefined();
  });

  it('formatiert wie auf der Packung', () => {
    expect(formatBarcode('4006381333931')).toBe('4 006381 333931');
    expect(formatBarcode('96385074')).toBe('9638 5074');
  });
});
