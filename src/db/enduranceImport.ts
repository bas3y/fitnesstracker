import {
  mergeSessionValues,
  planImport,
  type ImportCandidate,
  type PlannedImport,
} from '../domain/import/activity';
import { suggestGearId } from '../domain/endurance';
import { newEffortRecords, type EffortRecord } from '../domain/enduranceStats';
import { trackSummary } from '../domain/track';
import { db } from './database';
import { listEnduranceSessions, loadEnduranceTrack } from './endurance';
import { create, listActive, update } from './repository';
import {
  enduranceSessionFieldsSchema,
  enduranceSessionInputSchema,
  type EnduranceSessionValues,
} from './schemas';
import type { EnduranceSession, EnduranceSport, EnduranceTrack } from './types';

/** Status je Einheit gegenüber den gespeicherten Einheiten */
export async function planEnduranceImport(
  candidates: readonly ImportCandidate[],
): Promise<PlannedImport[]> {
  return planImport(candidates, await listEnduranceSessions());
}

export interface ImportChoice {
  planned: PlannedImport;
  /** In der Vorschau änderbar */
  sport: EnduranceSport;
}

export interface ImportSummary {
  created: number;
  merged: number;
  skipped: number;
  /** Neue und ergänzte Einheiten */
  sessionIds: string[];
  /** Bestzeiten der importierten Einheiten, die alle bisherigen schlagen */
  records: EffortRecord[];
}

function sessionValues(session: EnduranceSession): EnduranceSessionValues {
  const keys = Object.keys(enduranceSessionFieldsSchema.shape) as (keyof EnduranceSessionValues)[];
  return Object.fromEntries(keys.map((key) => [key, session[key]])) as EnduranceSessionValues;
}

/** Speichert die gewählten Einheiten; Duplikate werden übersprungen */
export async function applyEnduranceImport(
  choices: readonly ImportChoice[],
): Promise<ImportSummary> {
  return db.transaction('rw', db.enduranceSessions, db.enduranceTracks, db.gear, async () => {
    const summary: ImportSummary = {
      created: 0,
      merged: 0,
      skipped: 0,
      sessionIds: [],
      records: [],
    };
    const sessions = await listActive(db.enduranceSessions);
    const gear = await listActive(db.gear);

    const addTrack = async (
      session: Pick<EnduranceSession, 'id' | 'sport'>,
      candidate: ImportCandidate,
    ) => {
      if (!candidate.track || (await loadEnduranceTrack(session.id))) return;
      await create<EnduranceTrack>(db.enduranceTracks, {
        ...candidate.track,
        sessionId: session.id,
      });
      await update(db.enduranceSessions, session.id, {
        trackSummary: trackSummary(candidate.track, session.sport),
      });
    };

    for (const { planned, sport } of choices) {
      const { candidate, status, matchId } = planned;
      const match = matchId ? sessions.find((session) => session.id === matchId) : undefined;
      if (status === 'duplicate' || (status === 'merge' && !match)) {
        summary.skipped++;
        continue;
      }
      if (status === 'merge' && match) {
        const values = enduranceSessionInputSchema.parse(
          mergeSessionValues(sessionValues(match), { ...candidate.session, sport: match.sport }),
        );
        await update(db.enduranceSessions, match.id, {
          ...values,
          importInfo: candidate.importInfo,
        });
        await addTrack(match, candidate);
        summary.merged++;
        summary.sessionIds.push(match.id);
        continue;
      }

      // Ausrüstung nur, wenn es sie zum Zeitpunkt der Einheit schon gab (alte Einheiten nicht auf neue Schuhe)
      const startedAt = candidate.session.startedAt;
      const gearId = suggestGearId(
        sport,
        gear.filter((item) => item.createdAt <= startedAt),
        sessions,
      );
      const session = await create<EnduranceSession>(db.enduranceSessions, {
        ...enduranceSessionInputSchema.parse({ ...candidate.session, sport, gearId }),
        source: 'import',
        importInfo: candidate.importInfo,
        trackSummary: null,
      });
      sessions.push(session);
      await addTrack(session, candidate);
      summary.created++;
      summary.sessionIds.push(session.id);
    }
    summary.records = newEffortRecords(await listActive(db.enduranceSessions), summary.sessionIds);
    return summary;
  });
}
