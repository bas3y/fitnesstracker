import { Card } from '../../components/Page';
import { formatBytes } from '../../domain/format';
import { useStorageInfo } from './storage';

export function StorageSection() {
  const info = useStorageInfo();

  return (
    <Card title="Speicher">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-muted">Dauerhaft</dt>
        <dd>{info?.persisted == null ? 'unbekannt' : info.persisted ? 'ja' : 'nein'}</dd>
        <dt className="text-muted">Belegt</dt>
        <dd>
          {info?.usage == null ? 'unbekannt' : formatBytes(info.usage)}
          {info?.quota != null && ` von ${formatBytes(info.quota)}`}
        </dd>
      </dl>
      {info?.persisted === false && (
        <p className="mt-3 text-sm text-warn">
          Der Browser kann die Daten bei Speichermangel löschen. Installiere die App auf dem
          Startbildschirm und erstelle regelmäßig Backups.
        </p>
      )}
    </Card>
  );
}
