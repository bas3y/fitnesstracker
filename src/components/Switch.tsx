import { useId, type ReactNode } from 'react';
import { InfoButton } from './InfoButton';

const SWITCH_INPUT =
  'relative h-[31px] w-[51px] shrink-0 cursor-pointer appearance-none rounded-full bg-subtle-strong transition-colors outline-offset-2 before:absolute before:top-0.5 before:left-0.5 before:h-[27px] before:w-[27px] before:rounded-full before:bg-white before:shadow before:transition-transform checked:bg-primary checked:before:translate-x-5 focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50';

/** Ein/Aus-Schalter (iOS-Stil) mit Beschriftung links; Rolle `switch`; `info` = „i“ hinter dem Namen */
export function Switch({
  label,
  checked,
  disabled = false,
  onChange,
  info,
  className = '',
}: {
  label: ReactNode;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  info?: { title: string; content: ReactNode };
  className?: string;
}) {
  const id = useId();
  const input = (
    <input
      id={id}
      type="checkbox"
      role="switch"
      checked={checked}
      disabled={disabled}
      onChange={(event) => onChange(event.target.checked)}
      className={SWITCH_INPUT}
    />
  );
  if (info) {
    // Der Info-Knopf darf nicht im <label> stecken (sonst Teil des Namens des Schalters)
    return (
      <div className={`flex min-h-11 items-center gap-3 ${className}`}>
        <span className="flex min-w-0 flex-1 items-center">
          <label htmlFor={id} className={`min-w-0 ${disabled ? 'text-muted' : ''}`}>
            {label}
          </label>
          <InfoButton title={info.title} className="-my-1.5 -ml-0.5">
            {info.content}
          </InfoButton>
        </span>
        {input}
      </div>
    );
  }
  return (
    <label className={`flex min-h-11 items-center gap-3 ${className}`}>
      <span className={`min-w-0 flex-1 ${disabled ? 'text-muted' : ''}`}>{label}</span>
      {input}
    </label>
  );
}
