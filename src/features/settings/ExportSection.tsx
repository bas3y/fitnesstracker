import { useState } from 'react';
import { useFromHere } from '../../components/backNavigation';
import { secondaryButton } from '../../components/buttons';
import { Card, MoreLink } from '../../components/Page';
import type { WeightUnit } from '../../db/types';
import { createWorkoutsCsvFile } from '../../db/workoutExport';
import { REVIEW_STATS_PATH } from '../stats/statsFilter';
import { shareOrDownload } from './shareOrDownload';

type Status = { kind: 'success' | 'error'; text: string } | null;

export function ExportSection({ unit }: { unit: WeightUnit }) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const from = useFromHere();

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
    <Card
      title="Export"
      info={
        <>
          <p>
            Alle Sätze als Tabelle, z. B. für Excel. Ersetzt kein Backup: CSV-Dateien lassen sich
            nicht wieder importieren.
          </p>
          <p>
            Wochen-, Monats- und Jahresberichte als PDF gibt es im Rückblick der Statistik, einzelne
            Übungen und Ausdauer-Statistiken lassen sich dort ebenfalls als PDF oder CSV
            exportieren.
          </p>
        </>
      }
    >
      <button type="button" className={secondaryButton} disabled={busy} onClick={handleExport}>
        Workouts als CSV exportieren
      </button>
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
      <div>
        <MoreLink to={REVIEW_STATS_PATH} state={from}>
          PDF-Berichte im Rückblick
        </MoreLink>
      </div>
    </Card>
  );
}
