import { Card } from '../../components/Page';
import { ExportButton } from './ExportButton';

/** Karte „Exportieren“ mit PDF und CSV für eine Statistik */
export function StatsExportCard({
  hint,
  pdf,
  csv,
}: {
  hint: string;
  pdf: () => Promise<File | null>;
  csv: () => Promise<File | null>;
}) {
  return (
    <Card title="Exportieren" info={<p>{hint}</p>}>
      <div className="flex flex-col gap-2">
        <ExportButton label="Als PDF" success="PDF wurde erstellt" create={pdf} />
        <ExportButton label="Als CSV (Tabelle)" success="CSV-Datei wurde erstellt" create={csv} />
      </div>
    </Card>
  );
}
