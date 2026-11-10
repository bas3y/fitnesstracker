import { toWinAnsi, winAnsiWidth } from './fontMetrics';

/**
 * Kleiner PDF-Erzeuger (PDF 1.4, ohne Paket): Seiten mit Text in Helvetica/Helvetica-Bold,
 * Rechtecken, Linien und Kreisen. Koordinaten in Punkt, Ursprung **oben links**, Text-`y` ist die
 * Grundlinie. Inhalte werden nicht komprimiert (Berichte bleiben klein).
 */

/** Farbe mit Anteilen 0–1 */
export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export const A4 = { width: 595.28, height: 841.89 } as const;

export type TextAlign = 'left' | 'right' | 'center';

export interface TextOptions {
  size: number;
  bold?: boolean;
  color?: Rgb;
  align?: TextAlign;
}

export interface ShapeOptions {
  fill?: Rgb;
  stroke?: Rgb;
  lineWidth?: number;
}

export interface LineOptions {
  color: Rgb;
  width?: number;
  /** Strichlänge und Lücke */
  dash?: [number, number];
}

const BLACK: Rgb = { r: 0, g: 0, b: 0 };

/** Zahl ohne überflüssige Nachkommastellen */
function num(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return Object.is(rounded, -0) ? '0' : String(rounded);
}

const color = ({ r, g, b }: Rgb) => `${num(r)} ${num(g)} ${num(b)}`;

/** WinAnsi-Text als PDF-Zeichenkette */
function pdfString(winAnsi: string): string {
  return `(${winAnsi.replace(/[\\()]/g, (char) => `\\${char}`)})`;
}

/** Text für das Info-Verzeichnis (UTF-16BE, damit Umlaute überall stimmen) */
function pdfUnicodeString(text: string): string {
  let hex = 'FEFF';
  for (let index = 0; index < text.length; index++) {
    hex += text.charCodeAt(index).toString(16).padStart(4, '0').toUpperCase();
  }
  return `<${hex}>`;
}

function pdfDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `D:${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(
    date.getHours(),
  )}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

/** Bézier-Faktor für Viertelkreise */
const KAPPA = 0.5523;

export class PdfPage {
  private readonly ops: string[] = [];

  constructor(
    readonly width: number,
    readonly height: number,
  ) {}

  /** Inhalt der Seite (für Tests und das Zusammensetzen) */
  get content(): string {
    return this.ops.join('\n');
  }

  private y(top: number) {
    return this.height - top;
  }

  /** Text in einer Zeile; gibt die Breite zurück */
  text(x: number, baseline: number, text: string, options: TextOptions): number {
    const encoded = toWinAnsi(text);
    const width = winAnsiWidth(encoded, options.size, options.bold);
    const left =
      options.align === 'right' ? x - width : options.align === 'center' ? x - width / 2 : x;
    this.ops.push(
      `BT ${color(options.color ?? BLACK)} rg /${options.bold ? 'F2' : 'F1'} ${num(options.size)} Tf ` +
        `1 0 0 1 ${num(left)} ${num(this.y(baseline))} Tm ${pdfString(encoded)} Tj ET`,
    );
    return width;
  }

  /** Rechteck, optional mit runden Ecken */
  rect(
    x: number,
    top: number,
    width: number,
    height: number,
    options: ShapeOptions & { radius?: number },
  ) {
    const radius = Math.min(options.radius ?? 0, width / 2, height / 2);
    const path =
      radius > 0
        ? roundedRectPath(x, this.y(top + height), width, height, radius)
        : `${num(x)} ${num(this.y(top + height))} ${num(width)} ${num(height)} re`;
    this.draw(path, options);
  }

  circle(cx: number, cy: number, radius: number, options: ShapeOptions) {
    const y = this.y(cy);
    const k = radius * KAPPA;
    const path = [
      `${num(cx + radius)} ${num(y)} m`,
      `${num(cx + radius)} ${num(y + k)} ${num(cx + k)} ${num(y + radius)} ${num(cx)} ${num(y + radius)} c`,
      `${num(cx - k)} ${num(y + radius)} ${num(cx - radius)} ${num(y + k)} ${num(cx - radius)} ${num(y)} c`,
      `${num(cx - radius)} ${num(y - k)} ${num(cx - k)} ${num(y - radius)} ${num(cx)} ${num(y - radius)} c`,
      `${num(cx + k)} ${num(y - radius)} ${num(cx + radius)} ${num(y - k)} ${num(cx + radius)} ${num(y)} c`,
      'h',
    ].join(' ');
    this.draw(path, options);
  }

  line(x1: number, y1: number, x2: number, y2: number, options: LineOptions) {
    this.polyline(
      [
        [x1, y1],
        [x2, y2],
      ],
      options,
    );
  }

  /** Linienzug durch die Punkte `[x, y]` */
  polyline(points: ReadonlyArray<readonly [number, number]>, options: LineOptions) {
    if (points.length < 2) return;
    const path = points
      .map(([x, y], index) => `${num(x)} ${num(this.y(y))} ${index === 0 ? 'm' : 'l'}`)
      .join(' ');
    const dash = options.dash ? `[${num(options.dash[0])} ${num(options.dash[1])}] 0 d ` : '';
    this.ops.push(
      `q ${dash}${color(options.color)} RG ${num(options.width ?? 1)} w 1 J 1 j ${path} S Q`,
    );
  }

  private draw(path: string, { fill, stroke, lineWidth }: ShapeOptions) {
    if (!fill && !stroke) return;
    const paint = fill && stroke ? 'B' : fill ? 'f' : 'S';
    this.ops.push(
      `q ${fill ? `${color(fill)} rg ` : ''}${stroke ? `${color(stroke)} RG ${num(lineWidth ?? 1)} w ` : ''}${path} ${paint} Q`,
    );
  }
}

function roundedRectPath(x: number, y: number, width: number, height: number, radius: number) {
  const k = radius * KAPPA;
  const right = x + width;
  const top = y + height;
  return [
    `${num(x + radius)} ${num(y)} m`,
    `${num(right - radius)} ${num(y)} l`,
    `${num(right - radius + k)} ${num(y)} ${num(right)} ${num(y + radius - k)} ${num(right)} ${num(y + radius)} c`,
    `${num(right)} ${num(top - radius)} l`,
    `${num(right)} ${num(top - radius + k)} ${num(right - radius + k)} ${num(top)} ${num(right - radius)} ${num(top)} c`,
    `${num(x + radius)} ${num(top)} l`,
    `${num(x + radius - k)} ${num(top)} ${num(x)} ${num(top - radius + k)} ${num(x)} ${num(top - radius)} c`,
    `${num(x)} ${num(y + radius)} l`,
    `${num(x)} ${num(y + radius - k)} ${num(x + radius - k)} ${num(y)} ${num(x + radius)} ${num(y)} c`,
    'h',
  ].join(' ');
}

export class PdfDocument {
  readonly pages: PdfPage[] = [];

  constructor(private readonly info: { title: string; createdAt: Date }) {}

  addPage(width: number = A4.width, height: number = A4.height): PdfPage {
    const page = new PdfPage(width, height);
    this.pages.push(page);
    return page;
  }

  /** Fertige Datei; jedes Zeichen der Zwischenform ist genau ein Byte */
  toBytes(): Uint8Array {
    const pageCount = Math.max(1, this.pages.length);
    const pages = this.pages.length > 0 ? this.pages : [new PdfPage(A4.width, A4.height)];
    // 1 Katalog, 2 Seitenbaum, 3/4 Schriften, 5 Info, danach je Seite: Seite + Inhalt
    const pageId = (index: number) => 6 + index * 2;
    const objects: string[] = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      `<< /Type /Pages /Kids [${pages.map((_, index) => `${pageId(index)} 0 R`).join(' ')}] /Count ${pageCount} >>`,
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
      `<< /Title ${pdfUnicodeString(this.info.title)} /Producer (Basey) /Creator (Basey) /CreationDate (${pdfDate(this.info.createdAt)}) >>`,
    ];
    pages.forEach((page, index) => {
      objects.push(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${num(page.width)} ${num(page.height)}] ` +
          `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${pageId(index) + 1} 0 R >>`,
      );
      const content = page.content;
      objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    });

    let output = '%PDF-1.4\n%\xe2\xe3\xcf\xd3\n';
    const offsets: number[] = [];
    objects.forEach((body, index) => {
      offsets.push(output.length);
      output += `${index + 1} 0 obj\n${body}\nendobj\n`;
    });
    const xref = output.length;
    output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (const offset of offsets) output += `${String(offset).padStart(10, '0')} 00000 n \n`;
    output += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 5 0 R >>\nstartxref\n${xref}\n%%EOF\n`;

    const bytes = new Uint8Array(output.length);
    for (let index = 0; index < output.length; index++) bytes[index] = output.charCodeAt(index);
    return bytes;
  }
}
