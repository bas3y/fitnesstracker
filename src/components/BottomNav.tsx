import type { ComponentType, SVGProps } from 'react';
import { NavLink } from 'react-router-dom';
import { ChartIcon, DumbbellIcon, HomeIcon, SettingsIcon, SunIcon } from './icons';

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: HomeIcon },
  { to: '/training', label: 'Training', icon: DumbbellIcon },
  { to: '/daily', label: 'Alltag', icon: SunIcon },
  { to: '/stats', label: 'Statistik', icon: ChartIcon },
  { to: '/settings', label: 'Einstellungen', icon: SettingsIcon },
];

export function BottomNav() {
  return (
    <nav
      aria-label="Hauptnavigation"
      data-bottom-bar
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto flex max-w-md">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium ${
                  isActive ? 'text-primary-text' : 'text-muted'
                }`
              }
            >
              <Icon className="h-6 w-6" />
              <span className="max-w-full truncate">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
