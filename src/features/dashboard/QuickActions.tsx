import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { BackState } from '../../components/backNavigation';
import { Dialog } from '../../components/Dialog';
import { Card } from '../../components/Page';
import { Stepper } from '../../components/Stepper';
import { showToast } from '../../components/toastStore';
import { addProtein, addWater, updateDailyLog } from '../../db/daily';
import { loadNutritionDay } from '../../db/nutrition';
import { dayGoal, dayNutrients } from '../../domain/nutrition';
import { MAX_BODY_WEIGHT_KG, MAX_STEPS, MIN_BODY_WEIGHT_KG } from '../../db/schemas';
import { ENDURANCE_SPORTS, type DayKey, type QuickAction, type Settings } from '../../db/types';
import { formatDecimal } from '../../domain/format';
import {
  DASHBOARD_WIDGET_LABELS,
  ENDURANCE_SPORT_LABELS,
  QUICK_ACTION_LABELS,
} from '../../domain/labels';
import { displayToKg, kgToDisplay, roundTo } from '../../domain/units';
import { MEASUREMENTS_PATH } from '../daily/paths';
import { TodoAddForm } from '../daily/TodoParts';
import { useDailyLog } from '../daily/useDaily';
import { newSessionPath } from '../endurance/paths';
import { NUTRITION_PATH } from '../nutrition/paths';
import { JOURNAL_PATH, PHOTOS_PATH, READING_PATH, TIMER_PATH } from '../self/paths';
import { SUPPLEMENTS_PATH } from '../supplements/paths';
import { useActiveWorkout } from '../training/useWorkouts';

const WATER_ML = 250;
const PROTEIN_G = 20;
const FROM_DASHBOARD: BackState = { from: '/' };
const TILE =
  'flex min-h-20 flex-col items-center justify-center gap-1 rounded-xl bg-slate-100 px-2 py-2 text-center text-sm font-semibold active:bg-slate-200 dark:bg-slate-700 dark:active:bg-slate-600';

type OpenDialog = 'weight' | 'steps' | 'todo' | 'endurance' | null;

/** Widget „Schnellzugriff“: Buttons laut `Settings.quickActions` */
export function QuickActions({ settings, today }: { settings: Settings; today: DayKey }) {
  const [open, setOpen] = useState<OpenDialog>(null);
  const activeWorkout = useActiveWorkout();
  const log = useDailyLog(today);
  const water = log?.waterMl ?? 0;

  const tile = (action: QuickAction, content?: { name: string; icon: string }) => {
    const { name, icon } = content ?? QUICK_ACTION_LABELS[action];
    return (
      <>
        <span aria-hidden="true" className="text-2xl">
          {icon}
        </span>
        <span>{name}</span>
      </>
    );
  };

  const renderAction = (action: QuickAction): ReactNode => {
    switch (action) {
      case 'training':
        return activeWorkout ? (
          <Link to="/training/workout" state={FROM_DASHBOARD} className={TILE}>
            {tile(action, { name: 'Fortsetzen', icon: '▶️' })}
          </Link>
        ) : (
          <Link to="/training" className={TILE}>
            {tile(action)}
          </Link>
        );
      case 'water':
        return (
          <button
            type="button"
            className={TILE}
            onClick={() => {
              void addWater(today, WATER_ML);
              showToast({
                variant: 'info',
                title: `+${WATER_ML} ml Wasser`,
                lines: [
                  `${formatDecimal(water + WATER_ML, 0)} von ${formatDecimal(settings.waterGoalMl, 0)} ml`,
                ],
              });
            }}
          >
            {tile(action)}
          </button>
        );
      case 'protein':
        return (
          <button
            type="button"
            className={TILE}
            onClick={async () => {
              await addProtein(today, PROTEIN_G);
              const day = await loadNutritionDay(today);
              const total = dayNutrients(day.entries, day.quickProteinGrams).protein;
              showToast({
                variant: 'info',
                title: `+${PROTEIN_G} g Protein`,
                lines: [
                  `${formatDecimal(Math.round(total), 0)} von ${formatDecimal(dayGoal(settings, day).protein, 0)} g heute`,
                ],
              });
            }}
          >
            {tile(action)}
          </button>
        );
      case 'measurements':
        return (
          <Link to={MEASUREMENTS_PATH} state={FROM_DASHBOARD} className={TILE}>
            {tile(action)}
          </Link>
        );
      case 'supplements':
        return (
          <Link to={SUPPLEMENTS_PATH} state={FROM_DASHBOARD} className={TILE}>
            {tile(action)}
          </Link>
        );
      case 'meal':
        return (
          <Link to={NUTRITION_PATH} state={FROM_DASHBOARD} className={TILE}>
            {tile(action)}
          </Link>
        );
      case 'journal':
        return (
          <Link to={JOURNAL_PATH} state={FROM_DASHBOARD} className={TILE}>
            {tile(action)}
          </Link>
        );
      case 'reading':
        return (
          <Link to={READING_PATH} state={FROM_DASHBOARD} className={TILE}>
            {tile(action)}
          </Link>
        );
      case 'timer':
        return (
          <Link to={TIMER_PATH} state={FROM_DASHBOARD} className={TILE}>
            {tile(action)}
          </Link>
        );
      case 'photo':
        return (
          <Link to={PHOTOS_PATH} state={FROM_DASHBOARD} className={TILE}>
            {tile(action)}
          </Link>
        );
      case 'weight':
      case 'steps':
      case 'todo':
      case 'endurance':
        return (
          <button type="button" className={TILE} onClick={() => setOpen(action)}>
            {tile(action)}
          </button>
        );
    }
  };

  const unit = settings.weightUnit;
  const toDisplay = (kg: number) => roundTo(kgToDisplay(kg, unit), 1);

  return (
    <Card title={DASHBOARD_WIDGET_LABELS.quickActions.name}>
      {settings.quickActions.length === 0 ? (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Keine Buttons gewählt. Über „Anpassen“ wählst du sie aus.
        </p>
      ) : (
        <ul aria-label="Schnellzugriff" className="grid grid-cols-3 gap-2">
          {settings.quickActions.map((action) => (
            <li key={action} className="grid">
              {renderAction(action)}
            </li>
          ))}
        </ul>
      )}

      {open === 'weight' && (
        <Dialog title="Gewicht heute" onClose={() => setOpen(null)}>
          <Stepper
            label="Körpergewicht heute"
            value={log?.weightKg == null ? null : toDisplay(log.weightKg)}
            unit={unit}
            step={0.1}
            min={toDisplay(MIN_BODY_WEIGHT_KG)}
            max={toDisplay(MAX_BODY_WEIGHT_KG)}
            startValue={toDisplay(settings.bodyWeightKg ?? 75)}
            allowEmpty
            onChange={(value) =>
              void updateDailyLog(today, {
                weightKg: value === null ? null : displayToKg(value, unit),
              })
            }
          />
        </Dialog>
      )}
      {open === 'steps' && (
        <Dialog title="Schritte heute" onClose={() => setOpen(null)}>
          <Stepper
            label="Schritte gesamt"
            value={log?.steps ?? 0}
            step={500}
            max={MAX_STEPS}
            decimals={0}
            onChange={(value) => value !== null && void updateDailyLog(today, { steps: value })}
          />
        </Dialog>
      )}
      {open === 'todo' && (
        <Dialog title="Neue Aufgabe" onClose={() => setOpen(null)}>
          <TodoAddForm today={today} withPicker onAdded={() => setOpen(null)} />
        </Dialog>
      )}
      {open === 'endurance' && (
        <Dialog title="Ausdauer erfassen" onClose={() => setOpen(null)}>
          <ul aria-label="Sportarten" className="grid grid-cols-2 gap-2">
            {ENDURANCE_SPORTS.map((sport) => (
              <li key={sport} className="grid">
                <Link to={newSessionPath(sport)} state={FROM_DASHBOARD} className={TILE}>
                  <span aria-hidden="true" className="text-2xl">
                    {ENDURANCE_SPORT_LABELS[sport].icon}
                  </span>
                  <span>{ENDURANCE_SPORT_LABELS[sport].name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Dialog>
      )}
    </Card>
  );
}
