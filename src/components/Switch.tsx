import type { ReactNode } from 'react';

/** Ein/Aus-Schalter (iOS-Stil) mit Beschriftung links; Rolle `switch` */
export function Switch({
  label,
  checked,
  disabled = false,
  onChange,
  className = '',
}: {
  label: ReactNode;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}) {
  return (
    <label className={`flex min-h-11 items-center gap-3 ${className}`}>
      <span className={`min-w-0 flex-1 ${disabled ? 'text-muted' : ''}`}>{label}</span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="relative h-[31px] w-[51px] shrink-0 cursor-pointer appearance-none rounded-full bg-subtle-strong transition-colors outline-offset-2 before:absolute before:top-0.5 before:left-0.5 before:h-[27px] before:w-[27px] before:rounded-full before:bg-white before:shadow before:transition-transform checked:bg-primary checked:before:translate-x-5 focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
      />
    </label>
  );
}
