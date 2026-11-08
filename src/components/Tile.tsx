import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { IconBadge, type IconName } from './icons';
import type { CardTone } from './Page';

/** Kachel im 2er-Raster (Alltag, Training); muss in einer `<ul>` stehen */
export function Tile({
  to,
  icon,
  name,
  tone,
  children,
}: {
  to: string;
  icon: IconName;
  name: string;
  /** Farbblock (Variante C), z. B. für die ersten Kacheln eines Rasters */
  tone?: CardTone;
  children?: ReactNode;
}) {
  return (
    <li className="grid">
      <Link
        to={to}
        className={`flex min-h-32 flex-col gap-1 rounded-2xl bg-surface p-4 active:opacity-90 ${
          tone ? `tone-${tone}` : ''
        }`}
      >
        <IconBadge name={icon} className="mb-1 h-9 w-9" />
        <span className="font-semibold">{name}</span>
        <span className="flex flex-col gap-1">{children}</span>
      </Link>
    </li>
  );
}
