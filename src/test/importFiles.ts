// Testdateien für den Import: FIT schreiben, ZIP packen, GPX erzeugen (nur Tests und E2E)

const FIT_EPOCH_MS = Date.UTC(1989, 11, 31);

type FitType = 'enum' | 'uint8' | 'uint16' | 'uint32' | 'sint32' | 'string';

const TYPES: Record<FitType, { baseType: number; size: number }> = {
  enum: { baseType: 0x00, size: 1 },
  uint8: { baseType: 0x02, size: 1 },
  uint16: { baseType: 0x84, size: 2 },
  uint32: { baseType: 0x86, size: 4 },
  sint32: { baseType: 0x85, size: 4 },
  string: { baseType: 0x07, size: 16 },
};

const INVALID: Record<Exclude<FitType, 'string'>, number> = {
  enum: 0xff,
  uint8: 0xff,
  uint16: 0xffff,
  uint32: 0xffffffff,
  sint32: 0x7fffffff,
};

export interface FitField {
  num: number;
  type: FitType;
  /** `null` = ungültig (wie „kein Wert“ auf der Uhr) */
  value: number | string | null;
}

export interface FitMessageInput {
  num: number;
  fields: FitField[];
  /** Zeitstempel im Header statt als Feld (5-Bit-Versatz zum letzten Zeitstempel) */
  compressedOffset?: number;
}

export const fitTime = (ms: number) => Math.round((ms - FIT_EPOCH_MS) / 1000);

/** Minimaler FIT-Schreiber: je Nachricht eine Definition (lokaler Typ 0), danach die Daten */
export function encodeFit(messages: FitMessageInput[], { bigEndian = false } = {}): Uint8Array {
  const chunks: number[] = [];
  const push16 = (value: number, little: boolean) =>
    little ? chunks.push(value & 0xff, value >> 8) : chunks.push(value >> 8, value & 0xff);
  const push32 = (value: number, little: boolean) => {
    const bytes = [
      value & 0xff,
      (value >>> 8) & 0xff,
      (value >>> 16) & 0xff,
      (value >>> 24) & 0xff,
    ];
    chunks.push(...(little ? bytes : bytes.reverse()));
  };
  const little = !bigEndian;

  for (const message of messages) {
    const local = message.compressedOffset === undefined ? 0 : 1;
    chunks.push(0x40 | local, 0, little ? 0 : 1);
    push16(message.num, little);
    chunks.push(message.fields.length);
    for (const field of message.fields) {
      const { baseType, size } = TYPES[field.type];
      chunks.push(field.num, size, baseType);
    }
    chunks.push(
      message.compressedOffset === undefined
        ? local
        : 0x80 | (local << 5) | message.compressedOffset,
    );
    for (const field of message.fields) {
      if (field.type === 'string') {
        const bytes = new TextEncoder().encode(String(field.value ?? '')).slice(0, 15);
        chunks.push(...bytes, ...new Array<number>(16 - bytes.length).fill(0));
        continue;
      }
      const value = field.value === null ? INVALID[field.type] : Number(field.value);
      if (field.type === 'enum' || field.type === 'uint8') chunks.push(value & 0xff);
      else if (field.type === 'uint16') push16(value, little);
      else push32(value >>> 0, little);
    }
  }

  const header = [14, 0x20, 0x08, 0x08];
  const size = chunks.length;
  header.push(size & 0xff, (size >>> 8) & 0xff, (size >>> 16) & 0xff, (size >>> 24) & 0xff);
  header.push(...'.FIT'.split('').map((char) => char.charCodeAt(0)), 0, 0);
  return new Uint8Array([...header, ...chunks, 0, 0]);
}

export interface SampleRun {
  start: number;
  /** Sekunden zwischen zwei Punkten */
  step: number;
  count: number;
  /** m/s */
  speed: number;
  heartRate: (i: number) => number;
}

/** Lauf als FIT: Punkte nach Norden, Strecke vom Gerät, Runden je km */
export function sampleFitRun(run: SampleRun, { sport = 1, subSport = 0 } = {}): Uint8Array {
  const records: FitMessageInput[] = [];
  for (let i = 0; i < run.count; i++) {
    const meters = i * run.step * run.speed;
    records.push({
      num: 20,
      fields: [
        { num: 253, type: 'uint32', value: fitTime(run.start + i * run.step * 1000) },
        { num: 0, type: 'sint32', value: Math.round(((52.5 + meters / 111_195) * 2 ** 31) / 180) },
        { num: 1, type: 'sint32', value: Math.round((13.4 * 2 ** 31) / 180) },
        { num: 2, type: 'uint16', value: (40 + 500) * 5 },
        { num: 3, type: 'uint8', value: run.heartRate(i) },
        { num: 5, type: 'uint32', value: Math.round(meters * 100) },
      ],
    });
  }
  const seconds = (run.count - 1) * run.step;
  const distance = seconds * run.speed;
  return encodeFit([
    {
      num: 0,
      fields: [
        { num: 0, type: 'enum', value: 4 },
        { num: 1, type: 'uint16', value: 1 },
      ],
    },
    ...records,
    {
      num: 19,
      fields: [
        { num: 253, type: 'uint32', value: fitTime(run.start + seconds * 1000) },
        { num: 2, type: 'uint32', value: fitTime(run.start) },
        { num: 8, type: 'uint32', value: seconds * 1000 },
        { num: 9, type: 'uint32', value: Math.round(distance * 100) },
        { num: 15, type: 'uint8', value: 150 },
        { num: 16, type: 'uint8', value: 170 },
      ],
    },
    {
      num: 18,
      fields: [
        { num: 253, type: 'uint32', value: fitTime(run.start + seconds * 1000) },
        { num: 2, type: 'uint32', value: fitTime(run.start) },
        { num: 5, type: 'enum', value: sport },
        { num: 6, type: 'enum', value: subSport },
        { num: 7, type: 'uint32', value: seconds * 1000 },
        { num: 8, type: 'uint32', value: seconds * 1000 },
        { num: 9, type: 'uint32', value: Math.round(distance * 100) },
        { num: 11, type: 'uint16', value: 400 },
        { num: 16, type: 'uint8', value: 150 },
        { num: 17, type: 'uint8', value: 170 },
        { num: 22, type: 'uint16', value: 12 },
      ],
    },
  ]);
}

/** GPX wie aus Strava (ohne Strecke vom Gerät, Puls in der Garmin-Erweiterung) */
export function sampleGpx(
  run: SampleRun,
  { name = 'Abendlauf', type = 'running', creator = 'StravaGPX' } = {},
): string {
  const points = Array.from({ length: run.count }, (_, i) => {
    const meters = i * run.step * run.speed;
    const time = new Date(run.start + i * run.step * 1000).toISOString();
    return `<trkpt lat="${(52.5 + meters / 111_195).toFixed(7)}" lon="13.4"><ele>${40 + (i % 2)}</ele><time>${time}</time><extensions><gpxtpx:TrackPointExtension><gpxtpx:hr>${run.heartRate(i)}</gpxtpx:hr></gpxtpx:TrackPointExtension></extensions></trkpt>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx creator="${creator}" version="1.1" xmlns="http://www.topografix.com/GPX/1/1" xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1">
 <metadata><time>${new Date(run.start).toISOString()}</time></metadata>
 <trk><name>${name}</name><type>${type}</type><trkseg>
${points.join('\n')}
 </trkseg></trk>
</gpx>`;
}

const pad2 = (n: number) => String(Math.abs(n)).padStart(2, '0');

/** Ortszeit wie im Apple-Export: `2024-01-31 22:15:00 +0100` */
export function healthDate(ms: number): string {
  const d = new Date(ms);
  const offset = -d.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())} ${sign}${pad2(Math.trunc(offset / 60))}${pad2(offset % 60)}`;
}

export interface HealthRecordInput {
  type: string;
  start: number;
  end?: number;
  value: string | number;
  unit?: string;
  source?: string;
}

/** `export.xml` wie aus der Health-App (mit DTD-Kopf, Metadaten und anderen Einträgen) */
export function sampleAppleHealthXml(records: HealthRecordInput[]): string {
  const lines = records.map((record) => {
    const attributes = `type="${record.type}" sourceName="${record.source ?? 'Apple Watch von Test'}" sourceVersion="10.0" unit="${record.unit ?? 'count'}" creationDate="${healthDate(record.end ?? record.start)}" startDate="${healthDate(record.start)}" endDate="${healthDate(record.end ?? record.start)}" value="${record.value}"`;
    return record.type.includes('HeartRateVariability')
      ? ` <Record ${attributes}>\n  <MetadataEntry key="HKMetadataKeySyncVersion" value="2"/>\n </Record>`
      : ` <Record ${attributes}/>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE HealthData [
<!ELEMENT HealthData (ExportDate,Me,(Record|Correlation|Workout|ActivitySummary)*)>
<!ATTLIST Record
  type          CDATA #REQUIRED
>
]>
<HealthData locale="de_DE">
 <ExportDate value="${healthDate(Date.now())}"/>
 <Me HKCharacteristicTypeIdentifierBiologicalSex="HKBiologicalSexNotSet"/>
 <Record type="HKQuantityTypeIdentifierHeartRate" sourceName="Apple Watch von Test" unit="count/min" startDate="${healthDate(Date.now())}" endDate="${healthDate(Date.now())}" value="72"/>
${lines.join('\n')}
 <ActivitySummary dateComponents="2026-10-01" activeEnergyBurned="500"/>
</HealthData>
`;
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

async function compress(bytes: Uint8Array, format: 'deflate-raw' | 'gzip'): Promise<Uint8Array> {
  const source = new ReadableStream<BufferSource>({
    start(controller) {
      controller.enqueue(new Uint8Array(bytes));
      controller.close();
    },
  });
  const stream = source.pipeThrough(new CompressionStream(format));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

const deflateRaw = (bytes: Uint8Array) => compress(bytes, 'deflate-raw');
export const gzip = (bytes: Uint8Array) => compress(bytes, 'gzip');

/** ZIP mit Deflate (bzw. gespeichert bei `store`) */
export async function createZip(
  entries: { name: string; data: Uint8Array | string; store?: boolean }[],
): Promise<Uint8Array> {
  const local: number[] = [];
  const central: number[] = [];
  const u16 = (target: number[], value: number) => target.push(value & 0xff, (value >>> 8) & 0xff);
  const u32 = (target: number[], value: number) =>
    target.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);

  for (const entry of entries) {
    const raw = typeof entry.data === 'string' ? new TextEncoder().encode(entry.data) : entry.data;
    const data = entry.store ? raw : await deflateRaw(raw);
    const name = new TextEncoder().encode(entry.name);
    const offset = local.length;
    const crc = crc32(raw);
    const method = entry.store ? 0 : 8;
    u32(local, 0x04034b50);
    u16(local, 20);
    u16(local, 0x0800);
    u16(local, method);
    u32(local, 0);
    u32(local, crc);
    u32(local, data.length);
    u32(local, raw.length);
    u16(local, name.length);
    u16(local, 0);
    local.push(...name, ...data);

    u32(central, 0x02014b50);
    u16(central, 20);
    u16(central, 20);
    u16(central, 0x0800);
    u16(central, method);
    u32(central, 0);
    u32(central, crc);
    u32(central, data.length);
    u32(central, raw.length);
    u16(central, name.length);
    u16(central, 0);
    u16(central, 0);
    u16(central, 0);
    u16(central, 0);
    u32(central, 0);
    u32(central, offset);
    central.push(...name);
  }
  const end: number[] = [];
  u32(end, 0x06054b50);
  u16(end, 0);
  u16(end, 0);
  u16(end, entries.length);
  u16(end, entries.length);
  u32(end, central.length);
  u32(end, local.length);
  u16(end, 0);
  return new Uint8Array([...local, ...central, ...end]);
}
