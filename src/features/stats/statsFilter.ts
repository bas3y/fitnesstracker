import { useSearchParams } from 'react-router-dom';
import {
  ENDURANCE_SPORTS,
  MUSCLE_GROUPS,
  type EnduranceSport,
  type MuscleGroup,
} from '../../db/types';
import { DEFAULT_STATS_RANGE, STATS_RANGES, type StatsRange } from '../../domain/stats';

const STATS_PATH = '/stats';
export const ENDURANCE_STATS_PATH = `${STATS_PATH}?view=endurance`;

export type StatsView = 'strength' | 'endurance';

function parseSport(value: string | null): EnduranceSport | null {
  return ENDURANCE_SPORTS.find((sport) => sport === value) ?? null;
}

function parseRange(value: string | null): StatsRange {
  return STATS_RANGES.find((range) => range === value) ?? DEFAULT_STATS_RANGE;
}

function parseMuscle(value: string | null): MuscleGroup | null {
  return MUSCLE_GROUPS.find((muscle) => muscle === value) ?? null;
}

/** Filter stehen in der URL und überstehen so den Wechsel zur Übung und zurück */
export function useStatsFilter() {
  const [params, setParams] = useSearchParams();
  const change = (name: string, value: string | null) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value === null) next.delete(name);
        else next.set(name, value);
        return next;
      },
      { replace: true },
    );
  return {
    view: (params.get('view') === 'endurance' ? 'endurance' : 'strength') as StatsView,
    range: parseRange(params.get('range')),
    muscle: parseMuscle(params.get('muscle')),
    sport: parseSport(params.get('sport')),
    setView: (view: StatsView) => change('view', view === 'strength' ? null : view),
    setRange: (range: StatsRange) => change('range', range),
    setMuscle: (muscle: MuscleGroup | null) => change('muscle', muscle),
    setSport: (sport: EnduranceSport | null) => change('sport', sport),
  };
}

/** Link zur Übung, der die Filter mitnimmt */
export function exerciseStatsPath(id: string, params: URLSearchParams): string {
  const next = new URLSearchParams(params);
  next.set('from', 'stats');
  return `/training/exercises/${id}?${next}`;
}

/** Zurück zur Statistik, falls man von dort kam */
export function statsBackPath(params: URLSearchParams): string | null {
  if (params.get('from') !== 'stats') return null;
  const next = new URLSearchParams(params);
  next.delete('from');
  const query = next.toString();
  return query ? `${STATS_PATH}?${query}` : STATS_PATH;
}
