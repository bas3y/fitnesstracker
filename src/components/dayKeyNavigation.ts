import type { KeyboardEvent } from 'react';

/**
 * Pfeiltasten in einer Reihe antippbarer Tage: wählt den Nachbarn und setzt den Fokus darauf.
 * Die Reihe braucht Buttons mit `data-day`.
 */
export function dayKeyNavigation(
  days: readonly string[],
  selected: string,
  onSelect: (day: string) => void,
) {
  return (event: KeyboardEvent<HTMLElement>) => {
    const step =
      event.key === 'ArrowRight'
        ? 1
        : event.key === 'ArrowLeft'
          ? -1
          : event.key === 'Home'
            ? -99
            : event.key === 'End'
              ? 99
              : 0;
    if (step === 0) return;
    event.preventDefault();
    const index = Math.max(0, Math.min(days.length - 1, days.indexOf(selected) + step));
    const next = days[index];
    if (next === undefined) return;
    onSelect(next);
    event.currentTarget.querySelector<HTMLElement>(`[data-day="${next}"]`)?.focus();
  };
}
