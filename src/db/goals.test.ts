import { updateDailyLog } from './daily';
import { createEnduranceSession } from './endurance';
import { createUserExercise } from './exercises';
import {
  addGoalEntry,
  createGoal,
  deleteGoal,
  listGoals,
  loadGoal,
  loadGoalData,
  setGoalChecked,
  undoGoalEntry,
  updateGoal,
} from './goals';
import { addHabitAmount, createHabit } from './habits';
import { EMPTY_EXERCISE_INPUT, EMPTY_HABIT_INPUT, emptyGoalInput } from './schemas';
import { updateSettings } from './settings';
import { resetDatabase } from './testUtils';
import {
  addWorkoutExercise,
  completeSet,
  finishWorkout,
  startWorkout,
  updateSet,
} from './workouts';
import { db } from './database';

beforeEach(resetDatabase);

describe('Ziele speichern', () => {
  it('legt an, ändert und löscht weich', async () => {
    const goal = await createGoal({
      ...emptyGoalInput('bodyWeight', '2026-11-07'),
      startValue: 90,
      target: 85,
      deadline: '2027-03-01',
    });
    expect(await listGoals()).toMatchObject([{ kind: 'bodyWeight', target: 85, deletedAt: null }]);

    await updateGoal(goal.id, {
      ...emptyGoalInput('bodyWeight', '2026-11-07'),
      startValue: 90,
      target: 83,
      title: 'Sommer',
    });
    expect(await loadGoal(goal.id)).toMatchObject({ target: 83, title: 'Sommer', deadline: null });

    await deleteGoal(goal.id);
    expect(await listGoals()).toEqual([]);
    expect(await loadGoal(goal.id)).toBeNull();
    expect((await db.goals.get(goal.id))?.deletedAt).not.toBeNull();
  });

  it('lehnt ungültige Ziele ab', async () => {
    await expect(createGoal(emptyGoalInput('total', '2026-11-07'))).rejects.toThrow();
    expect(await db.goals.count()).toBe(0);
  });
});

describe('loadGoalData', () => {
  it('lädt beendete Workouts, Einheiten und Gewichte', async () => {
    const exercise = await createUserExercise({
      ...EMPTY_EXERCISE_INPUT,
      name: 'Bank',
      primaryMuscles: ['chest'],
    });
    const workout = await startWorkout();
    await addWorkoutExercise(workout.id, exercise.id);
    const [set] = await db.sets.toArray();
    await updateSet(set!.id, { weight: 80, reps: 5 });
    await completeSet(set!.id, 0);
    await finishWorkout(workout.id, '');
    await createEnduranceSession({
      sport: 'run',
      title: '',
      startedAt: '2026-11-03T17:00:00.000Z',
      durationSeconds: 1800,
      distanceMeters: 5000,
      avgHeartRate: null,
      maxHeartRate: null,
      elevationGainMeters: null,
      calories: null,
      rating: null,
      notes: '',
      gearId: null,
      poolLengthMeters: null,
      laps: null,
      swimStroke: null,
      swolf: null,
    });
    await updateDailyLog('2026-11-01', { weightKg: 82 });

    const habit = await createHabit({
      ...EMPTY_HABIT_INPUT,
      name: 'Lesen',
      kind: 'count',
      target: 10,
    });
    await addHabitAmount(habit.id, '2026-11-02', 15);
    await updateSettings({ stepsGoal: 8000 });
    await updateDailyLog('2026-11-02', { steps: 9000 });

    const data = await loadGoalData();
    expect(data.strength).toMatchObject([{ exercise: { name: 'Bank' }, sets: [{ weight: 80 }] }]);
    expect(data.endurance).toMatchObject([{ distanceMeters: 5000 }]);
    expect(data.weights).toEqual([{ date: '2026-11-01', weightKg: 82 }]);
    expect(data.habits).toMatchObject([
      { habit: { name: 'Lesen' }, entries: [{ date: '2026-11-02', amount: 15 }] },
    ]);
    expect(data.logs).toMatchObject([{ date: '2026-11-01' }, { date: '2026-11-02', steps: 9000 }]);
    expect(data.dailyGoals.stepsGoal).toBe(8000);
  });
});

describe('Eigene Ziele: Fortschritt eintragen', () => {
  const customGoal = (customType: 'number' | 'check') =>
    createGoal({
      ...emptyGoalInput('custom', '2026-11-07'),
      title: 'Spanisch',
      customType,
      target: 50,
    });

  it('trägt Mengen ein und nimmt den letzten Eintrag zurück', async () => {
    const goal = await customGoal('number');
    await addGoalEntry(goal.id, 1, '2026-11-06');
    await addGoalEntry(goal.id, 5, '2026-11-07');
    await expect(addGoalEntry(goal.id, 0)).rejects.toThrow();
    expect((await loadGoalData()).entries).toEqual([
      { goalId: goal.id, date: '2026-11-06', amount: 1 },
      { goalId: goal.id, date: '2026-11-07', amount: 5 },
    ]);

    expect(await undoGoalEntry(goal.id)).toBe(true);
    expect((await loadGoalData()).entries).toMatchObject([{ amount: 1 }]);
    expect(await undoGoalEntry(goal.id)).toBe(true);
    expect(await undoGoalEntry(goal.id)).toBe(false);
  });

  it('hakt Ja/Nein-Ziele ab, höchstens ein Eintrag', async () => {
    const goal = await customGoal('check');
    expect(goal.target).toBe(1);
    await setGoalChecked(goal.id, true, '2026-11-07');
    await setGoalChecked(goal.id, true, '2026-11-07');
    expect((await loadGoalData()).entries).toHaveLength(1);
    await setGoalChecked(goal.id, false);
    expect((await loadGoalData()).entries).toHaveLength(0);
  });

  it('löscht die Einträge mit dem Ziel', async () => {
    const goal = await customGoal('number');
    await addGoalEntry(goal.id, 3);
    await deleteGoal(goal.id);
    expect((await loadGoalData()).entries).toEqual([]);
    expect((await db.goalEntries.toArray())[0]?.deletedAt).not.toBeNull();
  });
});
