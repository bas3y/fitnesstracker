import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useBackTo } from '../../components/backNavigation';
import { Card, Page } from '../../components/Page';
import { showToast } from '../../components/toastStore';
import { createEnduranceSession, updateEnduranceSession } from '../../db/endurance';
import { enduranceSessionFieldsSchema, type EnduranceSessionInput } from '../../db/schemas';
import type { EnduranceSession, EnduranceSport, Gear, Settings } from '../../db/types';
import { formatSessionSummary, sessionTitle, suggestGearId } from '../../domain/endurance';
import { ENDURANCE_SPORT_LABELS } from '../../domain/labels';
import { useSettings } from '../settings/useSettings';
import { TRAINING_PATH } from '../training/paths';
import { activityPath, sessionPath } from './paths';
import { SessionForm } from './SessionForm';
import { parseSport, useEnduranceSession, useEnduranceSessions, useGearList } from './useEndurance';

const DEFAULT_DURATION_SECONDS = 30 * 60;
const FIVE_MINUTES_MS = 5 * 60 * 1000;

/** Beginn vor einer halben Stunde, auf 5 Minuten abgerundet (Einheit gerade beendet) */
function defaultStart(now: Date): string {
  const start = now.getTime() - DEFAULT_DURATION_SECONDS * 1000;
  return new Date(Math.floor(start / FIVE_MINUTES_MS) * FIVE_MINUTES_MS).toISOString();
}

function emptyInput(sport: EnduranceSport, gearId: string | null): EnduranceSessionInput {
  return {
    sport,
    title: '',
    startedAt: defaultStart(new Date()),
    durationSeconds: DEFAULT_DURATION_SECONDS,
    distanceMeters: null,
    avgHeartRate: null,
    maxHeartRate: null,
    elevationGainMeters: null,
    calories: null,
    rating: null,
    notes: '',
    gearId,
    poolLengthMeters: sport === 'swim' ? 25 : null,
    laps: null,
    swimStroke: null,
    swolf: null,
  };
}

export function SessionCreatePage() {
  const sport = parseSport(useParams().sport);
  if (!sport) return <Navigate to={TRAINING_PATH} replace />;
  return <CreateSession sport={sport} />;
}

function CreateSession({ sport }: { sport: EnduranceSport }) {
  const navigate = useNavigate();
  const settings = useSettings();
  const sessions = useEnduranceSessions();
  const gear = useGearList();
  const backTo = useBackTo(activityPath(sport));
  const title = `${ENDURANCE_SPORT_LABELS[sport].name} erfassen`;
  if (!settings || !sessions || !gear) return <Page title={title}>{null}</Page>;

  return (
    <Page title={title} backTo={backTo}>
      <SessionForm
        initial={emptyInput(sport, suggestGearId(sport, gear, sessions))}
        gear={gear}
        unit={settings.distanceUnit}
        submitLabel="Speichern"
        onSubmit={async (values) => {
          const session = await createEnduranceSession(values);
          showToast({
            variant: 'info',
            title: `${sessionTitle(session)} gespeichert`,
            lines: [formatSessionSummary(session, settings.distanceUnit)],
          });
          navigate(backTo, { replace: true });
        }}
        onCancel={() => navigate(backTo)}
      />
    </Page>
  );
}

export function SessionEditPage() {
  const { id } = useParams();
  const session = useEnduranceSession(id);
  const settings = useSettings();
  const gear = useGearList();

  if (session === undefined || !settings || !gear) {
    return <Page title="Einheit bearbeiten">{null}</Page>;
  }
  if (session === null) {
    return (
      <Page title="Einheit bearbeiten" backTo={TRAINING_PATH}>
        <Card>
          <p className="text-muted">Diese Einheit existiert nicht mehr.</p>
        </Card>
      </Page>
    );
  }
  return <EditSession session={session} settings={settings} gear={gear} />;
}

function EditSession({
  session,
  settings,
  gear,
}: {
  session: EnduranceSession;
  settings: Settings;
  gear: Gear[];
}) {
  const navigate = useNavigate();
  const { state } = useLocation();
  const detailPath = sessionPath(session.id);
  const back = () => navigate(detailPath, { replace: true, state });
  return (
    <Page title="Einheit bearbeiten" backTo={detailPath} backState={state}>
      <SessionForm
        // `parse` übernimmt nur die Formularfelder
        initial={enduranceSessionFieldsSchema.parse(session)}
        gear={gear}
        unit={settings.distanceUnit}
        submitLabel="Speichern"
        onSubmit={async (values) => {
          await updateEnduranceSession(session.id, values);
          back();
        }}
        onCancel={back}
      />
    </Page>
  );
}
