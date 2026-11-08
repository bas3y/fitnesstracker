import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useBackTo } from '../../components/backNavigation';
import { inputField, primaryButton, secondaryButton } from '../../components/buttons';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DeleteRowButton } from '../../components/DeleteRowButton';
import { Icon } from '../../components/icons';
import { Card, HEADER_ICON_BUTTON, Page } from '../../components/Page';
import {
  addBookNote,
  deleteBookNote,
  deleteReadingLog,
  setBookRating,
  setBookStatus,
} from '../../db/reading';
import { bookNoteInputSchema, MAX_BOOK_PAGES } from '../../db/schemas';
import type { Book, BookStatus, DayKey, ReadingLog } from '../../db/types';
import { formatDayLabel } from '../../domain/daily';
import { parseDecimal } from '../../domain/format';
import { formatGoalDate } from '../../domain/goals';
import { BOOK_STATUS_LABELS } from '../../domain/labels';
import { bookProgress, formatBookProgress, formatPages } from '../../domain/reading';
import { toDateInput } from '../../domain/workout';
import { GoalBar } from '../daily/GoalBar';
import { RatingPicker } from '../daily/RatingPicker';
import { useDayParam } from '../daily/useDaily';
import { bookEditPath, READING_PATH } from './paths';
import { ReadingLogDialog } from './ReadingLogDialog';
import { useBook, useBookLogs, useBookNotes } from './useSelf';

const HINT = 'text-sm text-muted';

export function BookPage() {
  const { id = '' } = useParams();
  const book = useBook(id);
  const logs = useBookLogs(id);
  const backTo = useBackTo(READING_PATH);

  if (book === null) return <Navigate to={READING_PATH} replace />;
  if (!book || !logs)
    return (
      <Page title="Buch" backTo={backTo}>
        {null}
      </Page>
    );
  return <BookDetail book={book} logs={logs} backTo={backTo} />;
}

function BookDetail({ book, logs, backTo }: { book: Book; logs: ReadingLog[]; backTo: string }) {
  const { today } = useDayParam();
  const [logging, setLogging] = useState(false);
  const progress = bookProgress(book, logs);
  const status = (next: BookStatus) => void setBookStatus(book.id, next, today);

  const dates = [
    book.startedOn ? `Begonnen ${formatGoalDate(book.startedOn)}` : null,
    book.finishedOn
      ? `${book.status === 'abandoned' ? 'Abgebrochen' : 'Beendet'} ${formatGoalDate(book.finishedOn)}`
      : null,
  ].filter(Boolean);

  return (
    <Page
      title={book.title}
      backTo={backTo}
      action={
        <Link
          to={bookEditPath(book.id)}
          aria-label="Bearbeiten"
          title="Bearbeiten"
          className={HEADER_ICON_BUTTON}
        >
          <Icon name="pen" />
        </Link>
      }
    >
      <Card>
        {book.author && <p className="mb-1 font-medium">{book.author}</p>}
        <p className={`mb-1 ${HINT}`} data-testid="book-status">
          {BOOK_STATUS_LABELS[book.status]}
          {dates.length > 0 && ` · ${dates.join(' · ')}`}
        </p>
        {book.status !== 'want' && (
          <p className="mb-2 tabular-nums">{formatBookProgress(book, progress)}</p>
        )}
        {book.totalPages !== null && book.status !== 'want' && (
          <div className="mb-3">
            <GoalBar label="Fortschritt" value={progress.currentPage} goal={book.totalPages} />
          </div>
        )}
        <div className="flex flex-col gap-2">
          {book.status === 'reading' && (
            <>
              <button type="button" className={primaryButton} onClick={() => setLogging(true)}>
                Seiten eintragen
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={secondaryButton}
                  onClick={() => status('finished')}
                >
                  Gelesen
                </button>
                <button
                  type="button"
                  className={secondaryButton}
                  onClick={() => status('abandoned')}
                >
                  Abbrechen
                </button>
              </div>
            </>
          )}
          {book.status === 'want' && (
            <button type="button" className={primaryButton} onClick={() => status('reading')}>
              Jetzt beginnen
            </button>
          )}
          {(book.status === 'finished' || book.status === 'abandoned') && (
            <button type="button" className={secondaryButton} onClick={() => status('reading')}>
              {book.status === 'finished' ? 'Wieder auf „Lese ich“' : 'Weiterlesen'}
            </button>
          )}
        </div>
        {book.status === 'finished' && (
          <div className="mt-4">
            <RatingPicker
              label="Bewertung"
              low="schwach"
              high="großartig"
              value={book.rating}
              onChange={(rating) => void setBookRating(book.id, rating)}
            />
          </div>
        )}
      </Card>

      <NotesCard book={book} />
      <LogsCard logs={logs} today={today} />

      {logging && (
        <ReadingLogDialog
          book={book}
          progress={progress}
          date={today}
          today={today}
          onClose={() => setLogging(false)}
        />
      )}
    </Page>
  );
}

function NotesCard({ book }: { book: Book }) {
  const notes = useBookNotes(book.id);
  const [text, setText] = useState('');
  const [page, setPage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const add = async () => {
    const pageNumber = page.trim() === '' ? null : parseDecimal(page);
    const parsed = bookNoteInputSchema.safeParse({ text, page: pageNumber });
    if (!parsed.success || (page.trim() !== '' && pageNumber === null)) {
      setError(parsed.error?.issues[0]?.message ?? 'Ungültige Seite');
      return;
    }
    setError(null);
    await addBookNote(book.id, parsed.data);
    setText('');
    setPage('');
  };

  return (
    <Card title="Notizen & Zitate">
      <form
        className="flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void add();
        }}
      >
        <textarea
          aria-label="Neue Notiz"
          rows={3}
          placeholder="Gedanke oder Zitat …"
          className={`${inputField} h-auto py-2`}
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <div className="flex gap-2">
          <input
            aria-label="Seite (optional)"
            inputMode="numeric"
            placeholder="Seite"
            maxLength={String(MAX_BOOK_PAGES).length}
            className={`${inputField} max-w-24`}
            value={page}
            onChange={(event) => setPage(event.target.value)}
          />
          <button type="submit" className={primaryButton}>
            Notiz speichern
          </button>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
      </form>
      {notes && notes.length > 0 && (
        <ul aria-label="Notizen" className="mt-4 flex flex-col gap-2">
          {notes.map((note) => (
            <li key={note.id} className="flex items-start gap-1 rounded-xl bg-page py-2 pl-3">
              <span className="min-w-0 flex-1">
                <span className="block whitespace-pre-line">{note.text}</span>
                <span className={HINT}>
                  {note.page !== null && `S. ${note.page} · `}
                  {formatGoalDate(toDateInput(note.createdAt))}
                </span>
              </span>
              <DeleteRowButton
                name={`Notiz ${note.text.slice(0, 30)}`}
                onClick={() => void deleteBookNote(note.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function LogsCard({ logs, today }: { logs: ReadingLog[]; today: DayKey }) {
  const [confirm, setConfirm] = useState<ReadingLog | null>(null);
  if (logs.length === 0) return null;
  const newest = [...logs].reverse();
  return (
    <Card title="Verlauf">
      <ul aria-label="Gelesene Seiten">
        {newest.map((log) => (
          <li
            key={log.id}
            className="flex min-h-11 items-center justify-between gap-2 border-b border-line last:border-0"
          >
            <span>
              {formatDayLabel(log.date, today)}
              <span className={`ml-2 tabular-nums ${HINT}`}>{formatPages(log.pages)}</span>
            </span>
            <DeleteRowButton
              name={`Eintrag ${formatDayLabel(log.date, today)}, ${formatPages(log.pages)}`}
              onClick={() => setConfirm(log)}
            />
          </li>
        ))}
      </ul>
      {confirm && (
        <ConfirmDialog
          title="Eintrag löschen?"
          confirmLabel="Löschen"
          onCancel={() => setConfirm(null)}
          onConfirm={async () => {
            await deleteReadingLog(confirm.id);
            setConfirm(null);
          }}
        >
          {formatPages(confirm.pages)} vom {formatGoalDate(confirm.date)} werden entfernt (auch bei
          einer verknüpften Gewohnheit).
        </ConfirmDialog>
      )}
    </Card>
  );
}
