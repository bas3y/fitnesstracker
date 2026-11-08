import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBackTo } from '../../components/backNavigation';
import { primaryButton, secondaryButton } from '../../components/buttons';
import { Details } from '../../components/Details';
import { Card, Page } from '../../components/Page';
import { listDailyLogs } from '../../db/daily';
import { applyHealthImport } from '../../db/healthImport';
import { DAILY_IMPORT_FIELDS, type DailyImportField, type DailyLog } from '../../db/types';
import { dayKey } from '../../domain/daily';
import {
  planHealthImport,
  type HealthDay,
  type HealthFieldCount,
  type HealthSource,
} from '../../domain/import/health';
import type { ImportFileProblem } from '../../domain/import/readFiles';
import { DAILY_IMPORT_FIELD_LABELS } from '../../domain/labels';
import { formatDayKey } from '../../domain/stats';
import { BODY_PATH, DAILY_HISTORY_PATH } from './paths';

const MUTED = 'text-sm text-muted';

const SOURCE_LABELS: Record<HealthSource, string> = { apple: 'Apple Health', garmin: 'Garmin' };

interface ReadResult {
  days: HealthDay[];
  sources: HealthSource[];
  problems: ImportFileProblem[];
  logs: DailyLog[];
}

type State =
  | { step: 'idle'; message: string | null }
  | { step: 'reading'; percent: number | null }
  | { step: 'preview'; result: ReadResult }
  | { step: 'saving' }
  | { step: 'done'; dayCount: number };

const plural = (count: number, one: string, many: string) =>
  `${count.toLocaleString('de-DE')} ${count === 1 ? one : many}`;

/** Gesundheitsdaten (Apple Health, Garmin) als Tageswerte übernehmen */
export function HealthImportPage() {
  const backTo = useBackTo(BODY_PATH);
  const [state, setState] = useState<State>({ step: 'idle', message: null });
  const fileInput = useRef<HTMLInputElement>(null);

  const readFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setState({ step: 'reading', percent: null });
    // Parser erst bei Bedarf laden
    const { readHealthFiles } = await import('../../domain/import/readHealthFiles');
    const result = await readHealthFiles(files, (percent) =>
      setState({ step: 'reading', percent }),
    );
    setState({ step: 'preview', result: { ...result, logs: await listDailyLogs() } });
  };

  const reset = () => setState({ step: 'idle', message: null });

  return (
    <Page title="Gesundheitsdaten importieren" backTo={backTo}>
      {state.step === 'idle' && (
        <>
          <Card>
            <p className="mb-3">
              Übernimm Schritte, Schlaf, Gewicht, Ruhepuls und HRV aus dem Export von Apple Health
              oder Garmin. Alles wird nur auf diesem Gerät gelesen, selbst eingetragene Werte
              bleiben.
            </p>
            <label className={primaryButton}>
              Export auswählen
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
          <HealthImportHelp />
        </>
      )}

      {state.step === 'reading' && (
        <Card>
          <p role="status">
            Export wird gelesen …{state.percent !== null && ` ${state.percent} %`}
          </p>
          <p className={`mt-2 ${MUTED}`}>
            Große Exporte brauchen einige Minuten. Bitte die App so lange geöffnet lassen.
          </p>
        </Card>
      )}

      {state.step === 'preview' && (
        <Preview
          result={state.result}
          onCancel={reset}
          onSave={async (changes) => {
            setState({ step: 'saving' });
            await applyHealthImport(changes);
            setState({ step: 'done', dayCount: changes.length });
          }}
        />
      )}

      {state.step === 'saving' && (
        <Card>
          <p role="status">Wird gespeichert …</p>
        </Card>
      )}

      {state.step === 'done' && (
        <>
          <Card>
            <p role="status" className="font-semibold text-primary-text">
              ✓ Import abgeschlossen: {plural(state.dayCount, 'Tag', 'Tage')} aktualisiert
            </p>
          </Card>
          <div className="mb-4 flex flex-col gap-2">
            <Link to={BODY_PATH} className={primaryButton}>
              Zu Körper & Befinden
            </Link>
            <Link to={DAILY_HISTORY_PATH} className={secondaryButton}>
              Verlauf ansehen
            </Link>
            <button type="button" className={secondaryButton} onClick={reset}>
              Weiteren Export importieren
            </button>
          </div>
        </>
      )}
    </Page>
  );
}

function countText(count: HealthFieldCount): string {
  return [
    count.added > 0 ? `${count.added.toLocaleString('de-DE')} neu` : null,
    count.updated > 0 ? `${count.updated.toLocaleString('de-DE')} aktualisiert` : null,
    count.unchanged > 0 ? `${count.unchanged.toLocaleString('de-DE')} unverändert` : null,
    count.kept > 0
      ? `${plural(count.kept, 'eigener Eintrag bleibt', 'eigene Einträge bleiben')}`
      : null,
  ]
    .filter((part) => part !== null)
    .join(' · ');
}

function Preview({
  result,
  onCancel,
  onSave,
}: {
  result: ReadResult;
  onCancel: () => void;
  onSave: (changes: ReturnType<typeof planHealthImport>['changes']) => Promise<void>;
}) {
  const [fields, setFields] = useState<DailyImportField[]>([...DAILY_IMPORT_FIELDS]);
  const today = useMemo(() => dayKey(new Date()), []);
  const plan = useMemo(
    () => planHealthImport(result.days, result.logs, fields, today),
    [result, fields, today],
  );
  const found = DAILY_IMPORT_FIELDS.filter((field) => plan.counts[field].found > 0);
  const toggle = (field: DailyImportField, checked: boolean) =>
    setFields((current) =>
      checked ? [...current, field] : current.filter((item) => item !== field),
    );
  const dayCount = plan.changes.length;

  return (
    <>
      {found.length === 0 ? (
        <p data-testid="health-summary" className="mb-3 font-medium">
          Keine Gesundheitsdaten gefunden.
        </p>
      ) : (
        <p data-testid="health-summary" className="mb-3">
          <span className="font-medium">
            {plan.firstDate && plan.lastDate
              ? `${formatDayKey(plan.firstDate)} – ${formatDayKey(plan.lastDate)}`
              : ''}
          </span>
          <span className={`block ${MUTED}`}>
            aus {result.sources.map((source) => SOURCE_LABELS[source]).join(' und ')}
          </span>
        </p>
      )}

      {found.length > 0 && (
        <ul aria-label="Gefundene Werte" className="mb-4 flex flex-col gap-2">
          {found.map((field) => {
            const count = plan.counts[field];
            const label = DAILY_IMPORT_FIELD_LABELS[field];
            return (
              <li key={field} className="rounded-xl bg-surface p-3">
                <label className="flex min-h-11 items-start gap-3">
                  <input
                    type="checkbox"
                    aria-label={label}
                    className="mt-1 h-5 w-5 shrink-0 accent-primary"
                    checked={fields.includes(field)}
                    onChange={(event) => toggle(field, event.target.checked)}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">
                      {label} · {plural(count.found, 'Tag', 'Tage')}
                    </span>
                    <span className={`block ${MUTED}`}>{countText(count)}</span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}

      {result.problems.length > 0 && (
        <Details
          summary={
            result.problems.length === 1
              ? '1 Datei nicht lesbar'
              : `${result.problems.length} Dateien nicht lesbar`
          }
        >
          <ul aria-label="Nicht lesbare Dateien" className="flex flex-col gap-1">
            {result.problems.map((problem, index) => (
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
          disabled={dayCount === 0}
          onClick={() => void onSave(plan.changes)}
        >
          {dayCount === 0
            ? 'Nichts Neues zu übernehmen'
            : `${plural(dayCount, 'Tag', 'Tage')} übernehmen`}
        </button>
        <button type="button" className={secondaryButton} onClick={onCancel}>
          Abbrechen
        </button>
      </div>
    </>
  );
}

const HELP: { title: string; steps: string[] }[] = [
  {
    title: 'Apple Health (iPhone)',
    steps: [
      'Health-App öffnen, oben rechts auf dein Profilbild tippen.',
      'Ganz unten „Alle Gesundheitsdaten exportieren“ → „Exportieren“. Das dauert je nach Datenmenge einige Minuten.',
      '„In Dateien sichern“ wählen und danach „export.zip“ hier auswählen (nicht entpacken).',
      'Garmin-Werte kommen mit, wenn in der Garmin-Connect-App die Verbindung zu Apple Health eingeschaltet ist.',
    ],
  },
  {
    title: 'Garmin-Datenexport',
    steps: [
      'Im Browser im Garmin-Konto anmelden → Datenverwaltung → „Daten exportieren“ → „Export anfordern“.',
      'Garmin schickt per E-Mail einen Link zu einem ZIP (kann bis zu 30 Tage dauern).',
      'Das ZIP hier auswählen. Gelesen werden Schlaf (mit Phasen), Schritte, Ruhepuls und, falls enthalten, HRV und Gewicht.',
    ],
  },
];

function HealthImportHelp() {
  return (
    <section className="mb-4">
      <h2 className="mb-3 text-lg font-semibold">So kommst du an den Export</h2>
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
        Übernommen werden nur Tageswerte. Schlaf zählt zum Tag des Aufwachens. Ein erneuter Import
        desselben Zeitraums ist unschädlich: Bereits importierte Werte werden aktualisiert, selbst
        eingetragene nie überschrieben.
      </p>
    </section>
  );
}
