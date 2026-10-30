import { useState } from 'react';
import { Link } from 'react-router-dom';
import { primaryButton } from '../../components/buttons';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { LinkRow, Page } from '../../components/Page';
import { SortableList } from '../../components/SortableList';
import { deletePlan, reorderPlans } from '../../db/plans';
import type { Plan } from '../../db/types';
import { PLAN_SCHEDULE_LABELS } from '../../domain/plans';
import { useSettings } from '../settings/useSettings';
import { PLANS_PATH, TRAINING_PATH } from '../training/paths';
import { DeleteRowButton } from './DeleteRowButton';
import { usePlans } from './usePlans';

export function PlanListPage() {
  const plans = usePlans();
  const settings = useSettings();
  const [deleting, setDeleting] = useState<Plan | null>(null);

  return (
    <Page title="Trainingspläne" backTo={TRAINING_PATH}>
      <SortableList
        label="Pläne"
        items={(plans ?? []).map((summary) => ({
          ...summary,
          id: summary.plan.id,
          name: summary.plan.name,
        }))}
        onReorder={reorderPlans}
        renderItem={({ plan, dayNames }, { handle }) => (
          <LinkRow
            to={`${PLANS_PATH}/${plan.id}`}
            label={plan.id === settings?.activePlanId ? `${plan.name} (aktiv)` : plan.name}
            hint={`${PLAN_SCHEDULE_LABELS[plan.schedule]} · ${dayNames.join(', ') || 'keine Trainings'}`}
            handle={handle}
            action={<DeleteRowButton name={plan.name} onClick={() => setDeleting(plan)} />}
          />
        )}
      />
      {plans && (
        <Link to={`${PLANS_PATH}/new`} className={`${primaryButton} mt-2 mb-4`}>
          + Neuer Plan
        </Link>
      )}
      {deleting && (
        <ConfirmDialog
          title={`„${deleting.name}“ löschen?`}
          confirmLabel="Löschen"
          onCancel={() => setDeleting(null)}
          onConfirm={async () => {
            await deletePlan(deleting.id);
            setDeleting(null);
          }}
        >
          Der Plan wird mit allen Trainings entfernt. Bisherige Workouts bleiben erhalten.
        </ConfirmDialog>
      )}
    </Page>
  );
}
