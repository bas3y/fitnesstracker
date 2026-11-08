import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '../../components/icons';
import { Page } from '../../components/Page';
import { shiftDay } from '../../domain/daily';
import { weekRange } from '../../domain/endurance';
import { formatPeriod } from '../../domain/periods';
import { useDayBackTo, useDayParam } from '../daily/useDaily';
import { JournalEditor } from './JournalEditor';
import { CustomizeButton, PromptEditor } from './PromptEditor';
import { useJournalEntry, useJournalPrompts } from './useSelf';

const weekButton =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface text-xl font-semibold active:bg-page disabled:opacity-40';

/** Wochenreflexion je Kalenderwoche (der gewählte Tag bestimmt die Woche) */
export function ReflectionPage() {
  const { date, today, setDate } = useDayParam();
  const backTo = useDayBackTo(date, today);
  const [editing, setEditing] = useState(false);
  const range = weekRange(date);
  const entry = useJournalEntry('week', date);
  const prompts = useJournalPrompts();
  const current = range.to >= today;
  const nextWeek = shiftDay(range.from, 7);

  return (
    <Page
      title="Wochenreflexion"
      backTo={backTo}
      action={<CustomizeButton editing={editing} onToggle={() => setEditing(!editing)} />}
    >
      {editing ? (
        prompts && <PromptEditor kind="week" prompts={prompts} />
      ) : (
        <>
          <div className="mb-4 flex items-center gap-2">
            <button
              type="button"
              aria-label="Vorherige Woche"
              className={weekButton}
              onClick={() => setDate(shiftDay(range.from, -7))}
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <h2 className="min-w-0 flex-1 text-center text-lg font-semibold">
              {current ? 'Diese Woche' : formatPeriod('week', range)}
              {current && (
                <span className="block text-sm font-normal text-muted">
                  {formatPeriod('week', range)}
                </span>
              )}
            </h2>
            <button
              type="button"
              aria-label="Nächste Woche"
              className={weekButton}
              disabled={current}
              onClick={() => setDate(nextWeek > today ? today : nextWeek)}
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
          {entry !== undefined && prompts && (
            <JournalEditor
              key={range.from}
              kind="week"
              date={range.from}
              entry={entry}
              prompts={prompts}
            />
          )}
        </>
      )}
    </Page>
  );
}
