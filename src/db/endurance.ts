import { sortSessions } from '../domain/endurance';
import { db, summaryFor } from './database';
import { create, listActive, nowIso, softDelete, update } from './repository';
import {
  enduranceSessionInputSchema,
  gearFieldsSchema,
  type EnduranceSessionInput,
  type GearInput,
} from './schemas';
import type {
  EnduranceImportInfo,
  EnduranceSession,
  EnduranceSource,
  EnduranceTrack,
  Gear,
} from './types';

const isActive = (entity: { deletedAt: string | null }) => entity.deletedAt === null;

/** Alle Einheiten, neueste zuerst */
export async function listEnduranceSessions(): Promise<EnduranceSession[]> {
  return sortSessions(await listActive(db.enduranceSessions));
}

/** `null` = gibt es nicht (mehr) */
export async function loadEnduranceSession(id: string): Promise<EnduranceSession | null> {
  const session = await db.enduranceSessions.get(id);
  return session && isActive(session) ? session : null;
}

export async function createEnduranceSession(
  input: EnduranceSessionInput,
  origin: { source: EnduranceSource; importInfo: EnduranceImportInfo | null } = {
    source: 'manual',
    importInfo: null,
  },
): Promise<EnduranceSession> {
  return create<EnduranceSession>(db.enduranceSessions, {
    ...enduranceSessionInputSchema.parse(input),
    ...origin,
    trackSummary: null,
  });
}

/** Für Einheiten mit Verlauf ohne Zusammenfassung (z. B. aus einer älteren Sicherung) */
export function ensureTrackSummaries(): Promise<void> {
  return db.transaction('rw', db.enduranceSessions, db.enduranceTracks, async () => {
    const missing = await db.enduranceSessions
      .filter((session) => session.deletedAt === null && session.trackSummary === null)
      .toArray();
    if (missing.length === 0) return;
    const tracks = await listActive(db.enduranceTracks);
    for (const session of missing) {
      const trackSummary = summaryFor(session, tracks);
      if (trackSummary) await db.enduranceSessions.update(session.id, { trackSummary });
    }
  });
}

export async function updateEnduranceSession(
  id: string,
  input: EnduranceSessionInput,
): Promise<void> {
  await update(db.enduranceSessions, id, enduranceSessionInputSchema.parse(input));
}

/** Verlauf einer importierten Einheit, `null` = keiner */
export async function loadEnduranceTrack(sessionId: string): Promise<EnduranceTrack | null> {
  const tracks = await db.enduranceTracks.where('sessionId').equals(sessionId).toArray();
  return tracks.find(isActive) ?? null;
}

/** Löscht auch den Verlauf */
export function deleteEnduranceSession(id: string): Promise<void> {
  return db.transaction('rw', db.enduranceSessions, db.enduranceTracks, async () => {
    await softDelete(db.enduranceSessions, id);
    const tracks = await db.enduranceTracks.where('sessionId').equals(id).toArray();
    for (const track of tracks.filter(isActive)) await softDelete(db.enduranceTracks, track.id);
  });
}

// ---------- Ausrüstung ----------

/** Auch ausgemusterte, alphabetisch */
export async function listGear(): Promise<Gear[]> {
  return (await listActive(db.gear)).sort((a, b) => a.name.localeCompare(b.name, 'de'));
}

export async function loadGear(id: string): Promise<Gear | null> {
  const gear = await db.gear.get(id);
  return gear && isActive(gear) ? gear : null;
}

export async function createGear(input: GearInput): Promise<Gear> {
  return create<Gear>(db.gear, { ...gearFieldsSchema.parse(input), archivedAt: null });
}

export async function updateGear(id: string, input: GearInput): Promise<void> {
  await update(db.gear, id, gearFieldsSchema.parse(input));
}

export function setGearArchived(id: string, archived: boolean): Promise<void> {
  return update(db.gear, id, { archivedAt: archived ? nowIso() : null });
}

/** Einheiten bleiben erhalten, verlieren aber die Zuordnung */
export function deleteGear(id: string): Promise<void> {
  return db.transaction('rw', db.gear, db.enduranceSessions, async () => {
    await softDelete(db.gear, id);
    const sessions = await db.enduranceSessions.where('gearId').equals(id).toArray();
    for (const session of sessions) {
      await update(db.enduranceSessions, session.id, { gearId: null });
    }
  });
}
