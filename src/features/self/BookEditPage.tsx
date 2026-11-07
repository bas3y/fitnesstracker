import { useId, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { dangerButton, inputField, primaryButton, secondaryButton } from '../../components/buttons';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Card, Page } from '../../components/Page';
import { Select } from '../../components/Select';
import { Stepper } from '../../components/Stepper';
import { createBook, deleteBook, updateBook } from '../../db/reading';
import { bookInputSchema, emptyBookInput, MAX_BOOK_PAGES, type BookInput } from '../../db/schemas';
import { BOOK_STATUSES, type Book, type BookStatus, type DayKey } from '../../db/types';
import { BOOK_STATUS_LABELS } from '../../domain/labels';
import { RatingPicker } from '../daily/RatingPicker';
import { useDayParam } from '../daily/useDaily';
import { bookPath, READING_PATH } from './paths';
import { useBook } from './useSelf';

const LABEL = 'mb-1 block text-sm font-medium';
const HINT = 'text-sm text-slate-500 dark:text-slate-400';

export function BookCreatePage() {
  const navigate = useNavigate();
  const { today } = useDayParam();
  return (
    <Page title="Neues Buch" backTo={READING_PATH}>
      <BookForm
        initial={emptyBookInput(today)}
        today={today}
        submitLabel="Hinzufügen"
        onSubmit={async (input) => {
          await createBook(input);
          navigate(READING_PATH, { replace: true });
        }}
        onCancel={() => navigate(READING_PATH)}
      />
    </Page>
  );
}

export function BookEditPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { today } = useDayParam();
  const book = useBook(id);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const detail = bookPath(id);

  if (book === undefined) return <Page title="Buch bearbeiten">{null}</Page>;
  if (book === null) {
    return (
      <Page title="Buch bearbeiten" backTo={READING_PATH}>
        <Card>
          <p className={HINT}>Dieses Buch gibt es nicht mehr.</p>
        </Card>
      </Page>
    );
  }
  return (
    <Page title="Buch bearbeiten" backTo={detail}>
      <BookForm
        initial={toInput(book)}
        today={today}
        submitLabel="Speichern"
        onSubmit={async (input) => {
          await updateBook(book.id, input);
          navigate(detail, { replace: true });
        }}
        onCancel={() => navigate(detail)}
      />
      <button
        type="button"
        className={`${dangerButton} mb-4`}
        onClick={() => setConfirmDelete(true)}
      >
        Buch löschen
      </button>
      {confirmDelete && (
        <ConfirmDialog
          title="Buch löschen?"
          confirmLabel="Löschen"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={async () => {
            await deleteBook(book.id);
            navigate(READING_PATH, { replace: true });
          }}
        >
          „{book.title}“ wird samt eingetragener Seiten und Notizen gelöscht. Bei einer verknüpften
          Gewohnheit werden die Seiten wieder abgezogen.
        </ConfirmDialog>
      )}
    </Page>
  );
}

function toInput(book: Book): BookInput {
  const { title, author, totalPages, status, startPage, startedOn, finishedOn, rating } = book;
  return { title, author, totalPages, status, startPage, startedOn, finishedOn, rating };
}

function BookForm({
  initial,
  today,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: BookInput;
  today: DayKey;
  submitLabel: string;
  onSubmit: (input: BookInput) => Promise<void>;
  onCancel: () => void;
}) {
  const titleId = useId();
  const authorId = useId();
  const [input, setInput] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const change = (changes: Partial<BookInput>) => {
    setInput({ ...input, ...changes });
    setError(null);
  };
  const changeStatus = (status: BookStatus) => {
    const done = status === 'finished' || status === 'abandoned';
    change({
      status,
      startedOn: status === 'want' ? null : (input.startedOn ?? today),
      finishedOn: done ? (input.finishedOn ?? today) : null,
    });
  };
  const done = input.status === 'finished' || input.status === 'abandoned';

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const result = bookInputSchema.safeParse(input);
    if (result.success) await onSubmit(input);
    else setError(result.error.issues[0]?.message ?? 'Eingabe prüfen');
  };

  const dateField = (
    label: string,
    value: DayKey | null | undefined,
    key: 'startedOn' | 'finishedOn',
  ) => (
    <label className={LABEL}>
      {label}
      <input
        type="date"
        className={`${inputField} mt-1 font-normal`}
        max={today}
        value={value ?? ''}
        onChange={(event) => change({ [key]: event.target.value || null })}
      />
    </label>
  );

  return (
    <form onSubmit={(event) => void submit(event)}>
      <Card>
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor={titleId} className={LABEL}>
              Titel
            </label>
            <input
              id={titleId}
              className={inputField}
              maxLength={200}
              value={input.title}
              onChange={(event) => change({ title: event.target.value })}
            />
          </div>
          <div>
            <label htmlFor={authorId} className={LABEL}>
              Autor (optional)
            </label>
            <input
              id={authorId}
              className={inputField}
              maxLength={120}
              value={input.author}
              onChange={(event) => change({ author: event.target.value })}
            />
          </div>
          <Stepper
            label="Seitenzahl (optional)"
            value={input.totalPages ?? null}
            step={10}
            min={1}
            max={MAX_BOOK_PAGES}
            decimals={0}
            startValue={250}
            allowEmpty
            onChange={(totalPages) => change({ totalPages })}
          />
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-4">
          <Select
            label="Status"
            value={input.status}
            options={BOOK_STATUSES}
            labels={BOOK_STATUS_LABELS}
            onChange={(status) => status && changeStatus(status)}
          />
          {input.status !== 'want' && (
            <>
              <Stepper
                label="Vorher schon gelesen bis Seite"
                value={input.startPage ?? 0}
                step={10}
                max={input.totalPages ?? MAX_BOOK_PAGES}
                decimals={0}
                onChange={(startPage) => change({ startPage: startPage ?? 0 })}
              />
              <p className={HINT}>
                Für Bücher, die du schon vor der App angefangen hast. Diese Seiten zählen nicht zu
                Zielen.
              </p>
              {dateField('Begonnen am', input.startedOn, 'startedOn')}
            </>
          )}
          {done &&
            dateField(
              input.status === 'abandoned' ? 'Abgebrochen am' : 'Gelesen am',
              input.finishedOn,
              'finishedOn',
            )}
          {input.status === 'finished' && (
            <RatingPicker
              label="Bewertung"
              low="schwach"
              high="großartig"
              value={input.rating ?? null}
              onChange={(rating) => change({ rating })}
            />
          )}
        </div>
      </Card>

      {error && (
        <p role="alert" className="mb-3 text-sm font-medium text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
      <div className="mb-4 flex gap-2">
        <button type="button" className={secondaryButton} onClick={onCancel}>
          Abbrechen
        </button>
        <button type="submit" className={primaryButton}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
