import Dexie from 'dexie';
import { getDbState, setDbState, watchDatabase } from './dbStatus';

const open: Dexie[] = [];
let counter = 0;
const uniqueName = () => `db-status-test-${++counter}`;

function database(name: string, version: number): Dexie {
  const instance = new Dexie(name);
  instance.version(version).stores({ items: 'id' });
  open.push(instance);
  return instance;
}

beforeEach(() => setDbState('ok'));
afterEach(async () => {
  for (const instance of open.splice(0)) instance.close();
});

describe('watchDatabase', () => {
  it('bleibt ok, wenn die Datenbank normal öffnet', async () => {
    await watchDatabase(database(uniqueName(), 1));
    expect(getDbState()).toEqual({ status: 'ok', error: null });
  });

  it('meldet „veraltet“, wenn ein anderes Fenster die Datenbank aktualisiert', async () => {
    const name = uniqueName();
    const current = database(name, 1);
    await watchDatabase(current);
    await database(name, 2).open();
    expect(getDbState().status).toBe('outdated');
    expect(current.isOpen()).toBe(false);
  });

  it('öffnet auch eine neuere Datenbank (Dexie 4), also kein Fehler mit altem Code', async () => {
    const name = uniqueName();
    const newer = database(name, 3);
    await newer.open();
    newer.close();
    await watchDatabase(database(name, 2));
    expect(getDbState().status).toBe('ok');
  });

  it('meldet einen Fehler, wenn sich die Datenbank nicht öffnen lässt', async () => {
    const broken = database(uniqueName(), 1);
    vi.spyOn(broken, 'open').mockRejectedValueOnce(new Error('QuotaExceededError'));
    await watchDatabase(broken);
    expect(getDbState()).toEqual({ status: 'error', error: 'QuotaExceededError' });
  });

  it('meldet „blockiert“, solange ein altes Fenster das Update aufhält, danach wieder ok', async () => {
    const name = uniqueName();
    // Alte Verbindung ohne Dexie: schließt bei „versionchange“ nicht von selbst
    const old = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(name, 10);
      request.onupgradeneeded = () => request.result.createObjectStore('items', { keyPath: 'id' });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const opening = watchDatabase(database(name, 2));
    await vi.waitFor(() => expect(getDbState().status).toBe('blocked'));
    old.close();
    await opening;
    expect(getDbState().status).toBe('ok');
  });
});
