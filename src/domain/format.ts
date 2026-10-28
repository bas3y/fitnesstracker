export function formatDecimal(value: number, maxDecimals = 1): string {
  return value.toLocaleString('de-DE', { maximumFractionDigits: maxDecimals, useGrouping: false });
}

/** Akzeptiert Komma und Punkt als Dezimaltrenner; `null` bei ungültiger Eingabe */
export function parseDecimal(input: string): number | null {
  const normalized = input.trim().replace(',', '.');
  if (normalized === '' || !/^-?\d*\.?\d+$|^-?\d+\.$/.test(normalized)) return null;
  return Number(normalized);
}

export function formatDaysAgo(days: number): string {
  if (days <= 0) return 'heute';
  if (days === 1) return 'gestern';
  return `vor ${days} Tagen`;
}

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB'];

export function formatBytes(bytes: number): string {
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < BYTE_UNITS.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${formatDecimal(value, unitIndex === 0 ? 0 : 1)} ${BYTE_UNITS[unitIndex]}`;
}
