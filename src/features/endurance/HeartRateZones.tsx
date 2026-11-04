import { Link } from 'react-router-dom';
import { useFromHere } from '../../components/backNavigation';
import { Card } from '../../components/Page';
import type { HeartRateSeconds, Settings } from '../../db/types';
import { HEART_RATE_ZONE_LABELS, heartRateZoneBounds, zoneSecondsOf } from '../../domain/track';
import { formatClock } from '../../domain/workout';

const MUTED = 'text-sm text-slate-500 dark:text-slate-400';

/** Zeit in den 5 Pulszonen; ohne max. Puls ein Hinweis auf die Einstellungen */
export function HeartRateZonesCard({
  histogram,
  settings,
  hint,
}: {
  histogram: HeartRateSeconds;
  settings: Pick<Settings, 'maxHeartRate' | 'restingHeartRate'>;
  /** Zusatz unter den Zonen, z. B. Anzahl der Einheiten */
  hint?: string;
}) {
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
  const seconds = zoneSecondsOf(histogram, bounds);
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
        {hint && `${hint} `}
        {settings.restingHeartRate === null
          ? 'Zonen in % des max. Pulses.'
          : 'Zonen nach Herzfrequenzreserve (mit Ruhepuls).'}
      </p>
    </Card>
  );
}
