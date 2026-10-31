import { LinkRow, Page } from '../../components/Page';
import { HISTORY_PATH, PLANS_PATH } from './paths';
import { TrainingStartCard } from './TrainingStartCard';

export function TrainingPage() {
  return (
    <Page title="Training">
      <TrainingStartCard />
      <LinkRow to={PLANS_PATH} label="Trainingspläne" hint="Vorlagen, eigene Pläne, aktiver Plan" />
      <LinkRow to={HISTORY_PATH} label="Verlauf" hint="Beendete Workouts ansehen und bearbeiten" />
      <LinkRow
        to="/training/exercises"
        label="Übungen"
        hint="Durchsuchen, Favoriten, eigene Übungen"
      />
    </Page>
  );
}
