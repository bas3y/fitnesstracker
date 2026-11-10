/** PDF-Bytes als Text (jedes Byte ein Zeichen), um Inhalte in Tests zu prüfen */
export function pdfText(bytes: Uint8Array): string {
  let text = '';
  for (const byte of bytes) text += String.fromCharCode(byte);
  return text;
}

const WIN_ANSI: Record<string, string> = {
  '\x80': '€',
  '\x82': '‚',
  '\x84': '„',
  '\x85': '…',
  '\x91': '‘',
  '\x92': '’',
  '\x93': '“',
  '\x94': '”',
  '\x95': '•',
  '\x96': '–',
  '\x97': '—',
};

/** Alle mit `Tj` gezeichneten Texte einer PDF-Datei (zurück in Unicode) */
export function pdfStrings(bytes: Uint8Array): string[] {
  return [...pdfText(bytes).matchAll(/\(((?:\\.|[^\\)])*)\) Tj/g)].map((match) =>
    match[1]!.replace(/\\(.)/g, '$1').replace(/[\x80-\x9f]/g, (char) => WIN_ANSI[char] ?? char),
  );
}
