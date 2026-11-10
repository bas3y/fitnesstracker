import { toWinAnsi, winAnsiWidth } from './fontMetrics';
import { A4, PdfDocument, type PdfPage, type Rgb, type TextAlign } from './pdfWriter';

/** Grundfarben der gewählten Palette (wie `--p-*` in `index.css`) */
export interface PdfTheme {
  light: Rgb;
  mid: Rgb;
  strong: Rgb;
  deep: Rgb;
  pop: Rgb;
}

export function hexToRgb(hex: string): Rgb | null {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const value =
    match[1]!.length === 3 ? [...match[1]!].map((char) => char + char).join('') : match[1]!;
  const int = Number.parseInt(value, 16);
  return { r: ((int >> 16) & 255) / 255, g: ((int >> 8) & 255) / 255, b: (int & 255) / 255 };
}

const fromHex = (hex: string) => hexToRgb(hex)!;

/** Palette „Standard“ (`basey`) */
export const DEFAULT_PDF_THEME: PdfTheme = {
  light: fromHex('#e8d9c2'),
  mid: fromHex('#bea98e'),
  strong: fromHex('#6f5b43'),
  deep: fromHex('#1a1714'),
  pop: fromHex('#d9480f'),
};

/** `t` = Anteil von `b` */
export function mixRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return { r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t };
}

const WHITE: Rgb = { r: 1, g: 1, b: 1 };
export const PDF_COLORS = {
  text: fromHex('#1d1d1f'),
  muted: fromHex('#6e6e73'),
  faint: fromHex('#a1a1a8'),
  line: fromHex('#dcdce0'),
  subtle: fromHex('#f3f3f5'),
  danger: fromHex('#c0392b'),
  white: WHITE,
};

const MARGIN = 42;
const BOTTOM = 52;
const CONTENT_WIDTH = A4.width - 2 * MARGIN;

/** Kürzt mit „…“, bis der Text passt */
export function fitText(text: string, maxWidth: number, size: number, bold = false): string {
  const encoded = toWinAnsi(text);
  if (winAnsiWidth(encoded, size, bold) <= maxWidth) return text;
  let end = encoded.length;
  while (end > 0 && winAnsiWidth(`${encoded.slice(0, end)}\x85`, size, bold) > maxWidth) end--;
  // Bleibt WinAnsi: `toWinAnsi` lässt es beim Zeichnen unverändert
  return `${encoded.slice(0, end).trimEnd()}\x85`;
}

/** Zeilenumbruch an Leerzeichen; zu lange Wörter werden gekürzt */
export function wrapText(text: string, maxWidth: number, size: number, bold = false): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (winAnsiWidth(toWinAnsi(candidate), size, bold) <= maxWidth) {
        line = candidate;
      } else {
        if (line) lines.push(line);
        line = fitText(word, maxWidth, size, bold);
      }
    }
    lines.push(line);
  }
  return lines;
}

/** Runde Obergrenze für eine Achse (1, 2, 2,5, 5 × 10ⁿ) */
export function niceCeil(value: number): number {
  if (!(value > 0)) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = [1, 2, 2.5, 5, 10].find((candidate) => normalized <= candidate + 1e-9) ?? 10;
  return step * magnitude;
}

export type Cell = string | { text: string; color?: Rgb; bold?: boolean };

export interface TableColumn {
  header: string;
  /** Anteil an der Breite */
  weight: number;
  align?: Exclude<TextAlign, 'center'>;
}

export interface ChartSeries {
  name: string;
  color: Rgb;
}

export interface BarChartOptions {
  bars: ReadonlyArray<{ label: string; values: readonly number[] }>;
  /** Je Wert eines Balkens eine Reihe (gestapelt) */
  series: readonly ChartSeries[];
  formatValue: (value: number) => string;
  height?: number;
  /** Summe über den Balken anzeigen */
  showTotals?: boolean;
}

export interface LineChartOptions {
  points: ReadonlyArray<{ x: number; y: number }>;
  formatY: (value: number) => string;
  formatX: (value: number) => string;
  /** Feste x-Achse (sonst erster bis letzter Punkt) */
  xDomain?: readonly [number, number];
  height?: number;
  /** Kleinere Werte oben (z. B. Pace) */
  reversed?: boolean;
}

export interface CalendarMonth {
  /** `YYYY-MM` */
  month: string;
  title: string;
}

export interface LegendItem {
  label: string;
  color: Rgb;
}

const WEEKDAY_LETTERS = ['M', 'D', 'M', 'D', 'F', 'S', 'S'];

/**
 * Bericht als fließendes Layout: Abschnitte, Texte, Tabellen und Diagramme laufen von oben nach
 * unten, neue Seiten entstehen automatisch. Kopfbereich auf Seite 1, Fußzeile mit Seitenzahl.
 */
export class ReportLayout {
  private readonly doc: PdfDocument;
  private page!: PdfPage;
  private y = 0;
  readonly theme: PdfTheme;
  readonly width = CONTENT_WIDTH;
  readonly left = MARGIN;

  constructor(
    private readonly options: {
      /** z. B. „Monatsbericht“ */
      kind: string;
      title: string;
      subtitle?: string;
      createdAt: Date;
      theme?: PdfTheme;
    },
  ) {
    this.theme = options.theme ?? DEFAULT_PDF_THEME;
    this.doc = new PdfDocument({
      title: `${options.kind}: ${options.title}`,
      createdAt: options.createdAt,
    });
    this.newPage();
    this.drawCover();
  }

  get pageCount() {
    return this.doc.pages.length;
  }

  private newPage() {
    this.page = this.doc.addPage();
    this.y = MARGIN;
  }

  private drawCover() {
    const { deep, light, mid } = this.theme;
    const height = 112;
    this.page.rect(0, 0, A4.width, height, { fill: deep });
    this.page.rect(0, height - 4, A4.width, 4, { fill: mid });
    this.page.text(MARGIN, 34, 'Basey', { size: 13, bold: true, color: light });
    this.page.text(A4.width - MARGIN, 34, this.options.kind, {
      size: 10,
      color: light,
      align: 'right',
    });
    this.page.text(MARGIN, 70, fitText(this.options.title, CONTENT_WIDTH, 24, true), {
      size: 24,
      bold: true,
      color: WHITE,
    });
    if (this.options.subtitle) {
      this.page.text(MARGIN, 90, fitText(this.options.subtitle, CONTENT_WIDTH, 10), {
        size: 10,
        color: light,
      });
    }
    this.y = height + 24;
  }

  /** Platz sicherstellen, sonst neue Seite */
  ensureSpace(height: number) {
    if (this.y + height > A4.height - BOTTOM) this.newPage();
  }

  spacer(height: number) {
    this.y += height;
  }

  /** Abschnittsüberschrift; `keep` = Mindestplatz für den folgenden Inhalt */
  section(title: string, keep = 80) {
    this.ensureSpace(34 + keep);
    if (this.y > MARGIN) this.y += 8;
    this.page.text(this.left, this.y + 14, title, { size: 15, bold: true, color: PDF_COLORS.text });
    this.page.rect(this.left, this.y + 21, 28, 2.5, { fill: this.theme.strong, radius: 1.25 });
    this.y += 34;
  }

  subheading(title: string, keep = 50) {
    this.ensureSpace(20 + keep);
    this.page.text(this.left, this.y + 10, title, {
      size: 10.5,
      bold: true,
      color: PDF_COLORS.text,
    });
    this.y += 18;
  }

  paragraph(text: string, { size = 9, muted = true }: { size?: number; muted?: boolean } = {}) {
    const lineHeight = size * 1.4;
    for (const line of wrapText(text, this.width, size)) {
      this.ensureSpace(lineHeight);
      this.page.text(this.left, this.y + size, line, {
        size,
        color: muted ? PDF_COLORS.muted : PDF_COLORS.text,
      });
      this.y += lineHeight;
    }
    this.y += 4;
  }

  /** Kacheln mit großer Zahl, bis zu vier je Zeile */
  tiles(items: ReadonlyArray<{ label: string; value: string }>) {
    const perRow = Math.min(4, Math.max(1, items.length));
    const gap = 8;
    const width = (this.width - gap * (perRow - 1)) / perRow;
    const height = 50;
    for (let start = 0; start < items.length; start += perRow) {
      this.ensureSpace(height + gap);
      items.slice(start, start + perRow).forEach((item, index) => {
        const x = this.left + index * (width + gap);
        this.page.rect(x, this.y, width, height, {
          fill: mixRgb(this.theme.light, WHITE, 0.55),
          radius: 8,
        });
        this.page.text(x + 10, this.y + 23, fitText(item.value, width - 20, 15, true), {
          size: 15,
          bold: true,
          color: this.theme.deep,
        });
        this.page.text(x + 10, this.y + 39, fitText(item.label, width - 20, 8.5), {
          size: 8.5,
          color: PDF_COLORS.muted,
        });
      });
      this.y += height + gap;
    }
    this.y += 4;
  }

  /** Tabelle mit Kopfzeile, die auf neuen Seiten wiederholt wird */
  table(columns: readonly TableColumn[], rows: ReadonlyArray<readonly Cell[]>, size = 9) {
    const total = columns.reduce((sum, column) => sum + column.weight, 0);
    const widths = columns.map((column) => (column.weight / total) * this.width);
    const rowHeight = size + 8;
    const padding = 4;

    const drawRow = (cells: readonly Cell[], header: boolean) => {
      let x = this.left;
      cells.forEach((cell, index) => {
        const column = columns[index]!;
        const width = widths[index]!;
        const value = typeof cell === 'string' ? { text: cell } : cell;
        const bold = header || Boolean(value.bold);
        const text = fitText(value.text, width - 2 * padding, header ? size - 0.5 : size, bold);
        const right = column.align === 'right';
        this.page.text(right ? x + width - padding : x + padding, this.y + rowHeight - 5.5, text, {
          size: header ? size - 0.5 : size,
          bold,
          color: header ? PDF_COLORS.muted : (value.color ?? PDF_COLORS.text),
          align: right ? 'right' : 'left',
        });
        x += width;
      });
      this.y += rowHeight;
      this.page.line(this.left, this.y, this.left + this.width, this.y, {
        color: header ? PDF_COLORS.faint : PDF_COLORS.line,
        width: header ? 0.8 : 0.5,
      });
    };
    const header = () =>
      drawRow(
        columns.map((column) => column.header),
        true,
      );

    this.ensureSpace(rowHeight * Math.min(3, rows.length + 1));
    header();
    for (const row of rows) {
      if (this.y + rowHeight > A4.height - BOTTOM) {
        this.newPage();
        header();
      }
      drawRow(row, false);
    }
    this.y += 10;
  }

  legend(items: readonly LegendItem[]) {
    this.ensureSpace(14);
    let x = this.left;
    for (const item of items) {
      this.page.rect(x, this.y + 2, 8, 8, { fill: item.color, radius: 2 });
      const width = this.page.text(x + 12, this.y + 9, item.label, {
        size: 8.5,
        color: PDF_COLORS.muted,
      });
      x += width + 26;
    }
    this.y += 16;
  }

  private axisLabelWidth(labels: readonly string[]) {
    return Math.max(24, ...labels.map((label) => winAnsiWidth(toWinAnsi(label), 7.5))) + 6;
  }

  /** Säulen, gestapelt je Reihe */
  barChart({ bars, series, formatValue, height = 120, showTotals = false }: BarChartOptions) {
    const totals = bars.map((bar) => bar.values.reduce((sum, value) => sum + value, 0));
    const max = niceCeil(Math.max(0, ...totals));
    const ticks = [0, max / 2, max];
    const axis = this.axisLabelWidth(ticks.map(formatValue));
    const full = height + 18 + (series.length > 1 ? 16 : 0) + 8;
    this.ensureSpace(full);

    const top = this.y + (showTotals ? 10 : 4);
    const plotHeight = height - (showTotals ? 10 : 4);
    const plotLeft = this.left + axis;
    const plotWidth = this.width - axis;
    const bottom = top + plotHeight;
    for (const tick of ticks) {
      const y = bottom - (tick / max) * plotHeight;
      this.page.line(plotLeft, y, plotLeft + plotWidth, y, {
        color: PDF_COLORS.line,
        width: 0.5,
        dash: tick === 0 ? undefined : [2, 2],
      });
      this.page.text(plotLeft - 5, y + 2.5, formatValue(tick), {
        size: 7.5,
        color: PDF_COLORS.muted,
        align: 'right',
      });
    }

    const slot = plotWidth / Math.max(1, bars.length);
    const barWidth = Math.min(28, slot * 0.64);
    const labelWidth = Math.max(0, ...bars.map((bar) => winAnsiWidth(toWinAnsi(bar.label), 7)));
    const every = Math.max(1, Math.ceil((labelWidth + 4) / slot));
    bars.forEach((bar, index) => {
      const center = plotLeft + slot * index + slot / 2;
      let stack = bottom;
      bar.values.forEach((value, seriesIndex) => {
        if (value <= 0) return;
        const barHeight = (value / max) * plotHeight;
        this.page.rect(center - barWidth / 2, stack - barHeight, barWidth, barHeight, {
          fill: series[seriesIndex]?.color ?? this.theme.strong,
        });
        stack -= barHeight;
      });
      if (showTotals && totals[index]! > 0 && bars.length <= 16) {
        this.page.text(center, stack - 3, formatValue(totals[index]!), {
          size: 7,
          color: PDF_COLORS.muted,
          align: 'center',
        });
      }
      if (index % every === 0) {
        this.page.text(center, bottom + 10, bar.label, {
          size: 7,
          color: PDF_COLORS.muted,
          align: 'center',
        });
      }
    });
    this.y = bottom + 16;
    if (series.length > 1) this.legend(series.map(({ name, color }) => ({ label: name, color })));
    this.y += 6;
  }

  /** Linie durch die Punkte (nach x sortiert) */
  lineChart({
    points,
    formatY,
    formatX,
    xDomain,
    height = 120,
    reversed = false,
  }: LineChartOptions) {
    if (points.length === 0) return;
    const sorted = [...points].sort((a, b) => a.x - b.x);
    const ys = sorted.map((point) => point.y);
    let minY = Math.min(...ys);
    let maxY = Math.max(...ys);
    const pad = (maxY - minY) * 0.12 || Math.max(1, Math.abs(maxY) * 0.05);
    minY -= pad;
    maxY += pad;
    const [minX, maxX] = xDomain ?? [sorted[0]!.x, sorted.at(-1)!.x];
    const ticks = [minY, (minY + maxY) / 2, maxY];
    const axis = this.axisLabelWidth(ticks.map(formatY));
    this.ensureSpace(height + 26);

    const top = this.y + 4;
    const plotHeight = height - 4;
    const plotLeft = this.left + axis;
    const plotWidth = this.width - axis - 6;
    const bottom = top + plotHeight;
    const toY = (value: number) => {
      const share = (value - minY) / (maxY - minY);
      return reversed ? top + share * plotHeight : bottom - share * plotHeight;
    };
    const toX = (value: number) =>
      maxX === minX
        ? plotLeft + plotWidth / 2
        : plotLeft + ((value - minX) / (maxX - minX)) * plotWidth;

    for (const tick of ticks) {
      const y = toY(tick);
      this.page.line(plotLeft, y, plotLeft + plotWidth, y, {
        color: PDF_COLORS.line,
        width: 0.5,
        dash: [2, 2],
      });
      this.page.text(plotLeft - 5, y + 2.5, formatY(tick), {
        size: 7.5,
        color: PDF_COLORS.muted,
        align: 'right',
      });
    }
    this.page.line(plotLeft, bottom, plotLeft + plotWidth, bottom, {
      color: PDF_COLORS.faint,
      width: 0.6,
    });
    const coords = sorted.map((point) => [toX(point.x), toY(point.y)] as const);
    this.page.polyline(coords, { color: this.theme.strong, width: 1.6 });
    if (coords.length <= 60) {
      for (const [x, y] of coords) {
        this.page.circle(x, y, 2.2, { fill: WHITE, stroke: this.theme.strong, lineWidth: 1.2 });
      }
    }
    const xTicks = minX === maxX ? [minX] : [minX, (minX + maxX) / 2, maxX];
    xTicks.forEach((tick, index) => {
      this.page.text(toX(tick), bottom + 11, formatX(tick), {
        size: 7,
        color: PDF_COLORS.muted,
        align:
          xTicks.length === 1 ? 'center' : index === 0 ? 'left' : index === 2 ? 'right' : 'center',
      });
    });
    this.y = bottom + 24;
  }

  /** Waagrechte Balken mit Name links und Wert rechts */
  horizontalBars(
    items: ReadonlyArray<{ label: string; value: number; text: string; color?: Rgb }>,
  ) {
    const max = Math.max(0, ...items.map((item) => item.value)) || 1;
    const labelWidth = Math.min(
      170,
      Math.max(60, ...items.map((item) => winAnsiWidth(toWinAnsi(item.label), 8.5))) + 16,
    );
    const valueWidth = 64;
    const barLeft = this.left + labelWidth;
    const barWidth = this.width - labelWidth - valueWidth;
    for (const item of items) {
      this.ensureSpace(16);
      this.page.text(this.left, this.y + 9, fitText(item.label, labelWidth - 8, 8.5), {
        size: 8.5,
        color: PDF_COLORS.text,
      });
      this.page.rect(barLeft, this.y + 3, barWidth, 7, { fill: PDF_COLORS.subtle, radius: 3.5 });
      if (item.value > 0) {
        this.page.rect(barLeft, this.y + 3, Math.max(7, (item.value / max) * barWidth), 7, {
          fill: item.color ?? this.theme.strong,
          radius: 3.5,
        });
      }
      this.page.text(this.left + this.width, this.y + 9, item.text, {
        size: 8.5,
        bold: true,
        color: PDF_COLORS.text,
        align: 'right',
      });
      this.y += 16;
    }
    this.y += 6;
  }

  /**
   * Monatskalender (Mo–So). Ein Monat groß mit Tageszahlen, mehrere als kleine Raster
   * (vier je Zeile). `dayColor` liefert die Füllung eines Tages (`null` = leer).
   */
  calendars(months: readonly CalendarMonth[], dayColor: (day: string) => Rgb | null) {
    const single = months.length === 1;
    const perRow = single ? 1 : 4;
    const gap = 18;
    const blockWidth = single ? 7 * 30 : (this.width - gap * (perRow - 1)) / perRow;
    const cell = blockWidth / 7;
    const square = cell - (single ? 4 : 2.5);

    for (let start = 0; start < months.length; start += perRow) {
      const row = months.slice(start, start + perRow);
      const weeks = Math.max(...row.map(({ month }) => monthGrid(month).length));
      this.ensureSpace(16 + 10 + weeks * cell + 8);
      row.forEach(({ month, title }, index) => {
        const x = this.left + index * (blockWidth + gap);
        this.page.text(x, this.y + 9, title, {
          size: single ? 10 : 8.5,
          bold: true,
          color: PDF_COLORS.text,
        });
        WEEKDAY_LETTERS.forEach((letter, weekday) => {
          this.page.text(x + weekday * cell + square / 2, this.y + 23, letter, {
            size: 6.5,
            color: PDF_COLORS.faint,
            align: 'center',
          });
        });
        monthGrid(month).forEach((week, weekIndex) => {
          week.forEach((day, weekday) => {
            if (!day) return;
            const cx = x + weekday * cell;
            const cy = this.y + 28 + weekIndex * cell;
            const fill = dayColor(day);
            this.page.rect(cx, cy, square, square, {
              fill: fill ?? PDF_COLORS.subtle,
              radius: single ? 4 : 1.5,
            });
            if (single) {
              this.page.text(cx + square / 2, cy + square / 2 + 3, String(Number(day.slice(8))), {
                size: 8,
                color: fill ? WHITE : PDF_COLORS.muted,
                align: 'center',
              });
            }
          });
        });
      });
      this.y += 28 + weeks * cell + 10;
    }
  }

  /** Fußzeilen setzen und Datei erzeugen */
  finish(): Uint8Array {
    const count = this.doc.pages.length;
    this.doc.pages.forEach((page, index) => {
      const y = A4.height - 28;
      page.line(MARGIN, y - 10, A4.width - MARGIN, y - 10, { color: PDF_COLORS.line, width: 0.5 });
      page.text(
        MARGIN,
        y,
        fitText(`Basey · ${this.options.kind}: ${this.options.title}`, 360, 7.5),
        {
          size: 7.5,
          color: PDF_COLORS.muted,
        },
      );
      page.text(A4.width - MARGIN, y, `Seite ${index + 1} von ${count}`, {
        size: 7.5,
        color: PDF_COLORS.muted,
        align: 'right',
      });
    });
    return this.doc.toBytes();
  }
}

/** Wochen eines Monats (Mo–So), Tage als `YYYY-MM-DD`, außerhalb `null` */
export function monthGrid(month: string): Array<Array<string | null>> {
  const [year, monthIndex] = month.split('-').map(Number) as [number, number];
  const first = new Date(year, monthIndex - 1, 1);
  const days = new Date(year, monthIndex, 0).getDate();
  const offset = (first.getDay() + 6) % 7;
  const weeks: Array<Array<string | null>> = [];
  let week: Array<string | null> = Array.from({ length: offset }, () => null);
  for (let day = 1; day <= days; day++) {
    week.push(`${month}-${String(day).padStart(2, '0')}`);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0)
    weeks.push([...week, ...Array.from({ length: 7 - week.length }, () => null)]);
  return weeks;
}
