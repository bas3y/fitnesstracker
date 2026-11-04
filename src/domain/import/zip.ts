import { ImportFileError } from './types';

// ZIP lesen ohne Zusatzpaket: Inhaltsverzeichnis am Dateiende, Einträge einzeln per `Blob.slice`
// (Konto-Exporte können mehrere GB groß sein). Entpacken über `DecompressionStream`.

export interface ZipEntry {
  name: string;
  /** 0 = gespeichert, 8 = Deflate */
  method: number;
  compressedSize: number;
  size: number;
  localHeaderOffset: number;
}

const EOCD = 0x06054b50;
const EOCD64_LOCATOR = 0x07064b50;
const EOCD64 = 0x06064b50;
const CENTRAL_HEADER = 0x02014b50;
const LOCAL_HEADER = 0x04034b50;
const MAX_U32 = 0xffffffff;

async function readBytes(blob: Blob, start: number, end: number): Promise<DataView> {
  const buffer = await blob.slice(start, end).arrayBuffer();
  return new DataView(buffer);
}

export function hasZipSignature(bytes: Uint8Array): boolean {
  return bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
}

export function hasGzipSignature(bytes: Uint8Array): boolean {
  return bytes[0] === 0x1f && bytes[1] === 0x8b;
}

const u64 = (view: DataView, offset: number) => Number(view.getBigUint64(offset, true));

export async function listZipEntries(blob: Blob): Promise<ZipEntry[]> {
  // Ende des Verzeichnisses: 22 Bytes + bis zu 64 KB Kommentar
  const tailStart = Math.max(0, blob.size - 22 - 0xffff);
  const tail = await readBytes(blob, tailStart, blob.size);
  let eocd = -1;
  for (let i = tail.byteLength - 22; i >= 0; i--) {
    if (tail.getUint32(i, true) === EOCD) {
      eocd = i;
      break;
    }
  }
  if (eocd === -1) throw new ImportFileError('ZIP-Datei ist beschädigt oder unvollständig');

  let count = tail.getUint16(eocd + 10, true);
  let directorySize = tail.getUint32(eocd + 12, true);
  let directoryOffset = tail.getUint32(eocd + 16, true);
  if (
    (count === 0xffff || directoryOffset === MAX_U32 || directorySize === MAX_U32) &&
    eocd >= 20 &&
    tail.getUint32(eocd - 20, true) === EOCD64_LOCATOR
  ) {
    const zip64Offset = u64(tail, eocd - 20 + 8);
    const zip64 = await readBytes(blob, zip64Offset, zip64Offset + 56);
    if (zip64.getUint32(0, true) !== EOCD64) throw new ImportFileError('ZIP-Datei ist beschädigt');
    count = u64(zip64, 32);
    directorySize = u64(zip64, 40);
    directoryOffset = u64(zip64, 48);
  }

  const directory = await readBytes(blob, directoryOffset, directoryOffset + directorySize);
  const decoder = new TextDecoder();
  const entries: ZipEntry[] = [];
  let pos = 0;
  for (let i = 0; i < count && pos + 46 <= directory.byteLength; i++) {
    if (directory.getUint32(pos, true) !== CENTRAL_HEADER) break;
    const nameLength = directory.getUint16(pos + 28, true);
    const extraLength = directory.getUint16(pos + 30, true);
    const commentLength = directory.getUint16(pos + 32, true);
    let compressedSize = directory.getUint32(pos + 20, true);
    let size = directory.getUint32(pos + 24, true);
    let localHeaderOffset = directory.getUint32(pos + 42, true);
    const name = decoder.decode(
      new Uint8Array(directory.buffer, directory.byteOffset + pos + 46, nameLength),
    );

    // Zip64: große Werte stehen im Zusatzfeld 0x0001, in fester Reihenfolge
    let extra = pos + 46 + nameLength;
    const extraEnd = extra + extraLength;
    while (extra + 4 <= extraEnd) {
      const id = directory.getUint16(extra, true);
      const length = directory.getUint16(extra + 2, true);
      if (id === 0x0001) {
        let field = extra + 4;
        if (size === MAX_U32) {
          size = u64(directory, field);
          field += 8;
        }
        if (compressedSize === MAX_U32) {
          compressedSize = u64(directory, field);
          field += 8;
        }
        if (localHeaderOffset === MAX_U32) localHeaderOffset = u64(directory, field);
      }
      extra += 4 + length;
    }

    entries.push({
      name,
      method: directory.getUint16(pos + 10, true),
      compressedSize,
      size,
      localHeaderOffset,
    });
    pos = extraEnd + commentLength;
  }
  return entries;
}

/** `Blob.stream()` fehlt in manchen Umgebungen (Tests) → dann über den Inhalt */
export async function blobStream(blob: Blob): Promise<ReadableStream<BufferSource>> {
  if (typeof blob.stream === 'function') return blob.stream();
  const bytes = new Uint8Array(await blob.arrayBuffer());
  return new ReadableStream({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
}

export async function decompress(blob: Blob, format: 'deflate-raw' | 'gzip'): Promise<Blob> {
  const stream = (await blobStream(blob)).pipeThrough(new DecompressionStream(format));
  return new Blob([await new Response(stream).arrayBuffer()]);
}

async function entryData(blob: Blob, entry: ZipEntry): Promise<Blob> {
  const header = await readBytes(blob, entry.localHeaderOffset, entry.localHeaderOffset + 30);
  if (header.getUint32(0, true) !== LOCAL_HEADER)
    throw new ImportFileError('ZIP-Datei ist beschädigt');
  if (entry.method !== 0 && entry.method !== 8) {
    throw new ImportFileError(`Packverfahren ${entry.method} wird nicht unterstützt`);
  }
  const start =
    entry.localHeaderOffset + 30 + header.getUint16(26, true) + header.getUint16(28, true);
  return blob.slice(start, start + entry.compressedSize);
}

export async function readZipEntry(blob: Blob, entry: ZipEntry): Promise<Blob> {
  const data = await entryData(blob, entry);
  return entry.method === 0 ? data : decompress(data, 'deflate-raw');
}

/** Entpackt stückweise, ohne den ganzen Inhalt im Speicher zu halten (z. B. `export.xml`) */
export async function openZipEntry(
  blob: Blob,
  entry: ZipEntry,
): Promise<ReadableStream<Uint8Array>> {
  const data = await entryData(blob, entry);
  const stream = await blobStream(data);
  return entry.method === 0
    ? (stream as ReadableStream<Uint8Array>)
    : stream.pipeThrough(new DecompressionStream('deflate-raw'));
}
