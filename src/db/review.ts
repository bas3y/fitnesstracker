import type { ReviewInput } from '../domain/review';
import { listDailyLogs } from './daily';
import { db } from './database';
import { listEnduranceSessions } from './endurance';
import { loadHabits } from './habits';
import { listJournalEntries } from './journal';
import { listBooks, listReadingLogs } from './reading';
import { getBodyWeightKg } from './records';
import { loadStatsSessions } from './stats';
import type { DayKey } from './types';

/** Alles für den Rückblick; Mahlzeiten nur von `from` bis `to` */
export async function loadReviewInput(from: DayKey, to: DayKey): Promise<ReviewInput> {
  const [strength, endurance, logs, habits, meals, bodyWeightKg, journal, readingLogs, books] =
    await Promise.all([
      loadStatsSessions(),
      listEnduranceSessions(),
      listDailyLogs(),
      loadHabits(),
      db.mealEntries
        .where('date')
        .between(from, to, true, true)
        .filter((entry) => entry.deletedAt === null)
        .toArray(),
      getBodyWeightKg(),
      listJournalEntries(),
      listReadingLogs(),
      listBooks(),
    ]);
  return { strength, endurance, logs, habits, meals, bodyWeightKg, journal, readingLogs, books };
}
