import { useLiveQuery } from 'dexie-react-hooks';
import { useRef, useState } from 'react';
import { primaryButton, secondaryButton } from '../../components/buttons';
import { Card } from '../../components/Page';
import { listProgressPhotos } from '../../db/photos';
import { formatBytes } from '../../domain/photos';
import {
  backupHasPhotos,
  backupToFile,
  countRows,
  createBackup,
  parseBackupText,
  restoreBackup,
  TABLE_LABELS,
  type Backup,
  type TableName,
} from '../../db/backup';
import { nowIso } from '../../db/repository';
import { updateSettings } from '../../db/settings';
import type { Settings } from '../../db/types';
import { daysSince } from '../../domain/backupReminder';
import { formatDaysAgo } from '../../domain/format';
import { shareOrDownload } from './shareOrDownload';
import { useStorageInfo } from './storage';

type Status = { kind: 'success' | 'error'; text: string } | null;

export function BackupSection({ settings }: { settings: Settings }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [pending, setPending] = useState<Backup | null>(null);
  const [includePhotos, setIncludePhotos] = useState(false);
  const photos = useLiveQuery(async () => {
    const list = await listProgressPhotos();
    return { count: list.length, bytes: list.reduce((sum, photo) => sum + photo.bytes, 0) };
  }, []);

  const handleExport = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const backup = await createBackup({ includePhotos: includePhotos && !!photos?.count });
      const result = await shareOrDownload(backupToFile(backup));
      if (result !== 'cancelled') {
        await updateSettings({ lastBackupAt: nowIso() });
        setStatus({ kind: 'success', text: 'Sicherung wurde erstellt' });
      }
    } catch (error) {
      setStatus({ kind: 'error', text: `Export fehlgeschlagen: ${String(error)}` });
    } finally {
      setBusy(false);
    }
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setStatus(null);
    const result = parseBackupText(await file.text());
    if (fileInput.current) fileInput.current.value = '';
    if (result.ok) setPending(result.backup);
    else setStatus({ kind: 'error', text: result.error });
  };

  const handleImport = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      await restoreBackup(pending);
      setPending(null);
      setStatus({ kind: 'success', text: 'Sicherung wurde importiert' });
    } catch (error) {
      setStatus({ kind: 'error', text: `Import fehlgeschlagen: ${String(error)}` });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Datensicherung">
      <p className="mb-3 text-sm text-muted">
        Alle Daten liegen nur auf diesem Gerät. Sichere sie regelmäßig, z. B. in deiner Cloud.
      </p>
      <p className="mb-3 text-sm font-medium">
        Letztes Backup:{' '}
        {settings.lastBackupAt
          ? formatDaysAgo(daysSince(settings.lastBackupAt, new Date()))
          : 'noch nie'}
      </p>

      <div className="flex flex-col gap-2">
        {photos && photos.count > 0 && (
          <div className="mb-1">
            <label className="flex min-h-11 items-center gap-3">
              <input
                type="checkbox"
                className="h-5 w-5 accent-primary"
                checked={includePhotos}
                onChange={(event) => setIncludePhotos(event.target.checked)}
              />
              Fortschrittsfotos einschließen
            </label>
            <p className="text-sm text-muted">
              {photos.count === 1 ? '1 Foto' : `${photos.count} Fotos`}, die Datei wird etwa{' '}
              {formatBytes(Math.round(photos.bytes * 1.37))} größer. Ohne Haken bleiben beim Import
              einer Sicherung die Fotos auf dem Gerät erhalten.
            </p>
          </div>
        )}
        <button type="button" className={primaryButton} disabled={busy} onClick={handleExport}>
          Backup exportieren
        </button>
        <label className={secondaryButton}>
          Backup importieren
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />
        </label>
      </div>

      <DataLocationInfo />

      {pending && (
        <div className="mt-4 rounded-xl border border-warn/50 bg-warn-soft p-3">
          <p className="font-semibold">
            Sicherung vom {new Date(pending.exportedAt).toLocaleString('de-DE')}
          </p>
          <ul className="my-2 text-sm">
            {Object.entries(countRows(pending)).map(([name, count]) => (
              <li key={name}>
                {TABLE_LABELS[name as TableName]}: {count}
              </li>
            ))}
          </ul>
          <p className="mb-3 text-sm font-medium text-on-warn-soft">
            {backupHasPhotos(pending)
              ? 'Ersetzt alle Daten auf diesem Gerät, auch die Fotos.'
              : 'Ersetzt alle Daten auf diesem Gerät. Ohne Fotos: Die Fotos auf dem Gerät bleiben erhalten.'}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className={secondaryButton}
              disabled={busy}
              onClick={() => setPending(null)}
            >
              Abbrechen
            </button>
            <button type="button" className={primaryButton} disabled={busy} onClick={handleImport}>
              Importieren
            </button>
          </div>
        </div>
      )}

      {status && (
        <p
          role={status.kind === 'error' ? 'alert' : 'status'}
          className={`mt-3 text-sm ${
            status.kind === 'error' ? 'text-danger' : 'text-primary-text'
          }`}
        >
          {status.text}
        </p>
      )}
    </Card>
  );
}

function DataLocationInfo() {
  const storage = useStorageInfo();
  const persisted =
    storage?.persisted == null
      ? null
      : storage.persisted
        ? 'Dieser Browser hat den Speicher als dauerhaft markiert: Er löscht die Daten nicht von sich aus bei Platzmangel.'
        : 'Der Speicher ist nicht als dauerhaft markiert: Der Browser darf die Daten bei Platzmangel löschen.';
  return (
    <details className="mt-3 text-sm">
      <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-primary-text">
        Wo liegen meine Daten?
      </summary>
      <ul className="flex list-disc flex-col gap-2 pl-5 text-fg">
        <li>
          Nur im Browser-Speicher dieses Geräts. Es gibt kein automatisches Backup und keine
          Synchronisierung mit anderen Geräten.
        </li>
        <li>
          Browserdaten löschen: Nur Verlauf oder Cache zu löschen ist unbedenklich. „Cookies und
          Websitedaten“ (Chrome) bzw. „Verlauf und Websitedaten“ (Safari, dort ist es <em>ein</em>{' '}
          Knopf) löscht aber alles.
        </li>
        <li>
          Android: Die installierte App teilt sich den Speicher mit Chrome. iPhone: Die App auf dem
          Startbildschirm hat einen eigenen Speicher. Wird sie vom Startbildschirm entfernt, sind
          die Daten weg; iOS kann Daten länger nicht genutzter Web-Apps auch selbst entfernen.
        </li>
        <li>
          Privatmodus/Inkognito: Beim Schließen des Fensters ist alles weg. Die App dort nicht
          verwenden.
        </li>
        <li>
          Empfehlung: App zum Startbildschirm hinzufügen, regelmäßig „Backup exportieren“ und die
          Datei außerhalb des Handys ablegen (Cloud, PC). Bei Verlust hier importieren; was nach dem
          letzten Export eingetragen wurde, fehlt dann.
        </li>
        {persisted && <li data-testid="storage-persisted">{persisted}</li>}
      </ul>
    </details>
  );
}
