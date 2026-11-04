import { Link } from 'react-router-dom';
import { useFromHere } from '../../components/backNavigation';
import { Card } from '../../components/Page';
import type { DayKey, DistanceUnit, EnduranceSession } from '../../db/types';
import {
  formatSessionCount,
  formatSessionSummary,
  formatTotals,
  sessionTitle,
} from '../../domain/endurance';
import { weekBySport } from '../../domain/enduranceStats';
import { DASHBOARD_WIDGET_LABELS, ENDURANCE_SPORT_LABELS } from '../../domain/labels';
import { formatWorkoutDate } from '../../domain/workout';
import { ENDURANCE_STATS_PATH } from '../stats/statsFilter';
import { activityPath, sessionPath } from './paths';

const MUTED = 'text-sm text-slate-500 dark:text-slate-400';

/** Startseiten-Widget: diese Woche je Sportart und letzte Einheit; `sessions` neueste zuerst */
export function EnduranceWidget({
  sessions,
  today,
  unit,
}: {
  sessions: readonly EnduranceSession[];
  today: DayKey;
  unit: DistanceUnit;
}) {
  const from = useFromHere();
  const week = weekBySport(sessions, today);
  const last = sessions[0];
  return (
    <Card title={DASHBOARD_WIDGET_LABELS.endurance.name}>
      {week.length === 0 ? (
        <p className={MUTED}>Diese Woche noch keine Einheit.</p>
      ) : (
        <ul aria-label="Ausdauer diese Woche" className="flex flex-col">
          {week.map(({ sport, totals }) => (
            <li key={sport}>
              <Link
                to={activityPath(sport)}
                state={from}
                className="flex min-h-11 items-center justify-between gap-3"
              >
                <span>
                  {ENDURANCE_SPORT_LABELS[sport].icon} {ENDURANCE_SPORT_LABELS[sport].name}
                </span>
                <span className="tabular-nums">
                  <span className="font-semibold">{formatTotals(totals, sport, unit)}</span>{' '}
                  <span className={MUTED}>· {formatSessionCount(totals.count)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {last && (
        <Link
          to={sessionPath(last.id)}
          state={from}
          className="mt-2 flex min-h-11 items-center justify-between gap-3 border-t border-slate-200 pt-2 dark:border-slate-700"
        >
          <span className="min-w-0">
            <span className={`block ${MUTED}`}>Letzte Einheit</span>
            <span className="block font-medium">
              {ENDURANCE_SPORT_LABELS[last.sport].icon} {sessionTitle(last)}
            </span>
            <span className={`block ${MUTED}`}>
              {formatWorkoutDate(last.startedAt)} · {formatSessionSummary(last, unit)}
            </span>
          </span>
          <span aria-hidden="true" className="text-xl text-slate-400">
            ›
          </span>
        </Link>
      )}
      <Link
        to={ENDURANCE_STATS_PATH}
        className="flex min-h-11 items-center text-sm font-semibold text-emerald-700 dark:text-emerald-400"
      >
        Zur Statistik ›
      </Link>
    </Card>
  );
}
