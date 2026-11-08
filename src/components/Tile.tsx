import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { IconBadge, type IconName } from './icons';
import type { CardTone } from './Page';

/** Kachel im 2er-Raster (Alltag, Training, Statistik); muss in einer `<ul>` stehen */
export function Tile({
  to,
  state,
  icon,
  name,
  tone,
  value,
  children,
}: {
  to: string;
  state?: unknown;
  icon: IconName;
  name: string;
  /** Farbblock (Variante C), z. B. für die ersten Kacheln eines Rasters */
  tone?: CardTone;
  /** Große Zahl unter dem Namen (Tagesstand) */
  value?: string;
  children?: ReactNode;
}) {
  return (
    <li className="grid">
      <Link
        to={to}
        state={state}
        className={`flex min-h-32 min-w-0 flex-col gap-1 rounded-2xl bg-surface p-4 active:opacity-90 ${
          tone ? `tone-${tone}` : ''
        }`}
      >
        <IconBadge name={icon} className="mb-1 h-9 w-9" />
        <span className="font-semibold">{name}</span>
        {value && (
          <span className="text-2xl leading-tight font-bold tracking-tight tabular-nums">
            {value}
          </span>
        )}
        <span className="flex min-w-0 flex-col gap-1">{children}</span>
      </Link>
    </li>
  );
}
