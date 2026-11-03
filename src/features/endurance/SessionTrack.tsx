import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFromHere } from '../../components/backNavigation';
import { Card } from '../../components/Page';
import type { DistanceUnit, EnduranceSport, EnduranceTrack, Settings } from '../../db/types';
import { formatDistance, formatPace, hasDistance, paceLabel } from '../../domain/endurance';
import {
  distanceSplits,
  HEART_RATE_ZONE_LABELS,
  hasValues,
  heartRateZoneBounds,
  projectRoute,
  svgPath,
  zoneSeconds,
} from '../../domain/track';
import { METERS_PER_MILE } from '../../domain/units';
import { formatClock } from '../../domain/workout';

// Eigener Chunk wegen Recharts
const SessionCharts = lazy(() =>
  import('./SessionCharts').then((module) => ({ default: module.SessionCharts })),
);

const MUTED = 'text-sm text-slate-500 dark:text-slate-400';
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
      {hasValues(track.heartRate) && <ZonesCard track={track} settings={settings} />}
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
          stroke="#10b981"
          strokeWidth={3}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle cx={endX} cy={endY} r={5} className="fill-slate-700 dark:fill-slate-200" />
        <circle cx={startX} cy={startY} r={5} fill="#10b981" stroke="white" strokeWidth={2} />
      </svg>
      <p className={`mt-1 ${MUTED}`}>Strecke ohne Karte · grün = Start</p>
    </Card>
  );
}

function ZonesCard({ track, settings }: { track: EnduranceTrack; settings: Settings }) {
  const from = useFromHere();
  if (settings.maxHeartRate === null) {
    return (
      <Card title="Pulszonen">
        <p className={MUTED}>
          Trage deinen max. Puls in den{' '}
          <Link
            to="/settings"
            state={from}
            className="font-semibold text-emerald-700 dark:text-emerald-400"
          >
            Einstellungen
          </Link>{' '}
          ein, um die Zeit in den Pulszonen zu sehen.
        </p>
      </Card>
    );
  }
  const bounds = heartRateZoneBounds(settings.maxHeartRate, settings.restingHeartRate);
  const seconds = zoneSeconds(track, bounds);
  const total = seconds.reduce((sum, value) => sum + value, 0);
  return (
    <Card title="Pulszonen">
      <ul data-testid="hr-zones" className="flex flex-col gap-2">
        {bounds.map((bound, index) => {
          const share = total > 0 ? seconds[index]! / total : 0;
          const upper = bounds[index + 1];
          return (
            <li key={index}>
              <div className="flex justify-between text-sm">
                <span>
                  <span className="font-semibold">Z{index + 1}</span>{' '}
                  {HEART_RATE_ZONE_LABELS[index]}{' '}
                  <span className={MUTED}>
                    {upper === undefined ? `ab ${bound}` : `${bound}–${upper - 1}`} bpm
                  </span>
                </span>
                <span className="tabular-nums">
                  {formatClock(seconds[index]!)} · {Math.round(share * 100)} %
                </span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-2 rounded-full bg-rose-500"
                  style={{ width: `${share * 100}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <p className={`mt-2 ${MUTED}`}>
        {settings.restingHeartRate === null
          ? 'Zonen in % des max. Pulses.'
          : 'Zonen nach Herzfrequenzreserve (mit Ruhepuls).'}
      </p>
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
              <tr key={row.label} className="border-t border-slate-200 dark:border-slate-700">
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
          className="mt-2 min-h-11 font-semibold text-emerald-700 dark:text-emerald-400"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? 'Weniger anzeigen' : `Alle ${rows.length} anzeigen`}
        </button>
      )}
    </Card>
  );
}
