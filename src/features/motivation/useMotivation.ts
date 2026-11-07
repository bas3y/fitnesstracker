import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { loadMotivation } from '../../db/motivation';
import type { DayKey } from '../../db/types';
import { evaluateBadges, type BadgeState } from '../../domain/badges';
import { streakOverview, type StreakItem } from '../../domain/streaks';

export interface MotivationView {
  streaks: StreakItem[];
  badges: BadgeState[];
  trainingWeekTarget: number;
}

/** Serien und Abzeichen; `undefined` = lädt */
export function useMotivation(today: DayKey): MotivationView | undefined {
  const motivation = useLiveQuery(loadMotivation, []);
  return useMemo(() => {
    if (!motivation) return undefined;
    const { data, goals } = motivation;
    return {
      streaks: streakOverview(data, today),
      badges: evaluateBadges(data, goals, today),
      trainingWeekTarget: data.trainingWeekTarget,
    };
  }, [motivation, today]);
}
