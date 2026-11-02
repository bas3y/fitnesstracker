import { useState } from 'react';
import { Link } from 'react-router-dom';
import { primaryButton, secondaryButton } from '../../components/buttons';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DeleteRowButton } from '../../components/DeleteRowButton';
import { Dialog } from '../../components/Dialog';
import { LinkRow, Page } from '../../components/Page';
import { SortableList } from '../../components/SortableList';
import { showToast } from '../../components/toastStore';
import {
  deleteSupplement,
  importSupplementsFromHabit,
  reorderSupplements,
} from '../../db/supplements';
import type { Habit, Supplement } from '../../db/types';
import { formatHabitTarget } from '../../domain/habits';
import { formatDoseTime, formatSupplementSchedule } from '../../domain/supplements';
import { DayNavigator } from '../daily/DayNavigator';
import { useDayBackTo, useDayParam } from '../daily/useDaily';
import { useSettings } from '../settings/useSettings';
import { SUPPLEMENTS_PATH } from './paths';
import { SupplementChecklist } from './SupplementChecklist';
import { useSupplementHabitCandidates, useSupplementOverview } from './useSupplements';

const MUTED = 'text-sm text-slate-600 dark:text-slate-400';

function supplementHint(supplement: Supplement): string {
  return [
    formatSupplementSchedule(supplement),
    supplement.doses.map(formatDoseTime).join(', '),
  ].join(' · ');
}

export function SupplementsPage() {
  const settings = useSettings();
  const overview = useSupplementOverview();
  const { date, today, setDate } = useDayParam();
  const backTo = useDayBackTo(date, today);
  const [deleting, setDeleting] = useState<Supplement | null>(null);
  const [importing, setImporting] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const all = (overview?.items ?? []).map(({ supplement }) => supplement);
  const active = all.filter((supplement) => supplement.archivedAt === null);
  const archived = all.filter((supplement) => supplement.archivedAt !== null);

  return (
    <Page title="Supplements" backTo={backTo}>
      {active.length > 0 && (
        <>
          <DayNavigator date={date} today={today} onChange={setDate} />
          {settings && (
            <SupplementChecklist date={date} today={today} settings={settings} variant="page" />
          )}
        </>
      )}

      {overview && active.length === 0 && (
        <p className={`mb-4 ${MUTED}`}>
          Noch keine Supplements. Lege das erste an: mit Dosis, Uhrzeit und optional Bestand. Es
          erscheint dann hier zum Abhaken.
        </p>
      )}
      {active.length > 0 && <h2 className="mb-3 text-lg font-semibold">Alle Supplements</h2>}
      <SortableList
        label="Supplements"
        items={active}
        onReorder={reorderSupplements}
        renderItem={(supplement, { handle }) => (
          <LinkRow
            to={`${SUPPLEMENTS_PATH}/${supplement.id}`}
            label={`💊 ${supplement.name}`}
            hint={supplementHint(supplement)}
            handle={handle}
            action={
              <DeleteRowButton name={supplement.name} onClick={() => setDeleting(supplement)} />
            }
          />
        )}
      />
      {overview && (
        <div className="mt-2 mb-4 flex flex-col gap-2">
          <Link to={`${SUPPLEMENTS_PATH}/new`} className={primaryButton}>
            + Neues Supplement
          </Link>
          <ImportButton onClick={() => setImporting(true)} />
        </div>
      )}

      {archived.length > 0 && (
        <section className="mb-4">
          <button
            type="button"
            aria-expanded={showArchive}
            className="flex min-h-11 w-full items-center gap-2 text-left font-semibold"
            onClick={() => setShowArchive(!showArchive)}
          >
            <span aria-hidden="true">{showArchive ? '▾' : '▸'}</span>
            Archiv ({archived.length})
          </button>
          {showArchive && (
            <ul aria-label="Archiv">
              {archived.map((supplement) => (
                <li key={supplement.id}>
                  <LinkRow
                    to={`${SUPPLEMENTS_PATH}/${supplement.id}`}
                    label={`💊 ${supplement.name}`}
                    hint="Archiviert"
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <p className={`mb-4 ${MUTED}`}>
        Erinnerungen und Warnschwelle für den Bestand stellst du in den{' '}
        <Link to="/settings" className="font-semibold text-emerald-700 dark:text-emerald-400">
          Einstellungen
        </Link>{' '}
        ein.
      </p>

      {importing && <ImportDialog onClose={() => setImporting(false)} />}
      {deleting && (
        <ConfirmDialog
          title={`„${deleting.name}“ löschen?`}
          confirmLabel="Löschen"
          onCancel={() => setDeleting(null)}
          onConfirm={async () => {
            await deleteSupplement(deleting.id);
            setDeleting(null);
          }}
        >
          Das Supplement wird mit allen Einnahmen entfernt. Zum Aufheben lieber archivieren.
        </ConfirmDialog>
      )}
    </Page>
  );
}

/** Nur sichtbar, wenn es passende Gewohnheiten gibt */
function ImportButton({ onClick }: { onClick: () => void }) {
  const candidates = useSupplementHabitCandidates();
  if (!candidates || candidates.length === 0) return null;
  return (
    <button type="button" className={secondaryButton} onClick={onClick}>
      Aus Gewohnheit übernehmen
    </button>
  );
}

function ImportDialog({ onClose }: { onClose: () => void }) {
  const candidates = useSupplementHabitCandidates();
  const [selected, setSelected] = useState<Habit | null>(null);

  if (selected) {
    return (
      <ConfirmDialog
        title={`„${selected.name}“ übernehmen?`}
        confirmLabel="Übernehmen"
        onCancel={() => setSelected(null)}
        onConfirm={async () => {
          const created = await importSupplementsFromHabit(selected.id);
          showToast({
            variant: 'info',
            title:
              created.length === 1
                ? '1 Supplement übernommen'
                : `${created.length} Supplements übernommen`,
            lines: created.map((supplement) => supplement.name),
          });
          onClose();
        }}
      >
        {selected.kind === 'items'
          ? 'Jeder Unterpunkt wird ein Supplement'
          : 'Die Gewohnheit wird ein Supplement'}{' '}
        mit seinen bisherigen Einnahmen. Die Gewohnheit wird archiviert, ihr Verlauf bleibt. Zeiten
        und Bestand kannst du danach ergänzen.
      </ConfirmDialog>
    );
  }

  return (
    <Dialog title="Aus Gewohnheit übernehmen" onClose={onClose}>
      <p className={MUTED}>Gewohnheiten mit Unterpunkten oder Mengen:</p>
      <ul aria-label="Gewohnheiten" className="flex flex-col gap-2">
        {(candidates ?? []).map((habit) => (
          <li key={habit.id}>
            <button
              type="button"
              className="flex min-h-14 w-full flex-col justify-center rounded-xl border border-slate-300 px-4 py-2 text-left dark:border-slate-600"
              onClick={() => setSelected(habit)}
            >
              <span className="font-medium">
                {habit.icon} {habit.name}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {formatHabitTarget(habit)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Dialog>
  );
}
