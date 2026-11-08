import { useState } from 'react';
import { inputField } from '../../components/buttons';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { SegmentedControl } from '../../components/SegmentedControl';
import { Stepper } from '../../components/Stepper';
import { showToast } from '../../components/toastStore';
import { addReadingLog } from '../../db/reading';
import { MAX_BOOK_PAGES } from '../../db/schemas';
import type { Book, DayKey } from '../../db/types';
import {
  bookLabel,
  formatPages,
  pagesFromInput,
  type BookProgress,
  type ReadingInputMode,
} from '../../domain/reading';

const MODES: { value: ReadingInputMode; label: string }[] = [
  { value: 'untilPage', label: 'Bis Seite' },
  { value: 'pages', label: 'Seiten gelesen' },
];

/** Gelesene Seiten eintragen („bis Seite“ oder Anzahl), Tag wählbar */
export function ReadingLogDialog({
  book,
  progress,
  date,
  today,
  onClose,
}: {
  book: Book;
  progress: BookProgress;
  date: DayKey;
  today: DayKey;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<ReadingInputMode>('untilPage');
  const [value, setValue] = useState<number | null>(null);
  const [day, setDay] = useState(date);
  const [error, setError] = useState<string | null>(null);
  const pages = value === null ? null : pagesFromInput(mode, value, progress.currentPage);

  const submit = async () => {
    if (pages === null) {
      setError(
        mode === 'untilPage'
          ? `Bitte eine Seite nach ${progress.currentPage} eingeben`
          : 'Bitte die Anzahl der Seiten eingeben',
      );
      return;
    }
    const { finished } = await addReadingLog(book.id, day, pages);
    onClose();
    if (finished) {
      showToast({ title: 'Buch gelesen!', lines: [bookLabel(book)] });
    } else {
      showToast({ variant: 'info', title: `+${formatPages(pages)}`, lines: [book.title] });
    }
  };

  return (
    <ConfirmDialog
      title={book.title}
      confirmLabel="Eintragen"
      onCancel={onClose}
      onConfirm={submit}
    >
      <div className="flex flex-col gap-3 text-base text-fg">
        <SegmentedControl
          label="Eingabe"
          options={MODES}
          value={mode}
          onChange={(next) => {
            setMode(next);
            setValue(null);
            setError(null);
          }}
        />
        {mode === 'untilPage' ? (
          <Stepper
            key="until"
            label="Gelesen bis Seite"
            value={value}
            step={10}
            min={0}
            max={book.totalPages ?? MAX_BOOK_PAGES}
            decimals={0}
            startValue={Math.min(progress.currentPage + 10, book.totalPages ?? MAX_BOOK_PAGES)}
            allowEmpty
            onChange={(next) => {
              setValue(next);
              setError(null);
            }}
          />
        ) : (
          <Stepper
            key="pages"
            label="Seiten gelesen"
            value={value}
            step={5}
            min={0}
            max={MAX_BOOK_PAGES}
            decimals={0}
            startValue={10}
            allowEmpty
            onChange={(next) => {
              setValue(next);
              setError(null);
            }}
          />
        )}
        <p className="text-sm text-muted">
          Bisher bis Seite {progress.currentPage}
          {book.totalPages !== null && ` von ${book.totalPages}`}
          {pages !== null && mode === 'untilPage' && ` · +${formatPages(pages)}`}
        </p>
        <label className="block text-sm font-medium">
          Tag
          <input
            type="date"
            className={`${inputField} mt-1`}
            max={today}
            value={day}
            onChange={(event) => {
              if (event.target.value && event.target.value <= today) setDay(event.target.value);
            }}
          />
        </label>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </ConfirmDialog>
  );
}
