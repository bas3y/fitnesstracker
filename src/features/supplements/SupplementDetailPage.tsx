import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useBackTo } from '../../components/backNavigation';
import { dangerButton, primaryButton, secondaryButton } from '../../components/buttons';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Heatmap } from '../../components/Heatmap';
import { Card, Page } from '../../components/Page';
import { Stepper } from '../../components/Stepper';
import { MAX_SUPPLEMENT_AMOUNT } from '../../db/schemas';
import {
  deleteSupplement,
  refillSupplement,
  setSupplementArchived,
  setSupplementStock,
  type LoadedSupplement,
} from '../../db/supplements';
import { dayKey } from '../../domain/daily';
import {
  adherenceLevel,
  ADHERENCE_DAYS,
  dailyUse,
  formatDaysLeft,
  formatDose,
  formatSupplementAmount,
  formatSupplementSchedule,
  intakePercentByDay,
  isLowStock,
  stockDaysLeft,
  supplementAdherence,
  type TrainingDays,
} from '../../domain/supplements';
import { useSettings } from '../settings/useSettings';
import { useNow } from '../training/useWorkouts';
import { SUPPLEMENTS_PATH } from './paths';
import { useSupplement } from './useSupplements';

const MUTED = 'text-sm text-muted';
const HEATMAP_WEEKS = 17;

export function SupplementDetailPage() {
  const { id } = useParams();
  const data = useSupplement(id);
  const backTo = useBackTo(SUPPLEMENTS_PATH);

  if (data === undefined) {
    return (
      <Page title="Supplement" backTo={backTo}>
        {null}
      </Page>
    );
  }
  if (data === null) {
    return (
      <Page title="Supplement" backTo={backTo}>
        <Card>
          <p className="text-muted">Dieses Supplement existiert nicht mehr.</p>
        </Card>
      </Page>
    );
  }
  return <SupplementDetail item={data.item} trainingDays={data.trainingDays} backTo={backTo} />;
}

function SupplementDetail({
  item,
  trainingDays,
  backTo,
}: {
  item: LoadedSupplement;
  trainingDays: TrainingDays;
  backTo: string;
}) {
  const { supplement } = item;
  const navigate = useNavigate();
  const now = useNow(true, 60_000);
  const today = dayKey(now);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const archived = supplement.archivedAt !== null;
  const adherence = supplementAdherence(item, trainingDays, today);

  return (
    <Page title={`💊 ${supplement.name}`} backTo={backTo}>
      {archived && (
        <p
          role="status"
          className="mb-4 rounded-xl bg-warn-soft px-4 py-3 text-sm font-medium text-on-warn-soft"
        >
          Archiviert: erscheint nicht mehr in Liste und Checkliste.
        </p>
      )}
      <Card>
        <p className={`mb-2 ${MUTED}`}>{formatSupplementSchedule(supplement)}</p>
        <ul aria-label="Einnahmen" className="mb-1">
          {supplement.doses.map((dose) => (
            <li key={dose.id}>{formatDose(dose, supplement.unit)}</li>
          ))}
        </ul>
        {supplement.notes && <p className={`mt-2 ${MUTED}`}>{supplement.notes}</p>}
      </Card>

      <StockCard item={item} trainingDays={trainingDays} today={today} />

      <Card title="Verlauf">
        <dl data-testid="supplement-stats" className="mb-3 grid grid-cols-2 gap-2 text-center">
          <div className="flex flex-col-reverse">
            <dt className={MUTED}>Letzte {ADHERENCE_DAYS} Tage</dt>
            <dd className="text-xl font-bold tabular-nums">
              {adherence ? `${adherence.percent} %` : '–'}
            </dd>
          </div>
          <div className="flex flex-col-reverse">
            <dt className={MUTED}>Eingenommen</dt>
            <dd className="text-xl font-bold tabular-nums">
              {adherence ? `${adherence.taken} von ${adherence.due}` : '–'}
            </dd>
          </div>
        </dl>
        <Heatmap
          values={intakePercentByDay(item, today)}
          now={now}
          weekCount={HEATMAP_WEEKS}
          level={adherenceLevel}
          describe={(percent) => (percent > 0 ? `${percent} % genommen` : 'nichts genommen')}
        />
        <p className={MUTED}>Die Quote zählt fällige Einnahmen bis gestern.</p>
      </Card>

      <div className="mb-4 flex flex-col gap-2">
        <Link to={`${SUPPLEMENTS_PATH}/${supplement.id}/edit`} className={secondaryButton}>
          Bearbeiten
        </Link>
        <button
          type="button"
          className={secondaryButton}
          onClick={() => void setSupplementArchived(supplement.id, !archived)}
        >
          {archived ? 'Wiederherstellen' : 'Archivieren'}
        </button>
        <button type="button" className={dangerButton} onClick={() => setConfirmDelete(true)}>
          Supplement löschen
        </button>
      </div>
      {confirmDelete && (
        <ConfirmDialog
          title={`„${supplement.name}“ löschen?`}
          confirmLabel="Löschen"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={async () => {
            await deleteSupplement(supplement.id);
            navigate(SUPPLEMENTS_PATH, { replace: true });
          }}
        >
          Das Supplement wird mit allen Einnahmen entfernt. Zum Aufheben lieber archivieren.
        </ConfirmDialog>
      )}
    </Page>
  );
}

function StockCard({
  item,
  trainingDays,
  today,
}: {
  item: LoadedSupplement;
  trainingDays: TrainingDays;
  today: string;
}) {
  const { supplement } = item;
  const settings = useSettings();
  const { stock, packageSize, unit } = supplement;
  if (stock === null) {
    return (
      <Card title="Bestand">
        <p className={`mb-3 ${MUTED}`}>Der Bestand wird nicht erfasst.</p>
        <button
          type="button"
          className={secondaryButton}
          onClick={() => void setSupplementStock(supplement.id, packageSize ?? 0)}
        >
          Bestand erfassen
        </button>
      </Card>
    );
  }
  const days = stockDaysLeft(supplement, trainingDays, today);
  const low = settings ? isLowStock(days, settings.supplementLowStockDays) : false;
  const use = dailyUse(supplement, trainingDays, today);

  return (
    <Card title="Bestand">
      <div className="flex flex-col gap-3">
        <p
          data-testid="supplement-stock"
          className={`text-lg font-semibold tabular-nums ${low ? 'text-mark' : ''}`}
        >
          {formatSupplementAmount(stock, unit)}
          {days !== null && ` · ${formatDaysLeft(days)}`}
        </p>
        {use > 0 && (
          <p className={MUTED}>
            Verbrauch im Schnitt {formatSupplementAmount(Math.round(use * 100) / 100, unit)} pro Tag
            {supplement.schedule === 'training' && ' (nach deinen Trainings der letzten 4 Wochen)'}.
          </p>
        )}
        {packageSize !== null && (
          <button
            type="button"
            className={primaryButton}
            onClick={() => void refillSupplement(supplement.id)}
          >
            Neue Packung (+{formatSupplementAmount(packageSize, unit)})
          </button>
        )}
        <Stepper
          label="Bestand korrigieren"
          value={stock}
          unit={unit}
          step={1}
          max={MAX_SUPPLEMENT_AMOUNT}
          decimals={2}
          onChange={(value) => value !== null && void setSupplementStock(supplement.id, value)}
        />
        <button
          type="button"
          className={secondaryButton}
          onClick={() => void setSupplementStock(supplement.id, null)}
        >
          Bestand nicht mehr erfassen
        </button>
      </div>
    </Card>
  );
}
