/**
 * Vereinheitlicht Text für die Suche: Kleinschreibung, Umlaute und ihre Umschreibung (ä/ae → a),
 * ß → ss, Akzente entfernt, Satzzeichen → Leerzeichen.
 */
export function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .replace(/ä|ae/g, 'a')
    .replace(/ö|oe/g, 'o')
    .replace(/ü|ue/g, 'u')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export interface Searchable {
  name: string;
  aliases: string[];
}

const NAME_BONUS = 3;

interface IndexedEntry<T> {
  item: T;
  name: string;
  aliases: string[];
}

function scoreText(text: string, query: string, tokens: string[]): number {
  if (!tokens.every((token) => text.includes(token))) return 0;
  let score = 10;
  if (text === query) score += 100;
  else if (text.startsWith(query)) score += 50;
  const words = text.split(' ');
  for (const token of tokens) {
    if (words.some((word) => word.startsWith(token))) score += 5;
  }
  return score;
}

/**
 * Baut einmal einen Index (normalisierte Texte) und liefert eine Suchfunktion.
 * Treffer: Alle Suchwörter kommen im Namen oder in einem Alias vor. Gewichtung: exakter Treffer >
 * Textanfang > Wortanfang, bei Gleichstand Name vor Alias und kürzere Namen zuerst.
 */
export function createSearch<T extends Searchable>(items: readonly T[]) {
  const index: IndexedEntry<T>[] = items.map((item) => ({
    item,
    name: normalizeSearchText(item.name),
    aliases: item.aliases.map(normalizeSearchText),
  }));

  return (query: string, limit = Infinity): T[] => {
    const normalized = normalizeSearchText(query);
    if (normalized === '') return [];
    const tokens = normalized.split(' ');

    const hits: Array<{ item: T; score: number; name: string }> = [];
    for (const entry of index) {
      const nameScore = scoreText(entry.name, normalized, tokens);
      const aliasScore = Math.max(0, ...entry.aliases.map((a) => scoreText(a, normalized, tokens)));
      // Exakter Alias schlägt Namensanfang („Bankdrücken“ → Langhantel vor Maschine)
      const score = Math.max(nameScore > 0 ? nameScore + NAME_BONUS : 0, aliasScore);
      if (score > 0) hits.push({ item: entry.item, score, name: entry.name });
    }

    hits.sort(
      (a, b) => b.score - a.score || a.name.length - b.name.length || a.name.localeCompare(b.name),
    );
    return hits.slice(0, limit).map((hit) => hit.item);
  };
}
