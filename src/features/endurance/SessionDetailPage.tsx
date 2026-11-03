import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useBackTo, useFromHere } from '../../components/backNavigation';
import { dangerButton, secondaryButton } from '../../components/buttons';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Card, Page } from '../../components/Page';
import { deleteEnduranceSession } from '../../db/endurance';
import type { DistanceUnit, EnduranceSession, Gear, Settings } from '../../db/types';
import { formatDistance, formatPace, paceLabel, sessionTitle } from '../../domain/endurance';
import { formatDecimal } from '../../domain/format';
import { ENDURANCE_SPORT_LABELS, SWIM_STROKE_LABELS } from '../../domain/labels';
import { formatClock, formatTime, formatWorkoutDate } from '../../domain/workout';
import { useSettings } from '../settings/useSettings';
import { TRAINING_PATH } from '../training/paths';
import { activityPath, gearPath, sessionPath } from './paths';
import { SessionTrack } from './SessionTrack';
import { useEnduranceSession, useEnduranceTrack, useGearList } from './useEndurance';

const MUTED = 'text-sm text-slate-500 dark:text-slate-400';

export function SessionDetailPage() {
  const { id } = useParams();
  const session = useEnduranceSession(id);
  const settings = useSettings();
  const gear = useGearList();
  const backTo = useBackTo(session ? activityPath(session.sport) : TRAINING_PATH);

  if (session === undefined || !settings || !gear) {
    return (
      <Page title="Einheit" backTo={backTo}>
        {null}
      </Page>
    );
  }
  if (session === null) {
    return (
      <Page title="Einheit" backTo={backTo}>
        <Card>
          <p className="text-slate-600 dark:text-slate-400">Diese Einheit existiert nicht mehr.</p>
        </Card>
      </Page>
    );
  }
  return (
    <SessionDetail
      session={session}
      gear={gear.find((item) => item.id === session.gearId) ?? null}
      settings={settings}
      backTo={backTo}
    />
  );
}

/** z. B. „importiert · Garmin · FIT“ bzw. „ergänzt aus GPX“ */
function originText(session: EnduranceSession): string | null {
  const info = session.importInfo;
  if (!info) return null;
  const details = [info.device, info.format.toUpperCase()].filter(Boolean).join(' · ');
  return session.source === 'import' ? `importiert · ${details}` : `ergänzt aus ${details}`;
}

function sessionFacts(session: EnduranceSession, unit: DistanceUnit) {
  const { sport, distanceMeters, durationSeconds } = session;
  const pace = formatPace(sport, distanceMeters, durationSeconds, unit);
  const facts: { label: string; value: string | null }[] = [
    { label: 'Dauer', value: formatClock(durationSeconds) },
    {
      label: 'Distanz',
      value: distanceMeters ? formatDistance(distanceMeters, sport, unit) : null,
    },
    { label: paceLabel(sport), value: pace },
    {
      label: 'Puls Ø',
      value: session.avgHeartRate === null ? null : `${session.avgHeartRate} bpm`,
    },
    {
      label: 'Puls max.',
      value: session.maxHeartRate === null ? null : `${session.maxHeartRate} bpm`,
    },
    {
      label: 'Höhenmeter',
      value:
        session.elevationGainMeters === null
          ? null
          : `${formatDecimal(session.elevationGainMeters, 0)} m`,
    },
    {
      label: 'Kalorien',
      value: session.calories === null ? null : `${formatDecimal(session.calories, 0)} kcal`,
    },
    {
      label: 'Bahnen',
      value:
        session.laps === null
          ? null
          : `${session.laps} × ${formatDecimal(session.poolLengthMeters ?? 0, 1)} m`,
    },
    {
      label: 'Stil',
      value: session.swimStroke === null ? null : SWIM_STROKE_LABELS[session.swimStroke],
    },
    { label: 'SWOLF', value: session.swolf === null ? null : String(session.swolf) },
    { label: 'Bewertung', value: session.rating === null ? null : `${session.rating} von 5` },
  ];
  return facts.filter((fact): fact is { label: string; value: string } => fact.value !== null);
}

function SessionDetail({
  session,
  gear,
  settings,
  backTo,
}: {
  session: EnduranceSession;
  gear: Gear | null;
  settings: Settings;
  backTo: string;
}) {
  const unit = settings.distanceUnit;
  const track = useEnduranceTrack(session.id);
  const origin = originText(session);
  const navigate = useNavigate();
  const { state } = useLocation();
  const from = useFromHere();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { icon } = ENDURANCE_SPORT_LABELS[session.sport];

  return (
    <Page title={`${icon} ${sessionTitle(session)}`} backTo={backTo}>
      <p className={`-mt-2 mb-4 ${MUTED}`}>
        {formatWorkoutDate(session.startedAt)}, {formatTime(session.startedAt)} Uhr
        {origin && ` · ${origin}`}
      </p>
      <Card>
        <dl data-testid="session-facts" className="grid grid-cols-2 gap-3">
          {sessionFacts(session, unit).map(({ label, value }) => (
            <div key={label} className="flex flex-col-reverse">
              <dt className={MUTED}>{label}</dt>
              <dd className="text-lg font-semibold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
        {gear && (
          <p className={`mt-3 ${MUTED}`}>
            Ausrüstung:{' '}
            <Link
              to={gearPath(gear.id)}
              state={from}
              className="font-semibold text-emerald-700 dark:text-emerald-400"
            >
              {gear.name}
            </Link>
          </p>
        )}
        {session.notes && <p className="mt-3 whitespace-pre-line">{session.notes}</p>}
      </Card>
      {track && <SessionTrack track={track} sport={session.sport} settings={settings} />}

      <div className="mb-4 flex flex-col gap-2">
        <Link to={`${sessionPath(session.id)}/edit`} state={state} className={secondaryButton}>
          Bearbeiten
        </Link>
        <button type="button" className={dangerButton} onClick={() => setConfirmDelete(true)}>
          Einheit löschen
        </button>
      </div>
      {confirmDelete && (
        <ConfirmDialog
          title="Einheit löschen?"
          confirmLabel="Löschen"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={async () => {
            await deleteEnduranceSession(session.id);
            navigate(backTo, { replace: true });
          }}
        >
          „{sessionTitle(session)}“ vom {formatWorkoutDate(session.startedAt)} wird entfernt.
        </ConfirmDialog>
      )}
    </Page>
  );
}
