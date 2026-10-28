/** ISO-8601-Zeitstempel, z. B. `2026-10-28T09:15:00.000Z` */
export type Timestamp = string;

export interface BaseEntity {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  /** Soft-Delete: `null` = aktiv */
  deletedAt: Timestamp | null;
}

export type WeightUnit = 'kg' | 'lb';
export type DistanceUnit = 'km' | 'mi';
export type ThemePreference = 'system' | 'light' | 'dark';

export interface Settings extends BaseEntity {
  name: string;
  weightUnit: WeightUnit;
  distanceUnit: DistanceUnit;
  bodyWeightKg: number | null;
  theme: ThemePreference;
  lastBackupAt: Timestamp | null;
}
