import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useBackTo, useFromHere } from '../../components/backNavigation';
import { dangerButton, secondaryButton } from '../../components/buttons';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Card, LinkRow, Page } from '../../components/Page';
import { deleteGear, setGearArchived } from '../../db/endurance';
import type { DistanceUnit, EnduranceSession, Gear } from '../../db/types';
import {
  formatDistance,
  formatSessionCount,
  formatSessionSummary,
  gearUsage,
  isGearWorn,
  sessionTitle,
} from '../../domain/endurance';
import { ENDURANCE_SPORT_LABELS } from '../../domain/labels';
import { formatWorkoutDate } from '../../domain/workout';
import { GoalBar } from '../daily/GoalBar';
import { useSettings } from '../settings/useSettings';
import { GEAR_PATH, gearPath, sessionPath } from './paths';
import { useEnduranceSessions, useGear } from './useEndurance';

const MUTED = 'text-sm text-slate-500 dark:text-slate-400';
const RECENT_SESSIONS = 5;

export function GearDetailPage() {
  const { id } = useParams();
  const gear = useGear(id);
  const sessions = useEnduranceSessions();
  const settings = useSettings();
  const backTo = useBackTo(GEAR_PATH);

  if (gear === undefined || !sessions || !settings) {
    return (
      <Page title="Ausrüstung" backTo={backTo}>
        {null}
      </Page>
    );
  }
  if (gear === null) {
    return (
      <Page title="Ausrüstung" backTo={backTo}>
        <Card>
          <p className="text-slate-600 dark:text-slate-400">
            Diese Ausrüstung existiert nicht mehr.
          </p>
        </Card>
      </Page>
    );
  }
  return (
    <GearDetail gear={gear} sessions={sessions} unit={settings.distanceUnit} backTo={backTo} />
  );
}

function GearDetail({
  gear,
  sessions,
  unit,
  backTo,
}: {
  gear: Gear;
  sessions: EnduranceSession[];
  unit: DistanceUnit;
  backTo: string;
}) {
  const navigate = useNavigate();
  const from = useFromHere();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const archived = gear.archivedAt !== null;
  const { distanceMeters, sessionCount } = gearUsage(gear, sessions);
  const worn = isGearWorn(gear, distanceMeters);
  const used = sessions.filter((session) => session.gearId === gear.id);
  const distance = (meters: number) => formatDistance(meters, 'run', unit, 0);

  return (
    <Page title={gear.name} backTo={backTo}>
      {archived && (
        <p
          role="status"
          className="mb-4 rounded-xl bg-amber-100 px-4 py-3 text-sm font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200"
        >
          Ausgemustert: steht bei neuen Einheiten nicht mehr zur Auswahl.
        </p>
      )}
      <Card>
        <p className={`mb-2 ${MUTED}`}>
          {gear.sports
            .map(
              (sport) =>
                `${ENDURANCE_SPORT_LABELS[sport].icon} ${ENDURANCE_SPORT_LABELS[sport].name}`,
            )
            .join(', ')}
        </p>
        <p
          data-testid="gear-distance"
          className={`mb-2 text-2xl font-bold tabular-nums ${worn ? 'text-orange-700 dark:text-orange-400' : ''}`}
        >
          {distance(distanceMeters)}
        </p>
        {gear.warnDistanceMeters !== null && (
          <>
            <GoalBar
              label="Kilometerstand bis zur Warnung"
              value={distanceMeters}
              goal={gear.warnDistanceMeters}
            />
            <p className={`mt-2 ${MUTED}`}>
              {worn
                ? `Warnschwelle von ${distance(gear.warnDistanceMeters)} erreicht. Zeit für Ersatz?`
                : `Noch ${distance(gear.warnDistanceMeters - distanceMeters)} bis zur Warnung bei ${distance(gear.warnDistanceMeters)}.`}
            </p>
          </>
        )}
        <p className={`mt-2 ${MUTED}`}>
          {formatSessionCount(sessionCount)}
          {gear.initialDistanceMeters > 0 &&
            `, dazu ${distance(gear.initialDistanceMeters)} vor der App`}
        </p>
        {gear.notes && <p className="mt-2 whitespace-pre-line">{gear.notes}</p>}
      </Card>

      {used.length > 0 && (
        <section className="mb-4">
          <h2 className="mb-3 text-lg font-semibold">Letzte Einheiten</h2>
          {used.slice(0, RECENT_SESSIONS).map((session) => (
            <LinkRow
              key={session.id}
              to={sessionPath(session.id)}
              state={from}
              label={`${ENDURANCE_SPORT_LABELS[session.sport].icon} ${sessionTitle(session)}`}
              hint={`${formatWorkoutDate(session.startedAt)} · ${formatSessionSummary(session, unit)}`}
            />
          ))}
        </section>
      )}

      <div className="mb-4 flex flex-col gap-2">
        <Link to={`${gearPath(gear.id)}/edit`} className={secondaryButton}>
          Bearbeiten
        </Link>
        <button
          type="button"
          className={secondaryButton}
          onClick={() => void setGearArchived(gear.id, !archived)}
        >
          {archived ? 'Wieder verwenden' : 'Ausmustern'}
        </button>
        <button type="button" className={dangerButton} onClick={() => setConfirmDelete(true)}>
          Ausrüstung löschen
        </button>
      </div>
      {confirmDelete && (
        <ConfirmDialog
          title={`„${gear.name}“ löschen?`}
          confirmLabel="Löschen"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={async () => {
            await deleteGear(gear.id);
            navigate(GEAR_PATH, { replace: true });
          }}
        >
          Die Einheiten bleiben erhalten, verlieren aber die Zuordnung. Zum Aufheben lieber
          ausmustern.
        </ConfirmDialog>
      )}
    </Page>
  );
}
