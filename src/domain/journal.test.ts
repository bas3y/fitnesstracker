import { describe, expect, it } from 'vitest';
import type { JournalEntry, JournalPrompt } from '../db/types';
import {
  activePrompts,
  averageWeekRating,
  compactJournal,
  countJournal,
  gratitudeSlots,
  isJournalEmpty,
  journalDate,
  journalDayStatus,
  journalTexts,
  promptsForEntry,
  questionText,
  reflectionProgress,
  searchJournal,
} from './journal';

const base = { createdAt: '2026-11-01T08:00:00.000Z', updatedAt: '', deletedAt: null };

const prompt = (id: string, values: Partial<JournalPrompt> = {}): JournalPrompt => ({
  ...base,
  id,
  kind: 'day',
  text: `Frage ${id}`,
  order: 0,
  archivedAt: null,
  ...values,
});

const entry = (date: string, values: Partial<JournalEntry> = {}): JournalEntry => ({
  ...base,
  id: `e-${date}-${values.kind ?? 'day'}`,
  kind: 'day',
  date,
  text: '',
  gratitude: [],
  answers: {},
  rating: null,
  ...values,
});

describe('Journal', () => {
  it('erkennt leere Einträge (Leerzeichen zählen nicht)', () => {
    expect(isJournalEmpty(entry('2026-11-01', { text: '  ', gratitude: ['', ' '] }))).toBe(true);
    expect(isJournalEmpty(entry('2026-11-01', { answers: { a: ' x ' } }))).toBe(false);
    expect(isJournalEmpty(entry('2026-11-01', { rating: 3 }))).toBe(false);
  });

  it('speichert die Woche unter ihrem Montag', () => {
    expect(journalDate('week', '2026-11-07')).toBe('2026-11-02');
    expect(journalDate('week', '2026-11-02')).toBe('2026-11-02');
    expect(journalDate('day', '2026-11-07')).toBe('2026-11-07');
  });

  it('füllt Dankbarkeit auf drei Felder auf und kürzt leere am Ende', () => {
    expect(gratitudeSlots(['Sonne'])).toEqual(['Sonne', '', '']);
    const compact = compactJournal(
      entry('2026-11-01', { gratitude: ['', 'Familie', ' '], answers: { a: 'ja', b: '  ' } }),
    );
    expect(compact.gratitude).toEqual(['', 'Familie']);
    expect(compact.answers).toEqual({ a: 'ja' });
  });

  it('zeigt aktive Fragen sortiert und entfernte nur mit Antwort', () => {
    const prompts = [
      prompt('b', { order: 1 }),
      prompt('a', { order: 0 }),
      prompt('old', { order: 2, archivedAt: '2026-11-02T00:00:00.000Z' }),
      prompt('w', { kind: 'week' }),
    ];
    expect(activePrompts(prompts, 'day').map((item) => item.id)).toEqual(['a', 'b']);
    expect(promptsForEntry(prompts, 'day', null).map((item) => item.id)).toEqual(['a', 'b']);
    expect(
      promptsForEntry(prompts, 'day', { answers: { old: 'Antwort' } }).map((item) => item.id),
    ).toEqual(['a', 'b', 'old']);
  });

  it('findet Fragetexte und sucht über alle Felder (Umlaute egal)', () => {
    const prompts = new Map([['p1', { text: 'Was habe ich gelernt?' }]]);
    expect(questionText('wentWell', prompts)).toBe('Was lief diese Woche gut?');
    expect(questionText('p1', prompts)).toBe('Was habe ich gelernt?');
    expect(questionText('weg', prompts)).toBeNull();

    const entries = [
      entry('2026-11-01', { text: 'Langer Lauf', gratitude: ['Grüner Tee'] }),
      entry('2026-11-03', { answers: { p1: 'Spanisch geübt' } }),
      entry('2026-11-02', { kind: 'week', answers: { focus: 'Mehr Schlaf' } }),
    ];
    expect(journalTexts(entries[2]!, prompts)).toEqual(['Mehr Schlaf']);
    expect(searchJournal(entries, '', prompts).map((item) => item.date)).toEqual([
      '2026-11-03',
      '2026-11-02',
      '2026-11-01',
    ]);
    expect(searchJournal(entries, 'gruener', prompts).map((item) => item.date)).toEqual([
      '2026-11-01',
    ]);
    expect(searchJournal(entries, 'spanisch GEÜBT', prompts)).toHaveLength(1);
    expect(searchJournal(entries, 'schlaf lauf', prompts)).toHaveLength(0);
  });

  it('beschreibt den Stand eines Tages und der Reflexion', () => {
    expect(journalDayStatus(null)).toEqual({ written: false, gratitude: 0 });
    expect(journalDayStatus(entry('2026-11-01', { gratitude: ['a', '', 'b'] }))).toEqual({
      written: true,
      gratitude: 2,
    });
    const prompts = [prompt('w1', { kind: 'week' }), prompt('d1')];
    expect(reflectionProgress(null, prompts)).toEqual({ answered: 0, total: 4 });
    expect(
      reflectionProgress({ answers: { wentWell: 'viel', w1: 'x', d1: 'y' } }, prompts),
    ).toEqual({ answered: 2, total: 4 });
  });

  it('zählt Tage und Wochen im Zeitraum und mittelt die Wochenbewertung', () => {
    const entries = [
      entry('2026-11-01'),
      entry('2026-11-05'),
      entry('2026-11-02', { kind: 'week', rating: 5 }),
      entry('2026-11-09', { kind: 'week', rating: 3 }),
      entry('2026-11-16', { kind: 'week', rating: null, text: 'x' }),
    ];
    const november = { from: '2026-11-01', to: '2026-11-30' };
    expect(countJournal(entries, 'day', november)).toBe(2);
    expect(countJournal(entries, 'week', november)).toBe(3);
    expect(averageWeekRating(entries, november)).toBe(4);
    expect(averageWeekRating(entries, { from: '2026-10-01', to: '2026-10-31' })).toBeNull();
  });
});
