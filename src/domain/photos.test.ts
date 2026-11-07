import { describe, expect, it } from 'vitest';
import type { PhotoPose } from '../db/types';
import {
  base64ToBytes,
  bytesToBase64,
  defaultComparison,
  fitWithin,
  formatBytes,
  formatPhotoGap,
  groupPhotosByDate,
  photoLabel,
  weightNear,
} from './photos';

const photo = (
  id: string,
  date: string,
  pose: PhotoPose = 'front',
  createdAt = `${date}T08:00`,
) => ({
  id,
  date,
  pose,
  createdAt,
});

describe('fitWithin', () => {
  it('verkleinert proportional nach der längeren Seite', () => {
    expect(fitWithin(4000, 3000, 1600)).toEqual({ width: 1600, height: 1200 });
    expect(fitWithin(3024, 4032, 1600)).toEqual({ width: 1200, height: 1600 });
  });

  it('vergrößert kleine Bilder nicht', () => {
    expect(fitWithin(800, 600, 1600)).toEqual({ width: 800, height: 600 });
  });
});

describe('Gruppen und Vergleich', () => {
  const photos = [
    photo('a', '2026-10-01'),
    photo('b', '2026-11-01', 'side'),
    photo('c', '2026-11-01', 'front', '2026-11-01T07:00'),
    photo('d', '2026-10-15', 'side'),
  ];

  it('gruppiert neueste Tage zuerst, innerhalb des Tages nach Aufnahme', () => {
    expect(
      groupPhotosByDate(photos).map((group) => [group.date, group.photos.map((p) => p.id)]),
    ).toEqual([
      ['2026-11-01', ['c', 'b']],
      ['2026-10-15', ['d']],
      ['2026-10-01', ['a']],
    ]);
  });

  it('schlägt ältestes und neuestes Foto vor, auf Wunsch je Ansicht', () => {
    expect(defaultComparison(photos)?.map((p) => p.id)).toEqual(['a', 'c']);
    expect(defaultComparison(photos, 'side')?.map((p) => p.id)).toEqual(['d', 'b']);
    expect(defaultComparison(photos, 'back')).toBeNull();
    expect(defaultComparison([photos[0]!])).toBeNull();
  });

  it('beschreibt den Abstand', () => {
    expect(formatPhotoGap('2026-11-01', '2026-11-01')).toBe('am selben Tag');
    expect(formatPhotoGap('2026-11-01', '2026-11-02')).toBe('1 Tag später');
    expect(formatPhotoGap('2026-11-07', '2026-10-01')).toBe('37 Tage später');
    expect(formatPhotoGap('2026-01-01', '2026-11-01')).toBe('43 Wochen später');
  });

  it('benennt Fotos', () => {
    expect(photoLabel({ pose: 'side', date: '2026-11-01' })).toBe('Foto Seite, 01.11.2026');
  });
});

describe('weightNear', () => {
  const weights = [
    { date: '2026-10-01', weightKg: 84 },
    { date: '2026-10-28', weightKg: 82 },
    { date: '2026-11-03', weightKg: 81 },
  ];

  it('nimmt den Tag selbst oder das nächstgelegene Gewicht', () => {
    expect(weightNear(weights, '2026-11-03')?.weightKg).toBe(81);
    expect(weightNear(weights, '2026-11-01')?.weightKg).toBe(81);
    expect(weightNear(weights, '2026-10-30')?.weightKg).toBe(82);
  });

  it('nicht weiter als eine Woche entfernt', () => {
    expect(weightNear(weights, '2026-10-15')).toBeNull();
    expect(weightNear([], '2026-10-15')).toBeNull();
  });
});

describe('Bytes', () => {
  it('formatiert Größen', () => {
    expect(formatBytes(300)).toBe('1 KB');
    expect(formatBytes(250 * 1024)).toBe('250 KB');
    expect(formatBytes(3.4 * 1024 * 1024)).toBe('3,4 MB');
    expect(formatBytes(2 * 1024 ** 3)).toBe('2 GB');
  });

  it('wandelt Base64 hin und zurück, auch große Daten', () => {
    const bytes = new Uint8Array(100_000).map((_, i) => (i * 7) % 256);
    const text = bytesToBase64(bytes);
    expect(base64ToBytes(text)).toEqual(bytes);
    expect(bytesToBase64(new Uint8Array([104, 105]))).toBe('aGk=');
  });
});
