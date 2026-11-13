import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFromHere } from '../../components/backNavigation';
import { Icon } from '../../components/icons';
import type { CardTone } from '../../components/Page';
import { updateSettings } from '../../db/settings';
import type { DayKey, Settings } from '../../db/types';
import {
  buildDayHint,
  type DayHint,
  type DayHintAction,
  type DayHintTraining,
} from '../../domain/dayHints';
import { isHabitDoneOn, isHabitShownOn } from '../../domain/habits';
import { dayGoal, dayNutrients } from '../../domain/nutrition';
import { supplementDay } from '../../domain/supplements';
import { BODY_PATH } from '../daily/paths';
import { HABITS_PATH, useHabits } from '../daily/useHabits';
import { useDailyLog } from '../daily/useDaily';
import { NUTRITION_PATH } from '../nutrition/paths';
import { useNutritionDay } from '../nutrition/useNutrition';
import { useActivePlanSuggestion } from '../plans/usePlans';
import { useSupplementOverview } from '../supplements/useSupplements';
import { TRAINING_PATH } from '../training/paths';

const MIDDAY_HOUR = 12;

const ACTION_PATHS: Record<Exclude<DayHintAction, 'workout'>, string> = {
  training: TRAINING_PATH,
  sleep: BODY_PATH,
  nutrition: NUTRITION_PATH,
  habits: HABITS_PATH,
};

const PHASE_TONES: Record<DayHint['phase'], CardTone | undefined> = {
  morning: undefined,
  afterTraining: 'accent',
  evening: 'soft',
};

/**
 * Widget „Tageshinweis“: morgens, nach dem Training und abends eine Karte mit dem Wichtigsten.
 * Nur rendern, wenn `dayHintVisible` – die Daten lädt es erst dann.
 */
export function DayHintWidget({
  settings,
  today,
  now,
  training,
}: {
  settings: Settings;
  today: DayKey;
  now: Date;
  training: DayHintTraining | null;
}) {
  const log = useDailyLog(today);
  const nutritionDay = useNutritionDay(today);
  const plan = useActivePlanSuggestion();
  const supplements = useSupplementOverview();
  const habits = useHabits();
  const from = useFromHere();

  const hint = useMemo(() => {
    if (log === undefined || !nutritionDay || plan === undefined || !supplements || !habits) {
      return undefined;
    }
    const doses = supplementDay(
      supplements.items.filter(({ supplement }) => supplement.archivedAt === null),
      today,
      today,
      supplements.trainingDays,
    ).filter((entry) => entry.status === 'due' && entry.intake === null);
    const names = (entries: typeof doses) => [
      ...new Set(entries.map(({ supplement }) => supplement.name)),
    ];
    const total = dayNutrients(nutritionDay.entries, nutritionDay.quickProteinGrams);
    const goal = dayGoal(settings, nutritionDay);
    const suggestion = plan?.suggestion;
    const trainedToday =
      training !== null && training.endedAt.toDateString() === now.toDateString();
    return buildDayHint(
      {
        now,
        today,
        name: settings.name,
        sleepSeconds: log?.sleepSeconds ?? null,
        sleepGoalSeconds: settings.sleepGoalSeconds,
        waterMl: log?.waterMl ?? 0,
        waterGoalMl: settings.waterGoalMl,
        plannedDay:
          suggestion && !trainedToday
            ? { name: suggestion.day.day.name, scheduled: suggestion.reason === 'today' }
            : null,
        morningSupplements: names(
          doses.filter((entry) => entry.dueAt !== null && entry.dueAt.getHours() < MIDDAY_HOUR),
        ),
        openSupplements: names(doses),
        openHabits: habits
          .filter(
            ({ habit, entries }) =>
              habit.kind !== 'quit' &&
              isHabitShownOn(habit, today) &&
              !isHabitDoneOn(habit, entries, today),
          )
          .map(({ habit }) => habit.name),
        lastTraining: training,
        nutrition: {
          proteinOnly: settings.proteinOnly,
          hasEntries: nutritionDay.entries.length > 0,
          kcal: total.kcal,
          kcalGoal: goal.kcal,
          protein: total.protein,
          proteinGoal: goal.protein,
        },
      },
      settings.dayHintDismissed,
    );
  }, [log, nutritionDay, plan, supplements, habits, settings, today, now, training]);

  if (!hint) return null;
  const tone = PHASE_TONES[hint.phase];
  const action = hint.action;
  const to = action && (action.kind === 'workout' ? action.to : ACTION_PATHS[action.kind]);
  return (
    <section
      aria-labelledby="day-hint-title"
      data-testid="day-hint"
      className={`anim-fade-in rounded-2xl bg-surface p-4 ${tone ? `tone-${tone}` : ''}`}
    >
      <div className="mb-1 flex items-start gap-2">
        <h2 id="day-hint-title" className="min-w-0 flex-1 pt-1.5 text-[1.0625rem] font-semibold">
          {hint.title}
        </h2>
        <button
          type="button"
          aria-label="Tageshinweis ausblenden"
          title="Ausblenden"
          className="-mt-1 -mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full opacity-70 active:bg-current/10"
          onClick={() => void updateSettings({ dayHintDismissed: hint.key })}
        >
          <Icon name="close" className="h-5 w-5" />
        </button>
      </div>
      <ul className="flex flex-col gap-1 text-[0.9375rem] leading-snug">
        {hint.lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      {action && to && (
        <Link
          to={to}
          state={from}
          className="mt-2 inline-flex min-h-11 items-center gap-0.5 text-sm font-semibold underline-offset-2"
        >
          {action.label}
          <Icon name="chevronRight" className="h-4 w-4" />
        </Link>
      )}
    </section>
  );
}
