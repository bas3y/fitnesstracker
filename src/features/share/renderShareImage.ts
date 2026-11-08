import { SHARE_SIZES, type ShareCardContent, type ShareFormat } from '../../domain/shareCard';
import { projectRoute } from '../../domain/track';

const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const BADGE_COLOR = '#fbbf24';

/** Farben der gewählten Palette (Canvas kennt keine CSS-Variablen) */
function paletteColors() {
  const style = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  return {
    deep: read('--p-deep', '#013220'),
    strong: read('--p-strong', '#0b6e4f'),
    light: read('--p-light', '#d1f2eb'),
  };
}
const PADDING = 80;

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Höhen der Abschnitte im Sticker; er ist nur so hoch wie sein Inhalt */
const STICKER = { margin: 40, middle: 500, header: 150, stats: 300, badge: 80 };

function shareImageSize(format: ShareFormat, hasMiddle: boolean, hasBadge: boolean) {
  if (format === 'story') return SHARE_SIZES.story;
  const height =
    2 * STICKER.margin +
    (hasMiddle ? STICKER.middle : 0) +
    STICKER.header +
    STICKER.stats +
    (hasBadge ? STICKER.badge : 0);
  return { width: SHARE_SIZES.sticker.width, height };
}

/** Kürzt mit „…“, bis der Text in die Breite passt */
function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let end = text.length;
  while (end > 1 && ctx.measureText(`${text.slice(0, end)}…`).width > maxWidth) end--;
  return `${text.slice(0, end)}…`;
}

function setFont(ctx: CanvasRenderingContext2D, size: number, weight = 400) {
  ctx.font = `${weight} ${size}px ${FONT}`;
}

function drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  const colors = paletteColors();
  gradient.addColorStop(0, colors.deep);
  gradient.addColorStop(1, colors.strong);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawRoute(ctx: CanvasRenderingContext2D, route: [number, number][], box: Box) {
  const points = projectRoute(route, box.width, box.height, 24);
  if (!points) return;
  ctx.save();
  ctx.translate(box.x, box.y);
  const routeColor = paletteColors().light;
  ctx.strokeStyle = routeColor;
  ctx.lineWidth = 12;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  points.forEach(([x, y], index) => (index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.stroke();
  const [startX, startY] = points[0]!;
  const [endX, endY] = points.at(-1)!;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(endX, endY, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = routeColor;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(startX, startY, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawLines(ctx: CanvasRenderingContext2D, lines: string[], box: Box) {
  const lineHeight = Math.min(84, box.height / Math.max(lines.length, 1));
  setFont(ctx, Math.round(lineHeight * 0.55), 500);
  ctx.fillStyle = '#ffffff';
  lines.forEach((line, index) => {
    ctx.fillText(fitText(ctx, line, box.width), box.x, box.y + lineHeight * (index + 0.75));
  });
}

/** 2 × 2 Kennzahlen */
function drawStats(ctx: CanvasRenderingContext2D, stats: ShareCardContent['stats'], box: Box) {
  const columnWidth = box.width / 2;
  const rowHeight = box.height / 2;
  stats.forEach((stat, index) => {
    const x = box.x + (index % 2) * columnWidth;
    const y = box.y + Math.floor(index / 2) * rowHeight;
    setFont(ctx, 34, 500);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.fillText(fitText(ctx, stat.label.toUpperCase(), columnWidth - 24), x, y + 40);
    setFont(ctx, 76, 700);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(fitText(ctx, stat.value, columnWidth - 24), x, y + 124);
  });
}

function drawHeader(
  ctx: CanvasRenderingContext2D,
  content: ShareCardContent,
  x: number,
  y: number,
  width: number,
) {
  setFont(ctx, 68, 700);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(fitText(ctx, content.title, width), x, y);
  setFont(ctx, 38, 400);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fillText(fitText(ctx, content.subtitle, width), x, y + 60);
}

function drawBadge(
  ctx: CanvasRenderingContext2D,
  badge: string,
  x: number,
  y: number,
  width: number,
) {
  setFont(ctx, 42, 700);
  ctx.fillStyle = BADGE_COLOR;
  ctx.fillText(fitText(ctx, badge, width), x, y);
}

/** Bild als PNG; der Sticker hat einen transparenten Hintergrund und Schatten hinter der Schrift */
export async function renderShareImage(
  content: ShareCardContent,
  format: ShareFormat,
): Promise<Blob> {
  const hasMiddle = content.route !== null || content.lines.length > 0;
  const { width, height } = shareImageSize(format, hasMiddle, content.badge !== null);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas wird nicht unterstützt');
  const inner = width - 2 * PADDING;
  const drawMiddle = (box: Box) => {
    if (content.route) drawRoute(ctx, content.route, box);
    else drawLines(ctx, content.lines, box);
  };

  if (format === 'story') {
    drawBackground(ctx, width, height);
    // Oben und unten blendet Instagram eigene Leisten ein
    drawHeader(ctx, content, PADDING, 260, inner);
    if (hasMiddle) drawMiddle({ x: PADDING, y: 400, width: inner, height: 820 });
    drawStats(ctx, content.stats, { x: PADDING, y: 1280, width: inner, height: 320 });
    if (content.badge) drawBadge(ctx, content.badge, PADDING, 1680, inner);
    setFont(ctx, 30, 600);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.fillText('Fitnesstracker', PADDING, 1760);
  } else {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 3;
    let y = STICKER.margin;
    if (hasMiddle) {
      drawMiddle({ x: PADDING, y, width: inner, height: STICKER.middle - 40 });
      y += STICKER.middle;
    }
    drawHeader(ctx, content, PADDING, y + 70, inner);
    y += STICKER.header;
    drawStats(ctx, content.stats, { x: PADDING, y, width: inner, height: STICKER.stats });
    y += STICKER.stats;
    if (content.badge) drawBadge(ctx, content.badge, PADDING, y + 50, inner);
  }

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Bild konnte nicht erstellt werden'))),
      'image/png',
    ),
  );
}
