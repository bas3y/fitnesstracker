import { useId } from 'react';

interface SearchInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({ label, value, onChange, placeholder }: SearchInputProps) {
  const id = useId();
  return (
    <div className="mb-4">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 min-w-0 flex-1 rounded-xl border border-line bg-subtle px-3 outline-none focus:border-primary focus:bg-surface text-base"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="h-12 rounded-xl px-3 text-sm font-medium text-muted"
          >
            Leeren
          </button>
        )}
      </div>
    </div>
  );
}
