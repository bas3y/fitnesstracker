import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFromHere } from '../../components/backNavigation';
import { Heatmap } from '../../components/Heatmap';
import { Card } from '../../components/Page';
import type { EnduranceSession } from '../../db/types';
import { enduranceDays, enduranceHeatLevel } from '../../domain/enduranceStats';
import { ENDURANCE_SPORT_LABELS } from '../../domain/labels';
import {
  formatDayKey,
  heatLevel,
  rangeStart,
  summarizeDays,
  type StatsRange,
  type StatsSession,
} from '../../domain/stats';
import { formatWorkoutDuration, toDateInput } from '../../domain/workout';
import { sessionPath } from '../endurance/paths';
import { HISTORY_PATH } from '../training/paths';

const countSets = (sets: number) => (sets === 1 ? '1 Satz' : `${sets} Sätze`);
const LINK = 'inline-flex min-h-11 items-center font-medium text-primary-text';

const SPANS = {
  '3m': { weekCount: 14, label: '3 Monaten' },
  '1y': { weekCount: 53, label: '12 Monaten' },
} satisfies Partial<Record<StatsRange, { weekCount: number; label: string }>>;

/**
 * Heatmap der Trainingstage (Krafttraining und Ausdauer); ein angetippter Tag zeigt,
 * was trainiert wurde, und führt zum Workout bzw. zur Einheit
 */
export function ActivityCard({
  sessions,
  endurance = [],
  now,
  span = '1y',
}: {
  sessions: StatsSession[];
  endurance?: readonly EnduranceSession[];
  now: Date;
  span?: keyof typeof SPANS;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const from = useFromHere();
  const strengthDays = summarizeDays(sessions);
  const cardioDays = enduranceDays(endurance);
  const keys = new Set([...strengthDays.keys(), ...cardioDays.keys()]);
  const values = new Map([...keys].map((key) => [key, 1]));
  const level = (_: number, key: string) =>
    Math.max(
      heatLevel(strengthDays.get(key)?.sets ?? 0),
      enduranceHeatLevel(cardioDays.get(key)?.durationSeconds ?? 0),
    ) as 0 | 1 | 2 | 3 | 4;
  const describe = (_: number, key: string) => {
    const sets = strengthDays.get(key)?.sets;
    const seconds = cardioDays.get(key)?.durationSeconds;
    const parts = [
      sets ? countSets(sets) : null,
      seconds ? `${formatWorkoutDuration(seconds)} Ausdauer` : null,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(' · ') : 'kein Training';
  };
  const strengthDay = selected ? strengthDays.get(selected) : undefined;
  const cardioDay = selected ? cardioDays.get(selected) : undefined;
  const today = toDateInput(now.toISOString());
  const spanStart = toDateInput(rangeStart(span, now)!.toISOString());
  const activeDays = [...keys].filter((key) => key >= spanStart && key <= today).length;
  const { weekCount, label } = SPANS[span];

  return (
    <Card title="Trainingstage">
      <Heatmap
        values={values}
        now={now}
        weekCount={weekCount}
        selectedKey={selected}
        onSelect={(key) => setSelected(key === selected ? null : key)}
        describe={describe}
        level={level}
      />
      {selected ? (
        <div className="mt-1 text-sm">
          <p className="font-medium">
            {formatDayKey(selected)}: {describe(0, selected)}
          </p>
          <div className="flex flex-wrap gap-x-4">
            {strengthDay?.workoutIds.map((id) => (
              <Link key={id} to={`${HISTORY_PATH}/${id}`} state={from} className={LINK}>
                Workout öffnen ›
              </Link>
            ))}
            {cardioDay?.sessions.map(({ id, sport }) => (
              <Link key={id} to={sessionPath(id)} state={from} className={LINK}>
                {ENDURANCE_SPORT_LABELS[sport].name} öffnen ›
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-1 text-sm text-muted">
          {activeDays === 1 ? '1 Trainingstag' : `${activeDays} Trainingstage`} in den letzten{' '}
          {label}
        </p>
      )}
    </Card>
  );
}
