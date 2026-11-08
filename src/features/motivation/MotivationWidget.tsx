import { Link } from 'react-router-dom';
import type { BackState } from '../../components/backNavigation';
import { ChevronRightIcon } from '../../components/icons';
import { Card, type CardTone } from '../../components/Page';
import { formatStreak } from '../../domain/habits';
import { SmallWidget } from '../dashboard/WidgetParts';
import type { DayKey, Settings } from '../../db/types';
import {
  formatBadgeTier,
  formatBadgeValue,
  nextTier,
  tierShare,
  type BadgeState,
} from '../../domain/badges';
import { DASHBOARD_WIDGET_LABELS } from '../../domain/labels';
import { StreakRow } from './MotivationParts';
import { ACHIEVEMENTS_PATH } from './paths';
import { useMotivation } from './useMotivation';

const SHOWN_STREAKS = 3;
const FROM_DASHBOARD: BackState = { from: '/' };

/** Angefangenes Abzeichen, das seiner nächsten Stufe am nächsten ist */
function closestBadge(badges: readonly BadgeState[]): BadgeState | null {
  const candidates = badges.filter((state) => state.value > 0 && nextTier(state));
  return candidates.sort((a, b) => tierShare(b) - tierShare(a))[0] ?? null;
}

export function MotivationWidget({
  settings,
  today,
  small = false,
  tone,
}: {
  settings: Settings;
  today: DayKey;
  /** Kleines Widget: längste laufende Serie */
  small?: boolean;
  tone?: CardTone;
}) {
  const view = useMotivation(today);
  if (!view) return null;
  const running = view.streaks.filter((item) => item.current > 0).slice(0, SHOWN_STREAKS);

  if (small) {
    const top = running[0];
    return (
      <SmallWidget
        to={ACHIEVEMENTS_PATH}
        state={FROM_DASHBOARD}
        icon={top?.icon ?? 'flame'}
        label={top?.name ?? 'Serien'}
        value={top ? formatStreak(top.current, top.unit) : '–'}
        sub={top ? `Beste: ${formatStreak(top.best, top.unit)}` : 'Keine laufende Serie'}
        tone={tone}
      />
    );
  }
  const badge = closestBadge(view.badges);
  const next = badge && nextTier(badge);

  return (
    <Card title={DASHBOARD_WIDGET_LABELS.motivation.name}>
      {running.length === 0 ? (
        <p className="text-sm text-muted">
          Gerade keine laufende Serie – heute ist ein guter Tag, eine zu starten.
        </p>
      ) : (
        <ul aria-label="Laufende Serien" className="divide-y divide-line">
          {running.map((item) => (
            <StreakRow
              key={item.key}
              item={item}
              trainingWeekTarget={view.trainingWeekTarget}
              compact
            />
          ))}
        </ul>
      )}
      {badge && next && (
        <div data-testid="next-badge" className="mt-3">
          <p className="text-sm">
            <span className="font-medium">Nächstes Abzeichen:</span> {badge.badge.name} –{' '}
            {formatBadgeTier(badge.badge.id, next.threshold, settings)}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-2 flex-1 rounded-full bg-subtle">
              <div
                className="bar-fill h-2 rounded-full bg-primary"
                style={{ width: `${tierShare(badge) * 100}%` }}
              />
            </div>
            <span className="shrink-0 text-xs text-muted tabular-nums">
              {formatBadgeValue(badge.badge.id, badge.value, settings)} /{' '}
              {formatBadgeValue(badge.badge.id, next.threshold, settings)}
            </span>
          </div>
        </div>
      )}
      <Link
        to={ACHIEVEMENTS_PATH}
        state={FROM_DASHBOARD}
        className="mt-1 flex min-h-11 items-center gap-0.5 text-sm font-semibold text-primary-text"
      >
        Alle Erfolge
        <ChevronRightIcon className="h-4 w-4" />
      </Link>
    </Card>
  );
}
