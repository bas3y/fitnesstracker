import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { primaryButton, secondaryButton } from '../../components/buttons';
import { Card } from '../../components/Page';
import { startPlanWorkout, type ActivePlanSuggestion, type PlanDayDetail } from '../../db/plans';
import { startWorkout } from '../../db/workouts';
import type { PlanDaySuggestion } from '../../domain/plans';
import { PLANS_PATH, WORKOUT_PATH } from '../training/paths';

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

/** Vorschlag fürs heutige Training: bestätigen, anderes Training wählen oder frei trainieren */
export function PlanSuggestionCard({ active }: { active: ActivePlanSuggestion }) {
  const navigate = useNavigate();
  const [choosing, setChoosing] = useState(false);
  const { plan, days, suggestion } = active;
  const planPath = `${PLANS_PATH}/${plan.id}`;

  const startDay = async (id: string) => {
    await startPlanWorkout(id);
    navigate(WORKOUT_PATH);
  };
  const startFree = async () => {
    await startWorkout();
    navigate(WORKOUT_PATH);
  };

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
          <button type="button" className={secondaryButton} onClick={() => void startFree()}>
            Freies Training
          </button>
        </div>
      </Card>
    );
  }

  const { day, items } = suggestion.day;
  const names = items.map((item) => item.exercise?.name ?? 'Unbekannte Übung');

  return (
    <Card title={plan.name}>
      <p className="text-sm text-slate-500 dark:text-slate-400">{reasonText(suggestion)}</p>
      <p className="text-xl font-bold">{day.name}</p>
      <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">{names.join(', ')}</p>
      <div className="flex flex-col gap-2">
        <button type="button" className={primaryButton} onClick={() => void startDay(day.id)}>
          {day.name} starten
        </button>
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
                  onClick={() => void startDay(item.day.id)}
                >
                  {item.day.name}
                </button>
              </li>
            ))}
          </ul>
        )}
        <button type="button" className={secondaryButton} onClick={() => void startFree()}>
          Freies Training
        </button>
      </div>
    </Card>
  );
}
