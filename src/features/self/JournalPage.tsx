import { useState } from 'react';
import { useFromHere } from '../../components/backNavigation';
import { LinkRow, Page } from '../../components/Page';
import { DayNavigator } from '../daily/DayNavigator';
import { withDate } from '../daily/paths';
import { useDayBackTo, useDayParam } from '../daily/useDaily';
import { JournalEditor } from './JournalEditor';
import { JOURNAL_HISTORY_PATH, REFLECTION_PATH } from './paths';
import { CustomizeButton, PromptEditor } from './PromptEditor';
import { useJournalEntry, useJournalPrompts } from './useSelf';

/** Tagebuch: Freitext, Dankbarkeit, eigene Fragen (Anpassen) */
export function JournalPage() {
  const { date, today, setDate } = useDayParam();
  const backTo = useDayBackTo(date, today);
  const [editing, setEditing] = useState(false);
  const entry = useJournalEntry('day', date);
  const prompts = useJournalPrompts();
  const from = useFromHere();

  return (
    <Page
      title="Journal"
      backTo={backTo}
      action={<CustomizeButton editing={editing} onToggle={() => setEditing(!editing)} />}
    >
      {editing ? (
        prompts && <PromptEditor kind="day" prompts={prompts} />
      ) : (
        <>
          <DayNavigator date={date} today={today} onChange={setDate} />
          {entry !== undefined && prompts && (
            <JournalEditor key={date} kind="day" date={date} entry={entry} prompts={prompts} />
          )}
          <LinkRow
            to={withDate(REFLECTION_PATH, date, today)}
            state={from}
            label="Wochenreflexion"
            hint="Rückblick auf die Woche mit festen Fragen"
          />
          <LinkRow
            to={withDate(JOURNAL_HISTORY_PATH, date, today)}
            state={from}
            label="Alle Einträge"
            hint="Durchsuchen und nachlesen"
          />
        </>
      )}
    </Page>
  );
}
