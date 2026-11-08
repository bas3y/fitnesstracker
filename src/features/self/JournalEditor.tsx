import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { inputField } from '../../components/buttons';
import { Card } from '../../components/Page';
import { saveJournalEntry } from '../../db/journal';
import { EMPTY_JOURNAL_VALUES, MAX_GRATITUDE_LENGTH, type JournalValues } from '../../db/schemas';
import type { DayKey, JournalEntry, JournalKind, JournalPrompt } from '../../db/types';
import { gratitudeSlots, promptsForEntry, WEEKLY_QUESTIONS } from '../../domain/journal';
import { RatingPicker } from '../daily/RatingPicker';

const SAVE_DELAY_MS = 600;
const HINT = 'text-sm text-muted';

function toValues(entry: JournalEntry | null): JournalValues {
  if (!entry) return { ...EMPTY_JOURNAL_VALUES, gratitude: gratitudeSlots([]) };
  const { text, gratitude, answers, rating } = entry;
  return { text, gratitude: gratitudeSlots(gratitude), answers, rating };
}

type SaveState = 'idle' | 'pending' | 'saved' | 'error';

/**
 * Speichert beim Tippen nach einer kurzen Pause, beim Verlassen der Seite und wenn die App in den
 * Hintergrund geht. Nur einmal je Tag/Woche rendern (`key`), danach gilt der eigene Stand.
 */
function useAutoSave(kind: JournalKind, date: DayKey) {
  const pending = useRef<JournalValues | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const [state, setState] = useState<SaveState>('idle');

  const flush = useCallback(() => {
    window.clearTimeout(timer.current);
    const values = pending.current;
    if (!values) return;
    pending.current = null;
    saveJournalEntry(kind, date, values).then(
      () => setState((current) => (current === 'pending' && pending.current ? current : 'saved')),
      () => setState('error'),
    );
  }, [kind, date]);

  const schedule = useCallback(
    (values: JournalValues, immediately = false) => {
      pending.current = values;
      setState('pending');
      window.clearTimeout(timer.current);
      if (immediately) flush();
      else timer.current = window.setTimeout(flush, SAVE_DELAY_MS);
    },
    [flush],
  );

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [flush]);

  return { state, schedule, flush };
}

function TextField({
  label,
  value,
  placeholder,
  rows = 3,
  maxLength,
  onChange,
  onBlur,
}: {
  label: string;
  value: string;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  onChange: (value: string) => void;
  onBlur: () => void;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        className={`${inputField} h-auto py-2`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
      />
    </div>
  );
}

/** Tagebuch bzw. Wochenreflexion eines Tages/einer Woche */
export function JournalEditor({
  kind,
  date,
  entry,
  prompts,
}: {
  kind: JournalKind;
  date: DayKey;
  entry: JournalEntry | null;
  prompts: readonly JournalPrompt[];
}) {
  const [values, setValues] = useState(() => toValues(entry));
  const { state, schedule, flush } = useAutoSave(kind, date);
  // Fragen beim Öffnen festhalten: Eine gerade geleerte Antwort einer entfernten Frage bleibt stehen
  const [visible] = useState(() => promptsForEntry(prompts, kind, entry));

  const change = (next: JournalValues, immediately = false) => {
    setValues(next);
    schedule(next, immediately);
  };
  const answer = (key: string, value: string) =>
    change({ ...values, answers: { ...values.answers, [key]: value } });

  const promptFields = visible.map((prompt) => (
    <TextField
      key={prompt.id}
      label={prompt.archivedAt ? `${prompt.text} (entfernte Frage)` : prompt.text}
      value={values.answers[prompt.id] ?? ''}
      onChange={(value) => answer(prompt.id, value)}
      onBlur={flush}
    />
  ));

  return (
    <>
      {kind === 'day' ? (
        <>
          <Card>
            <TextField
              label="Wie war dein Tag?"
              rows={6}
              placeholder="Gedanken, Erlebnisse, Ideen …"
              value={values.text}
              onChange={(text) => change({ ...values, text })}
              onBlur={flush}
            />
          </Card>
          <Card title="Dankbar für">
            <div className="flex flex-col gap-2">
              {values.gratitude.map((item, index) => (
                <input
                  key={index}
                  aria-label={`Dankbar für ${index + 1}`}
                  placeholder={`${index + 1}.`}
                  maxLength={MAX_GRATITUDE_LENGTH}
                  className={inputField}
                  value={item}
                  onChange={(event) => {
                    const gratitude = [...values.gratitude];
                    gratitude[index] = event.target.value;
                    change({ ...values, gratitude });
                  }}
                  onBlur={flush}
                />
              ))}
            </div>
          </Card>
          {promptFields.length > 0 && (
            <Card title="Eigene Fragen">
              <div className="flex flex-col gap-4">{promptFields}</div>
            </Card>
          )}
        </>
      ) : (
        <>
          <Card>
            <RatingPicker
              label="Wie war die Woche?"
              low="schlecht"
              high="super"
              value={values.rating}
              onChange={(rating) => change({ ...values, rating }, true)}
            />
          </Card>
          <Card title="Fragen">
            <div className="flex flex-col gap-4">
              {WEEKLY_QUESTIONS.map((question) => (
                <TextField
                  key={question.key}
                  label={question.text}
                  value={values.answers[question.key] ?? ''}
                  onChange={(value) => answer(question.key, value)}
                  onBlur={flush}
                />
              ))}
              {promptFields}
              <TextField
                label="Notizen"
                value={values.text}
                onChange={(text) => change({ ...values, text })}
                onBlur={flush}
              />
            </div>
          </Card>
        </>
      )}
      <p role="status" aria-live="polite" className={`mb-4 text-center ${HINT}`}>
        {state === 'pending'
          ? 'Wird gespeichert …'
          : state === 'saved'
            ? 'Gespeichert'
            : state === 'error'
              ? 'Konnte nicht gespeichert werden'
              : 'Wird automatisch gespeichert'}
      </p>
    </>
  );
}
