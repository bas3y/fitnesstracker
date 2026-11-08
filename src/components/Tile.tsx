import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/** Kachel im 2er-Raster (Alltag, Training); muss in einer `<ul>` stehen */
export function Tile({
  to,
  icon,
  name,
  children,
}: {
  to: string;
  icon: string;
  name: string;
  children?: ReactNode;
}) {
  return (
    <li className="grid">
      <Link
        to={to}
        className="flex min-h-32 flex-col gap-1 rounded-2xl bg-surface p-4 active:bg-page"
      >
        <span aria-hidden="true" className="text-2xl">
          {icon}
        </span>
        <span className="font-semibold">{name}</span>
        <span className="flex flex-col gap-1">{children}</span>
      </Link>
    </li>
  );
}
