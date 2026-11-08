import { joinDuration, splitDuration, type DurationParts } from '../domain/endurance';
import { inputField } from './buttons';

const DURATION_FIELDS: { key: keyof DurationParts; label: string; unit: string; max: number }[] = [
  { key: 'hours', label: 'Stunden', unit: 'h', max: 47 },
  { key: 'minutes', label: 'Minuten', unit: 'min', max: 59 },
  { key: 'seconds', label: 'Sekunden', unit: 's', max: 59 },
];

/** Dauer als Stunden/Minuten/Sekunden; leeres Feld = 0 */
export function DurationInput({
  label = 'Dauer',
  value,
  onChange,
}: {
  label?: string;
  value: number;
  onChange: (seconds: number) => void;
}) {
  const parts = splitDuration(value);
  return (
    <div role="group" aria-label={label}>
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <div className="grid grid-cols-3 gap-2">
        {DURATION_FIELDS.map(({ key, label: fieldLabel, unit, max }) => (
          <div key={key} className="relative">
            <input
              aria-label={fieldLabel}
              inputMode="numeric"
              placeholder="0"
              className={`${inputField} pr-10 text-center tabular-nums`}
              value={parts[key] === 0 ? '' : String(parts[key])}
              onChange={(event) => {
                const digits = event.target.value.replace(/\D/g, '');
                const next = Math.min(max, digits === '' ? 0 : Number(digits));
                onChange(joinDuration({ ...parts, [key]: next }));
              }}
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted">
              {unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
