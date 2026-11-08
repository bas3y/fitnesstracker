import { useNavigate } from 'react-router-dom';
import { Page } from '../../components/Page';
import { PLAN_TEMPLATES } from '../../data/planTemplates';
import { createPlan, createPlanFromTemplate } from '../../db/plans';
import type { Plan } from '../../db/types';
import { PLANS_PATH } from '../training/paths';

function ChoiceButton({
  label,
  hint,
  onClick,
}: {
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="mb-2 flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl border border-line-strong bg-surface px-4 py-3 text-left active:bg-page"
      onClick={onClick}
    >
      <span className="min-w-0">
        <span className="block font-semibold">{label}</span>
        <span className="block text-sm text-muted">{hint}</span>
      </span>
      <span aria-hidden="true" className="text-xl text-faint">
        ›
      </span>
    </button>
  );
}

export function PlanNewPage() {
  const navigate = useNavigate();
  const open = async (created: Promise<Plan>) => {
    const plan = await created;
    navigate(`${PLANS_PATH}/${plan.id}`, { replace: true });
  };

  return (
    <Page title="Neuer Plan" backTo={PLANS_PATH}>
      <ChoiceButton
        label="Leerer Plan"
        hint="Trainings und Übungen selbst zusammenstellen"
        onClick={() => void open(createPlan())}
      />
      <h2 className="mt-6 mb-1 text-lg font-semibold">Vorlagen</h2>
      <p className="mb-3 text-sm text-muted">
        Eine Vorlage wird als eigener Plan angelegt, den du frei ändern kannst.
      </p>
      {PLAN_TEMPLATES.map((template) => (
        <ChoiceButton
          key={template.key}
          label={template.name}
          hint={template.description}
          onClick={() => void open(createPlanFromTemplate(template.key))}
        />
      ))}
    </Page>
  );
}
