import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { TIMER_KINDS, type DayKey } from '../../db/types';
import { formatDayLabel } from '../../domain/daily';
import { journalDate, journalDayStatus, reflectionProgress } from '../../domain/journal';
import { TIMER_KIND_LABELS, TIMER_PHASE_LABELS } from '../../domain/labels';
import { sortPhotos } from '../../domain/photos';
import { formatTimerDuration, timerSecondsOn, timerState } from '../../domain/timer';
import { formatClock } from '../../domain/workout';
import { useSettings } from '../settings/useSettings';
import { useNow } from '../training/useWorkouts';
import {
  bookProgress,
  formatBookProgress,
  formatPages,
  groupBooks,
  pagesOn,
} from '../../domain/reading';
import { withDate } from '../daily/paths';
import { JOURNAL_PATH, PHOTOS_PATH, READING_PATH, REFLECTION_PATH, TIMER_PATH } from './paths';
import {
  useBooks,
  useJournalEntry,
  useJournalPrompts,
  useProgressPhotos,
  useReadingLogs,
  useTimerSessions,
} from './useSelf';

const MUTED = 'block text-sm text-muted';

/** Große Kachel unter den Alltag-Kacheln: Journal, Wochenreflexion, Lesen für den gewählten Tag */
export function SelfSection({ date, today }: { date: DayKey; today: DayKey }) {
  return (
    <section aria-labelledby="self-heading" className="mb-4">
      <h2 id="self-heading" className="mb-2 text-lg font-semibold">
        🌱 Persönliche Entwicklung
      </h2>
      <ul
        aria-label="Persönliche Entwicklung"
        className="divide-y divide-line rounded-2xl bg-surface"
      >
        <JournalRow date={date} today={today} />
        <ReflectionRow date={date} today={today} />
        <ReadingRow date={date} today={today} />
        <TimerRow date={date} today={today} />
        <PhotosRow date={date} today={today} />
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
        className="flex min-h-16 items-center gap-3 px-4 py-3 first:rounded-t-2xl last:rounded-b-2xl active:bg-page"
      >
        <span aria-hidden="true" className="text-2xl">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{name}</span>
          {children}
        </span>
        <span aria-hidden="true" className="text-xl text-faint">
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

function TimerRow({ date, today }: { date: DayKey; today: DayKey }) {
  const sessions = useTimerSessions();
  const timer = useSettings()?.activeTimer ?? null;
  const now = useNow(timer !== null && timer.pausedAt === null, 1000);
  let text: string | null = null;
  if (timer) {
    const state = timerState(timer, now);
    text = `Läuft: ${TIMER_PHASE_LABELS[state.phase.type]} ${formatClock(state.phaseRemaining)}${
      state.paused ? ' (angehalten)' : ''
    }`;
  } else if (sessions) {
    const parts = TIMER_KINDS.flatMap((kind) => {
      const seconds = timerSecondsOn(sessions, date, kind);
      return seconds > 0 ? [`${TIMER_KIND_LABELS[kind].name} ${formatTimerDuration(seconds)}`] : [];
    });
    text =
      parts.length > 0
        ? `${date === today ? 'Heute' : 'An dem Tag'}: ${parts.join(' · ')}`
        : 'Pomodoro und Meditation mit Gong';
  }
  return (
    <Row to={withDate(TIMER_PATH, date, today)} icon="⏱️" name="Fokus & Meditation">
      {text && <span className={`${MUTED} tabular-nums`}>{text}</span>}
    </Row>
  );
}

function PhotosRow({ date, today }: { date: DayKey; today: DayKey }) {
  const photos = useProgressPhotos();
  let text: string | null = null;
  if (photos) {
    const onDay = photos.filter((photo) => photo.date === date).length;
    const latest = sortPhotos(photos)[0];
    text =
      onDay > 0
        ? `${onDay === 1 ? '1 Foto' : `${onDay} Fotos`} ${date === today ? 'heute' : 'an dem Tag'}`
        : latest
          ? `${photos.length === 1 ? '1 Foto' : `${photos.length} Fotos`} · zuletzt ${formatDayLabel(latest.date, today)}`
          : 'Vorher/Nachher vergleichen';
  }
  return (
    <Row to={withDate(PHOTOS_PATH, date, today)} icon="📸" name="Fortschrittsfotos">
      {text && <span className={MUTED}>{text}</span>}
    </Row>
  );
}
