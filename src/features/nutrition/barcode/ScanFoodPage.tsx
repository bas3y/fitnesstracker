import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page } from '../../../components/Page';
import type { Food } from '../../../db/types';
import { foodPath, FOODS_PATH } from '../paths';
import { BarcodeFoodFlow } from './BarcodeFoodFlow';

/** Strichcode scannen und als eigenes Lebensmittel speichern (oder gespeichertes öffnen) */
export function ScanFoodPage() {
  const navigate = useNavigate();
  const open = useCallback(
    (food: Food) => navigate(foodPath(food.id), { replace: true }),
    [navigate],
  );
  return (
    <Page title="Strichcode scannen" backTo={FOODS_PATH}>
      <BarcodeFoodFlow
        submitLabel="Speichern"
        onFood={open}
        onCancel={() => navigate(FOODS_PATH)}
      />
    </Page>
  );
}
