import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CompactHeader } from './CompactHeader';
import { PAGE_WIDTH, useSplitPane, type PageWidth } from './pageLayout';
import { useScrolledPast } from './useScrolledPast';
import { ChevronLeftIcon, ChevronRightIcon, Icon, IconBadge, type IconName } from './icons';

/** Klassen des runden Kopf-Buttons, auch für Links (`aria-label` setzen) */
export const HEADER_ICON_BUTTON =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface text-primary-text hover:bg-subtle active:bg-pressed';

/** Runder Symbol-Button für die Kopfzeile (`Page`-Prop `action`) */
export function HeaderButton({
  icon,
  label,
  onClick,
}: {
  icon: IconName;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={HEADER_ICON_BUTTON}
    >
      <Icon name={icon} />
    </button>
  );
}

/** „Anpassen“ / „Fertig“ im Kopf (Startseite, Training) */
export function CustomizeToggle({
  editing,
  onChange,
}: {
  editing: boolean;
  onChange: (editing: boolean) => void;
}) {
  return (
    <HeaderButton
      icon={editing ? 'check' : 'pen'}
      label={editing ? 'Fertig' : 'Anpassen'}
      onClick={() => onChange(!editing)}
    />
  );
}

/** Gruppierte Liste (iOS-Stil): eine Karte mit Trennlinien, Zeilen über `GroupRow` */
export function LinkGroup({
  title,
  label,
  children,
}: {
  title?: string;
  /** Name der Liste für Screenreader (Standard: `title`) */
  label?: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-5">
      {title && (
        <h2 className="mb-1.5 px-1 text-[0.8125rem] font-semibold tracking-wide text-muted uppercase">
          {title}
        </h2>
      )}
      <ul
        aria-label={label ?? title}
        className="divide-y divide-line overflow-hidden rounded-2xl bg-surface"
      >
        {children}
      </ul>
    </section>
  );
}

/** Zeile in einer `LinkGroup`: Symbol, Name, Hinweis darunter oder Wert rechts, Pfeil */
export function GroupRow({
  to,
  state,
  icon,
  solid = false,
  label,
  hint,
  value,
  children,
}: {
  to: string;
  state?: unknown;
  icon?: IconName;
  /** Symbol auf voller Akzentfarbe (Einstellungen) */
  solid?: boolean;
  label: string;
  hint?: ReactNode;
  value?: string;
  children?: ReactNode;
}) {
  return (
    <li>
      <Link
        to={to}
        state={state}
        className="flex min-h-14 items-center gap-3 px-4 py-2.5 hover:bg-subtle active:bg-pressed"
      >
        {icon && <IconBadge name={icon} solid={solid} />}
        <span className="min-w-0 flex-1">
          <span className="block font-medium">{label}</span>
          {hint && <span className="block text-sm text-muted">{hint}</span>}
          {children}
        </span>
        {value && (
          <span className="max-w-[45%] shrink-0 truncate text-right text-sm text-muted">
            {value}
          </span>
        )}
        <ChevronRightIcon className="h-4 w-4 shrink-0 text-faint" />
      </Link>
    </li>
  );
}

/** Kleiner Textlink mit Pfeil-Symbol (z. B. „Zur Statistik“) */
export function MoreLink({
  to,
  state,
  children,
}: {
  to: string;
  state?: unknown;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      state={state}
      className="mt-1 inline-flex min-h-11 items-center gap-0.5 text-sm font-semibold text-primary-text"
    >
      {children}
      <ChevronRightIcon className="h-4 w-4" />
    </Link>
  );
}

/**
 * Kopf-Aktion an ihrem Platz; während der mitlaufende Kopf sie zeigt, ist sie hier nicht bedienbar
 * (sonst gäbe es den Button doppelt)
 */
export function HeaderAction({ hidden, children }: { hidden: boolean; children: ReactNode }) {
  return (
    <div className="contents" inert={hidden} aria-hidden={hidden || undefined}>
      {children}
    </div>
  );
}

export function Page({
  title,
  backTo: backLink,
  backState,
  action,
  width = 'normal',
  children,
}: {
  title: string;
  /** Unterseiten: Ziel des Zurück-Links */
  backTo?: string;
  /** Reicht die Herkunft an die übergeordnete Seite weiter (siehe `useBackTo`) */
  backState?: unknown;
  /** Schaltfläche rechts neben der Überschrift (z. B. „Anpassen“) */
  action?: ReactNode;
  /** Breite ab Handy quer (`PAGE_WIDTH`): `wide` für Raster, Kacheln, Statistik */
  width?: PageWidth;
  children: ReactNode;
}) {
  const pane = useSplitPane();
  // Neben der Liste (`SplitView`) braucht das Detail kein „Zurück“; die Liste scrollt für sich
  const backTo = pane === 'detail' ? undefined : backLink;
  const [header, scrolledPast] = useScrolledPast<HTMLDivElement>();
  const compact = scrolledPast && pane !== 'list';
  return (
    <div className={`${PAGE_WIDTH[width]} pt-[calc(1.25rem+env(safe-area-inset-top))]`}>
      {compact && (
        <CompactHeader
          title={title}
          backTo={backTo}
          backState={backState}
          action={action}
          width={width}
          inPane={pane === 'detail'}
        />
      )}
      {backTo && (
        <Link
          to={backTo}
          state={backState}
          inert={compact}
          aria-hidden={compact || undefined}
          className="-ml-3 inline-flex min-h-11 items-center gap-0.5 px-2 text-[0.9375rem] font-medium text-primary-text"
        >
          <ChevronLeftIcon className="h-5 w-5" />
          Zurück
        </Link>
      )}
      {/* Platz des „Zurück“ neben der Liste: Überschriften auf einer Höhe, Kopf erscheint erst beim Scrollen */}
      {pane === 'detail' && backLink && <div aria-hidden="true" className="min-h-11" />}
      <div ref={header} className="mb-4 flex items-center gap-3">
        <h1 className="min-w-0 flex-1 text-[1.75rem] leading-tight font-bold tracking-tight text-balance">
          {title}
        </h1>
        {action && <HeaderAction hidden={compact}>{action}</HeaderAction>}
      </div>
      {children}
    </div>
  );
}

/** Farbblock aus der Palette (Variante C), siehe `.tone-*` in `src/index.css` */
export type CardTone = 'hero' | 'accent' | 'soft';

export function Card({
  title,
  tone,
  wide = false,
  children,
}: {
  title?: string;
  tone?: CardTone;
  /** In einem Raster (z. B. Statistik ab `lg`) über alle Spalten */
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={`mb-4 rounded-2xl bg-surface ${tone ? `tone-${tone} p-5` : 'p-4'} ${wide ? 'col-span-full' : ''}`}
    >
      {title && <h2 className="mb-3 text-[1.0625rem] font-semibold">{title}</h2>}
      {children}
    </section>
  );
}

export function PlaceholderPage({
  title,
  text,
  children,
}: {
  title: string;
  text: string;
  children?: ReactNode;
}) {
  return (
    <Page title={title}>
      <Card>
        <p className="text-muted">{text}</p>
      </Card>
      {children}
    </Page>
  );
}

/**
 * Große, tippbare Zeile mit Pfeil – für Verweise auf Unterseiten.
 * `handle` = Griff zum Sortieren, `action` = Schaltfläche am Zeilenende (z. B. Löschen).
 */
export function LinkRow({
  to,
  state,
  label,
  hint,
  handle,
  action,
}: {
  to: string;
  state?: unknown;
  label: string;
  hint?: string;
  handle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-2 flex min-h-14 items-center rounded-2xl bg-surface">
      {handle}
      <Link
        to={to}
        state={state}
        className="flex min-h-14 min-w-0 flex-1 items-center justify-between gap-3 rounded-2xl px-4 py-3 hover:bg-subtle active:bg-pressed"
      >
        <span className="min-w-0">
          <span className="block font-medium">{label}</span>
          {hint && <span className="block text-sm text-muted">{hint}</span>}
        </span>
        <ChevronRightIcon className="h-5 w-5 shrink-0 text-faint" />
      </Link>
      {action}
    </div>
  );
}
