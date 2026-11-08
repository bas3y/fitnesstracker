import { useMemo, useState, type ReactNode } from 'react';
import { createSearch, type Searchable } from '../domain/search';
import { Card } from './Page';
import { SearchInput } from './SearchInput';

const MAX_RESULTS = 50;

interface CatalogSearchProps<T extends Searchable & { id: string }> {
  /** `undefined`, solange die Datenbank lädt */
  items: T[] | undefined;
  label: string;
  placeholder: string;
  noun: string;
  renderItem: (item: T) => ReactNode;
}

/** Suchfeld + Trefferliste für mitgelieferte Datenbanken (Übungen, Lebensmittel) */
export function CatalogSearch<T extends Searchable & { id: string }>({
  items,
  label,
  placeholder,
  noun,
  renderItem,
}: CatalogSearchProps<T>) {
  const [query, setQuery] = useState('');
  const search = useMemo(() => createSearch(items ?? []), [items]);
  const results = useMemo(() => search(query, MAX_RESULTS), [search, query]);

  return (
    <>
      <SearchInput label={label} placeholder={placeholder} value={query} onChange={setQuery} />
      {items === undefined || items.length === 0 ? (
        <p role="status" className="text-sm text-muted">
          Datenbank wird eingerichtet …
        </p>
      ) : query.trim() === '' ? (
        <p className="text-sm text-muted">
          {items.length} {noun} offline verfügbar.
        </p>
      ) : results.length === 0 ? (
        <p role="status" className="text-sm text-muted">
          Keine Treffer für „{query.trim()}“.
        </p>
      ) : (
        <Card>
          <ul aria-label="Suchergebnisse" className="-my-2 divide-y divide-line">
            {results.map((item) => (
              <li key={item.id} className="py-2">
                {renderItem(item)}
              </li>
            ))}
          </ul>
          {results.length === MAX_RESULTS && (
            <p className="mt-3 text-xs text-muted">
              Nur die ersten {MAX_RESULTS} Treffer – Suche genauer eingeben.
            </p>
          )}
        </Card>
      )}
    </>
  );
}
