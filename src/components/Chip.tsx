import type { ButtonHTMLAttributes } from 'react';

/** Umschaltbarer Chip (z. B. Filter, Muskelauswahl) */
export function Chip({
  pressed,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { pressed: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={`inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full border px-4 text-sm font-medium disabled:opacity-40 ${
        pressed ? 'border-primary bg-primary text-on-primary' : 'border-line bg-surface text-fg'
      } ${className}`}
      {...props}
    />
  );
}
