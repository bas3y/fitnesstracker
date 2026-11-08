import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card, Page } from '../../components/Page';
import { createGear, updateGear } from '../../db/endurance';
import type { GearInput } from '../../db/schemas';
import { useSettings } from '../settings/useSettings';
import { GEAR_PATH, gearPath } from './paths';
import { GearForm } from './GearForm';
import { parseSport, useGear } from './useEndurance';

const SHOE_WARN_METERS = 700_000;

export function GearCreatePage() {
  const navigate = useNavigate();
  const settings = useSettings();
  const sport = parseSport(useSearchParams()[0].get('sport'));
  // Zurück zur aufrufenden Seite (Liste oder Formular einer Einheit), ohne Verlauf zur Liste
  const back = () => {
    const index = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (index > 0) navigate(-1);
    else navigate(GEAR_PATH, { replace: true });
  };
  if (!settings) return <Page title="Neue Ausrüstung">{null}</Page>;

  const initial: GearInput = {
    name: '',
    sports: sport ? [sport] : ['run'],
    initialDistanceMeters: 0,
    warnDistanceMeters: (sport ?? 'run') === 'run' ? SHOE_WARN_METERS : null,
    notes: '',
  };
  return (
    <Page title="Neue Ausrüstung" backTo={GEAR_PATH}>
      <GearForm
        initial={initial}
        unit={settings.distanceUnit}
        submitLabel="Anlegen"
        onSubmit={async (values) => {
          await createGear(values);
          back();
        }}
        onCancel={back}
      />
    </Page>
  );
}

export function GearEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const gear = useGear(id);
  const settings = useSettings();
  const detailPath = gearPath(id ?? '');

  if (gear === undefined || !settings) return <Page title="Ausrüstung bearbeiten">{null}</Page>;
  if (gear === null) {
    return (
      <Page title="Ausrüstung bearbeiten" backTo={GEAR_PATH}>
        <Card>
          <p className="text-muted">Diese Ausrüstung existiert nicht mehr.</p>
        </Card>
      </Page>
    );
  }
  const { name, sports, initialDistanceMeters, warnDistanceMeters, notes } = gear;
  return (
    <Page title="Ausrüstung bearbeiten" backTo={detailPath}>
      <GearForm
        initial={{ name, sports, initialDistanceMeters, warnDistanceMeters, notes }}
        unit={settings.distanceUnit}
        submitLabel="Speichern"
        onSubmit={async (values) => {
          await updateGear(gear.id, values);
          navigate(detailPath, { replace: true });
        }}
        onCancel={() => navigate(detailPath)}
      />
    </Page>
  );
}
