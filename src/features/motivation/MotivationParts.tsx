import { Dialog } from '../../components/Dialog';
import {
  BADGE_HINTS,
  formatBadgeTier,
  formatBadgeValue,
  nextTier,
  tierShare,
  type BadgeId,
  type BadgeState,
  type BadgeUnits,
} from '../../domain/badges';
import { formatGoalDate } from '../../domain/goals';
import { formatStreak } from '../../domain/habits';
import type { StreakItem } from '../../domain/streaks';
import { Icon } from '../../components/icons';

const HINT = 'text-sm text-muted';

/** Ring je Stufe: Bronze, Silber, Gold, dann Smaragd, Saphir, Amethyst */
const TIER_RINGS = [
  'border-line bg-subtle grayscale opacity-60',
  // Materialfarben, unabhängig von der Palette
  'border-amber-700 bg-amber-50 dark:bg-amber-950/40',
  'border-slate-400 bg-slate-50 dark:border-slate-300 dark:bg-slate-700',
  'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/30',
  'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40',
  'border-sky-500 bg-sky-50 dark:bg-sky-950/40',
  'border-violet-500 bg-violet-50 dark:bg-violet-950/40',
];

/** Feste Trennstellen (weiches Trennzeichen) für lange Namen in den schmalen Kacheln */
const NAME_BREAKS: Partial<Record<BadgeId, string>> = {
  workouts: 'Kraft­training',
  records: 'Rekord­jäger',
  trainingStreak: 'Trainings­serie',
  habitStreak: 'Gewohnheits­serie',
  water: 'Wasser­ziel',
  sleep: 'Schlaf­ziel',
  protein: 'Protein­ziel',
  meditation: 'Medi­tation',
  photos: 'Fortschritts­fotos',
};

function tierRing(level: number): string {
  return TIER_RINGS[Math.min(level, TIER_RINGS.length - 1)]!;
}

function streakStatus(item: StreakItem, trainingWeekTarget: number): string {
  const weeks = item.unit === 'weeks';
  const status = item.todayDone
    ? weeks
      ? 'Diese Woche geschafft'
      : 'Heute geschafft'
    : item.current > 0
      ? weeks
        ? 'Diese Woche noch offen'
        : 'Heute noch offen'
      : 'Unterbrochen';
  const parts = [status, `Beste: ${formatStreak(item.best, item.unit)}`];
  if (item.area === 'training') parts.push(`Ziel ${trainingWeekTarget}× pro Woche`);
  return parts.join(' · ');
}

export function StreakRow({
  item,
  trainingWeekTarget,
  compact = false,
}: {
  item: StreakItem;
  trainingWeekTarget: number;
  compact?: boolean;
}) {
  const [count, unit] = formatStreak(item.current, item.unit).split(' ');
  return (
    <li className="flex min-h-14 items-center gap-3 py-2">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-on-primary-soft">
        <Icon name={item.icon} className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{item.name}</p>
        {!compact && <p className={HINT}>{streakStatus(item, trainingWeekTarget)}</p>}
        {compact && <p className={HINT}>{item.todayDone ? 'Geschafft' : 'Noch offen'}</p>}
      </div>
      <div className={`shrink-0 text-right ${item.current > 0 ? '' : 'text-faint'}`}>
        <p className="text-xl leading-tight font-bold tabular-nums">
          <span className="inline-flex items-center gap-1">
            {item.todayDone && <Icon name="flame" className="h-5 w-5 text-mark" />}
            {count}
          </span>
        </p>
        <p className="text-xs text-muted">{unit}</p>
      </div>
    </li>
  );
}

export function BadgeTile({ state, onOpen }: { state: BadgeState; onOpen: () => void }) {
  const { badge, level, tiers } = state;
  return (
    <button
      type="button"
      aria-label={`${badge.name}: ${level === 0 ? 'gesperrt' : `Stufe ${level} von ${tiers.length}`}`}
      className="flex min-h-11 w-full min-w-0 flex-col items-center gap-1 rounded-xl px-0 py-2 text-center min-[360px]:px-1 active:bg-subtle"
      onClick={onOpen}
    >
      <span
        aria-hidden="true"
        className={`flex h-14 w-14 items-center justify-center rounded-full border-4 ${tierRing(level)}`}
      >
        <Icon name={badge.icon} className="h-7 w-7" />
      </span>
      <span className="w-full text-xs leading-tight font-medium hyphens-manual min-[360px]:text-sm [overflow-wrap:anywhere]">
        {NAME_BREAKS[badge.id] ?? badge.name}
      </span>
      <span className="text-xs text-muted">
        {level === 0 ? 'Gesperrt' : `${level} / ${tiers.length}`}
      </span>
    </button>
  );
}

export function BadgeDialog({
  state,
  units,
  onClose,
}: {
  state: BadgeState;
  units: BadgeUnits;
  onClose: () => void;
}) {
  const { badge, value, tiers } = state;
  const next = nextTier(state);
  return (
    <Dialog title={badge.name} onClose={onClose}>
      <p className={HINT}>{BADGE_HINTS[badge.id]}</p>
      <p>
        Bisher: <span className="font-semibold">{formatBadgeValue(badge.id, value, units)}</span>
      </p>
      {next && (
        <div>
          <p className="text-sm">
            Nächste Stufe: {formatBadgeTier(badge.id, next.threshold, units)}
          </p>
          <div className="mt-1 h-2 rounded-full bg-subtle">
            <div
              className="bar-fill h-2 rounded-full bg-primary"
              style={{ width: `${tierShare(state) * 100}%` }}
            />
          </div>
        </div>
      )}
      <ol aria-label="Stufen" className="flex flex-col gap-1">
        {tiers.map((tier, index) => (
          <li key={tier.threshold} className="flex items-center gap-2 text-sm">
            <span
              aria-hidden="true"
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs ${tierRing(tier.reached ? index + 1 : 0)}`}
            >
              {tier.reached ? '✓' : ''}
            </span>
            <span className={`min-w-0 flex-1 ${tier.reached ? 'font-medium' : HINT}`}>
              {formatBadgeTier(badge.id, tier.threshold, units)}
            </span>
            <span className="shrink-0 text-xs text-muted">
              {tier.reached ? (tier.achievedOn ? formatGoalDate(tier.achievedOn) : 'erreicht') : ''}
            </span>
          </li>
        ))}
      </ol>
    </Dialog>
  );
}
