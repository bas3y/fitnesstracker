import type { DayKey, PhotoPose, ProgressPhoto } from '../db/types';
import type { DatedWeight } from './daily';
import { formatDecimal } from './format';
import { formatGoalDate } from './goals';
import { PHOTO_POSE_LABELS } from './labels';
import { daysBetween } from './periods';

/** Längere Seite des gespeicherten Bilds bzw. der Vorschau in Pixeln */
export const PHOTO_MAX_SIDE = 1600;
export const THUMB_MAX_SIDE = 400;
export const PHOTO_QUALITY = 0.82;
export const THUMB_QUALITY = 0.7;

/** Verkleinert proportional, vergrößert nie */
export function fitWithin(
  width: number,
  height: number,
  maxSide: number,
): { width: number; height: number } {
  const scale = Math.min(1, maxSide / Math.max(width, height, 1));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

type PhotoMeta = Pick<ProgressPhoto, 'id' | 'date' | 'pose' | 'createdAt'>;

/** „Foto Vorne, 01.11.2026“ */
export function photoLabel(photo: Pick<ProgressPhoto, 'pose' | 'date'>): string {
  return `Foto ${PHOTO_POSE_LABELS[photo.pose]}, ${formatGoalDate(photo.date)}`;
}

/** Neueste zuerst, innerhalb eines Tages in Aufnahmereihenfolge */
export function sortPhotos<T extends PhotoMeta>(photos: readonly T[]): T[] {
  return [...photos].sort(
    (a, b) => b.date.localeCompare(a.date) || a.createdAt.localeCompare(b.createdAt),
  );
}

export function groupPhotosByDate<T extends PhotoMeta>(
  photos: readonly T[],
): { date: DayKey; photos: T[] }[] {
  const groups: { date: DayKey; photos: T[] }[] = [];
  for (const photo of sortPhotos(photos)) {
    const last = groups.at(-1);
    if (last?.date === photo.date) last.photos.push(photo);
    else groups.push({ date: photo.date, photos: [photo] });
  }
  return groups;
}

/** Vorschlag für den Vergleich: ältestes und neuestes Foto (gleicher Ansicht, falls angegeben) */
export function defaultComparison<T extends PhotoMeta>(
  photos: readonly T[],
  pose: PhotoPose | null = null,
): [T, T] | null {
  const sorted = sortPhotos(photos.filter((photo) => !pose || photo.pose === pose));
  if (sorted.length < 2) return null;
  return [sorted.at(-1)!, sorted[0]!];
}

/** „am selben Tag“, „1 Tag später“, „42 Tage später“, „12 Wochen später“ */
export function formatPhotoGap(from: DayKey, to: DayKey): string {
  const [first, second] = from <= to ? [from, to] : [to, from];
  const days = daysBetween(first, second) - 1;
  if (days === 0) return 'am selben Tag';
  if (days === 1) return '1 Tag später';
  if (days < 60) return `${days} Tage später`;
  return `${Math.round(days / 7)} Wochen später`;
}

/** Gewicht am Tag des Fotos, sonst das nächstgelegene innerhalb von `maxDays` Tagen */
export function weightNear(
  weights: readonly DatedWeight[],
  date: DayKey,
  maxDays = 7,
): DatedWeight | null {
  let best: DatedWeight | null = null;
  let bestGap = Infinity;
  for (const weight of weights) {
    const distance = Math.abs(daysBetween(weight.date, date) - 1);
    if (distance <= maxDays && distance < bestGap) {
      best = weight;
      bestGap = distance;
    }
  }
  return best;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  if (bytes < 1024 ** 3) return `${formatDecimal(bytes / 1024 ** 2, 1)} MB`;
  return `${formatDecimal(bytes / 1024 ** 3, 1)} GB`;
}

// ---------- Backup ----------

const CHUNK = 0x8000;

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

export function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
