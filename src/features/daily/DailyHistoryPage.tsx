import { Page } from '../../components/Page';
import { useSettings } from '../settings/useSettings';
import { DailyHistoryCard } from './DailyHistoryCard';
import { useDayBackTo, useDayParam } from './useDaily';

/** Zentraler Verlauf des Alltags; die Seite lädt per `lazyPage`, Recharts bleibt so im eigenen Chunk */
export function DailyHistoryPage() {
  const settings = useSettings();
  const { date, today } = useDayParam();
  const backTo = useDayBackTo(date, today);
  return (
    <Page title="Verlauf" backTo={backTo}>
      {settings && <DailyHistoryCard settings={settings} today={today} />}
    </Page>
  );
}
