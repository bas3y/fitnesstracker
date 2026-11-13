import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { dayKeyNavigation } from '../../components/dayKeyNavigation';
import { CheckIcon, Icon, type IconName } from '../../components/icons';
import type { CardTone } from '../../components/Page';
import type { DayKey } from '../../db/types';
import { goalPercent } from '../../domain/daily';
import type { WeekDay } from '../../domain/week';
import { GoalBar } from '../daily/GoalBar';

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

/** Antippbare Tage: gewählter Tag + Auswahl (sonst nur Anzeige) */
export interface DaySelection {
  selected: DayKey;
  onSelect: (date: DayKey) => void;
}

/** Kleines Widget (halbe Breite): Name mit Symbol, große Zahl, Balken oder kurzer Hinweis */
export function SmallWidget({
  to,
  state,
  icon,
  label,
  value,
  sub,
  bar,
  tone,
}: {
  to: string;
  state?: unknown;
  icon: IconName;
  label: string;
  value: string;
  sub?: string;
  bar?: { value: number | null; goal: number };
  tone?: CardTone;
}) {
  return (
    <Link
      to={to}
      state={state}
      aria-label={`${label}: ${value}${sub ? `, ${sub}` : ''}`}
      className={`flex min-h-30 min-w-0 flex-col justify-between gap-2 rounded-2xl bg-surface p-4 active:opacity-90 ${
        tone ? `tone-${tone}` : ''
      }`}
    >
      <span className="flex min-w-0 items-center gap-1.5 text-sm text-muted">
        <Icon name={icon} className="h-4 w-4" />
        <span className="truncate">{label}</span>
      </span>
      <span className="truncate text-[1.75rem] leading-tight font-bold tracking-tight tabular-nums">
        {value}
      </span>
      {bar ? (
        <GoalBar label={`Ziel ${label}`} value={bar.value} goal={bar.goal} />
      ) : (
        sub && <span className="truncate text-sm text-muted">{sub}</span>
      )}
    </Link>
  );
}

/** Kopfzeile eines Widgets: Titel links, kurzer Stand rechts */
export function WidgetHeader({ title, aside }: { title: string; aside?: ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="text-[1.0625rem] font-semibold">{title}</h2>
      {aside && <span className="shrink-0 text-sm text-muted tabular-nums">{aside}</span>}
    </div>
  );
}

function weekdayOf(date: DayKey): string {
  return WEEKDAYS[(new Date(`${date}T12:00:00`).getDay() + 6) % 7]!;
}

/**
 * Mo–So als Kreise, trainierte Tage mit Haken, heute umrandet. Mit `selection` sind die Tage
 * antippbar (Pfeiltasten wechseln), der gewählte ist unterstrichen.
 */
export function WeekDots({
  days,
  today,
  selection,
}: {
  days: readonly WeekDay[];
  today: DayKey;
  selection?: DaySelection;
}) {
  const keys = days.map((day) => day.date);
  return (
    <ol
      aria-label="Trainingstage dieser Woche"
      className="flex justify-between"
      onKeyDown={selection && dayKeyNavigation(keys, selection.selected, selection.onSelect)}
    >
      {days.map(({ date, trained }, index) => {
        const label = `${WEEKDAYS[index]}: ${trained ? 'trainiert' : 'kein Training'}`;
        const selected = selection?.selected === date;
        const content = (
          <>
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] ${
                trained
                  ? 'border-primary bg-primary text-on-primary'
                  : date === today
                    ? 'border-fg'
                    : 'border-line-strong'
              }`}
            >
              {trained && <CheckIcon className="h-4 w-4" />}
            </span>
            <span className={selected ? 'font-bold text-fg underline underline-offset-4' : ''}>
              {WEEKDAYS[index]}
            </span>
          </>
        );
        return (
          <li key={date} aria-label={label}>
            {selection ? (
              <button
                type="button"
                data-day={date}
                aria-label={label}
                aria-pressed={selected}
                tabIndex={selected ? 0 : -1}
                className="flex min-h-11 min-w-10 flex-col items-center gap-1.5 rounded-xl text-xs text-muted"
                onClick={() => selection.onSelect(date)}
              >
                {content}
              </button>
            ) : (
              <span className="flex flex-col items-center gap-1.5 text-xs text-muted">
                {content}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Balken der letzten Tage (ältester zuerst); erreichte Tage kräftig, andere blass. Mit `selection`
 * sind die Balken antippbar (Pfeiltasten wechseln), der gewählte ist umrandet.
 */
export function MiniBars({
  label,
  points,
  goal,
  selection,
}: {
  label: string;
  points: readonly { date: DayKey; value: number }[];
  goal: number;
  selection?: DaySelection;
}) {
  const top = Math.max(goal, ...points.map((point) => point.value), 1);
  const keys = points.map((point) => point.date);
  return (
    <ol
      aria-label={label}
      className="flex h-20 items-end gap-1.5"
      onKeyDown={selection && dayKeyNavigation(keys, selection.selected, selection.onSelect)}
    >
      {points.map(({ date, value }) => {
        const weekday = weekdayOf(date);
        const text = `${weekday}: ${goalPercent(value, goal)} % vom Ziel`;
        const selected = selection?.selected === date;
        const content = (
          <>
            <span className="flex w-full flex-1 items-end">
              <span
                className={`block w-full rounded-md bg-primary ${value >= goal ? '' : 'opacity-45'} ${
                  selected ? 'outline-2 outline-offset-2 outline-fg' : ''
                }`}
                style={{ height: `${Math.max(4, (value / top) * 100)}%` }}
              />
            </span>
            <span className={`text-[0.6875rem] ${selected ? 'font-bold text-fg' : 'text-muted'}`}>
              {weekday}
            </span>
          </>
        );
        return (
          <li
            key={date}
            aria-label={selection ? undefined : text}
            className="flex h-full flex-1 flex-col items-center justify-end gap-1"
          >
            {selection ? (
              <button
                type="button"
                data-day={date}
                aria-label={text}
                aria-pressed={selected}
                tabIndex={selected ? 0 : -1}
                className="flex h-full w-full flex-col items-center justify-end gap-1"
                onClick={() => selection.onSelect(date)}
              >
                {content}
              </button>
            ) : (
              content
            )}
          </li>
        );
      })}
    </ol>
  );
}
