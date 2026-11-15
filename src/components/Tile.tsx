import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { IconBadge, type IconName } from './icons';
import { CountUpText } from './CountUpText';
import type { CardTone } from './Page';

/** Raster der Kacheln: 2 je Zeile am Handy, ab `sm` 3, ab `lg` 4 (seit 22c) */
export const TILE_GRID = 'anim-stagger grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4';

/** Kachel im Raster `TILE_GRID` (Alltag, Training, Statistik); muss in einer `<ul>` stehen */
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
        className={`press flex min-h-32 min-w-0 flex-col gap-1 rounded-2xl bg-surface p-4 hover:brightness-[0.97] active:opacity-90 ${
          tone ? `tone-${tone}` : ''
        }`}
      >
        <IconBadge name={icon} className="mb-1 h-9 w-9" />
        <span className="font-semibold">{name}</span>
        {value && (
          <span className="text-2xl leading-tight font-bold tracking-tight tabular-nums">
            <CountUpText text={value} />
          </span>
        )}
        <span className="flex min-w-0 flex-col gap-1">{children}</span>
      </Link>
    </li>
  );
}
