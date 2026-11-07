import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFromHere } from '../../components/backNavigation';
import { primaryButton, secondaryButton } from '../../components/buttons';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Card } from '../../components/Page';
import { startPlanWorkout, type ActivePlanSuggestion, type PlanDayDetail } from '../../db/plans';
import { startWorkout } from '../../db/workouts';
import { formatAdjustment, formatBlockWeek, workoutBlockFor } from '../../domain/blocks';
import { dayKey } from '../../domain/daily';
import type { PlanDaySuggestion } from '../../domain/plans';
import { BlockStatusPanel } from './BlockStatus';
import { PLANS_PATH, TRAINING_PATH, WORKOUT_PATH } from '../training/paths';

function reasonText({ reason, lastDay }: PlanDaySuggestion<PlanDayDetail>): string {
  switch (reason) {
    case 'start':
      return 'Erstes Training des Plans';
    case 'rotation':
      return `Letztes Mal: ${lastDay?.day.name}`;
    case 'today':
      return 'Heute geplant';
    case 'offSchedule':
      return 'Heute ist nichts geplant – als Nächstes dran:';
  }
}

const exerciseNames = ({ items }: PlanDayDetail) =>
  items.map((item) => item.exercise?.name ?? 'Unbekannte Übung').join(', ');

/**
 * Vorschlag fürs heutige Training: bestätigen, anderes Training wählen oder frei trainieren.
 * `compact` (Dashboard): Die weitere Auswahl liegt hinter einem Link zur Trainingsseite.
 */
export function PlanSuggestionCard({
  active,
  compact = false,
}: {
  active: ActivePlanSuggestion;
  compact?: boolean;
}) {
  const navigate = useNavigate();
  const from = useFromHere();
  const [choosing, setChoosing] = useState(false);
  // Gestartet wird erst nach der Rückfrage: ein Training bzw. 'free' für das freie Training
  const [pending, setPending] = useState<PlanDayDetail | 'free' | null>(null);
  const { plan, days, suggestion } = active;
  const planPath = `${PLANS_PATH}/${plan.id}`;
  const today = dayKey(new Date());
  const block = workoutBlockFor(plan, today);
  const blockLine = block && (
    <span className="mt-2 block text-sm">
      {formatBlockWeek(block)}
      {block.adjusted && ` · ${formatAdjustment(block)}`}
    </span>
  );

  const start = async () => {
    if (pending === 'free') await startWorkout();
    else if (pending) await startPlanWorkout(pending.day.id);
    navigate(WORKOUT_PATH, { state: compact ? from : undefined });
  };

  const confirm = pending && (
    <ConfirmDialog
      title={pending === 'free' ? 'Freies Training starten?' : `${pending.day.name} starten?`}
      confirmLabel="Starten"
      onConfirm={() => void start()}
      onCancel={() => setPending(null)}
    >
      {pending === 'free' ? (
        'Du startest ein leeres Workout und fügst die Übungen selbst hinzu.'
      ) : (
        <>
          {exerciseNames(pending) || 'Dieses Training hat noch keine Übungen.'}
          {blockLine}
        </>
      )}
    </ConfirmDialog>
  );

  if (!suggestion) {
    return (
      <Card title={plan.name}>
        <p className="mb-3 text-slate-600 dark:text-slate-400">
          Dieser Plan hat noch keine Übungen.
        </p>
        <div className="flex flex-col gap-2">
          <Link to={planPath} className={primaryButton}>
            Plan bearbeiten
          </Link>
          <button type="button" className={secondaryButton} onClick={() => setPending('free')}>
            Freies Training
          </button>
        </div>
        {confirm}
      </Card>
    );
  }

  const suggested = suggestion.day;

  return (
    <Card title={plan.name}>
      <BlockStatusPanel plan={plan} today={today} />
      <p className="text-sm text-slate-500 dark:text-slate-400">{reasonText(suggestion)}</p>
      <p className="text-xl font-bold">{suggested.day.name}</p>
      <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">{exerciseNames(suggested)}</p>
      <div className="flex flex-col gap-2">
        <button type="button" className={primaryButton} onClick={() => setPending(suggested)}>
          {suggested.day.name} starten
        </button>
        {compact ? (
          <Link to={TRAINING_PATH} className={secondaryButton}>
            Anderes Training
          </Link>
        ) : (
          <>
            <button
              type="button"
              aria-expanded={choosing}
              className={secondaryButton}
              onClick={() => setChoosing(!choosing)}
            >
              Anderes Training wählen
            </button>
            {choosing && (
              <ul aria-label="Trainings des Plans" className="flex flex-col gap-2">
                {days.map((item) => (
                  <li key={item.day.id}>
                    <button
                      type="button"
                      className={secondaryButton}
                      onClick={() => setPending(item)}
                    >
                      {item.day.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button type="button" className={secondaryButton} onClick={() => setPending('free')}>
              Freies Training
            </button>
          </>
        )}
      </div>
      {confirm}
    </Card>
  );
}
