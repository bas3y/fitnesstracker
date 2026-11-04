import { Link } from 'react-router-dom';
import { useFromHere } from '../../components/backNavigation';
import { Card } from '../../components/Page';
import type { DistanceUnit, EnduranceSession, EnduranceSport } from '../../db/types';
import { formatPace } from '../../domain/endurance';
import { bestEffortsOf, formatEffortDistance } from '../../domain/enduranceStats';
import { ENDURANCE_SPORT_LABELS } from '../../domain/labels';
import { formatClock, formatWorkoutDate } from '../../domain/workout';
import { sessionPath } from './paths';

const MUTED = 'text-sm text-slate-500 dark:text-slate-400';

/** Schnellste Zeit je Strecke über alle Einheiten der Sportart; `null`, solange es keine gibt */
export function BestEffortsCard({
  sessions,
  sport,
  unit,
  showSport = false,
}: {
  sessions: readonly EnduranceSession[];
  sport: EnduranceSport;
  unit: DistanceUnit;
  /** Sportart im Titel (Übersicht über mehrere Sportarten) */
  showSport?: boolean;
}) {
  const from = useFromHere();
  const efforts = bestEffortsOf(sessions, sport);
  if (efforts.length === 0) return null;
  const { icon, name } = ENDURANCE_SPORT_LABELS[sport];
  return (
    <Card title={showSport ? `Bestzeiten ${icon} ${name}` : 'Bestzeiten'}>
      <ul aria-label={`Bestzeiten ${name}`} className="flex flex-col">
        {efforts.map(({ meters, seconds, sessionId, startedAt }) => (
          <li key={meters}>
            <Link
              to={sessionPath(sessionId)}
              state={from}
              className="flex min-h-12 items-center justify-between gap-3 py-1"
            >
              <span className="font-medium">{formatEffortDistance(meters)}</span>
              <span className="text-right tabular-nums">
                <span className="block font-semibold">{formatClock(seconds)}</span>
                <span className={`block ${MUTED}`}>
                  {formatPace(sport, meters, seconds, unit)} · {formatWorkoutDate(startedAt)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className={`mt-1 ${MUTED}`}>Schnellster Abschnitt aus importierten Verläufen.</p>
    </Card>
  );
}
