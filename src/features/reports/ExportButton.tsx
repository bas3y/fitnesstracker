import { useState } from 'react';
import { secondaryButton } from '../../components/buttons';
import { Icon } from '../../components/icons';
import { shareOrDownload } from '../settings/shareOrDownload';

type Status = { kind: 'success' | 'error'; text: string } | null;

/**
 * Erzeugt eine Datei und bietet sie zum Teilen bzw. Speichern an.
 * `create` liefert `null`, wenn es nichts zu exportieren gibt (`empty` wird angezeigt).
 */
export function ExportButton({
  label,
  create,
  success,
  empty = 'Keine Daten zum Exportieren',
}: {
  label: string;
  create: () => Promise<File | null>;
  success: string;
  empty?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  const run = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const file = await create();
      if (!file) setStatus({ kind: 'error', text: empty });
      else if ((await shareOrDownload(file)) !== 'cancelled') {
        setStatus({ kind: 'success', text: success });
      }
    } catch (error) {
      setStatus({ kind: 'error', text: `Export fehlgeschlagen: ${String(error)}` });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <button type="button" className={secondaryButton} disabled={busy} onClick={() => void run()}>
        <Icon name="download" className="h-5 w-5" />
        {busy ? 'Wird erstellt …' : label}
      </button>
      {status && (
        <p
          role={status.kind === 'error' ? 'alert' : 'status'}
          className={`mt-2 text-sm ${status.kind === 'error' ? 'text-danger' : 'text-primary-text'}`}
        >
          {status.text}
        </p>
      )}
    </div>
  );
}
