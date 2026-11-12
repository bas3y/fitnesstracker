/** Text für ein XML/HTML-Attribut in doppelten Anführungszeichen (SVG-Strings, `innerHTML`) */
export function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
