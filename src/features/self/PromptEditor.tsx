import { useState } from 'react';
import { inputField, primaryButton } from '../../components/buttons';
import { DeleteRowButton } from '../../components/DeleteRowButton';
import { Card } from '../../components/Page';
import { SortableList } from '../../components/SortableList';
import {
  addJournalPrompt,
  removeJournalPrompt,
  renameJournalPrompt,
  reorderJournalPrompts,
} from '../../db/journal';
import { journalPromptTextSchema, MAX_JOURNAL_PROMPTS } from '../../db/schemas';
import type { JournalKind, JournalPrompt } from '../../db/types';
import { activePrompts } from '../../domain/journal';

const HINT = 'text-sm text-muted';

const SUGGESTIONS: Record<JournalKind, string[]> = {
  day: [
    'Was habe ich heute gelernt?',
    'Was hat mir Energie gegeben?',
    'Worauf freue ich mich morgen?',
    'Was hätte heute besser laufen können?',
  ],
  week: [
    'Worauf bin ich stolz?',
    'Was hat mich Energie gekostet?',
    'Wofür war ich diese Woche dankbar?',
  ],
};

/** „Anpassen“: eigene Fragen anlegen, umbenennen, sortieren, entfernen */
export function PromptEditor({
  kind,
  prompts,
}: {
  kind: JournalKind;
  prompts: readonly JournalPrompt[];
}) {
  const active = activePrompts(prompts, kind);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const full = active.length >= MAX_JOURNAL_PROMPTS;
  const suggestions = SUGGESTIONS[kind].filter(
    (text) => !active.some((prompt) => prompt.text === text),
  );

  const add = async (text: string) => {
    const parsed = journalPromptTextSchema.safeParse(text);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Ungültige Frage');
      return;
    }
    setError(null);
    await addJournalPrompt(kind, parsed.data);
    setDraft('');
  };

  return (
    <>
      <p className={`mb-3 ${HINT}`}>
        {kind === 'day'
          ? 'Eigene Fragen stehen unter Freitext und Dankbarkeit.'
          : 'Eigene Fragen stehen unter den festen Fragen der Wochenreflexion.'}{' '}
        Entfernte Fragen bleiben bei alten Einträgen sichtbar.
      </p>
      {active.length === 0 ? (
        <p className={`mb-3 ${HINT}`}>Noch keine eigenen Fragen.</p>
      ) : (
        <SortableList
          label="Eigene Fragen"
          items={active.map((prompt) => ({ id: prompt.id, name: prompt.text }))}
          onReorder={reorderJournalPrompts}
          renderItem={({ id }, { handle }) => {
            const prompt = active.find((item) => item.id === id)!;
            return (
              <div className="mb-2 flex min-h-14 items-center gap-1 rounded-2xl bg-surface">
                {handle ?? <span className="w-3 shrink-0" />}
                <PromptName prompt={prompt} />
                <DeleteRowButton
                  name={prompt.text}
                  verb="entfernen"
                  onClick={() => void removeJournalPrompt(prompt.id)}
                />
              </div>
            );
          }}
        />
      )}
      <Card title="Neue Frage">
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void add(draft);
          }}
        >
          <input
            aria-label="Neue Frage"
            placeholder="z. B. Was habe ich heute gelernt?"
            className={inputField}
            value={draft}
            disabled={full}
            onChange={(event) => setDraft(event.target.value)}
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <button type="submit" className={primaryButton} disabled={full}>
            Frage hinzufügen
          </button>
          {full && <p className={HINT}>Höchstens {MAX_JOURNAL_PROMPTS} eigene Fragen.</p>}
        </form>
        {suggestions.length > 0 && !full && (
          <div className="mt-4">
            <p className={`mb-2 ${HINT}`}>Vorschläge</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((text) => (
                <button
                  key={text}
                  type="button"
                  className="inline-flex min-h-11 items-center rounded-full border border-line-strong bg-surface px-4 text-left text-sm font-medium text-fg"
                  onClick={() => void add(text)}
                >
                  + {text}
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>
    </>
  );
}

/** Umbenennen direkt in der Zeile, gespeichert beim Verlassen des Felds */
function PromptName({ prompt }: { prompt: JournalPrompt }) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <input
      aria-label={`Frage: ${prompt.text}`}
      className="h-11 min-w-0 flex-1 rounded-xl bg-transparent px-2 text-base font-medium focus:bg-page"
      value={draft ?? prompt.text}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        const parsed = journalPromptTextSchema.safeParse(draft ?? '');
        if (draft !== null && parsed.success && parsed.data !== prompt.text) {
          void renameJournalPrompt(prompt.id, parsed.data);
        }
        setDraft(null);
      }}
    />
  );
}

/** Schaltet zwischen Inhalt und „Anpassen“ um (Kopfzeile der Seite) */
export function CustomizeButton({ editing, onToggle }: { editing: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className="min-h-11 shrink-0 rounded-xl border border-line-strong px-3 text-sm font-semibold"
      onClick={onToggle}
    >
      {editing ? 'Fertig' : 'Anpassen'}
    </button>
  );
}
