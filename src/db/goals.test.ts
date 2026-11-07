import { updateDailyLog } from './daily';
import { createEnduranceSession } from './endurance';
import { createUserExercise } from './exercises';
import { createGoal, deleteGoal, listGoals, loadGoal, loadGoalData, updateGoal } from './goals';
import { EMPTY_EXERCISE_INPUT, emptyGoalInput } from './schemas';
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

    const data = await loadGoalData();
    expect(data.strength).toMatchObject([{ exercise: { name: 'Bank' }, sets: [{ weight: 80 }] }]);
    expect(data.endurance).toMatchObject([{ distanceMeters: 5000 }]);
    expect(data.weights).toEqual([{ date: '2026-11-01', weightKg: 82 }]);
  });
});
