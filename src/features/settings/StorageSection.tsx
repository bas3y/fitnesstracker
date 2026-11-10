import { useLiveQuery } from 'dexie-react-hooks';
import { Card } from '../../components/Page';
import { loadDataSummary } from '../../db/dataSummary';
import { db } from '../../db/database';
import { formatBytes } from '../../domain/format';
import { isInstalledApp } from './shareApp';
import { useStorageInfo } from './storage';

export function StorageSection() {
  const info = useStorageInfo();
  const summary = useLiveQuery(loadDataSummary);
  const asApp = isInstalledApp();

  return (
    <Card title="Speicher">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-muted">Eigene Einträge</dt>
        <dd data-testid="data-summary">
          {summary === undefined
            ? '…'
            : `${summary.total} (${summary.workouts} Workouts, ${summary.enduranceSessions} Ausdauer, ${summary.dailyLogs} Alltagstage)`}
        </dd>
        <dt className="text-muted">Geöffnet</dt>
        <dd>{asApp ? 'über das App-Icon' : 'im Browser'}</dd>
        <dt className="text-muted">Dauerhaft</dt>
        <dd>{info?.persisted == null ? 'unbekannt' : info.persisted ? 'ja' : 'nein'}</dd>
        <dt className="text-muted">Belegt</dt>
        <dd>
          {info?.usage == null ? 'unbekannt' : formatBytes(info.usage)}
          {info?.quota != null && ` von ${formatBytes(info.quota)}`}
        </dd>
        <dt className="text-muted">Version</dt>
        <dd>
          {__APP_BUILD__.date} ({__APP_BUILD__.commit}), Datenbank {db.verno}
        </dd>
      </dl>
      {!asApp && (
        <p className="mt-3 text-sm text-muted">
          Im Browser geöffnet: Auf dem iPhone haben Safari und die App auf dem Home-Bildschirm
          getrennte Speicher. Fehlen hier Daten, die App über ihr Icon öffnen.
        </p>
      )}
      {info?.persisted === false && (
        <p className="mt-3 text-sm text-warn">
          Der Browser kann die Daten bei Speichermangel löschen. Installiere die App auf dem
          Startbildschirm und erstelle regelmäßig Backups.
        </p>
      )}
    </Card>
  );
}
