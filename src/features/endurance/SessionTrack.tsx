import { lazy, Suspense, useState } from 'react';
import { Card } from '../../components/Page';
import type { DistanceUnit, EnduranceSport, EnduranceTrack, Settings } from '../../db/types';
import { formatDistance, formatPace, hasDistance, paceLabel } from '../../domain/endurance';
import {
  distanceSplits,
  hasValues,
  heartRateSeconds,
  projectRoute,
  svgPath,
} from '../../domain/track';
import { METERS_PER_MILE } from '../../domain/units';
import { formatClock } from '../../domain/workout';
import { HeartRateZonesCard } from './HeartRateZones';

// Eigener Chunk wegen Recharts
const SessionCharts = lazy(() =>
  import('./SessionCharts').then((module) => ({ default: module.SessionCharts })),
);

const MUTED = 'text-sm text-muted';
const ROUTE_WIDTH = 320;
const ROUTE_HEIGHT = 200;
/** Längere Listen erst auf Wunsch ganz zeigen */
const VISIBLE_ROWS = 10;

/** Alles aus dem Verlauf einer importierten Einheit */
export function SessionTrack({
  track,
  sport,
  settings,
}: {
  track: EnduranceTrack;
  sport: EnduranceSport;
  settings: Settings;
}) {
  return (
    <>
      <RouteCard route={track.route} />
      <Suspense fallback={null}>
        <SessionCharts track={track} sport={sport} unit={settings.distanceUnit} />
      </Suspense>
      {hasValues(track.heartRate) && (
        <HeartRateZonesCard histogram={heartRateSeconds(track)} settings={settings} />
      )}
      <SectionsCard track={track} sport={sport} unit={settings.distanceUnit} />
    </>
  );
}

function RouteCard({ route }: { route: EnduranceTrack['route'] }) {
  const points = projectRoute(route, ROUTE_WIDTH, ROUTE_HEIGHT);
  if (!points) return null;
  const [startX, startY] = points[0]!;
  const [endX, endY] = points.at(-1)!;
  return (
    <Card>
      <svg
        role="img"
        aria-label="Streckenverlauf"
        viewBox={`0 0 ${ROUTE_WIDTH} ${ROUTE_HEIGHT}`}
        className="h-auto w-full"
      >
        <path
          d={svgPath(points)}
          fill="none"
          className="stroke-primary"
          strokeWidth={3}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle cx={endX} cy={endY} r={5} className="fill-fg" />
        <circle
          cx={startX}
          cy={startY}
          r={5}
          className="fill-primary stroke-surface"
          strokeWidth={2}
        />
      </svg>
      <p className={`mt-1 ${MUTED}`}>Strecke ohne Karte · farbiger Punkt = Start</p>
    </Card>
  );
}

interface SectionRow {
  label: string;
  distanceMeters: number | null;
  durationSeconds: number;
  avgHeartRate: number | null;
}

function SectionsCard({
  track,
  sport,
  unit,
}: {
  track: EnduranceTrack;
  sport: EnduranceSport;
  unit: DistanceUnit;
}) {
  const [showAll, setShowAll] = useState(false);
  const splitMeters = unit === 'km' ? 1000 : METERS_PER_MILE;
  const useLaps = track.laps.length > 1;
  const rows: SectionRow[] = useLaps
    ? track.laps.map((lap, index) => ({ label: String(index + 1), ...lap }))
    : hasDistance(sport) && sport !== 'swim'
      ? distanceSplits(track, splitMeters).map((split) => ({
          ...split,
          label: String(split.index),
        }))
      : [];
  if (rows.length < 2) return null;
  const visible = showAll ? rows : rows.slice(0, VISIBLE_ROWS);
  const cell = 'py-1 pr-2 tabular-nums';

  return (
    <Card title={useLaps ? 'Runden' : unit === 'km' ? 'Kilometer' : 'Meilen'}>
      <table className="w-full text-left text-sm">
        <thead className={MUTED}>
          <tr>
            <th className={cell}>Nr.</th>
            <th className={cell}>Strecke</th>
            <th className={cell}>Zeit</th>
            <th className={cell}>{paceLabel(sport)}</th>
            <th className={cell}>Puls</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((row) => {
            const rest = row.distanceMeters === 0;
            return (
              <tr key={row.label} className="border-t border-line">
                <td className={cell}>{row.label}</td>
                <td className={cell}>
                  {rest
                    ? 'Pause'
                    : row.distanceMeters === null
                      ? '–'
                      : formatDistance(row.distanceMeters, sport, unit)}
                </td>
                <td className={cell}>{formatClock(row.durationSeconds)}</td>
                <td className={cell}>
                  {(!rest && formatPace(sport, row.distanceMeters, row.durationSeconds, unit)) ||
                    '–'}
                </td>
                <td className={cell}>{row.avgHeartRate ?? '–'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length > VISIBLE_ROWS && (
        <button
          type="button"
          className="mt-2 min-h-11 font-semibold text-primary-text"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? 'Weniger anzeigen' : `Alle ${rows.length} anzeigen`}
        </button>
      )}
    </Card>
  );
}
