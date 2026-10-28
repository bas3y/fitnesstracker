export const BACKUP_REMINDER_DAYS = 7;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function daysSince(timestamp: string, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - Date.parse(timestamp)) / MS_PER_DAY));
}

export interface BackupReminder {
  days: number;
  /** Es wurde noch nie ein Backup erstellt; `days` zählt ab der ersten Nutzung */
  never: boolean;
}

export function getBackupReminder(
  settings: { lastBackupAt: string | null; createdAt: string },
  now: Date,
): BackupReminder | null {
  const reference = settings.lastBackupAt ?? settings.createdAt;
  const days = daysSince(reference, now);
  if (days < BACKUP_REMINDER_DAYS) return null;
  return { days, never: settings.lastBackupAt === null };
}
