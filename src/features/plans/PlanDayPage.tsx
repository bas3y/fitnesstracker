import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { dangerButton, secondaryButton } from '../../components/buttons';
import { Chip } from '../../components/Chip';
import { Card, Page } from '../../components/Page';
import { SortableList } from '../../components/SortableList';
import { Stepper } from '../../components/Stepper';
import { REST_TIMER_DEFAULTS } from '../../db/settings';
import {
  addPlanExercise,
  removePlanDay,
  removePlanExercise,
  reorderPlanExercises,
  updatePlanDay,
  updatePlanExercise,
  type PlanDayDetail,
  type PlanDayItem,
} from '../../db/plans';
import type { PlanSchedule } from '../../db/types';
import { formatPlanTarget, WEEKDAYS } from '../../domain/plans';
import { formatClock } from '../../domain/workout';
import { useSettings } from '../settings/useSettings';
import { ExercisePicker } from '../training/ExercisePicker';
import { PLANS_PATH } from '../training/paths';
import { NameField } from './NameField';
import { usePlanDayDetail, usePlanDetail } from './usePlans';

export function PlanDayPage() {
  const { id, dayId } = useParams();
  const backTo = `${PLANS_PATH}/${id}`;
  const detail = usePlanDayDetail(dayId);
  const plan = usePlanDetail(id);

  if (detail === undefined || plan === undefined) {
    return (
      <Page title="Training" backTo={backTo}>
        {null}
      </Page>
    );
  }
  if (detail === null || plan === null) {
    return (
      <Page title="Training" backTo={backTo}>
        <Card>
          <p className="text-slate-600 dark:text-slate-400">
            Dieses Training existiert nicht mehr.
          </p>
        </Card>
      </Page>
    );
  }
  return <DayEditor detail={detail} schedule={plan.plan.schedule} backTo={backTo} />;
}

function DayEditor({
  detail,
  schedule,
  backTo,
}: {
  detail: PlanDayDetail;
  schedule: PlanSchedule;
  backTo: string;
}) {
  const { day, items } = detail;
  const navigate = useNavigate();
  const [picking, setPicking] = useState(false);
  const [sorting, setSorting] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const toggleWeekday = (weekday: number) =>
    void updatePlanDay(day.id, {
      weekdays: day.weekdays.includes(weekday)
        ? day.weekdays.filter((value) => value !== weekday)
        : [...day.weekdays, weekday],
    });

  return (
    <Page title={day.name} backTo={backTo}>
      <Card>
        <div className="flex flex-col gap-3">
          <NameField
            label="Name des Trainings"
            value={day.name}
            onSave={(name) => void updatePlanDay(day.id, { name })}
          />
          {schedule === 'weekdays' && (
            <div role="group" aria-label="Wochentage">
              <p className="mb-1 text-sm font-medium">Wochentage</p>
              <div className="flex flex-wrap gap-1">
                {WEEKDAYS.map(({ value, label }) => (
                  <Chip
                    key={value}
                    pressed={day.weekdays.includes(value)}
                    className="px-3"
                    onClick={() => toggleWeekday(value)}
                  >
                    {label}
                  </Chip>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {sorting && items.length > 1 ? (
        <SortableList
          label="Reihenfolge der Übungen"
          items={items.map(({ planExercise, exercise }) => ({
            id: planExercise.id,
            name: exercise?.name ?? 'Unbekannte Übung',
          }))}
          onReorder={(ids) => reorderPlanExercises(day.id, ids)}
          onDone={() => setSorting(false)}
        />
      ) : (
        <>
          {items.length === 0 && (
            <p className="mb-4 text-slate-600 dark:text-slate-400">
              Noch keine Übungen. Füge die erste Übung hinzu.
            </p>
          )}
          {items.length > 1 && (
            <button
              type="button"
              className="min-h-11 text-sm font-medium text-emerald-700 dark:text-emerald-400"
              onClick={() => setSorting(true)}
            >
              ⠿ Reihenfolge ändern
            </button>
          )}
          {items.length > 0 && (
            <ul aria-label="Übungen im Training" className="mb-3 flex flex-col gap-2">
              {items.map((item) => (
                <PlanExerciseRow
                  key={item.planExercise.id}
                  item={item}
                  expanded={expanded === item.planExercise.id}
                  onToggle={() =>
                    setExpanded(expanded === item.planExercise.id ? null : item.planExercise.id)
                  }
                />
              ))}
            </ul>
          )}
          <button
            type="button"
            className={`${secondaryButton} mb-6`}
            onClick={() => setPicking(true)}
          >
            + Übung hinzufügen
          </button>
        </>
      )}

      {confirmDelete ? (
        <div className="mb-4 rounded-xl border border-red-300 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/40">
          <p className="mb-3 text-sm font-medium">„{day.name}“ aus dem Plan löschen?</p>
          <div className="flex gap-2">
            <button
              type="button"
              className={secondaryButton}
              onClick={() => setConfirmDelete(false)}
            >
              Abbrechen
            </button>
            <button
              type="button"
              className={dangerButton}
              onClick={async () => {
                await removePlanDay(day.id);
                navigate(backTo, { replace: true });
              }}
            >
              Löschen
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className={`${dangerButton} mb-4`}
          onClick={() => setConfirmDelete(true)}
        >
          Training löschen
        </button>
      )}

      {picking && (
        <ExercisePicker
          title="Übung hinzufügen"
          onClose={() => setPicking(false)}
          onSelect={async (exercise) => {
            setPicking(false);
            const created = await addPlanExercise(day.id, exercise);
            setExpanded(created.id);
          }}
        />
      )}
    </Page>
  );
}

function PlanExerciseRow({
  item,
  expanded,
  onToggle,
}: {
  item: PlanDayItem;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { planExercise, exercise } = item;
  const settings = useSettings();
  const name = exercise?.name ?? 'Unbekannte Übung';
  const isTimed = exercise?.isTimed ?? false;
  const { id, repMin, repMax, restSeconds, targetSets, targetDurationSeconds } = planExercise;
  const save = (changes: Parameters<typeof updatePlanExercise>[1]) =>
    void updatePlanExercise(id, changes);
  const summary = [
    formatPlanTarget(planExercise, isTimed),
    restSeconds !== null && `Pause ${formatClock(restSeconds)}`,
  ]
    .filter(Boolean)
    .join(' · ');
  const defaultRest = settings?.restTimerSeconds ?? REST_TIMER_DEFAULTS.restTimerSeconds;

  return (
    <li className="rounded-2xl bg-white shadow-sm dark:bg-slate-800">
      <button
        type="button"
        aria-expanded={expanded}
        className="min-h-14 w-full px-4 py-2 text-left"
        onClick={onToggle}
      >
        <span className="block font-medium">{name}</span>
        <span className="block text-sm text-slate-500 tabular-nums dark:text-slate-400">
          {summary}
        </span>
      </button>
      {expanded && (
        <div className="flex flex-col gap-3 border-t border-slate-200 p-4 dark:border-slate-700">
          <Stepper
            label="Sätze"
            value={targetSets}
            step={1}
            min={1}
            max={20}
            decimals={0}
            onChange={(value) => value !== null && save({ targetSets: value })}
          />
          {isTimed ? (
            <Stepper
              label="Zieldauer"
              value={targetDurationSeconds}
              unit="s"
              step={5}
              decimals={0}
              max={24 * 3600}
              startValue={30}
              allowEmpty
              onChange={(value) => save({ targetDurationSeconds: value })}
            />
          ) : (
            <>
              <Stepper
                label="Wdh. von"
                value={repMin}
                step={1}
                min={1}
                max={1000}
                decimals={0}
                onChange={(value) =>
                  value !== null && save({ repMin: value, repMax: Math.max(repMax, value) })
                }
              />
              <Stepper
                label="Wdh. bis"
                value={repMax}
                step={1}
                min={1}
                max={1000}
                decimals={0}
                onChange={(value) =>
                  value !== null && save({ repMax: value, repMin: Math.min(repMin, value) })
                }
              />
            </>
          )}
          <div>
            <Stepper
              label="Pause"
              value={restSeconds}
              unit="s"
              step={15}
              decimals={0}
              max={3600}
              startValue={defaultRest}
              allowEmpty
              onChange={(value) => save({ restSeconds: value })}
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Leer = Standard ({formatClock(defaultRest)})
            </p>
          </div>
          <button
            type="button"
            className="min-h-11 self-end px-2 text-sm font-medium text-red-700 dark:text-red-400"
            onClick={() => void removePlanExercise(id)}
          >
            Aus Training entfernen
          </button>
        </div>
      )}
    </li>
  );
}
