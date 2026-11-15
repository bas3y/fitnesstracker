import type { ReactNode } from 'react';
import { Icon } from './icons';
import { useChangedSinceMount } from './motion';

/** Zahl ploppt kurz auf, wenn sie sich ändert (z. B. „3 erledigt“, 22d) – nicht beim Öffnen */
export function Bump({ value, children }: { value: number; children: ReactNode }) {
  const changed = useChangedSinceMount(value);
  if (!changed) return children;
  // Neuer `key` = neues Element: die Animation läuft bei jeder Änderung wieder
  return (
    <span key={value} className="anim-bump inline-block">
      {children}
    </span>
  );
}

/** Pfeil zum Auf- und Zuklappen: dreht sich weich (22d, O1) */
export function ToggleChevron({ open }: { open: boolean }) {
  return (
    <Icon
      name="chevronRight"
      className={`h-4 w-4 motion-safe:transition-[rotate] motion-safe:duration-200 ${open ? 'rotate-90' : ''}`}
    />
  );
}
