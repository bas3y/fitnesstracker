import { LinkRow, PlaceholderPage } from '../../components/Page';

export function DailyPage() {
  return (
    <PlaceholderPage
      title="Alltag"
      text="Hier erfasst du bald Schritte, Wasser, Schlaf, Habits und Ernährung."
    >
      <LinkRow to="/daily/foods" label="Lebensmittel" hint="Nährwertdatenbank durchsuchen" />
    </PlaceholderPage>
  );
}
