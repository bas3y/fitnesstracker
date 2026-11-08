import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { dangerButton, primaryButton, secondaryButton } from '../../components/buttons';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DeleteRowButton } from '../../components/DeleteRowButton';
import { Card, LinkRow, Page } from '../../components/Page';
import { SegmentedControl } from '../../components/SegmentedControl';
import { SortableList } from '../../components/SortableList';
import {
  addPlanDay,
  deletePlan,
  duplicatePlan,
  removePlanDay,
  reorderPlanDays,
  setActivePlan,
  updatePlan,
  type PlanDayDetail,
  type PlanDetail,
} from '../../db/plans';
import {
  PLAN_SCHEDULES,
  type DayKey,
  type Plan,
  type PlanDay,
  type PlanSchedule,
} from '../../db/types';
import { blockStatus, formatBlockWeek } from '../../domain/blocks';
import { dayKey } from '../../domain/daily';
import { BLOCK_KIND_LABELS } from '../../domain/labels';
import { formatWeekdays, PLAN_SCHEDULE_LABELS } from '../../domain/plans';
import { formatDayKey } from '../../domain/stats';
import { useSettings } from '../settings/useSettings';
import { planBlocksPath, PLANS_PATH } from '../training/paths';
import { NameField } from './NameField';
import { usePlanDetail } from './usePlans';

export function PlanDetailPage() {
  const { id } = useParams();
  const detail = usePlanDetail(id);

  if (detail === undefined) {
    return (
      <Page title="Plan" backTo={PLANS_PATH}>
        {null}
      </Page>
    );
  }
  if (detail === null) {
    return (
      <Page title="Plan" backTo={PLANS_PATH}>
        <Card>
          <p className="text-muted">Dieser Plan existiert nicht mehr.</p>
        </Card>
      </Page>
    );
  }
  return <PlanEditor key={detail.plan.id} detail={detail} />;
}

function dayHint({ day, items }: PlanDayDetail, schedule: PlanSchedule): string {
  const count = items.length === 1 ? '1 Übung' : `${items.length} Übungen`;
  const weekdays = schedule === 'weekdays' ? formatWeekdays(day.weekdays) : '';
  return weekdays ? `${weekdays} · ${count}` : count;
}

function blocksHint(plan: Plan, today: DayKey): string {
  if (plan.blocks.length === 0) return 'Keine – z. B. 3 Wochen Aufbau + 1 Woche Deload';
  const status = blockStatus(plan, today);
  const sequence = plan.blocks.map((block) => BLOCK_KIND_LABELS[block.kind]).join(' → ');
  if (!status) return `${sequence} · angehalten`;
  if (status.phase === 'upcoming') return `${sequence} · beginnt ${formatDayKey(status.startDate)}`;
  if (status.phase === 'ended') return `${BLOCK_KIND_LABELS[status.block.kind]} geschafft`;
  return formatBlockWeek({ ...status.block, week: status.week });
}

function PlanEditor({ detail }: { detail: PlanDetail }) {
  const { plan, days } = detail;
  const navigate = useNavigate();
  const settings = useSettings();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletingDay, setDeletingDay] = useState<PlanDay | null>(null);
  const isActive = settings?.activePlanId === plan.id;
  const today = dayKey(new Date());

  return (
    <Page title={plan.name} backTo={PLANS_PATH}>
      <Card>
        <div className="flex flex-col gap-3">
          <NameField
            label="Name des Plans"
            value={plan.name}
            onSave={(name) => void updatePlan(plan.id, { name })}
          />
          <div>
            <p className="mb-1 text-sm font-medium">Ablauf</p>
            <SegmentedControl
              label="Ablauf"
              options={PLAN_SCHEDULES.map((value) => ({
                value,
                label: PLAN_SCHEDULE_LABELS[value],
              }))}
              value={plan.schedule}
              onChange={(schedule) => void updatePlan(plan.id, { schedule })}
            />
            <p className="mt-1 text-xs text-muted">
              {plan.schedule === 'rotation'
                ? 'Die Trainings kommen der Reihe nach dran, egal an welchem Tag.'
                : 'Jedes Training gehört zu festen Wochentagen.'}
            </p>
          </div>
          {isActive ? (
            <p className="text-sm font-medium text-primary-text">
              Aktiver Plan – wird auf der Trainingsseite vorgeschlagen.
            </p>
          ) : (
            <button
              type="button"
              className={primaryButton}
              onClick={() => void setActivePlan(plan.id)}
            >
              Als aktiven Plan wählen
            </button>
          )}
        </div>
      </Card>

      <LinkRow
        to={planBlocksPath(plan.id)}
        label="Trainingsblöcke"
        hint={blocksHint(plan, today)}
      />

      <h2 className="mt-4 mb-2 text-lg font-semibold">Trainings</h2>
      <SortableList
        label="Trainings"
        items={days.map((item) => ({ ...item, id: item.day.id, name: item.day.name }))}
        onReorder={(ids) => reorderPlanDays(plan.id, ids)}
        renderItem={(item, { handle }) => (
          <LinkRow
            to={`${PLANS_PATH}/${plan.id}/days/${item.day.id}`}
            label={item.day.name}
            hint={dayHint(item, plan.schedule)}
            handle={handle}
            action={<DeleteRowButton name={item.name} onClick={() => setDeletingDay(item.day)} />}
          />
        )}
      />
      {deletingDay && (
        <ConfirmDialog
          title={`„${deletingDay.name}“ löschen?`}
          confirmLabel="Löschen"
          onCancel={() => setDeletingDay(null)}
          onConfirm={async () => {
            await removePlanDay(deletingDay.id);
            setDeletingDay(null);
          }}
        >
          Das Training wird aus dem Plan entfernt. Bisherige Workouts bleiben erhalten.
        </ConfirmDialog>
      )}
      <button
        type="button"
        className={`${secondaryButton} mt-2 mb-6`}
        onClick={async () => {
          const day = await addPlanDay(plan.id);
          navigate(`${PLANS_PATH}/${plan.id}/days/${day.id}`);
        }}
      >
        + Training hinzufügen
      </button>

      <div className="mb-4 flex flex-col gap-2">
        <button
          type="button"
          className={secondaryButton}
          onClick={async () => {
            const copy = await duplicatePlan(plan.id);
            navigate(`${PLANS_PATH}/${copy.id}`);
          }}
        >
          Plan duplizieren
        </button>
        {confirmDelete ? (
          <div className="rounded-xl border border-danger/40 bg-danger-soft p-3">
            <p className="mb-3 text-sm font-medium">
              „{plan.name}“ löschen? Bisherige Workouts bleiben erhalten.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className={secondaryButton}
                onClick={() => setConfirmDelete(false)}
              >
                Abbrechen
              </button>
              <button
                type="button"
                className={dangerButton}
                onClick={async () => {
                  await deletePlan(plan.id);
                  navigate(PLANS_PATH, { replace: true });
                }}
              >
                Löschen
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className={dangerButton} onClick={() => setConfirmDelete(true)}>
            Plan löschen
          </button>
        )}
      </div>
    </Page>
  );
}
