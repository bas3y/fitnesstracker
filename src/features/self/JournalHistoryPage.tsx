import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFromHere } from '../../components/backNavigation';
import { Card, Page } from '../../components/Page';
import { SearchInput } from '../../components/SearchInput';
import { formatDayLabel } from '../../domain/daily';
import { weekRange } from '../../domain/endurance';
import { journalTexts, searchJournal } from '../../domain/journal';
import { formatPeriod } from '../../domain/periods';
import { withDate } from '../daily/paths';
import { useDayBackTo, useDayParam } from '../daily/useDaily';
import { JOURNAL_PATH, REFLECTION_PATH } from './paths';
import { useJournalEntries, useJournalPrompts } from './useSelf';

const HINT = 'text-sm text-muted';
const SHOWN = 100;

/** Alle Journal-Einträge und Wochenreflexionen, neueste zuerst, mit Suche */
export function JournalHistoryPage() {
  const { date, today } = useDayParam();
  const backTo = useDayBackTo(date, today, JOURNAL_PATH);
  const from = useFromHere();
  const entries = useJournalEntries();
  const prompts = useJournalPrompts();
  const [query, setQuery] = useState('');

  const promptMap = useMemo(
    () => new Map((prompts ?? []).map((prompt) => [prompt.id, prompt])),
    [prompts],
  );
  const found = useMemo(
    () => (entries ? searchJournal(entries, query, promptMap) : []),
    [entries, query, promptMap],
  );

  return (
    <Page title="Alle Einträge" backTo={backTo}>
      <SearchInput
        label="Journal durchsuchen"
        placeholder="Suchen …"
        value={query}
        onChange={setQuery}
      />
      {entries &&
        (found.length === 0 ? (
          <Card>
            <p className={HINT}>
              {entries.length === 0 ? 'Noch keine Einträge.' : 'Keine Einträge gefunden.'}
            </p>
          </Card>
        ) : (
          <ul aria-label="Einträge">
            {found.slice(0, SHOWN).map((entry) => {
              const week = entry.kind === 'week';
              const texts = journalTexts(entry, promptMap);
              return (
                <li key={entry.id} className="mb-2">
                  <Link
                    to={withDate(week ? REFLECTION_PATH : JOURNAL_PATH, entry.date, today)}
                    state={from}
                    className="block rounded-2xl bg-surface p-4 active:bg-page"
                  >
                    <span className="block font-semibold">
                      {week
                        ? `🪞 ${formatPeriod('week', weekRange(entry.date))}`
                        : `📓 ${formatDayLabel(entry.date, today)}`}
                      {week && entry.rating !== null && (
                        <span className={`ml-2 font-normal ${HINT}`}>
                          Bewertung {entry.rating}/5
                        </span>
                      )}
                    </span>
                    {texts.length > 0 && (
                      <span className={`mt-1 line-clamp-3 block whitespace-pre-line ${HINT}`}>
                        {texts.join('\n')}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        ))}
      {found.length > SHOWN && (
        <p className={`mb-4 text-center ${HINT}`}>
          Die neuesten {SHOWN} von {found.length} Einträgen. Die Suche grenzt weiter ein.
        </p>
      )}
    </Page>
  );
}
