import { useState, type ReactNode } from 'react';
import { CHECK_HINT, checkNameClass } from './checkStyles';
import { CheckIcon, IconBadge, type IconName } from './icons';

export function StatusCircle({ done, warn = false }: { done: boolean; warn?: boolean }) {
  // Nur nach dem Abhaken springen, nicht beim Öffnen der Seite
  const [initial] = useState(done);
  const [changed, setChanged] = useState(false);
  if (!changed && done !== initial) setChanged(true);
  return (
    <span
      aria-hidden="true"
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
        warn
          ? 'border-mark bg-mark text-surface'
          : done
            ? `border-primary bg-primary text-on-primary ${changed ? 'anim-check' : ''}`
            : 'border-line-strong'
      }`}
    >
      {warn ? '!' : done && <CheckIcon className="h-5 w-5" />}
    </span>
  );
}

/** Ganze Zeile als Checkbox (Kreis, optional Symbol, Name und Hinweis) */
export function CheckButton({
  label,
  icon,
  checked,
  hint,
  onChange,
}: {
  label: string;
  icon?: IconName;
  checked: boolean;
  hint: ReactNode;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      className="flex min-h-14 min-w-0 flex-1 items-center gap-3 py-2 text-left"
      onClick={() => onChange(!checked)}
    >
      <StatusCircle done={checked} />
      {icon && <IconBadge name={icon} className="h-8 w-8" iconClassName="h-4.5 w-4.5" />}
      <span className="min-w-0">
        <span className={checkNameClass(checked)}>{label}</span>
        {hint && <span className={CHECK_HINT}>{hint}</span>}
      </span>
    </button>
  );
}
