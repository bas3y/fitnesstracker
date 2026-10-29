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
        pressed
          ? 'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-600'
          : 'border-slate-300 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200'
      } ${className}`}
      {...props}
    />
  );
}
