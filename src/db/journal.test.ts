import { db } from './database';
import {
  addJournalPrompt,
  getJournalEntry,
  listJournalEntries,
  listJournalPrompts,
  removeJournalPrompt,
  renameJournalPrompt,
  reorderJournalPrompts,
  saveJournalEntry,
} from './journal';
import { EMPTY_JOURNAL_VALUES, MAX_JOURNAL_PROMPTS } from './schemas';
import { resetDatabase } from './testUtils';

beforeEach(resetDatabase);

describe('Journal speichern', () => {
  it('legt einen Eintrag je Tag an, ändert ihn und löscht ihn, wenn er leer wird', async () => {
    await saveJournalEntry('day', '2026-11-07', {
      ...EMPTY_JOURNAL_VALUES,
      text: 'Guter Tag',
      gratitude: ['Sonne', '', ''],
      rating: 4,
    });
    expect(await getJournalEntry('day', '2026-11-07')).toMatchObject({
      kind: 'day',
      date: '2026-11-07',
      text: 'Guter Tag',
      gratitude: ['Sonne'],
      // Bewertung gibt es nur für die Woche
      rating: null,
    });

    await saveJournalEntry('day', '2026-11-07', {
      ...EMPTY_JOURNAL_VALUES,
      text: 'Guter Tag!',
      answers: { p1: 'Antwort', p2: ' ' },
    });
    const entries = await listJournalEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ text: 'Guter Tag!', answers: { p1: 'Antwort' } });

    await saveJournalEntry('day', '2026-11-07', { ...EMPTY_JOURNAL_VALUES, text: '  ' });
    expect(await getJournalEntry('day', '2026-11-07')).toBeUndefined();
    expect(await db.journalEntries.count()).toBe(1);
    // Leere Einträge werden gar nicht erst angelegt
    await saveJournalEntry('day', '2026-11-06', EMPTY_JOURNAL_VALUES);
    expect(await db.journalEntries.count()).toBe(1);
  });

  it('speichert die Wochenreflexion unter dem Montag, egal welcher Tag gewählt ist', async () => {
    await saveJournalEntry('week', '2026-11-05', {
      ...EMPTY_JOURNAL_VALUES,
      answers: { wentWell: 'Training' },
      gratitude: ['nur Tag'],
      rating: 5,
    });
    const entry = await getJournalEntry('week', '2026-11-08');
    expect(entry).toMatchObject({ date: '2026-11-02', gratitude: [], rating: 5 });
    expect(await getJournalEntry('day', '2026-11-05')).toBeUndefined();
  });

  it('lehnt ungültige Inhalte ab', async () => {
    await expect(
      saveJournalEntry('day', '2026-11-07', {
        ...EMPTY_JOURNAL_VALUES,
        gratitude: ['a', 'b', 'c', 'd'],
      }),
    ).rejects.toThrow();
    await expect(saveJournalEntry('day', '7.11.2026', EMPTY_JOURNAL_VALUES)).rejects.toThrow();
  });
});

describe('Eigene Fragen', () => {
  it('legt an, benennt um, sortiert und entfernt (Antworten bleiben)', async () => {
    const first = await addJournalPrompt('day', '  Was habe ich gelernt? ');
    const second = await addJournalPrompt('day', 'Was war schwer?');
    await addJournalPrompt('week', 'Wochenfrage');
    expect(first).toMatchObject({ text: 'Was habe ich gelernt?', order: 0 });
    expect(second.order).toBe(1);

    await renameJournalPrompt(first.id, 'Was habe ich heute gelernt?');
    await reorderJournalPrompts([second.id, first.id]);
    await removeJournalPrompt(second.id);

    const prompts = await listJournalPrompts();
    expect(prompts.find((prompt) => prompt.id === first.id)).toMatchObject({
      text: 'Was habe ich heute gelernt?',
      order: 1,
      archivedAt: null,
    });
    expect(prompts.find((prompt) => prompt.id === second.id)?.archivedAt).not.toBeNull();

    // Neue Frage kommt hinter die aktiven
    expect((await addJournalPrompt('day', 'Neu')).order).toBe(2);
    await expect(addJournalPrompt('day', '   ')).rejects.toThrow();
  });

  it('begrenzt die Anzahl je Art', async () => {
    for (let index = 0; index < MAX_JOURNAL_PROMPTS; index++) {
      await addJournalPrompt('day', `Frage ${index}`);
    }
    await expect(addJournalPrompt('day', 'Zu viel')).rejects.toThrow(/Höchstens/);
    await expect(addJournalPrompt('week', 'Woche geht')).resolves.toBeTruthy();
  });
});
