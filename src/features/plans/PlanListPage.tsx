import { useNavigate } from 'react-router-dom';
import { primaryButton } from '../../components/buttons';
import { Card, LinkRow, Page } from '../../components/Page';
import { PLAN_TEMPLATES } from '../../data/planTemplates';
import { createPlan, createPlanFromTemplate } from '../../db/plans';
import { PLAN_SCHEDULE_LABELS } from '../../domain/plans';
import { useSettings } from '../settings/useSettings';
import { PLANS_PATH, TRAINING_PATH } from '../training/paths';
import { usePlans } from './usePlans';

export function PlanListPage() {
  const navigate = useNavigate();
  const plans = usePlans();
  const settings = useSettings();

  return (
    <Page title="Trainingspläne" backTo={TRAINING_PATH}>
      {plans?.length === 0 && (
        <p className="mb-4 text-slate-600 dark:text-slate-400">
          Noch kein Plan. Starte mit einer Vorlage oder lege einen eigenen an.
        </p>
      )}
      {plans?.map(({ plan, dayNames }) => (
        <LinkRow
          key={plan.id}
          to={`${PLANS_PATH}/${plan.id}`}
          label={plan.id === settings?.activePlanId ? `${plan.name} (aktiv)` : plan.name}
          hint={`${PLAN_SCHEDULE_LABELS[plan.schedule]} · ${dayNames.join(', ') || 'keine Trainings'}`}
        />
      ))}
      <button
        type="button"
        className={`${primaryButton} mt-2 mb-6`}
        onClick={async () => {
          const plan = await createPlan();
          navigate(`${PLANS_PATH}/${plan.id}`);
        }}
      >
        + Neuer Plan
      </button>

      <Card title="Vorlagen">
        <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">
          Eine Vorlage wird als eigener Plan angelegt, den du frei ändern kannst.
        </p>
        <ul aria-label="Vorlagen" className="divide-y divide-slate-200 dark:divide-slate-700">
          {PLAN_TEMPLATES.map((template) => (
            <li key={template.key}>
              <button
                type="button"
                className="min-h-14 w-full py-2 text-left"
                onClick={async () => {
                  const plan = await createPlanFromTemplate(template.key);
                  navigate(`${PLANS_PATH}/${plan.id}`);
                }}
              >
                <span className="block font-medium">{template.name}</span>
                <span className="block text-sm text-slate-500 dark:text-slate-400">
                  {template.description}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </Page>
  );
}
