import { Link } from 'react-router-dom';
import { useFromHere } from '../../components/backNavigation';
import { CheckButton } from '../../components/CheckButton';
import { Card } from '../../components/Page';
import { setSupplementTaken } from '../../db/supplements';
import type { DayKey, Settings } from '../../db/types';
import { dayKey } from '../../domain/daily';
import {
  formatDaysLeft,
  formatDose,
  formatDoseTime,
  isDoseOverdue,
  lowStockSupplements,
  supplementDay,
  type DoseEntry,
} from '../../domain/supplements';
import { toTimeInput } from '../../domain/workout';
import { GoalBar } from '../daily/GoalBar';
import { useNow } from '../training/useWorkouts';
import { SUPPLEMENTS_PATH } from './paths';
import { useSupplementOverview } from './useSupplements';

const MUTED = 'text-sm text-muted';
const LINK = 'font-semibold text-primary-text';

/** Einnahmen eines Tages auf der Startseite (`widget`) oder der Supplements-Seite (`page`) */
export function SupplementChecklist({
  date,
  today,
  settings,
  variant,
}: {
  date: DayKey;
  today: DayKey;
  settings: Settings;
  variant: 'widget' | 'page';
}) {
  const overview = useSupplementOverview();
  const now = useNow(true, 60_000);
  if (!overview) return null;
  const active = overview.items.filter(({ supplement }) => supplement.archivedAt === null);
  const title = variant === 'page' ? 'Einnahmen' : 'Supplements';

  if (active.length === 0) {
    return (
      <Card title={title}>
        <p className={MUTED}>
          Noch keine Supplements.{' '}
          {variant === 'widget' && (
            <Link to={SUPPLEMENTS_PATH} className={LINK}>
              Jetzt anlegen
            </Link>
          )}
        </p>
      </Card>
    );
  }

  const entries = supplementDay(active, date, today, overview.trainingDays);
  const due = entries.filter((entry) => entry.status === 'due');
  const optional = entries.filter((entry) => entry.status === 'optional');
  const taken = due.filter((entry) => entry.intake !== null).length;
  const lowStock = lowStockSupplements(
    active.map(({ supplement }) => supplement),
    overview.trainingDays,
    today,
    settings.supplementLowStockDays,
  );
  const row = (entry: DoseEntry) => (
    <DoseRow
      key={`${entry.supplement.id}-${entry.dose.id}`}
      entry={entry}
      date={date}
      overdue={date === today && isDoseOverdue(entry, now)}
    />
  );

  return (
    <Card title={title}>
      {due.length > 0 ? (
        <>
          <p className="mb-2 text-sm text-muted">
            {taken} von {due.length} genommen
          </p>
          <GoalBar label={`${title}: genommen`} value={taken} goal={due.length} />
          <ul aria-label={`${title}: fällig`} className="mt-2">
            {due.map(row)}
          </ul>
        </>
      ) : (
        <p className={MUTED}>{date === today ? 'Heute steht nichts an.' : 'Nichts fällig.'}</p>
      )}
      {optional.length > 0 && (
        <>
          <h3 className="mt-3 font-semibold">Nur an Trainingstagen</h3>
          <p className={MUTED}>
            Zählt, sobald an diesem Tag ein passendes Training eingetragen ist.
          </p>
          <ul aria-label={`${title}: Trainingstage`}>{optional.map(row)}</ul>
        </>
      )}
      {lowStock.length > 0 && (
        <ul aria-label="Niedriger Bestand" className="mt-3 flex flex-col gap-1">
          {lowStock.map(({ supplement, days }) => (
            <li key={supplement.id}>
              <StockWarning id={supplement.id} name={supplement.name} days={days} />
            </li>
          ))}
        </ul>
      )}
      {variant === 'widget' && (
        <Link to={SUPPLEMENTS_PATH} className={`mt-1 flex min-h-11 items-center text-sm ${LINK}`}>
          Alle Supplements ›
        </Link>
      )}
    </Card>
  );
}

function DoseRow({ entry, date, overdue }: { entry: DoseEntry; date: DayKey; overdue: boolean }) {
  const { supplement, dose, intake } = entry;
  const label =
    supplement.doses.length > 1 ? `${supplement.name} (${formatDoseTime(dose)})` : supplement.name;
  return (
    <li className="flex items-center">
      <CheckButton
        label={label}
        checked={intake !== null}
        hint={
          <>
            {formatDose(dose, supplement.unit)}
            {/* Uhrzeit nur, wenn am selben Tag abgehakt (nicht beim Nachtragen) */}
            {intake && dayKey(new Date(intake.takenAt)) === date
              ? ` · genommen ${toTimeInput(intake.takenAt)}`
              : intake && ' · genommen'}
            {overdue && <span className="font-semibold text-mark"> · fällig</span>}
          </>
        }
        onChange={(checked) => void setSupplementTaken(supplement.id, dose.id, date, checked)}
      />
    </li>
  );
}

export function StockWarning({ id, name, days }: { id: string; name: string; days: number }) {
  const from = useFromHere();
  return (
    <Link
      to={`${SUPPLEMENTS_PATH}/${id}`}
      state={from}
      className="flex min-h-11 items-center gap-2 rounded-xl bg-warn-soft px-3 py-2 text-sm font-medium text-on-warn-soft"
    >
      <span aria-hidden="true">⚠️</span>
      <span className="min-w-0 flex-1">
        {name}: {formatDaysLeft(days)}
      </span>
      <span aria-hidden="true">›</span>
    </Link>
  );
}
