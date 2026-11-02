import { useNavigate, useParams } from 'react-router-dom';
import { Card, Page } from '../../components/Page';
import { createHabit, updateHabit } from '../../db/habits';
import { EMPTY_HABIT_INPUT } from '../../db/schemas';
import { HabitForm } from './HabitForm';
import { HABITS_PATH, useHabit } from './useHabits';

export function HabitCreatePage() {
  const navigate = useNavigate();
  return (
    <Page title="Neue Gewohnheit" backTo={HABITS_PATH}>
      <HabitForm
        initial={EMPTY_HABIT_INPUT}
        submitLabel="Anlegen"
        onSubmit={async (input) => {
          await createHabit(input);
          navigate(HABITS_PATH, { replace: true });
        }}
        onCancel={() => navigate(HABITS_PATH)}
      />
    </Page>
  );
}

export function HabitEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const item = useHabit(id);
  const detailPath = `${HABITS_PATH}/${id ?? ''}`;

  if (item === undefined) return <Page title="Gewohnheit bearbeiten">{null}</Page>;
  if (item === null) {
    return (
      <Page title="Gewohnheit bearbeiten" backTo={HABITS_PATH}>
        <Card>
          <p className="text-slate-600 dark:text-slate-400">
            Diese Gewohnheit existiert nicht mehr.
          </p>
        </Card>
      </Page>
    );
  }

  const { name, icon, kind, target, unit, step, items, startDate } = item.habit;
  const { frequency, timesPerWeek, weekdays, group } = item.habit;
  return (
    <Page title="Gewohnheit bearbeiten" backTo={detailPath}>
      <HabitForm
        initial={{
          name,
          icon,
          kind,
          target,
          unit,
          step,
          items,
          startDate,
          frequency,
          timesPerWeek,
          weekdays,
          group,
        }}
        submitLabel="Speichern"
        onSubmit={async (input) => {
          await updateHabit(item.habit.id, input);
          navigate(detailPath, { replace: true });
        }}
        onCancel={() => navigate(detailPath)}
      />
    </Page>
  );
}
