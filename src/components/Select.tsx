import { useId } from 'react';
import { inputField } from './buttons';

interface SelectProps<T extends string> {
  label: string;
  value: T | null;
  options: readonly T[];
  labels: Record<T, string>;
  onChange: (value: T | null) => void;
  /** Beschriftung der leeren Auswahl; ohne Angabe ist eine Auswahl Pflicht */
  emptyLabel?: string;
}

export function Select<T extends string>({
  label,
  value,
  options,
  labels,
  onChange,
  emptyLabel,
}: SelectProps<T>) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        className={inputField}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value === '' ? null : (event.target.value as T))}
      >
        {emptyLabel !== undefined && <option value="">{emptyLabel}</option>}
        {options.map((option) => (
          <option key={option} value={option}>
            {labels[option]}
          </option>
        ))}
      </select>
    </div>
  );
}
