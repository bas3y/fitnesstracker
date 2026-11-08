import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useBackTo, useFromHere } from '../../components/backNavigation';
import { primaryButton, secondaryButton } from '../../components/buttons';
import { Details } from '../../components/Details';
import { Card, Page } from '../../components/Page';
import { showToast } from '../../components/toastStore';
import {
  applyEnduranceImport,
  planEnduranceImport,
  type ImportSummary,
} from '../../db/enduranceImport';
import { ENDURANCE_SPORTS, type DistanceUnit, type EnduranceSport } from '../../db/types';
import { formatDistance, formatPace, sessionTitle } from '../../domain/endurance';
import { formatEffortDistance } from '../../domain/enduranceStats';
import type {
  ImportedSessionValues,
  ImportStatus,
  PlannedImport,
} from '../../domain/import/activity';
import type { ImportFileProblem } from '../../domain/import/readFiles';
import { ENDURANCE_SPORT_LABELS } from '../../domain/labels';
import { formatClock, formatTime, formatWorkoutDate } from '../../domain/workout';
import { useSettings } from '../settings/useSettings';
import { TRAINING_PATH } from '../training/paths';
import { IMPORT_PATH, sessionPath } from './paths';
import { takeSharedFiles } from './sharedFiles';
import { Icon } from '../../components/icons';

const MUTED = 'text-sm text-muted';

interface PreviewItem {
  planned: PlannedImport;
  sport: EnduranceSport;
  selected: boolean;
}

type State =
  | { step: 'idle'; message: string | null }
  | { step: 'reading'; fileCount: number }
  | { step: 'preview'; items: PreviewItem[]; problems: ImportFileProblem[] }
  | { step: 'saving' }
  | { step: 'done'; summary: ImportSummary };

const SPORT_NAMES = Object.fromEntries(
  ENDURANCE_SPORTS.map((sport) => [sport, ENDURANCE_SPORT_LABELS[sport].name]),
) as Record<EnduranceSport, string>;

export function ImportPage() {
  const settings = useSettings();
  const backTo = useBackTo(TRAINING_PATH);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [state, setState] = useState<State>({ step: 'idle', message: null });
  const fileInput = useRef<HTMLInputElement>(null);
  const shared = params.get('shared') === '1';

  const readFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setState({ step: 'reading', fileCount: 0 });
    // Parser erst bei Bedarf laden
    const { readImportFiles } = await import('../../domain/import/readFiles');
    const { candidates, problems } = await readImportFiles(files, (fileCount) =>
      setState({ step: 'reading', fileCount }),
    );
    const planned = await planEnduranceImport(candidates);
    setState({
      step: 'preview',
      problems,
      items: planned
        .map((item) => ({
          planned: item,
          sport: item.candidate.session.sport,
          selected: item.status !== 'duplicate',
        }))
        .reverse(),
    });
  };

  useEffect(() => {
    if (!shared) return;
    void takeSharedFiles().then((files) => {
      navigate(IMPORT_PATH, { replace: true });
      if (files.length > 0) void readFiles(files);
      else setState({ step: 'idle', message: 'Es kamen keine Dateien an.' });
    });
    // Nur einmal beim Öffnen über „Teilen“
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shared]);

  const save = async (items: PreviewItem[]) => {
    setState({ step: 'saving' });
    // Duplikate gehen mit, damit sie als übersprungen zählen
    const summary = await applyEnduranceImport(
      items
        .filter((item) => item.selected || item.planned.status === 'duplicate')
        .map(({ planned, sport }) => ({ planned, sport })),
    );
    setState({ step: 'done', summary });
    if (summary.records.length > 0) {
      showToast({
        title: summary.records.length === 1 ? 'Neue Bestzeit' : 'Neue Bestzeiten',
        lines: summary.records.map(
          ({ sport, meters, seconds }) =>
            `${ENDURANCE_SPORT_LABELS[sport].name} ${formatEffortDistance(meters)}: ${formatClock(seconds)}`,
        ),
      });
    }
  };

  const reset = () => setState({ step: 'idle', message: null });

  return (
    <Page title="Einheiten importieren" backTo={backTo}>
      {state.step === 'idle' && (
        <>
          <Card>
            <p className="mb-3">
              Übernimm Einheiten von deiner Sportuhr oder aus Strava: FIT, GPX, TCX oder ein ZIP
              (auch ganze Konto-Exporte). Alles wird nur auf diesem Gerät gelesen.
            </p>
            <label className={primaryButton}>
              Dateien auswählen
              <input
                ref={fileInput}
                type="file"
                multiple
                className="sr-only"
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? []);
                  if (fileInput.current) fileInput.current.value = '';
                  void readFiles(files);
                }}
              />
            </label>
            {state.message && (
              <p role="status" className={`mt-3 ${MUTED}`}>
                {state.message}
              </p>
            )}
          </Card>
          <ImportHelp />
        </>
      )}

      {state.step === 'reading' && (
        <Card>
          <p role="status">
            Dateien werden gelesen …{state.fileCount > 0 && ` (${state.fileCount})`}
          </p>
        </Card>
      )}

      {state.step === 'preview' && settings && (
        <Preview
          items={state.items}
          problems={state.problems}
          unit={settings.distanceUnit}
          onChange={(items) => setState({ ...state, items })}
          onCancel={reset}
          onSave={() => void save(state.items)}
        />
      )}

      {state.step === 'saving' && (
        <Card>
          <p role="status">Wird gespeichert …</p>
        </Card>
      )}

      {state.step === 'done' && <Done summary={state.summary} onMore={reset} />}
    </Page>
  );
}

const STATUS_LABELS: Record<ImportStatus, string> = {
  new: 'neu',
  merge: 'ergänzt',
  duplicate: 'schon vorhanden',
};

function countLabel(count: number, status: ImportStatus) {
  return `${count} ${STATUS_LABELS[status]}`;
}

function Preview({
  items,
  problems,
  unit,
  onChange,
  onCancel,
  onSave,
}: {
  items: PreviewItem[];
  problems: ImportFileProblem[];
  unit: DistanceUnit;
  onChange: (items: PreviewItem[]) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const importable = items.filter((item) => item.planned.status !== 'duplicate');
  const duplicates = items.filter((item) => item.planned.status === 'duplicate');
  const selectedCount = importable.filter((item) => item.selected).length;
  const counts = (['new', 'merge', 'duplicate'] as const)
    .map((status) => ({
      status,
      count: items.filter((item) => item.planned.status === status).length,
    }))
    .filter(({ count }) => count > 0);
  const change = (key: string, changes: Partial<PreviewItem>) =>
    onChange(
      items.map((item) => (item.planned.candidate.key === key ? { ...item, ...changes } : item)),
    );

  return (
    <>
      <p data-testid="import-counts" className="mb-3 font-medium">
        {counts.length === 0
          ? 'Keine Einheiten gefunden.'
          : counts.map(({ status, count }) => countLabel(count, status)).join(' · ')}
      </p>

      {importable.length > 0 && (
        <ul aria-label="Gefundene Einheiten" className="mb-4 flex flex-col gap-2">
          {importable.map((item) => (
            <PreviewRow
              key={item.planned.candidate.key}
              item={item}
              unit={unit}
              onChange={change}
            />
          ))}
        </ul>
      )}

      {duplicates.length > 0 && (
        <Details summary={`${countLabel(duplicates.length, 'duplicate')} – werden übersprungen`}>
          <ul className="flex flex-col gap-1">
            {duplicates.map(({ planned }) => (
              <li key={planned.candidate.key} className={MUTED}>
                {describe(planned.candidate.session, unit)}
              </li>
            ))}
          </ul>
        </Details>
      )}

      {problems.length > 0 && (
        <Details
          summary={
            problems.length === 1
              ? '1 Datei nicht lesbar'
              : `${problems.length} Dateien nicht lesbar`
          }
        >
          <ul aria-label="Nicht lesbare Dateien" className="flex flex-col gap-1">
            {problems.map((problem, index) => (
              <li key={index} className="text-sm">
                <span className="font-medium">{problem.fileName}:</span> {problem.message}
              </li>
            ))}
          </ul>
        </Details>
      )}

      <div className="mb-4 flex flex-col gap-2">
        <button
          type="button"
          className={primaryButton}
          disabled={selectedCount === 0}
          onClick={onSave}
        >
          {selectedCount === 1 ? '1 Einheit importieren' : `${selectedCount} Einheiten importieren`}
        </button>
        <button type="button" className={secondaryButton} onClick={onCancel}>
          Abbrechen
        </button>
      </div>
    </>
  );
}

function describe(session: ImportedSessionValues, unit: DistanceUnit): string {
  return [
    `${formatWorkoutDate(session.startedAt)}, ${formatTime(session.startedAt)} Uhr`,
    session.distanceMeters ? formatDistance(session.distanceMeters, session.sport, unit) : null,
    formatClock(session.durationSeconds),
    formatPace(session.sport, session.distanceMeters, session.durationSeconds, unit),
  ]
    .filter((part) => part !== null)
    .join(' · ');
}

function PreviewRow({
  item,
  unit,
  onChange,
}: {
  item: PreviewItem;
  unit: DistanceUnit;
  onChange: (key: string, changes: Partial<PreviewItem>) => void;
}) {
  const { planned, sport, selected } = item;
  const { key, session, importInfo } = planned.candidate;
  const merge = planned.status === 'merge';
  const title = sessionTitle({ title: session.title, sport });
  return (
    <li className="rounded-xl bg-surface p-3">
      <label className="flex min-h-11 items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 h-5 w-5 shrink-0 accent-primary"
          checked={selected}
          onChange={(event) => onChange(key, { selected: event.target.checked })}
        />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-1.5 font-semibold">
            <Icon name={ENDURANCE_SPORT_LABELS[sport].icon} className="h-5 w-5 text-primary-text" />
            {title}
            {merge && (
              <span className="ml-2 rounded-full bg-info-soft px-2 py-0.5 text-xs font-medium text-on-info-soft">
                ergänzt deine Einheit
              </span>
            )}
          </span>
          <span className={`block ${MUTED}`}>{describe({ ...session, sport }, unit)}</span>
          <span className={`block truncate text-xs ${MUTED}`}>
            {[importInfo.device, importInfo.fileName].filter(Boolean).join(' · ')}
          </span>
        </span>
      </label>
      {merge ? (
        <p className={`mt-1 ${MUTED}`}>
          Schon manuell erfasst: Leere Felder und Verlauf werden ergänzt, deine Werte bleiben.
        </p>
      ) : (
        <label className="mt-2 flex items-center gap-2 text-sm">
          <span className="shrink-0">Sportart</span>
          <select
            aria-label={`Sportart: ${title}`}
            className="h-11 min-w-0 flex-1 rounded-xl border border-line-strong bg-surface px-2"
            value={sport}
            onChange={(event) => onChange(key, { sport: event.target.value as EnduranceSport })}
          >
            {ENDURANCE_SPORTS.map((option) => (
              <option key={option} value={option}>
                {SPORT_NAMES[option]}
              </option>
            ))}
          </select>
        </label>
      )}
    </li>
  );
}

function Done({ summary, onMore }: { summary: ImportSummary; onMore: () => void }) {
  const from = useFromHere();
  const parts = [
    `${summary.created} neu`,
    summary.merged > 0 ? `${summary.merged} ergänzt` : null,
    summary.skipped > 0 ? `${summary.skipped} übersprungen` : null,
  ].filter((part) => part !== null);
  const [single] = summary.sessionIds;
  return (
    <>
      <Card>
        <p role="status" className="font-semibold text-primary-text">
          ✓ Import abgeschlossen: {parts.join(', ')}
        </p>
      </Card>
      <div className="mb-4 flex flex-col gap-2">
        {summary.sessionIds.length === 1 && single && (
          <Link to={sessionPath(single)} state={from} className={primaryButton}>
            Einheit ansehen
          </Link>
        )}
        <Link to={TRAINING_PATH} className={secondaryButton}>
          Zur Trainingsübersicht
        </Link>
        <button type="button" className={secondaryButton} onClick={onMore}>
          Weitere Dateien importieren
        </button>
      </div>
    </>
  );
}

const HELP: { title: string; steps: string[] }[] = [
  {
    title: 'Garmin Connect (einzelne Einheit)',
    steps: [
      'Im Browser connect.garmin.com öffnen und die Aktivität anzeigen.',
      'Zahnrad oben rechts → „Original exportieren“. Es kommt ein ZIP mit einer FIT-Datei.',
      'Das ZIP hier auswählen (nicht entpacken nötig).',
    ],
  },
  {
    title: 'Strava (einzelne Einheit)',
    steps: [
      'Im Browser strava.com öffnen und die Aktivität anzeigen.',
      'Menü „⋯“ → „Original exportieren“ (FIT) oder „GPX exportieren“.',
      'Die Datei hier auswählen.',
    ],
  },
  {
    title: 'Strava-Konto-Export (alle Einheiten)',
    steps: [
      'strava.com → Einstellungen → Mein Konto → „Konto herunterladen“ → „Archiv anfordern“.',
      'Nach der E-Mail das ZIP herunterladen und hier auswählen. Die Einheiten liegen im Ordner „activities“.',
    ],
  },
  {
    title: 'Garmin-Datenexport (alle Einheiten)',
    steps: [
      'Garmin-Konto → Datenverwaltung → „Daten exportieren“.',
      'Das ZIP aus der E-Mail hier auswählen. Die App sucht die FIT-Dateien darin selbst.',
    ],
  },
  {
    title: 'Teilen (Android)',
    steps: [
      'Ist die App installiert, erscheint sie im „Teilen“-Menü, wenn eine Datei geteilt wird (z. B. aus „Downloads“ oder einem Dateimanager). Die Garmin-Connect-App teilt keine Dateien, dort den Weg über den Browser nehmen.',
      'Auf dem iPhone geht das nicht: Datei in „Dateien“ sichern und hier auswählen.',
    ],
  },
];

function ImportHelp() {
  return (
    <section className="mb-4">
      <h2 className="mb-3 text-lg font-semibold">So kommst du an die Dateien</h2>
      {HELP.map(({ title, steps }) => (
        <Details key={title} summary={title}>
          <ol className="list-decimal pl-5 text-sm">
            {steps.map((step) => (
              <li key={step} className="mb-1">
                {step}
              </li>
            ))}
          </ol>
        </Details>
      ))}
      <p className={MUTED}>
        Doppelte Einheiten (z. B. derselbe Lauf aus Garmin und Strava) erkennt die App an Startzeit
        und Dauer und überspringt sie. Manuell erfasste Einheiten werden nur ergänzt.
      </p>
    </section>
  );
}
