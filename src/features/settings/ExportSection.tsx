import { useState } from 'react';
import { secondaryButton } from '../../components/buttons';
import { Card } from '../../components/Page';
import type { WeightUnit } from '../../db/types';
import { createWorkoutsCsvFile } from '../../db/workoutExport';
import { shareOrDownload } from './shareOrDownload';

type Status = { kind: 'success' | 'error'; text: string } | null;

export function ExportSection({ unit }: { unit: WeightUnit }) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  const handleExport = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const file = await createWorkoutsCsvFile(unit);
      if (!file) {
        setStatus({ kind: 'error', text: 'Noch keine beendeten Workouts zum Exportieren' });
      } else if ((await shareOrDownload(file)) !== 'cancelled') {
        setStatus({ kind: 'success', text: 'CSV-Datei wurde erstellt' });
      }
    } catch (error) {
      setStatus({ kind: 'error', text: `Export fehlgeschlagen: ${String(error)}` });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Export">
      <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">
        Alle Sätze als Tabelle, z. B. für Excel. Ersetzt kein Backup: CSV-Dateien lassen sich nicht
        wieder importieren.
      </p>
      <button type="button" className={secondaryButton} disabled={busy} onClick={handleExport}>
        Workouts als CSV exportieren
      </button>
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
