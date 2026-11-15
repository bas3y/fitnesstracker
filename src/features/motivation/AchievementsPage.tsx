import { useMemo, useState } from 'react';
import { useBackTo } from '../../components/backNavigation';
import { InfoButton } from '../../components/InfoButton';
import { Card, Page } from '../../components/Page';
import { Stepper } from '../../components/Stepper';
import { setTrainingWeekTarget } from '../../db/motivation';
import { MAX_TRAINING_WEEK_TARGET } from '../../db/schemas';
import { BADGE_CATEGORIES, BADGE_CATEGORY_LABELS, type BadgeId } from '../../domain/badges';
import { dayKey } from '../../domain/daily';
import { useSettings } from '../settings/useSettings';
import { BadgeDialog, BadgeTile, StreakRow } from './MotivationParts';
import { useMotivation } from './useMotivation';

const HINT = 'text-sm text-muted';

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
      <Card
        title="Serien"
        info={
          <>
            <p>
              Trainiere, erreiche deine Tagesziele, schreib Journal oder hak Gewohnheiten ab – hier
              siehst du, wie viele Tage am Stück du dranbleibst.
            </p>
            <p>
              Heute noch offen unterbricht keine Serie. Tagesziele zählen mit den aktuellen Zielen
              aus den Einstellungen.
            </p>
          </>
        }
      >
        {streaks.length === 0 ? (
          <p className={HINT}>Noch keine Serien.</p>
        ) : (
          <ul aria-label="Serien" className="divide-y divide-line">
            {streaks.map((item) => (
              <StreakRow key={item.key} item={item} trainingWeekTarget={trainingWeekTarget} />
            ))}
          </ul>
        )}
      </Card>
      <Card
        title="Trainingsserie"
        info={
          <p>
            Eine Woche (Mo–So) hält die Serie, wenn du so oft trainierst. Krafttrainings und
            Ausdauer-Einheiten zählen beide.
          </p>
        }
      >
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
      </Card>
      <section aria-labelledby="badges-heading" className="mb-4">
        <div className="mb-3 flex items-center gap-1">
          <h2 id="badges-heading" className="text-lg font-semibold">
            Abzeichen
          </h2>
          <InfoButton title="Abzeichen" className="-my-2.5 mr-auto">
            <p>
              Abzeichen werden aus deinen Einträgen berechnet. Neue Stufen meldet die App mit einem
              Hinweis. Antippen zeigt, was für die nächste Stufe fehlt.
            </p>
          </InfoButton>
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
      </section>
      {open && <BadgeDialog state={open} units={settings} onClose={() => setOpenBadge(null)} />}
    </Page>
  );
}
