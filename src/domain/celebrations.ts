import type { Celebrations, Goal } from '../db/types';
import { formatBadgeTier, type BadgeState, type BadgeUnits } from './badges';
import type { GoalProgress } from './goals';

export interface CelebratedGoal {
  goal: Pick<Goal, 'id'>;
  progress: Pick<GoalProgress, 'achievedOn' | 'recurring' | 'range'>;
  name: string;
  icon: string;
}

export interface CelebrationResult {
  /** `null` = nichts zu melden */
  toast: { title: string; lines: string[] } | null;
  next: Celebrations;
  /** Muss gespeichert werden */
  changed: boolean;
}

const MAX_LINES = 4;

/** Unabhängig von der Reihenfolge der Schlüssel */
function sameRecord<T>(a: Record<string, T>, b: Record<string, T>): boolean {
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every((key) => b[key] === a[key]);
}

/** Schlüssel des Erreichens: wiederkehrende Ziele je Zeitraum, sonst einmal */
export function goalCelebrationKey(progress: CelebratedGoal['progress']): string | null {
  if (!progress.achievedOn) return null;
  return progress.recurring && progress.range ? progress.range.from : 'once';
}

/**
 * Vergleicht die erreichten Erfolge mit den schon gemeldeten. Beim ersten Abgleich (`null`) wird
 * nur der Stand gemerkt. Stufen werden nie zurückgenommen, gelöschte Ziele fallen heraus.
 */
export function celebrate(
  current: Celebrations | null,
  badges: readonly BadgeState[],
  goals: readonly CelebratedGoal[],
  units: BadgeUnits,
): CelebrationResult {
  const next: Celebrations = { badges: { ...(current?.badges ?? {}) }, goals: {} };
  const badgeLines: string[] = [];
  const goalLines: string[] = [];

  for (const { badge, level } of badges) {
    const known = next.badges[badge.id] ?? 0;
    if (level <= known) continue;
    next.badges[badge.id] = level;
    badgeLines.push(
      `${badge.icon} ${badge.name}: ${formatBadgeTier(badge.id, badge.tiers[level - 1]!, units)}`,
    );
  }
  for (const { goal, progress, name, icon } of goals) {
    const key = goalCelebrationKey(progress);
    const known = current?.goals[goal.id];
    if (key === null) {
      if (known !== undefined) next.goals[goal.id] = known;
      continue;
    }
    next.goals[goal.id] = key;
    if (known !== key) goalLines.push(`${icon} ${name}`);
  }

  const changed =
    current === null ||
    !sameRecord(next.badges, current.badges) ||
    !sameRecord(next.goals, current.goals);
  if (current === null || badgeLines.length + goalLines.length === 0) {
    return { toast: null, next, changed };
  }
  const lines = [...goalLines, ...badgeLines];
  const shown = lines.length > MAX_LINES ? lines.slice(0, MAX_LINES - 1) : lines;
  if (shown.length < lines.length) shown.push(`und ${lines.length - shown.length} weitere`);
  const title =
    badgeLines.length === 0
      ? goalLines.length === 1
        ? 'Ziel erreicht!'
        : 'Ziele erreicht!'
      : goalLines.length === 0
        ? badgeLines.length === 1
          ? 'Neues Abzeichen!'
          : 'Neue Abzeichen!'
        : 'Geschafft!';
  return { toast: { title, lines: shown }, next, changed };
}
