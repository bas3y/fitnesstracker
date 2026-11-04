import { AppleHealthCollector, HealthXmlScanner, isAppleHealthXml } from './appleHealth';
import { GarminHealthCollector, isGarminHealthFile } from './garminHealth';
import { mergeHealthDays, type HealthDay, type HealthSource } from './health';
import type { ImportFileProblem } from './readFiles';
import { ImportFileError } from './types';
import { blobStream, hasZipSignature, listZipEntries, openZipEntry, readZipEntry } from './zip';

export interface ReadHealthResult {
  days: HealthDay[];
  sources: HealthSource[];
  problems: ImportFileProblem[];
}

/** Fortschritt in Prozent (nur beim großen Apple-Export bekannt), sonst `null` */
export type HealthProgress = (percent: number | null) => void;

const APPLE_EXPORT = /(^|\/)export\.xml$/i;

const baseName = (path: string) => path.split(/[/\\]/).pop() || path;

const blobText = async (blob: Blob) => new TextDecoder().decode(await blob.arrayBuffer());

async function scanXml(
  stream: ReadableStream<Uint8Array>,
  size: number,
  collector: AppleHealthCollector,
  onProgress?: HealthProgress,
): Promise<void> {
  const scanner = new HealthXmlScanner((record) => collector.add(record));
  const decoder = new TextDecoder();
  const reader = stream.getReader();
  let read = 0;
  let reported = -1;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    read += value.byteLength;
    scanner.push(decoder.decode(value, { stream: true }));
    const percent = size > 0 ? Math.min(99, Math.floor((read / size) * 100)) : null;
    if (percent !== reported) {
      reported = percent ?? -1;
      onProgress?.(percent);
    }
  }
  scanner.push(decoder.decode());
}

/**
 * Liest Apple-Health-Export (`export.zip` oder `export.xml`) und Garmin-Datenexport (ZIP oder
 * einzelne JSON-Dateien). Garmin hat Vorrang (Schlafphasen, Nacht-HRV), Apple füllt Lücken.
 */
export async function readHealthFiles(
  files: readonly File[],
  onProgress?: HealthProgress,
): Promise<ReadHealthResult> {
  const apple = new AppleHealthCollector();
  const garmin = new GarminHealthCollector();
  const sources = new Set<HealthSource>();
  const problems: ImportFileProblem[] = [];

  const readGarminJson = async (blob: Blob, name: string) => {
    garmin.addJson(JSON.parse(await blobText(blob)), name);
    sources.add('garmin');
  };

  for (const file of files) {
    const name = baseName(file.name);
    try {
      const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
      if (hasZipSignature(head)) {
        const entries = (await listZipEntries(file)).filter(
          (entry) => !entry.name.endsWith('/') && !entry.name.startsWith('__MACOSX'),
        );
        const appleEntry = entries.find((entry) => APPLE_EXPORT.test(entry.name));
        const garminEntries = entries.filter((entry) => isGarminHealthFile(entry.name));
        if (!appleEntry && garminEntries.length === 0) {
          throw new ImportFileError(
            'Keine Gesundheitsdaten gefunden (erwartet: Apple-Health- oder Garmin-Export)',
          );
        }
        if (appleEntry) {
          await scanXml(await openZipEntry(file, appleEntry), appleEntry.size, apple, onProgress);
          sources.add('apple');
        }
        for (const entry of garminEntries) {
          onProgress?.(null);
          try {
            await readGarminJson(await readZipEntry(file, entry), entry.name);
          } catch {
            problems.push({ fileName: baseName(entry.name), message: 'Keine gültige JSON-Datei' });
          }
        }
        continue;
      }

      const start = await blobText(file.slice(0, 4096));
      if (isAppleHealthXml(start)) {
        await scanXml(
          (await blobStream(file)) as ReadableStream<Uint8Array>,
          file.size,
          apple,
          onProgress,
        );
        sources.add('apple');
      } else if (/^\s*[[{]/.test(start)) {
        await readGarminJson(file, name);
      } else {
        throw new ImportFileError(
          'Unbekanntes Format (erwartet: Apple-Health-Export oder Garmin-Datenexport)',
        );
      }
    } catch (error) {
      problems.push({
        fileName: name,
        message:
          error instanceof ImportFileError
            ? error.message
            : error instanceof SyntaxError
              ? 'Keine gültige JSON-Datei'
              : 'Die Datei konnte nicht gelesen werden',
      });
    }
  }

  return {
    days: mergeHealthDays(garmin.days(), apple.days()),
    sources: (['garmin', 'apple'] as const).filter((source) => sources.has(source)),
    problems,
  };
}
