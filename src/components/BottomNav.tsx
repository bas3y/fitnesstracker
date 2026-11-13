import type { ComponentType, SVGProps } from 'react';
import { NavLink } from 'react-router-dom';
import { ChartIcon, DumbbellIcon, HomeIcon, SettingsIcon, SunIcon } from './icons';

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Heute', icon: HomeIcon },
  { to: '/training', label: 'Training', icon: DumbbellIcon },
  { to: '/daily', label: 'Alltag', icon: SunIcon },
  { to: '/stats', label: 'Statistik', icon: ChartIcon },
  { to: '/settings', label: 'Einstellungen', icon: SettingsIcon },
];

/**
 * Hauptnavigation (Variante A aus 22b): aktiver Bereich – auch auf seinen Unterseiten – mit heller
 * Pille hinter dem Symbol und fettem Namen. Liegt unter dem Scrollbereich, nicht `fixed`.
 */
export function BottomNav() {
  return (
    <nav
      aria-label="Hauptnavigation"
      data-bottom-bar
      className="relative z-20 shrink-0 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto flex max-w-md">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <li key={to} className="min-w-0 flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `group flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[11px] ${
                  isActive ? 'font-bold text-primary-text' : 'font-medium text-muted'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-7 w-13 items-center justify-center rounded-full transition-colors ${
                      isActive ? 'bg-primary-soft' : ''
                    }`}
                  >
                    <Icon className="h-6 w-6" strokeWidth={isActive ? 2.2 : 1.8} />
                  </span>
                  <span className="max-w-full truncate">{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
