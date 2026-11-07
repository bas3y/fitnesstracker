import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { DayKey } from '../../db/types';
import { journalDate, journalDayStatus, reflectionProgress } from '../../domain/journal';
import {
  bookProgress,
  formatBookProgress,
  formatPages,
  groupBooks,
  pagesOn,
} from '../../domain/reading';
import { withDate } from '../daily/paths';
import { JOURNAL_PATH, READING_PATH, REFLECTION_PATH } from './paths';
import { useBooks, useJournalEntry, useJournalPrompts, useReadingLogs } from './useSelf';

const MUTED = 'block text-sm text-slate-500 dark:text-slate-400';

/** Große Kachel unter den Alltag-Kacheln: Journal, Wochenreflexion, Lesen für den gewählten Tag */
export function SelfSection({ date, today }: { date: DayKey; today: DayKey }) {
  return (
    <section aria-labelledby="self-heading" className="mb-4">
      <h2 id="self-heading" className="mb-2 text-lg font-semibold">
        🌱 Persönliche Entwicklung
      </h2>
      <ul
        aria-label="Persönliche Entwicklung"
        className="divide-y divide-slate-100 rounded-2xl bg-white shadow-sm dark:divide-slate-700 dark:bg-slate-800"
      >
        <JournalRow date={date} today={today} />
        <ReflectionRow date={date} today={today} />
        <ReadingRow date={date} today={today} />
      </ul>
    </section>
  );
}

function Row({
  to,
  icon,
  name,
  children,
}: {
  to: string;
  icon: string;
  name: string;
  children?: ReactNode;
}) {
  return (
    <li>
      <Link
        to={to}
        className="flex min-h-16 items-center gap-3 px-4 py-3 first:rounded-t-2xl last:rounded-b-2xl active:bg-slate-50 dark:active:bg-slate-700"
      >
        <span aria-hidden="true" className="text-2xl">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{name}</span>
          {children}
        </span>
        <span aria-hidden="true" className="text-xl text-slate-400">
          ›
        </span>
      </Link>
    </li>
  );
}

function JournalRow({ date, today }: { date: DayKey; today: DayKey }) {
  const entry = useJournalEntry('day', date);
  const status = entry === undefined ? null : journalDayStatus(entry);
  const text = !status
    ? null
    : status.written
      ? `Geschrieben${status.gratitude > 0 ? ` · ${status.gratitude}× dankbar` : ''}`
      : date === today
        ? 'Heute noch nichts geschrieben'
        : 'Nichts geschrieben';
  return (
    <Row to={withDate(JOURNAL_PATH, date, today)} icon="📓" name="Journal">
      {text && <span className={MUTED}>{text}</span>}
    </Row>
  );
}

function ReflectionRow({ date, today }: { date: DayKey; today: DayKey }) {
  const entry = useJournalEntry('week', date);
  const prompts = useJournalPrompts();
  const progress = entry === undefined || !prompts ? null : reflectionProgress(entry, prompts);
  const text = !progress
    ? null
    : progress.answered === 0
      ? entry?.rating
        ? `Bewertet mit ${entry.rating}/5`
        : date >= journalDate('week', today)
          ? 'Diese Woche noch offen'
          : 'Noch offen'
      : progress.answered >= progress.total
        ? `Erledigt${entry?.rating ? ` · ${entry.rating}/5` : ''}`
        : `${progress.answered} von ${progress.total} Fragen`;
  return (
    <Row to={withDate(REFLECTION_PATH, date, today)} icon="🪞" name="Wochenreflexion">
      {text && <span className={MUTED}>{text}</span>}
    </Row>
  );
}

function ReadingRow({ date, today }: { date: DayKey; today: DayKey }) {
  const books = useBooks();
  const logs = useReadingLogs();
  const lines: string[] = [];
  if (books && logs) {
    const pages = pagesOn(logs, date);
    if (pages > 0) lines.push(`${date === today ? 'Heute' : 'An dem Tag'} ${formatPages(pages)}`);
    const current = groupBooks(books).reading[0];
    if (current) {
      const progress = bookProgress(
        current,
        logs.filter((log) => log.bookId === current.id),
      );
      lines.push(`${current.title} · ${formatBookProgress(current, progress)}`);
    } else if (pages === 0) {
      lines.push(books.length === 0 ? 'Bücher, Seiten, Notizen' : 'Kein Buch angefangen');
    }
  }
  return (
    <Row to={withDate(READING_PATH, date, today)} icon="📚" name="Lesen">
      {lines.map((line) => (
        <span key={line} className={`${MUTED} truncate tabular-nums`}>
          {line}
        </span>
      ))}
    </Row>
  );
}
