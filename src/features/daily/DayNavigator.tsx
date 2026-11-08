import { inputField } from '../../components/buttons';
import type { DayKey } from '../../db/types';
import { formatDayLabel, shiftDay } from '../../domain/daily';

const dayButton =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface text-xl font-semibold active:bg-page disabled:opacity-40';

/** Tag wählen: Pfeile für die Tage daneben, Datumsfeld für weiter zurück; nie in die Zukunft */
export function DayNavigator({
  date,
  today,
  onChange,
}: {
  date: DayKey;
  today: DayKey;
  onChange: (date: DayKey) => void;
}) {
  return (
    <div className="mb-4">
      <h2 className="mb-2 text-center text-lg font-semibold">{formatDayLabel(date, today)}</h2>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Vorheriger Tag"
          className={dayButton}
          onClick={() => onChange(shiftDay(date, -1))}
        >
          ‹
        </button>
        <input
          type="date"
          aria-label="Tag wählen"
          className={`${inputField} min-w-0 flex-1 text-center`}
          max={today}
          value={date}
          onChange={(event) => {
            if (event.target.value && event.target.value <= today) onChange(event.target.value);
          }}
        />
        <button
          type="button"
          aria-label="Nächster Tag"
          className={dayButton}
          disabled={date >= today}
          onClick={() => onChange(shiftDay(date, 1))}
        >
          ›
        </button>
      </div>
    </div>
  );
}
