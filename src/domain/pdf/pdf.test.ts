import { textWidth, toWinAnsi } from './fontMetrics';
import { fitText, hexToRgb, monthGrid, niceCeil, ReportLayout, wrapText } from './layout';
import { pdfText } from '../../test/pdfText';
import { PdfDocument } from './pdfWriter';

describe('toWinAnsi', () => {
  it('lässt Umlaute und Latin-1 unverändert', () => {
    expect(toWinAnsi('Größe: 5 × 3 °C')).toBe('Größe: 5 × 3 °C');
  });

  it('wandelt typografische Zeichen in WinAnsi-Bytes', () => {
    expect(toWinAnsi('„Hallo“ – 5 €…')).toBe('\x84Hallo\x93 \x96 5 \x80\x85');
  });

  it('ersetzt Minus und Pfeile, Unbekanntes wird zu „?“', () => {
    expect(toWinAnsi('−5 → 6 ≥ 4')).toBe('-5 -> 6 >= 4');
    expect(toWinAnsi('Лук 💪')).toBe('??? ?');
  });

  it('ist idempotent', () => {
    const once = toWinAnsi('„A“ – B…');
    expect(toWinAnsi(once)).toBe(once);
  });
});

describe('textWidth', () => {
  it('rechnet mit den Helvetica-Breiten', () => {
    // H 722 + a 556 + l 222 + l 222 + o 556
    expect(textWidth('Hallo', 10)).toBeCloseTo(22.78);
    // Bold: H 722 + a 556 + l 278 + l 278 + o 611
    expect(textWidth('Hallo', 10, true)).toBeCloseTo(24.45);
  });

  it('Umlaute sind so breit wie ihr Grundbuchstabe', () => {
    expect(textWidth('Ä', 10)).toBe(textWidth('A', 10));
    expect(textWidth('ü', 10, true)).toBe(textWidth('u', 10, true));
  });
});

describe('PdfDocument', () => {
  it('erzeugt eine gültige Struktur mit stimmender xref-Tabelle', () => {
    const doc = new PdfDocument({ title: 'Test', createdAt: new Date(2026, 10, 7, 12, 0, 0) });
    doc.addPage().text(40, 40, 'Hallo (Welt)', { size: 12 });
    doc.addPage().rect(10, 10, 50, 20, { fill: { r: 1, g: 0, b: 0 }, radius: 4 });
    const text = pdfText(doc.toBytes());

    expect(text.startsWith('%PDF-1.4')).toBe(true);
    expect(text.trimEnd().endsWith('%%EOF')).toBe(true);
    expect(text).toContain('/Count 2');
    expect(text).toContain('(Hallo \\(Welt\\)) Tj');
    expect(text).toContain('/CreationDate (D:20261107120000)');

    const xrefAt = Number(/startxref\n(\d+)/.exec(text)![1]);
    expect(text.slice(xrefAt, xrefAt + 4)).toBe('xref');
    const offsets = [...text.slice(xrefAt).matchAll(/^(\d{10}) 00000 n $/gm)].map((match) =>
      Number(match[1]),
    );
    offsets.forEach((offset, index) => {
      expect(text.slice(offset).startsWith(`${index + 1} 0 obj`)).toBe(true);
    });
  });

  it('gibt die Länge jedes Inhalts richtig an', () => {
    const doc = new PdfDocument({ title: 'Länge', createdAt: new Date() });
    doc.addPage().text(10, 10, 'Übung „Kniebeuge“', { size: 9, bold: true });
    const text = pdfText(doc.toBytes());
    const match = /<< \/Length (\d+) >>\nstream\n([\s\S]*?)\nendstream/.exec(text)!;
    expect(match[2]!.length).toBe(Number(match[1]));
    expect(match[2]).toContain('/F2 9 Tf');
    expect(match[2]).toContain('(\xdcbung \x84Kniebeuge\x93)');
  });
});

describe('Layout-Hilfen', () => {
  it('niceCeil rundet auf 1, 2, 2,5, 5 × 10ⁿ', () => {
    expect(niceCeil(0)).toBe(1);
    expect(niceCeil(3)).toBe(5);
    expect(niceCeil(2.2)).toBe(2.5);
    expect(niceCeil(11_800)).toBe(20_000);
    expect(niceCeil(100)).toBe(100);
  });

  it('wrapText bricht an Leerzeichen um', () => {
    const lines = wrapText('eins zwei drei vier fünf sechs', 50, 10);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join(' ')).toBe('eins zwei drei vier fünf sechs');
  });

  it('fitText kürzt mit Auslassungspunkten', () => {
    const fitted = fitText('Ein sehr langer Übungsname mit vielen Wörtern', 80, 10);
    expect(fitted.endsWith('\x85')).toBe(true);
    expect(textWidth(fitted, 10)).toBeLessThanOrEqual(80);
    expect(fitText('Kurz', 80, 10)).toBe('Kurz');
  });

  it('monthGrid beginnt am Montag', () => {
    // 1.11.2026 ist ein Sonntag
    const weeks = monthGrid('2026-11');
    expect(weeks[0]).toEqual([null, null, null, null, null, null, '2026-11-01']);
    expect(weeks.at(-1)![0]).toBe('2026-11-30');
    expect(weeks.flat().filter(Boolean)).toHaveLength(30);
  });

  it('hexToRgb liest kurze und lange Farben', () => {
    expect(hexToRgb('#fff')).toEqual({ r: 1, g: 1, b: 1 });
    expect(hexToRgb(' #6f5b43 ')).toEqual({ r: 0x6f / 255, g: 0x5b / 255, b: 0x43 / 255 });
    expect(hexToRgb('rgb(1, 2, 3)')).toBeNull();
  });
});

describe('ReportLayout', () => {
  it('bricht lange Tabellen auf neue Seiten um und wiederholt die Kopfzeile', () => {
    const report = new ReportLayout({ kind: 'Test', title: 'Tabelle', createdAt: new Date() });
    report.section('Viele Zeilen');
    report.table(
      [
        { header: 'Name', weight: 3 },
        { header: 'Wert', weight: 1, align: 'right' },
      ],
      Array.from({ length: 120 }, (_, index) => [`Zeile ${index + 1}`, String(index)]),
    );
    expect(report.pageCount).toBeGreaterThan(2);
    const text = pdfText(report.finish());
    expect(text.match(/\(Name\) Tj/g)!.length).toBe(report.pageCount);
    expect(text).toContain('(Zeile 120) Tj');
    expect(text).toContain(`(Seite 1 von ${report.pageCount}) Tj`);
  });

  it('zeichnet Diagramme und Kalender ohne Fehler', () => {
    const report = new ReportLayout({ kind: 'Test', title: 'Diagramme', createdAt: new Date() });
    report.barChart({
      bars: [
        { label: 'KW 1', values: [2, 1] },
        { label: 'KW 2', values: [0, 0] },
      ],
      series: [
        { name: 'Kraft', color: { r: 0, g: 0, b: 0 } },
        { name: 'Ausdauer', color: { r: 1, g: 0, b: 0 } },
      ],
      formatValue: String,
      showTotals: true,
    });
    report.lineChart({
      points: [
        { x: 1, y: 80 },
        { x: 2, y: 81 },
      ],
      formatY: String,
      formatX: String,
    });
    report.calendars([{ month: '2026-11', title: 'November' }], (day) =>
      day === '2026-11-03' ? { r: 0, g: 0, b: 1 } : null,
    );
    report.horizontalBars([{ label: 'Brust', value: 4, text: '4' }]);
    const text = pdfText(report.finish());
    expect(text).toContain('(Kraft) Tj');
    expect(text).toContain('(November) Tj');
    expect(text).toContain('(Brust) Tj');
  });
});
