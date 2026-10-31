import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heatmap } from '../../components/Heatmap';
import { Card } from '../../components/Page';
import {
  formatDayKey,
  rangeStart,
  summarizeDays,
  type StatsRange,
  type StatsSession,
} from '../../domain/stats';
import { toDateInput } from '../../domain/workout';
import { HISTORY_PATH } from '../training/paths';

const countSets = (sets: number) => (sets === 1 ? '1 Satz' : `${sets} Sätze`);

const SPANS = {
  '3m': { weekCount: 14, label: '3 Monaten' },
  '1y': { weekCount: 53, label: '12 Monaten' },
} satisfies Partial<Record<StatsRange, { weekCount: number; label: string }>>;

/** Heatmap der Trainingstage; ein angetippter Tag zeigt Sätze und führt zum Workout */
export function ActivityCard({
  sessions,
  now,
  span = '1y',
}: {
  sessions: StatsSession[];
  now: Date;
  span?: keyof typeof SPANS;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const days = summarizeDays(sessions);
  const values = new Map([...days].map(([key, day]) => [key, day.sets]));
  const day = selected ? days.get(selected) : undefined;
  const today = toDateInput(now.toISOString());
  const spanStart = toDateInput(rangeStart(span, now)!.toISOString());
  const activeDays = [...days.keys()].filter((key) => key >= spanStart && key <= today).length;
  const { weekCount, label } = SPANS[span];

  return (
    <Card title="Trainingstage">
      <Heatmap
        values={values}
        now={now}
        weekCount={weekCount}
        selectedKey={selected}
        onSelect={(key) => setSelected(key === selected ? null : key)}
        describe={countSets}
      />
      {selected ? (
        <div className="mt-1 text-sm">
          <p className="font-medium">
            {formatDayKey(selected)}: {day ? countSets(day.sets) : 'kein Training'}
          </p>
          {day?.workoutIds.map((id) => (
            <Link
              key={id}
              to={`${HISTORY_PATH}/${id}`}
              className="inline-flex min-h-11 items-center font-medium text-emerald-700 dark:text-emerald-400"
            >
              Workout öffnen ›
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {activeDays === 1 ? '1 Trainingstag' : `${activeDays} Trainingstage`} in den letzten{' '}
          {label}
        </p>
      )}
    </Card>
  );
}
