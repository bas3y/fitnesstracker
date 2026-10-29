import { LinkRow, PlaceholderPage } from '../../components/Page';

export function TrainingPage() {
  return (
    <PlaceholderPage title="Training" text="Hier loggst du bald Workouts und verwaltest Pläne.">
      <LinkRow to="/training/exercises" label="Übungen" hint="Übungsdatenbank durchsuchen" />
    </PlaceholderPage>
  );
}
