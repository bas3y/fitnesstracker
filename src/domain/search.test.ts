import { createSearch, normalizeSearchText } from './search';

describe('normalizeSearchText', () => {
  it('vereinheitlicht Umlaute, ß, Groß-/Kleinschreibung und Satzzeichen', () => {
    expect(normalizeSearchText('Bankdrücken (Kurzhantel)')).toBe('bankdrucken kurzhantel');
    expect(normalizeSearchText('BANKDRUECKEN')).toBe('bankdrucken');
    expect(normalizeSearchText('Süßkartoffel')).toBe('susskartoffel');
    expect(normalizeSearchText('Crème fraîche')).toBe('creme fraiche');
    expect(normalizeSearchText('  Öl,  Äpfel  ')).toBe('ol apfel');
  });
});

describe('createSearch', () => {
  const items = [
    { name: 'Bankdrücken (Langhantel)', aliases: ['Bankdrücken', 'Bench Press'] },
    { name: 'Schrägbankdrücken (Langhantel)', aliases: ['Incline Bench Press'] },
    { name: 'Bankdrücken (Kurzhantel)', aliases: ['KH-Bankdrücken'] },
    { name: 'Kniebeugen (Langhantel)', aliases: ['Squat'] },
    { name: 'Haferflocken', aliases: ['Oats'] },
    { name: 'Haferdrink', aliases: ['Hafermilch'] },
  ];
  const search = createSearch(items);
  const names = (query: string) => search(query).map((item) => item.name);

  it('findet unabhängig von Umlauten und Schreibweise', () => {
    expect(names('Bankdrücken')[0]).toBe('Bankdrücken (Langhantel)');
    expect(names('bankdrucken')).toContain('Bankdrücken (Kurzhantel)');
    expect(names('BANKDRUECKEN')).toContain('Bankdrücken (Langhantel)');
  });

  it('verlangt alle Suchwörter und rankt exakte Aliase und Wortanfänge vor Teilwörtern', () => {
    expect(names('bank kurz')).toEqual(['Bankdrücken (Kurzhantel)']);
    expect(names('bankdrücken')).toEqual([
      'Bankdrücken (Langhantel)',
      'Bankdrücken (Kurzhantel)',
      'Schrägbankdrücken (Langhantel)',
    ]);
  });

  it('durchsucht Aliase', () => {
    expect(names('squat')).toEqual(['Kniebeugen (Langhantel)']);
    expect(names('hafermilch')).toEqual(['Haferdrink']);
  });

  it('bevorzugt exakte Namenstreffer und begrenzt die Trefferzahl', () => {
    expect(names('haferflocken')).toEqual(['Haferflocken']);
    expect(names('hafer')).toEqual(['Haferdrink', 'Haferflocken']);
    expect(search('langhantel', 2)).toHaveLength(2);
  });

  it('liefert bei leerer Suche nichts', () => {
    expect(search('   ')).toEqual([]);
    expect(search('xyz')).toEqual([]);
  });
});
