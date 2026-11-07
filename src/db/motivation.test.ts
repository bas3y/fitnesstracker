import { db } from './database';
import { updateDailyLog } from './daily';
import { createUserExercise } from './exercises';
import { addGoalEntry, createGoal, deleteGoal } from './goals';
import { saveJournalEntry } from './journal';
import { checkCelebrations, loadMotivation, setTrainingWeekTarget } from './motivation';
import { EMPTY_EXERCISE_INPUT, emptyGoalInput } from './schemas';
import { getSettings } from './settings';
import { resetDatabase } from './testUtils';
import {
  addWorkoutExercise,
  completeSet,
  finishWorkout,
  startWorkout,
  updateSet,
} from './workouts';

const TODAY = '2026-11-07';

beforeEach(resetDatabase);

async function finishedWorkout() {
  const exercise = await createUserExercise({
    ...EMPTY_EXERCISE_INPUT,
    name: `Bank ${Math.random()}`,
    primaryMuscles: ['chest'],
  });
  const workout = await startWorkout();
  await addWorkoutExercise(workout.id, exercise.id);
  const [set] = await db.sets.where('workoutId').equals(workout.id).toArray();
  await updateSet(set!.id, { weight: 80, reps: 5 });
  await completeSet(set!.id, 0);
  await finishWorkout(workout.id, '');
}

describe('loadMotivation', () => {
  it('lädt Journal-Tage (ohne Wochen), Protein, Einstellungen', async () => {
    await saveJournalEntry('day', '2026-11-05', {
      text: 'Gut',
      gratitude: [],
      answers: {},
      rating: null,
    });
    await saveJournalEntry('week', '2026-11-05', {
      text: 'Woche',
      gratitude: [],
      answers: {},
      rating: 4,
    });
    await updateDailyLog('2026-11-06', { proteinGrams: 40 });
    await updateDailyLog('2026-11-07', { steps: 1000 });
    await setTrainingWeekTarget(3);

    const { data, goals } = await loadMotivation();
    expect(data.journalDays).toEqual(['2026-11-05']);
    expect(data.quickProtein).toEqual([{ date: '2026-11-06', proteinGrams: 40 }]);
    expect(data.trainingWeekTarget).toBe(3);
    expect(data.photoDays).toEqual([]);
    expect(goals).toEqual([]);
  });

  it('prüft das Wochenziel', async () => {
    await expect(setTrainingWeekTarget(0)).rejects.toThrow();
    await expect(setTrainingWeekTarget(1.5)).rejects.toThrow();
  });
});

describe('checkCelebrations', () => {
  it('der erste Abgleich meldet nichts, danach jede neue Stufe einmal', async () => {
    await finishedWorkout();
    expect(await checkCelebrations(TODAY)).toBeNull();
    expect((await getSettings())?.celebrations).toEqual({ badges: { workouts: 1 }, goals: {} });
    expect(await checkCelebrations(TODAY)).toBeNull();

    const goal = await createGoal({
      ...emptyGoalInput('custom', '2026-11-01'),
      title: 'Führerschein',
      customType: 'check',
      target: 1,
    });
    await addGoalEntry(goal.id, 1, '2026-11-07');
    expect(await checkCelebrations(TODAY)).toEqual({
      title: 'Geschafft!',
      lines: ['🎯 Führerschein', '🎯 Ziele: Erstes Ziel erreicht'],
    });
    expect(await checkCelebrations(TODAY)).toBeNull();

    // Gelöschtes Ziel fällt heraus, die Abzeichen-Stufe bleibt gemerkt
    await deleteGoal(goal.id);
    expect(await checkCelebrations(TODAY)).toBeNull();
    expect((await getSettings())?.celebrations).toEqual({
      badges: { workouts: 1, goals: 1 },
      goals: {},
    });
  });
});
