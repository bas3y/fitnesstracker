import { useMemo, useState } from 'react';
import { useBackTo } from '../../components/backNavigation';
import { Card, Page } from '../../components/Page';
import { Stepper } from '../../components/Stepper';
import { setTrainingWeekTarget } from '../../db/motivation';
import { MAX_TRAINING_WEEK_TARGET } from '../../db/schemas';
import { BADGE_CATEGORIES, BADGE_CATEGORY_LABELS, type BadgeId } from '../../domain/badges';
import { dayKey } from '../../domain/daily';
import { useSettings } from '../settings/useSettings';
import { BadgeDialog, BadgeTile, StreakRow } from './MotivationParts';
import { useMotivation } from './useMotivation';

const HINT = 'text-sm text-slate-500 dark:text-slate-400';

export function AchievementsPage() {
  const backTo = useBackTo('/stats');
  const today = useMemo(() => dayKey(new Date()), []);
  const view = useMotivation(today);
  const settings = useSettings();
  const [openBadge, setOpenBadge] = useState<BadgeId | null>(null);

  if (!view || !settings) {
    return (
      <Page title="Erfolge" backTo={backTo}>
        {null}
      </Page>
    );
  }

  const { streaks, badges, trainingWeekTarget } = view;
  const unlocked = badges.reduce((sum, state) => sum + state.level, 0);
  const total = badges.reduce((sum, state) => sum + state.tiers.length, 0);
  const open = badges.find((state) => state.badge.id === openBadge);

  return (
    <Page title="Erfolge" backTo={backTo}>
      <Card title="Serien">
        {streaks.length === 0 ? (
          <p className={HINT}>
            Noch keine Serien. Trainiere, erreiche deine Tagesziele, schreib Journal oder hak
            Gewohnheiten ab – dann siehst du hier, wie viele Tage am Stück du dranbleibst.
          </p>
        ) : (
          <ul aria-label="Serien" className="divide-y divide-slate-100 dark:divide-slate-700">
            {streaks.map((item) => (
              <StreakRow key={item.key} item={item} trainingWeekTarget={trainingWeekTarget} />
            ))}
          </ul>
        )}
        <p className={`${HINT} mt-2`}>
          Heute noch offen unterbricht keine Serie. Tagesziele zählen mit den aktuellen Zielen aus
          den Einstellungen.
        </p>
      </Card>
      <Card title="Trainingsserie">
        <Stepper
          label="Trainings pro Woche"
          value={trainingWeekTarget}
          step={1}
          min={1}
          max={MAX_TRAINING_WEEK_TARGET}
          decimals={0}
          onChange={(value) => {
            if (value !== null) void setTrainingWeekTarget(value);
          }}
        />
        <p className={`${HINT} mt-2`}>
          Eine Woche (Mo–So) hält die Serie, wenn du so oft trainierst. Krafttrainings und
          Ausdauer-Einheiten zählen beide.
        </p>
      </Card>
      <section aria-labelledby="badges-heading" className="mb-4">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 id="badges-heading" className="text-lg font-semibold">
            Abzeichen
          </h2>
          <span className={HINT}>
            {unlocked} von {total} Stufen
          </span>
        </div>
        {BADGE_CATEGORIES.map((category) => (
          <Card key={category} title={BADGE_CATEGORY_LABELS[category]}>
            <div
              role="list"
              aria-label={`Abzeichen ${BADGE_CATEGORY_LABELS[category]}`}
              className="grid grid-cols-3 gap-1"
            >
              {badges
                .filter((state) => state.badge.category === category)
                .map((state) => (
                  <div role="listitem" key={state.badge.id} className="min-w-0">
                    <BadgeTile state={state} onOpen={() => setOpenBadge(state.badge.id)} />
                  </div>
                ))}
            </div>
          </Card>
        ))}
        <p className={HINT}>
          Abzeichen werden aus deinen Einträgen berechnet. Neue Stufen meldet die App mit einem
          Hinweis.
        </p>
      </section>
      {open && <BadgeDialog state={open} units={settings} onClose={() => setOpenBadge(null)} />}
    </Page>
  );
}
