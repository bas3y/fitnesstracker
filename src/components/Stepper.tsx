import { useId, useState } from 'react';
import { formatDecimal, parseDecimal } from '../domain/format';
import { roundTo } from '../domain/units';

interface StepperProps {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  step: number;
  min?: number;
  max?: number;
  decimals?: number;
  unit?: string;
  /** Startwert, wenn bei leerem Feld + oder − gedrückt wird */
  startValue?: number;
  allowEmpty?: boolean;
}

export function Stepper({
  label,
  value,
  onChange,
  step,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  decimals = 1,
  unit,
  startValue = 0,
  allowEmpty = false,
}: StepperProps) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);

  const clamp = (n: number) => roundTo(Math.min(max, Math.max(min, n)), decimals);
  const stepBy = (direction: 1 | -1) => {
    setDraft(null);
    onChange(clamp(value === null ? startValue : value + direction * step));
  };
  const commit = () => {
    if (draft === null) return;
    const parsed = parseDecimal(draft);
    setDraft(null);
    if (parsed !== null) onChange(clamp(parsed));
    else if (draft.trim() === '' && allowEmpty) onChange(null);
  };

  const buttonClass =
    'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl font-semibold text-slate-700 active:bg-slate-200 disabled:opacity-40 dark:bg-slate-700 dark:text-slate-100 dark:active:bg-slate-600';

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`${label} verringern`}
          className={buttonClass}
          disabled={value !== null && value <= min}
          onClick={() => stepBy(-1)}
        >
          −
        </button>
        <div className="relative flex-1">
          <input
            id={id}
            inputMode="decimal"
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-center text-lg tabular-nums dark:border-slate-600 dark:bg-slate-900"
            value={draft ?? (value === null ? '' : formatDecimal(value, decimals))}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur();
            }}
          />
          {unit && (
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-500">
              {unit}
            </span>
          )}
        </div>
        <button
          type="button"
          aria-label={`${label} erhöhen`}
          className={buttonClass}
          disabled={value !== null && value >= max}
          onClick={() => stepBy(1)}
        >
          +
        </button>
      </div>
    </div>
  );
}
