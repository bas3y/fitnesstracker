interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div role="group" aria-label={label} className="flex rounded-xl bg-subtle p-1">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`min-h-11 flex-1 rounded-[0.625rem] px-3 text-sm transition-colors ${
              active
                ? 'bg-surface font-semibold text-fg shadow-sm dark:bg-subtle-strong'
                : 'font-medium text-muted'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
