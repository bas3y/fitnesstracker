import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CheckIcon, Icon, type IconName } from '../../components/icons';
import type { CardTone } from '../../components/Page';
import type { DayKey } from '../../db/types';
import { goalPercent } from '../../domain/daily';
import type { WeekDay } from '../../domain/week';
import { GoalBar } from '../daily/GoalBar';

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

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

/** Mo–So als Kreise, trainierte Tage mit Haken, heute umrandet */
export function WeekDots({ days, today }: { days: readonly WeekDay[]; today: DayKey }) {
  return (
    <ol aria-label="Trainingstage dieser Woche" className="flex justify-between">
      {days.map(({ date, trained }, index) => (
        <li
          key={date}
          aria-label={`${WEEKDAYS[index]}: ${trained ? 'trainiert' : 'kein Training'}`}
          className="flex flex-col items-center gap-1.5 text-xs text-muted"
        >
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
          {WEEKDAYS[index]}
        </li>
      ))}
    </ol>
  );
}

/** Balken der letzten Tage (ältester zuerst); erreichte Tage kräftig, andere blass */
export function MiniBars({
  label,
  points,
  goal,
}: {
  label: string;
  points: readonly { date: DayKey; value: number }[];
  goal: number;
}) {
  const top = Math.max(goal, ...points.map((point) => point.value), 1);
  return (
    <ol aria-label={label} className="flex h-20 items-end gap-1.5">
      {points.map(({ date, value }) => {
        const weekday = WEEKDAYS[(new Date(`${date}T12:00:00`).getDay() + 6) % 7];
        return (
          <li
            key={date}
            aria-label={`${weekday}: ${goalPercent(value, goal)} % vom Ziel`}
            className="flex h-full flex-1 flex-col items-center justify-end gap-1"
          >
            <span className="flex w-full flex-1 items-end">
              <span
                className={`block w-full rounded-md bg-primary ${value >= goal ? '' : 'opacity-45'}`}
                style={{ height: `${Math.max(4, (value / top) * 100)}%` }}
              />
            </span>
            <span className="text-[0.6875rem] text-muted">{weekday}</span>
          </li>
        );
      })}
    </ol>
  );
}
