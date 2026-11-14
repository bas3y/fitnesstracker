import type { ComponentType, SVGProps } from 'react';
import { NavLink } from 'react-router-dom';
import { BaseyLogo } from './BaseyLogo';
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
 * Seit 22c je Bildschirm: Handy quer (`short`) flach nur mit Symbolen (Q3), Tablet wie am Handy
 * (T3), ab `xl` Seitenleiste links mit Logo, Symbol + Name, Einstellungen unten abgesetzt (D1).
 * Maße stehen auch in `--nav-bottom`/`--nav-left` (`index.css`).
 */
export function BottomNav() {
  return (
    <nav
      aria-label="Hauptnavigation"
      data-bottom-bar
      className="relative z-20 shrink-0 border-t border-line bg-surface/95 pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] backdrop-blur xl:order-first xl:flex xl:w-60 xl:flex-col xl:border-t-0 xl:border-r xl:p-0 xl:pt-[env(safe-area-inset-top)]"
    >
      <div className="hidden items-center gap-3 px-6 pt-6 pb-5 xl:flex">
        <BaseyLogo className="h-10 w-10" />
        <span className="text-[1.375rem] font-bold tracking-tight">Basey</span>
      </div>
      <ul className="mx-auto flex max-w-md xl:mx-0 xl:max-w-none xl:flex-1 xl:flex-col xl:gap-1 xl:px-3 xl:pb-4">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <li key={to} className="min-w-0 flex-1 xl:flex-none xl:last:mt-auto">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `group flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[11px] short:min-h-11 xl:min-h-12 xl:flex-row xl:justify-start xl:gap-3 xl:rounded-xl xl:px-3 xl:text-[0.9375rem] ${
                  isActive
                    ? 'font-bold text-primary-text xl:bg-primary-soft'
                    : 'font-medium text-muted hover:text-fg xl:hover:bg-subtle'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-7 w-13 items-center justify-center rounded-full transition-colors short:h-8 short:w-14 xl:h-auto xl:w-auto ${
                      isActive ? 'bg-primary-soft' : ''
                    }`}
                  >
                    <Icon className="h-6 w-6" strokeWidth={isActive ? 2.2 : 1.8} />
                  </span>
                  <span className="max-w-full truncate short:sr-only">{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
