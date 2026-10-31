import { Chip } from '../../components/Chip';

const RATINGS = [1, 2, 3, 4, 5];

/** Bewertung 1–5; erneutes Antippen nimmt sie zurück */
export function RatingPicker({
  label,
  low,
  high,
  value,
  onChange,
}: {
  label: string;
  low: string;
  high: string;
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          1 = {low}, 5 = {high}
        </span>
      </div>
      <div role="group" aria-label={label} className="flex gap-2">
        {RATINGS.map((rating) => (
          <Chip
            key={rating}
            pressed={rating === value}
            className="flex-1 justify-center px-0"
            aria-label={`${label} ${rating}`}
            onClick={() => onChange(rating === value ? null : rating)}
          >
            {rating}
          </Chip>
        ))}
      </div>
    </div>
  );
}
