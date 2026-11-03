import type { EnduranceSport, TrackLap } from '../../db/types';
import { emptyActivity, ImportFileError, type ParsedActivity, type TrackPoint } from './types';

// FIT-Protokoll (Garmin): Header, dann Definitions- und Datennachrichten. Gelesen werden nur die
// Nachrichten und Felder, die die App braucht; alles andere wird übersprungen.

/** 31.12.1989 00:00 UTC */
const FIT_EPOCH_MS = Date.UTC(1989, 11, 31);
const TIMESTAMP_FIELD = 253;
const SEMICIRCLE_TO_DEG = 180 / 2 ** 31;

export const FIT_MESSAGES = { fileId: 0, session: 18, lap: 19, record: 20 } as const;
const WANTED = new Set<number>(Object.values(FIT_MESSAGES));
const ACTIVITY_FILE = 4;

/** Größe je Basistyp (Index = Basistyp-Nummer) */
const BASE_TYPE_SIZES = [1, 1, 1, 2, 2, 4, 4, 1, 4, 8, 1, 2, 4, 1, 8, 8, 8];

export type FitValue = number | string | null;

export interface FitMessage {
  num: number;
  fields: Map<number, FitValue>;
}

interface FieldDefinition {
  num: number;
  size: number;
  baseType: number;
}

interface Definition {
  num: number;
  little: boolean;
  fields: FieldDefinition[];
  /** Bytes der Entwicklerfelder (werden übersprungen) */
  developerSize: number;
}

export function isFit(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 12 &&
    bytes[0]! >= 12 &&
    String.fromCharCode(bytes[8]!, bytes[9]!, bytes[10]!, bytes[11]!) === '.FIT'
  );
}

function readValue(
  view: DataView,
  offset: number,
  { size, baseType }: FieldDefinition,
  little: boolean,
): FitValue {
  const type = baseType & 0x1f;
  if (type === 7) {
    const bytes = new Uint8Array(view.buffer, view.byteOffset + offset, size);
    const end = bytes.indexOf(0);
    const text = new TextDecoder().decode(end === -1 ? bytes : bytes.subarray(0, end));
    return text || null;
  }
  // Arrays: nur das erste Element (die App braucht keine Array-Felder)
  if ((BASE_TYPE_SIZES[type] ?? Infinity) > size) return null;
  switch (type) {
    case 0:
    case 2:
    case 13: {
      const value = view.getUint8(offset);
      return value === 0xff ? null : value;
    }
    case 1: {
      const value = view.getInt8(offset);
      return value === 0x7f ? null : value;
    }
    case 10: {
      const value = view.getUint8(offset);
      return value === 0 ? null : value;
    }
    case 3: {
      const value = view.getInt16(offset, little);
      return value === 0x7fff ? null : value;
    }
    case 4: {
      const value = view.getUint16(offset, little);
      return value === 0xffff ? null : value;
    }
    case 11: {
      const value = view.getUint16(offset, little);
      return value === 0 ? null : value;
    }
    case 5: {
      const value = view.getInt32(offset, little);
      return value === 0x7fffffff ? null : value;
    }
    case 6: {
      const value = view.getUint32(offset, little);
      return value === 0xffffffff ? null : value;
    }
    case 12: {
      const value = view.getUint32(offset, little);
      return value === 0 ? null : value;
    }
    case 8: {
      const value = view.getFloat32(offset, little);
      return Number.isFinite(value) ? value : null;
    }
    case 9: {
      const value = view.getFloat64(offset, little);
      return Number.isFinite(value) ? value : null;
    }
    case 14: {
      const value = view.getBigInt64(offset, little);
      return value === 0x7fffffffffffffffn ? null : Number(value);
    }
    case 15:
    case 16: {
      const value = view.getBigUint64(offset, little);
      return value === 0xffffffffffffffffn || (type === 16 && value === 0n) ? null : Number(value);
    }
    default:
      return null;
  }
}

/** Liest alle Nachrichten, die die App braucht; eine abgeschnittene Datei liefert, was lesbar ist */
export function decodeFitMessages(bytes: Uint8Array): FitMessage[] {
  if (!isFit(bytes)) throw new ImportFileError('Keine FIT-Datei');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const headerSize = bytes[0]!;
  const end = Math.min(headerSize + view.getUint32(4, true), bytes.length);
  const definitions: (Definition | undefined)[] = [];
  const messages: FitMessage[] = [];
  let lastTimestamp = 0;
  let pos = headerSize;

  while (pos < end) {
    const header = bytes[pos++]!;
    if ((header & 0xc0) === 0x40) {
      // Definitionsnachricht
      if (pos + 5 > end) break;
      const little = bytes[pos + 1] === 0;
      const num = view.getUint16(pos + 2, little);
      const count = bytes[pos + 4]!;
      pos += 5;
      if (pos + count * 3 > end) break;
      const fields: FieldDefinition[] = [];
      for (let i = 0; i < count; i++, pos += 3) {
        fields.push({ num: bytes[pos]!, size: bytes[pos + 1]!, baseType: bytes[pos + 2]! });
      }
      let developerSize = 0;
      if (header & 0x20) {
        const devCount = bytes[pos++] ?? 0;
        for (let i = 0; i < devCount; i++, pos += 3) developerSize += bytes[pos + 1] ?? 0;
      }
      definitions[header & 0x0f] = { num, little, fields, developerSize };
      continue;
    }

    // Datennachricht, ggf. mit komprimiertem Zeitstempel im Header
    const compressed = (header & 0x80) !== 0;
    const definition = definitions[compressed ? (header >> 5) & 0x03 : header & 0x0f];
    if (!definition) throw new ImportFileError('FIT-Datei ist beschädigt');
    const size =
      definition.fields.reduce((sum, field) => sum + field.size, 0) + definition.developerSize;
    if (pos + size > end) break;
    const wanted = WANTED.has(definition.num);
    const fields = new Map<number, FitValue>();
    let offset = pos;
    for (const field of definition.fields) {
      if (wanted || field.num === TIMESTAMP_FIELD) {
        fields.set(field.num, readValue(view, offset, field, definition.little));
      }
      offset += field.size;
    }
    pos += size;

    const timestamp = fields.get(TIMESTAMP_FIELD);
    if (typeof timestamp === 'number') {
      lastTimestamp = timestamp;
    } else if (compressed) {
      const timeOffset = header & 0x1f;
      let value = (lastTimestamp & ~0x1f) + timeOffset;
      if (timeOffset < (lastTimestamp & 0x1f)) value += 0x20;
      lastTimestamp = value >>> 0;
      fields.set(TIMESTAMP_FIELD, lastTimestamp);
    }
    if (wanted) messages.push({ num: definition.num, fields });
  }
  return messages;
}

const toMs = (fitSeconds: number) => FIT_EPOCH_MS + fitSeconds * 1000;

function num(message: FitMessage, field: number, scale = 1, offset = 0): number | null {
  const value = message.fields.get(field);
  return typeof value === 'number' ? value / scale - offset : null;
}

/** FIT-Sportart (+ Untersportart) → Aktivität der App */
export function fitSport(sport: number | null, subSport: number | null): EnduranceSport {
  // Untersportarten Beweglichkeit (19), Yoga (43), Pilates (44)
  if (subSport !== null && [19, 43, 44].includes(subSport)) return 'mobility';
  switch (sport) {
    case 1:
      return 'run';
    case 2:
    case 21:
      return 'ride';
    case 5:
      return 'swim';
    case 11:
    case 16:
    case 17:
      return 'hike';
    default:
      return 'other';
  }
}

const MANUFACTURERS: Record<number, string> = {
  1: 'Garmin',
  23: 'Suunto',
  32: 'Wahoo',
};

function toPoint(message: FitMessage): TrackPoint | null {
  const time = num(message, TIMESTAMP_FIELD);
  if (time === null) return null;
  const lat = num(message, 0);
  const lon = num(message, 1);
  const hasPosition = lat !== null && lon !== null && (lat !== 0 || lon !== 0);
  return {
    time: toMs(time),
    lat: hasPosition ? lat * SEMICIRCLE_TO_DEG : null,
    lon: hasPosition ? lon * SEMICIRCLE_TO_DEG : null,
    altitude: num(message, 78, 5, 500) ?? num(message, 2, 5, 500),
    heartRate: num(message, 3),
    distance: num(message, 5, 100),
  };
}

/** Eine Einheit je `session` (Multisport-Dateien enthalten mehrere) */
export function parseFit(bytes: Uint8Array): ParsedActivity[] {
  const messages = decodeFitMessages(bytes);
  const fileId = messages.find((message) => message.num === FIT_MESSAGES.fileId);
  const fileType = fileId ? num(fileId, 0) : null;
  if (fileType !== null && fileType !== ACTIVITY_FILE) {
    throw new ImportFileError('Keine Aktivität (z. B. Strecke oder Tageswerte)');
  }
  const manufacturer = fileId ? num(fileId, 1) : null;
  const device = manufacturer === null ? null : (MANUFACTURERS[manufacturer] ?? null);

  const points = messages
    .filter((message) => message.num === FIT_MESSAGES.record)
    .map(toPoint)
    .filter((point) => point !== null)
    .sort((a, b) => a.time - b.time);
  const laps = messages
    .filter((message) => message.num === FIT_MESSAGES.lap)
    .map((message) => ({
      start: num(message, 2) ?? num(message, TIMESTAMP_FIELD),
      durationSeconds: num(message, 8, 1000) ?? num(message, 7, 1000),
      distanceMeters: num(message, 9, 100),
      avgHeartRate: num(message, 15),
      maxHeartRate: num(message, 16),
    }));
  const sessions = messages.filter((message) => message.num === FIT_MESSAGES.session);

  const activities = sessions.map((session) => {
    const startTime = toMs(num(session, 2) ?? num(session, TIMESTAMP_FIELD) ?? 0);
    const elapsedSeconds = num(session, 7, 1000);
    const end = elapsedSeconds === null ? Infinity : startTime + elapsedSeconds * 1000;
    const inSession = (time: number) =>
      sessions.length === 1 || (time >= startTime - 1000 && time <= end + 1000);
    return emptyActivity('fit', {
      device,
      sport: fitSport(num(session, 5), num(session, 6)),
      startTime,
      timerSeconds: num(session, 8, 1000),
      elapsedSeconds,
      distanceMeters: num(session, 9, 100),
      calories: num(session, 11),
      avgHeartRate: num(session, 16),
      maxHeartRate: num(session, 17),
      elevationGainMeters: num(session, 22),
      poolLengthMeters: num(session, 44, 100),
      lengths: num(session, 47),
      points: points.filter((point) => inSession(point.time)),
      laps: laps
        .filter(
          (lap): lap is typeof lap & { start: number; durationSeconds: number } =>
            lap.start !== null && lap.durationSeconds !== null && inSession(toMs(lap.start)),
        )
        .map(({ start, ...lap }): TrackLap => ({
          ...lap,
          startSeconds: Math.max(0, Math.round((toMs(start) - startTime) / 1000)),
        })),
    });
  });
  if (activities.length > 0) return activities;

  // Ohne Zusammenfassung (z. B. abgebrochene Aufzeichnung): nur aus dem Verlauf
  const first = points[0];
  if (!first) throw new ImportFileError('Die Datei enthält keine Einheit');
  return [emptyActivity('fit', { device, startTime: first.time, points })];
}
