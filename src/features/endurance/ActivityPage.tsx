import { Link, Navigate, useParams } from 'react-router-dom';
import { useBackTo, useFromHere } from '../../components/backNavigation';
import { primaryButton, secondaryButton } from '../../components/buttons';
import { Card, LinkRow, Page } from '../../components/Page';
import type { EnduranceSport } from '../../db/types';
import { dayKey } from '../../domain/daily';
import {
  formatDistance,
  formatSessionCount,
  formatSessionSummary,
  formatTotals,
  hasDistance,
  monthRange,
  sessionsInRange,
  sessionTitle,
  sessionTotals,
  weekRange,
  wornGear,
} from '../../domain/endurance';
import { ENDURANCE_SPORT_LABELS } from '../../domain/labels';
import { formatWorkoutDate } from '../../domain/workout';
import { useSettings } from '../settings/useSettings';
import { ENDURANCE_STATS_PATH } from '../stats/statsFilter';
import { TRAINING_PATH } from '../training/paths';
import { BestEffortsCard } from './BestEfforts';
import { useNow } from '../training/useWorkouts';
import { GEAR_PATH, gearPath, IMPORT_PATH, newSessionPath, sessionPath } from './paths';
import { parseSport, useEnduranceSessions, useGearList } from './useEndurance';

const MUTED = 'text-sm text-slate-500 dark:text-slate-400';

export function ActivityPage() {
  const sport = parseSport(useParams().sport);
  if (!sport) return <Navigate to={TRAINING_PATH} replace />;
  return <Activity sport={sport} />;
}

function Activity({ sport }: { sport: EnduranceSport }) {
  const settings = useSettings();
  const allSessions = useEnduranceSessions();
  const gear = useGearList();
  const backTo = useBackTo(TRAINING_PATH);
  const from = useFromHere();
  const now = useNow(true, 60_000);
  const today = dayKey(now);
  const { name, icon } = ENDURANCE_SPORT_LABELS[sport];
  const title = `${icon} ${name}`;
  if (!settings || !allSessions || !gear) {
    return (
      <Page title={title} backTo={backTo}>
        {null}
      </Page>
    );
  }

  const unit = settings.distanceUnit;
  const sessions = allSessions.filter((session) => session.sport === sport);
  const week = sessionTotals(sessionsInRange(sessions, weekRange(today)));
  const month = sessionTotals(sessionsInRange(sessions, monthRange(today)));
  const worn = hasDistance(sport) ? wornGear(gear, allSessions, sport) : [];
  const tiles = [
    { label: 'Diese Woche', value: formatTotals(week, sport, unit), count: week.count },
    { label: 'Dieser Monat', value: formatTotals(month, sport, unit), count: month.count },
  ];

  return (
    <Page title={title} backTo={backTo}>
      <Card>
        <dl data-testid="activity-summary" className="grid grid-cols-2 gap-3 text-center">
          {tiles.map(({ label, value, count }) => (
            <div key={label} className="flex flex-col-reverse">
              <dt className={MUTED}>
                {label} · {formatSessionCount(count)}
              </dt>
              <dd className="text-xl font-bold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>
      {worn.map(({ gear: item, distanceMeters }) => (
        <Link
          key={item.id}
          to={gearPath(item.id)}
          state={from}
          className="mb-4 block rounded-xl bg-amber-100 px-4 py-3 text-sm font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200"
        >
          ⚠️ {item.name} hat {formatDistance(distanceMeters, sport, unit, 0)}: Zeit für neue
          Ausrüstung?
        </Link>
      ))}
      <div className="mb-4 grid grid-cols-[3fr_2fr] gap-2">
        <Link to={newSessionPath(sport)} state={from} className={primaryButton}>
          + Einheit erfassen
        </Link>
        <Link to={IMPORT_PATH} state={from} className={secondaryButton}>
          Importieren
        </Link>
      </div>

      <BestEffortsCard sessions={sessions} sport={sport} unit={unit} />
      {sessions.length > 0 && (
        <LinkRow
          to={`${ENDURANCE_STATS_PATH}&sport=${sport}`}
          label="Statistik"
          hint="Pro Woche, Pace-Entwicklung, Pulszonen"
        />
      )}

      <section className="mb-4">
        <h2 className="mb-3 text-lg font-semibold">Einheiten</h2>
        {sessions.length === 0 ? (
          <p className={MUTED}>
            Noch keine Einheit. Trage sie nach dem Training ein
            {hasDistance(sport) ? ': Dauer, Strecke, Puls und mehr.' : ', die Dauer reicht.'}
          </p>
        ) : (
          <ul aria-label="Einheiten">
            {sessions.map((session) => (
              <li key={session.id}>
                <LinkRow
                  to={sessionPath(session.id)}
                  state={from}
                  label={sessionTitle(session)}
                  hint={`${formatWorkoutDate(session.startedAt)} · ${formatSessionSummary(session, unit)}`}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
      {hasDistance(sport) && (
        <LinkRow
          to={GEAR_PATH}
          state={from}
          label="Ausrüstung"
          hint="Schuhe, Rad, Kilometerstand"
        />
      )}
    </Page>
  );
}
