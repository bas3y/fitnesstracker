import { SeriesChart } from '../../components/charts';
import { Card } from '../../components/Page';
import type { DistanceUnit, EnduranceSport, EnduranceTrack } from '../../db/types';
import { hasDistance } from '../../domain/endurance';
import { formatDecimal } from '../../domain/format';
import { hasValues, trackChartPoints } from '../../domain/track';
import { METERS_PER_MILE } from '../../domain/units';

const HEART_RATE_COLOR = '#e11d48';

/** Puls und Höhe über Strecke bzw. Zeit (eigener Chunk wegen Recharts) */
export function SessionCharts({
  track,
  sport,
  unit,
}: {
  track: EnduranceTrack;
  sport: EnduranceSport;
  unit: DistanceUnit;
}) {
  const byDistance = hasDistance(sport) && sport !== 'swim' && hasValues(track.distance);
  const points = trackChartPoints(
    track,
    byDistance ? 'distance' : 'time',
    unit === 'km' ? 1000 : METERS_PER_MILE,
  );
  const formatX = (x: number) =>
    byDistance ? `${formatDecimal(x, 1)} ${unit}` : `${Math.round(x)} min`;
  const showAltitude = sport !== 'swim' && hasValues(track.altitude);

  return (
    <>
      {hasValues(track.heartRate) && (
        <Card title="Puls">
          <SeriesChart
            label="Pulsverlauf"
            points={points.map((point) => ({ x: point.x, value: point.heartRate }))}
            formatX={formatX}
            formatValue={(value) => `${Math.round(value)} bpm`}
            color={HEART_RATE_COLOR}
          />
        </Card>
      )}
      {showAltitude && (
        <Card title="Höhe">
          <SeriesChart
            label="Höhenprofil"
            points={points.map((point) => ({ x: point.x, value: point.altitude }))}
            formatX={formatX}
            formatValue={(value) => `${formatDecimal(value, 0)} m`}
          />
        </Card>
      )}
    </>
  );
}
