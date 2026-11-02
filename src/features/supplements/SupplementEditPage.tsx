import { useNavigate, useParams } from 'react-router-dom';
import { Card, Page } from '../../components/Page';
import { createSupplement, updateSupplement } from '../../db/supplements';
import { EMPTY_SUPPLEMENT_INPUT } from '../../db/schemas';
import { SUPPLEMENTS_PATH } from './paths';
import { SupplementForm } from './SupplementForm';
import { useSupplement } from './useSupplements';

export function SupplementCreatePage() {
  const navigate = useNavigate();
  return (
    <Page title="Neues Supplement" backTo={SUPPLEMENTS_PATH}>
      <SupplementForm
        initial={EMPTY_SUPPLEMENT_INPUT}
        submitLabel="Anlegen"
        onSubmit={async (input) => {
          await createSupplement(input);
          navigate(SUPPLEMENTS_PATH, { replace: true });
        }}
        onCancel={() => navigate(SUPPLEMENTS_PATH)}
      />
    </Page>
  );
}

export function SupplementEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const data = useSupplement(id);
  const detailPath = `${SUPPLEMENTS_PATH}/${id ?? ''}`;

  if (data === undefined) return <Page title="Supplement bearbeiten">{null}</Page>;
  if (data === null) {
    return (
      <Page title="Supplement bearbeiten" backTo={SUPPLEMENTS_PATH}>
        <Card>
          <p className="text-slate-600 dark:text-slate-400">
            Dieses Supplement existiert nicht mehr.
          </p>
        </Card>
      </Page>
    );
  }

  const { name, unit, doses, schedule, weekdays, trainingKind, stock, packageSize, notes } =
    data.item.supplement;
  return (
    <Page title="Supplement bearbeiten" backTo={detailPath}>
      <SupplementForm
        initial={{ name, unit, doses, schedule, weekdays, trainingKind, stock, packageSize, notes }}
        submitLabel="Speichern"
        onSubmit={async (input) => {
          await updateSupplement(data.item.supplement.id, input);
          navigate(detailPath, { replace: true });
        }}
        onCancel={() => navigate(detailPath)}
      />
    </Page>
  );
}
