import { useState } from 'react';
import { Link } from 'react-router-dom';
import { primaryButton, secondaryButton } from '../../components/buttons';
import { Details } from '../../components/Details';
import { Card, LinkRow, Page } from '../../components/Page';
import { Select } from '../../components/Select';
import { setReadingHabit } from '../../db/reading';
import type { Book, DayKey, ReadingLog, Settings } from '../../db/types';
import { formatDayLabel } from '../../domain/daily';
import { weekRange } from '../../domain/endurance';
import { formatGoalDate } from '../../domain/goals';
import {
  bookLabel,
  bookProgress,
  formatBookProgress,
  formatPages,
  groupBooks,
  pagesInRange,
  pagesOn,
} from '../../domain/reading';
import { GoalBar } from '../daily/GoalBar';
import { useDayBackTo, useDayParam } from '../daily/useDaily';
import { useHabits } from '../daily/useHabits';
import { useSettings } from '../settings/useSettings';
import { bookPath, NEW_BOOK_PATH } from './paths';
import { ReadingLogDialog } from './ReadingLogDialog';
import { useBooks, useReadingLogs } from './useSelf';

const HINT = 'text-sm text-muted';

/** Lese-Log: aktuelle Bücher mit Fortschritt, Leseliste, gelesene Bücher */
export function ReadingPage() {
  const { date, today } = useDayParam();
  const backTo = useDayBackTo(date, today);
  const books = useBooks();
  const logs = useReadingLogs();
  const settings = useSettings();
  const [logging, setLogging] = useState<Book | null>(null);

  if (!books || !logs)
    return (
      <Page title="Lesen" backTo={backTo}>
        {null}
      </Page>
    );
  const groups = groupBooks(books);
  const logsOf = (book: Book) => logs.filter((log) => log.bookId === book.id);
  const finishedHint = (book: Book) =>
    [
      book.author,
      book.finishedOn ? formatGoalDate(book.finishedOn) : null,
      book.rating ? '★'.repeat(book.rating) : null,
    ]
      .filter(Boolean)
      .join(' · ');

  return (
    <Page title="Lesen" backTo={backTo}>
      <Summary logs={logs} date={date} today={today} />

      <h2 className="mb-2 text-lg font-semibold">Lese ich gerade</h2>
      {groups.reading.length === 0 ? (
        <Card>
          <p className={HINT}>Kein Buch angefangen.</p>
        </Card>
      ) : (
        <ul aria-label="Lese ich gerade">
          {groups.reading.map((book) => (
            <CurrentBook
              key={book.id}
              book={book}
              logs={logsOf(book)}
              onLog={() => setLogging(book)}
            />
          ))}
        </ul>
      )}
      <Link to={NEW_BOOK_PATH} className={`${primaryButton} mb-4`}>
        + Buch hinzufügen
      </Link>

      {groups.want.length > 0 && (
        <section aria-labelledby="want-heading">
          <h2 id="want-heading" className="mb-2 text-lg font-semibold">
            Will ich lesen
          </h2>
          {groups.want.map((book) => (
            <LinkRow key={book.id} to={bookPath(book.id)} label={book.title} hint={book.author} />
          ))}
        </section>
      )}
      {groups.finished.length > 0 && (
        <section aria-labelledby="finished-heading" className="mt-4">
          <h2 id="finished-heading" className="mb-2 text-lg font-semibold">
            Gelesen ({groups.finished.length})
          </h2>
          {groups.finished.map((book) => (
            <LinkRow
              key={book.id}
              to={bookPath(book.id)}
              label={book.title}
              hint={finishedHint(book)}
            />
          ))}
        </section>
      )}
      {groups.abandoned.length > 0 && (
        <div className="mt-4">
          <Details summary={`Abgebrochen (${groups.abandoned.length})`}>
            {groups.abandoned.map((book) => (
              <LinkRow key={book.id} to={bookPath(book.id)} label={book.title} hint={book.author} />
            ))}
          </Details>
        </div>
      )}

      {settings && <HabitLink settings={settings} />}

      {logging && (
        <ReadingLogDialog
          book={logging}
          progress={bookProgress(logging, logsOf(logging))}
          date={date}
          today={today}
          onClose={() => setLogging(null)}
        />
      )}
    </Page>
  );
}

function Summary({ logs, date, today }: { logs: ReadingLog[]; date: DayKey; today: DayKey }) {
  const day = pagesOn(logs, date);
  const week = pagesInRange(logs, weekRange(date));
  return (
    <Card>
      <dl className="grid grid-cols-2 gap-3">
        <div>
          <dt className={HINT}>{formatDayLabel(date, today)}</dt>
          <dd className="text-xl font-semibold tabular-nums">{formatPages(day)}</dd>
        </div>
        <div>
          <dt className={HINT}>{date === today ? 'Diese Woche' : 'In der Woche'}</dt>
          <dd className="text-xl font-semibold tabular-nums">{formatPages(week)}</dd>
        </div>
      </dl>
    </Card>
  );
}

function CurrentBook({ book, logs, onLog }: { book: Book; logs: ReadingLog[]; onLog: () => void }) {
  const progress = bookProgress(book, logs);
  return (
    <li className="mb-3 rounded-2xl bg-surface p-4">
      <Link to={bookPath(book.id)} className="mb-2 block">
        <span className="block font-semibold">{book.title}</span>
        {book.author && <span className={`block ${HINT}`}>{book.author}</span>}
        <span className={`mt-1 block tabular-nums ${HINT}`}>
          {formatBookProgress(book, progress)}
        </span>
      </Link>
      {book.totalPages !== null && (
        <div className="mb-3">
          <GoalBar
            label={`Fortschritt ${book.title}`}
            value={progress.currentPage}
            goal={book.totalPages}
          />
        </div>
      )}
      <button
        type="button"
        className={secondaryButton}
        aria-label={`Seiten eintragen: ${bookLabel(book)}`}
        onClick={onLog}
      >
        Seiten eintragen
      </button>
    </li>
  );
}

/** Zähl-Gewohnheit, bei der gelesene Seiten automatisch mitgezählt werden */
function HabitLink({ settings }: { settings: Settings }) {
  const habits = useHabits();
  if (!habits) return null;
  const counting = habits
    .map(({ habit }) => habit)
    .filter((habit) => habit.kind === 'count' && habit.archivedAt === null);
  const linked = counting.some((habit) => habit.id === settings.readingHabitId)
    ? settings.readingHabitId
    : null;
  const labels = Object.fromEntries(
    counting.map((habit) => [habit.id, `${habit.name}${habit.unit ? ` (${habit.unit})` : ''}`]),
  );
  return (
    <Card title="Mit Gewohnheit verknüpfen">
      {counting.length === 0 ? (
        <p className={HINT}>
          Lege eine Gewohnheit mit der Art „Zählen“ an (z. B. Lesen, Einheit Seiten), dann zählen
          eingetragene Seiten dort automatisch mit.
        </p>
      ) : (
        <>
          <Select
            label="Seiten zählen auch bei"
            value={linked}
            options={counting.map((habit) => habit.id)}
            labels={labels}
            emptyLabel="Keiner Gewohnheit"
            onChange={(habitId) => void setReadingHabit(habitId)}
          />
          <p className={`mt-2 ${HINT}`}>
            Neu eingetragene Seiten werden bei der Gewohnheit addiert, gelöschte wieder abgezogen.
          </p>
        </>
      )}
    </Card>
  );
}
