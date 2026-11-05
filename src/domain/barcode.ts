/**
 * Strichcodes auf Lebensmitteln (GTIN: EAN-8, EAN-13, UPC-A, GTIN-14). Gespeichert wird die
 * Nummer ohne Leerzeichen; UPC-A (12 Ziffern) wird wie in Open Food Facts zu EAN-13 mit führender 0.
 */

/** Entfernt Leerzeichen und Bindestriche, macht aus UPC-A eine EAN-13 */
export function normalizeBarcode(input: string): string {
  const code = input.replace(/[\s-]/g, '');
  return /^\d{12}$/.test(code) ? `0${code}` : code;
}

/** Prüfziffer (Modulo 10, Gewichte 3/1 von rechts) für die Ziffern ohne Prüfziffer */
export function gtinCheckDigit(digits: string): number {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    const digit = Number(digits[digits.length - 1 - i]);
    sum += i % 2 === 0 ? digit * 3 : digit;
  }
  return (10 - (sum % 10)) % 10;
}

/** Gültige GTIN (8, 13 oder 14 Ziffern nach `normalizeBarcode`) mit passender Prüfziffer */
export function isValidBarcode(code: string): boolean {
  if (!/^(\d{8}|\d{13}|\d{14})$/.test(code)) return false;
  return gtinCheckDigit(code.slice(0, -1)) === Number(code.at(-1));
}

/** Nummer aus einer Eingabe oder einem Scan, `null` = kein gültiger Strichcode */
export function parseBarcode(input: string): string | null {
  const code = normalizeBarcode(input);
  return isValidBarcode(code) ? code : null;
}

/** Aktives Lebensmittel mit diesem Strichcode (Suche, Scan ohne Internet) */
export function findByBarcode<T extends { barcode: string | null }>(
  items: readonly T[],
  input: string,
): T | undefined {
  const code = parseBarcode(input);
  return code ? items.find((item) => item.barcode === code) : undefined;
}

/** Anzeige wie auf der Packung, z. B. „4 012345 678901“ */
export function formatBarcode(code: string): string {
  if (code.length === 13) return `${code[0]} ${code.slice(1, 7)} ${code.slice(7)}`;
  if (code.length === 8) return `${code.slice(0, 4)} ${code.slice(4)}`;
  return code;
}
