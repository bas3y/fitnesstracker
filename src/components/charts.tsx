import { useEffect, useState, type ReactNode } from 'react';
import { motionAllowed } from './motion';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const CHART_HEIGHT = 220;
const LINE_COLOR = 'var(--primary)';
const DAY_MS = 24 * 60 * 60 * 1000;
/** Darüber verschwimmen die Punkte zu einer Fläche */
const MAX_DOTS = 60;
const tick = { fill: 'currentColor', fontSize: 12 };
const grid = { stroke: 'currentColor', strokeOpacity: 0.15, vertical: false };

const shortDate = (time: number) =>
  new Date(time).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });

const LINE_DRAW_MS = 900;
const BAR_GROW_MS = 500;

/**
 * Animation nur beim ersten Anzeigen (22d, D1/D3): Linie zeichnet sich, Balken wachsen. Danach
 * aus, damit Zeitraum- und Filterwechsel ruhig bleiben.
 */
function useFirstShow(durationMs: number): boolean {
  const [animate, setAnimate] = useState(motionAllowed);
  useEffect(() => {
    if (!animate) return;
    const timer = setTimeout(() => setAnimate(false), durationMs + 300);
    return () => clearTimeout(timer);
  }, [animate, durationMs]);
  return animate;
}

function ChartTooltip({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg bg-fg px-2 py-1 text-sm text-surface shadow">
      <div className="opacity-80">{title}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

function ChartFrame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="img" aria-label={label} className="text-muted">
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}

export interface ChartPoint {
  time: number;
  value: number;
  /** Hervorgehobener Punkt (andere Farbe), Text erscheint im Tooltip */
  marker?: string;
}

const MARKER_COLOR = 'var(--mark)';

/** Linie über eine echte Zeitachse, Trainingspausen bleiben also sichtbar */
export function ProgressChart({
  label,
  points,
  formatValue,
  formatTick,
  reversed = false,
}: {
  label: string;
  points: ChartPoint[];
  formatValue: (value: number) => string;
  /** Beschriftung der y-Achse, Standard = Zahl */
  formatTick?: (value: number) => string;
  /** Kleinere Werte oben (z. B. Pace) */
  reversed?: boolean;
}) {
  const animate = useFirstShow(LINE_DRAW_MS);
  const first = points[0]?.time ?? 0;
  const last = points.at(-1)?.time ?? 0;
  // Ein einzelner Punkt braucht eine Achse mit Breite
  const domain = first === last ? [first - DAY_MS, last + DAY_MS] : [first, last];
  return (
    <ChartFrame label={label}>
      <LineChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid {...grid} />
        <XAxis
          dataKey="time"
          type="number"
          scale="time"
          domain={domain}
          tick={tick}
          tickFormatter={shortDate}
          minTickGap={32}
        />
        <YAxis
          width={44}
          domain={['auto', 'auto']}
          tick={tick}
          tickFormatter={formatTick}
          reversed={reversed}
        />
        <Tooltip
          content={({ active, payload }) => {
            const point = payload?.[0]?.payload as ChartPoint | undefined;
            if (!active || !point) return null;
            const title = shortDate(point.time) + (point.marker ? ` · ${point.marker}` : '');
            return <ChartTooltip title={title} value={formatValue(point.value)} />;
          }}
        />
        <Line
          dataKey="value"
          stroke={LINE_COLOR}
          strokeWidth={2}
          dot={(props: { cx?: number; cy?: number; index?: number; payload?: ChartPoint }) => {
            const { cx, cy, index, payload } = props;
            const marked = !!payload?.marker;
            if (cx === undefined || cy === undefined || (!marked && points.length > MAX_DOTS)) {
              return <g key={index} />;
            }
            return (
              <circle
                key={index}
                cx={cx}
                cy={cy}
                r={marked ? 4 : 3}
                fill={marked ? MARKER_COLOR : LINE_COLOR}
                stroke="none"
              />
            );
          }}
          isAnimationActive={animate}
          animationDuration={LINE_DRAW_MS}
          animationEasing="ease-out"
        />
      </LineChart>
    </ChartFrame>
  );
}

export interface SeriesPoint {
  x: number;
  value: number | null;
}

/** Verlauf innerhalb einer Einheit (x = Strecke oder Minuten), Lücken bleiben offen */
export function SeriesChart({
  label,
  points,
  formatX,
  formatValue,
  color = LINE_COLOR,
}: {
  label: string;
  points: SeriesPoint[];
  formatX: (x: number) => string;
  formatValue: (value: number) => string;
  color?: string;
}) {
  const animate = useFirstShow(LINE_DRAW_MS);
  return (
    <ChartFrame label={label}>
      <LineChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid {...grid} />
        <XAxis
          dataKey="x"
          type="number"
          domain={['dataMin', 'dataMax']}
          tick={tick}
          tickFormatter={formatX}
          minTickGap={32}
        />
        <YAxis width={44} domain={['auto', 'auto']} tick={tick} />
        <Tooltip
          content={({ active, payload }) => {
            const point = payload?.[0]?.payload as SeriesPoint | undefined;
            if (!active || !point || point.value === null) return null;
            return <ChartTooltip title={formatX(point.x)} value={formatValue(point.value)} />;
          }}
        />
        <Line
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          isAnimationActive={animate}
          animationDuration={LINE_DRAW_MS}
          animationEasing="ease-out"
        />
      </LineChart>
    </ChartFrame>
  );
}

export interface ChartBar {
  name: string;
  value: number;
}

export function WeeklyBarChart({
  label,
  bars,
  formatValue,
}: {
  label: string;
  bars: ChartBar[];
  formatValue: (value: number) => string;
}) {
  const animate = useFirstShow(BAR_GROW_MS);
  return (
    <ChartFrame label={label}>
      <BarChart data={bars} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid {...grid} />
        <XAxis dataKey="name" tick={tick} minTickGap={24} />
        <YAxis width={32} allowDecimals={false} tick={tick} />
        <Tooltip
          cursor={{ fill: 'currentColor', fillOpacity: 0.1 }}
          content={({ active, payload }) => {
            const bar = payload?.[0]?.payload as ChartBar | undefined;
            if (!active || !bar) return null;
            return <ChartTooltip title={bar.name} value={formatValue(bar.value)} />;
          }}
        />
        <Bar
          dataKey="value"
          fill={LINE_COLOR}
          radius={[3, 3, 0, 0]}
          isAnimationActive={animate}
          animationDuration={BAR_GROW_MS}
          animationEasing="ease-out"
        />
      </BarChart>
    </ChartFrame>
  );
}
