import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBackTo } from '../../components/backNavigation';
import { primaryButton } from '../../components/buttons';
import { Icon } from '../../components/icons';
import { LinkRow, Page } from '../../components/Page';
import type { DistanceUnit, EnduranceSession, Gear } from '../../db/types';
import { formatDistance, gearUsage, isGearWorn } from '../../domain/endurance';
import { ENDURANCE_SPORT_LABELS } from '../../domain/labels';
import { useSettings } from '../settings/useSettings';
import { TRAINING_PATH } from '../training/paths';
import { GEAR_PATH, gearPath } from './paths';
import { useEnduranceSessions, useGearList } from './useEndurance';

const MUTED = 'text-sm text-muted';

function gearHint(gear: Gear, sessions: EnduranceSession[], unit: DistanceUnit): string {
  const { distanceMeters } = gearUsage(gear, sessions);
  const icons = gear.sports.map((sport) => ENDURANCE_SPORT_LABELS[sport].name).join(', ');
  const worn = isGearWorn(gear, distanceMeters) ? ' · Warnschwelle erreicht' : '';
  return `${icons} ${formatDistance(distanceMeters, 'run', unit, 0)}${worn}`;
}

export function GearListPage() {
  const settings = useSettings();
  const gear = useGearList();
  const sessions = useEnduranceSessions();
  const backTo = useBackTo(TRAINING_PATH);
  const [showArchive, setShowArchive] = useState(false);
  if (!settings || !gear || !sessions) {
    return (
      <Page title="Ausrüstung" backTo={backTo}>
        {null}
      </Page>
    );
  }
  const unit = settings.distanceUnit;
  const active = gear.filter((item) => item.archivedAt === null);
  const archived = gear.filter((item) => item.archivedAt !== null);

  return (
    <Page title="Ausrüstung" backTo={backTo}>
      {active.length === 0 ? (
        <p className={`mb-4 ${MUTED}`}>
          Noch keine Ausrüstung. Lege z. B. deine Laufschuhe an: Jede Einheit mit ihnen zählt zum
          Kilometerstand, ab der Warnschwelle gibt es einen Hinweis.
        </p>
      ) : (
        <ul aria-label="Ausrüstung">
          {active.map((item) => (
            <li key={item.id}>
              <LinkRow
                to={gearPath(item.id)}
                label={item.name}
                hint={gearHint(item, sessions, unit)}
              />
            </li>
          ))}
        </ul>
      )}
      <Link to={`${GEAR_PATH}/new`} className={`${primaryButton} mt-2 mb-4`}>
        + Neue Ausrüstung
      </Link>

      {archived.length > 0 && (
        <section className="mb-4">
          <button
            type="button"
            aria-expanded={showArchive}
            className="flex min-h-11 w-full items-center gap-2 text-left font-semibold"
            onClick={() => setShowArchive(!showArchive)}
          >
            <Icon name={showArchive ? 'chevronDown' : 'chevronRight'} className="h-4 w-4" />
            Ausgemustert ({archived.length})
          </button>
          {showArchive && (
            <ul aria-label="Ausgemustert">
              {archived.map((item) => (
                <li key={item.id}>
                  <LinkRow
                    to={gearPath(item.id)}
                    label={item.name}
                    hint={gearHint(item, sessions, unit)}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </Page>
  );
}
