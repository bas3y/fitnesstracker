/** Cache, in den der Service Worker geteilte Dateien legt (`public/share-target.js`) */
export const SHARED_FILES_CACHE = 'shared-files';

/** Holt per „Teilen“ übergebene Dateien ab und entfernt sie aus dem Cache */
export async function takeSharedFiles(): Promise<File[]> {
  if (typeof caches === 'undefined') return [];
  const cache = await caches.open(SHARED_FILES_CACHE);
  const files: File[] = [];
  for (const request of await cache.keys()) {
    const response = await cache.match(request);
    if (response) {
      const name = decodeURIComponent(response.headers.get('x-file-name') ?? 'geteilt');
      files.push(new File([await response.blob()], name));
    }
    await cache.delete(request);
  }
  return files;
}
