import { graphemes, isSingleEmoji, parseEmoji } from './emoji';

describe('isSingleEmoji', () => {
  it('erkennt einfache und zusammengesetzte Emojis', () => {
    for (const emoji of ['⭐', '📚', '✍️', '👩‍💻', '🇩🇪', '👍🏽', '1️⃣', '🏳️‍🌈']) {
      expect(isSingleEmoji(emoji), emoji).toBe(true);
    }
  });

  it('lehnt Text, mehrere Emojis und Leeres ab', () => {
    for (const text of ['', ' ', 'a', 'ab', '1', '⭐⭐', '⭐a', '📚 Lesen']) {
      expect(isSingleEmoji(text), text).toBe(false);
    }
  });

  it('ignoriert Leerzeichen am Rand', () => {
    expect(parseEmoji(' 🎯 ')).toBe('🎯');
    expect(parseEmoji('x')).toBeNull();
    expect(graphemes('👩‍💻a')).toEqual(['👩‍💻', 'a']);
  });
});
