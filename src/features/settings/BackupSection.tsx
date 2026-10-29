import { useRef, useState } from 'react';
import { primaryButton, secondaryButton } from '../../components/buttons';
import { Card } from '../../components/Page';
import {
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

type Status = { kind: 'success' | 'error'; text: string } | null;

export function BackupSection({ settings }: { settings: Settings }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [pending, setPending] = useState<Backup | null>(null);

  const handleExport = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const result = await shareOrDownload(backupToFile(await createBackup()));
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
      <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">
        Alle Daten liegen nur auf diesem Gerät. Sichere sie regelmäßig, z. B. in deiner Cloud.
      </p>
      <p className="mb-3 text-sm font-medium">
        Letztes Backup:{' '}
        {settings.lastBackupAt
          ? formatDaysAgo(daysSince(settings.lastBackupAt, new Date()))
          : 'noch nie'}
      </p>

      <div className="flex flex-col gap-2">
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

      {pending && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-950/40">
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
          <p className="mb-3 text-sm font-medium text-amber-800 dark:text-amber-300">
            Ersetzt alle Daten auf diesem Gerät.
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
            status.kind === 'error'
              ? 'text-red-600 dark:text-red-400'
              : 'text-emerald-700 dark:text-emerald-400'
          }`}
        >
          {status.text}
        </p>
      )}
    </Card>
  );
}
