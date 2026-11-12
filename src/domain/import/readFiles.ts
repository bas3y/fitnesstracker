import { buildCandidate, type ImportCandidate } from './activity';
import { isFit, parseFit } from './fit';
import { ImportFileError, type ParsedActivity } from './types';
import { isXml, parseGpx, parseTcx } from './xml';
import {
  MAX_FILE_BYTES,
  decompress,
  fileTooLargeError,
  hasGzipSignature,
  hasZipSignature,
  listZipEntries,
  readZipEntry,
} from './zip';

export interface ImportFileProblem {
  fileName: string;
  message: string;
}

export interface ReadFilesResult {
  candidates: ImportCandidate[];
  problems: ImportFileProblem[];
  /** Gelesene Dateien (in ZIPs einzeln gezählt) */
  fileCount: number;
}

/** In ZIPs nur diese Einträge ansehen (Konto-Exporte enthalten auch Fotos, JSON …) */
const ACTIVITY_ENTRY = /\.(fit|gpx|tcx|zip|gz)$/i;
/** Verschachtelte ZIP/GZ (Garmin-Export: ZIP im ZIP, Strava: .fit.gz im ZIP) */
const MAX_NESTING = 3;

const baseName = (path: string) => path.split(/[/\\]/).pop() || path;

async function parseBlob(blob: Blob): Promise<ParsedActivity[]> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  if (isFit(bytes)) return parseFit(bytes);
  const text = new TextDecoder().decode(bytes);
  const format = isXml(text);
  if (format === 'gpx') return parseGpx(text);
  if (format === 'tcx') return parseTcx(text);
  throw new ImportFileError('Unbekanntes Format (erwartet: FIT, GPX, TCX oder ZIP)');
}

/**
 * Liest FIT/GPX/TCX, auch gezippt (verschachtelt wie im Garmin-Export) oder als `.gz` (Strava).
 * Das Dateiformat wird am Inhalt erkannt, nicht an der Endung.
 */
export async function readImportFiles(
  files: readonly File[],
  onProgress?: (fileCount: number) => void,
): Promise<ReadFilesResult> {
  const result: ReadFilesResult = { candidates: [], problems: [], fileCount: 0 };

  const read = async (blob: Blob, name: string, depth: number): Promise<void> => {
    try {
      const head = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
      if (hasZipSignature(head)) {
        if (depth >= MAX_NESTING) return;
        const entries = (await listZipEntries(blob)).filter(
          (entry) =>
            !entry.name.endsWith('/') &&
            !entry.name.startsWith('__MACOSX') &&
            ACTIVITY_ENTRY.test(entry.name),
        );
        if (entries.length === 0 && depth === 0) {
          throw new ImportFileError('Keine FIT-, GPX- oder TCX-Dateien im ZIP gefunden');
        }
        for (const entry of entries) {
          const entryName = baseName(entry.name);
          try {
            await read(await readZipEntry(blob, entry), entryName, depth + 1);
          } catch (error) {
            addProblem(entryName, error);
          }
        }
        return;
      }
      if (hasGzipSignature(head)) {
        // Zählt mit, sonst läuft eine GZ-Datei, die sich selbst enthält, endlos
        if (depth >= MAX_NESTING) throw new ImportFileError('Datei ist zu tief verschachtelt');
        await read(await decompress(blob, 'gzip'), name.replace(/\.gz$/i, ''), depth + 1);
        return;
      }
      if (blob.size > MAX_FILE_BYTES) throw fileTooLargeError();
      result.fileCount++;
      const activities = await parseBlob(blob);
      activities.forEach((activity, index) => {
        try {
          result.candidates.push(
            buildCandidate(activity, name, `${result.fileCount}:${index}:${name}`),
          );
        } catch (error) {
          addProblem(name, error);
        }
      });
      onProgress?.(result.fileCount);
    } catch (error) {
      addProblem(name, error);
    }
  };

  const addProblem = (fileName: string, error: unknown) => {
    result.problems.push({
      fileName,
      message:
        error instanceof ImportFileError ? error.message : 'Die Datei konnte nicht gelesen werden',
    });
  };

  for (const file of files) await read(file, baseName(file.name), 0);
  return result;
}
