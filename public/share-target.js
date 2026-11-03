// Teilen-Ziel (Android): Der Service Worker nimmt geteilte Dateien an, legt sie in den Cache
// „shared-files“ und öffnet die Import-Seite, die sie dort abholt (siehe sharedFiles.ts).
// Wird per `workbox.importScripts` in den generierten Service Worker geladen.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'POST' || !url.pathname.endsWith('/share-target')) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open('shared-files');
      for (const key of await cache.keys()) await cache.delete(key);
      try {
        const data = await event.request.formData();
        const files = data.getAll('files').filter((file) => typeof file !== 'string');
        await Promise.all(
          files.map((file, index) =>
            cache.put(
              new Request(new URL(`shared-files/${index}`, self.registration.scope).href),
              new Response(file, { headers: { 'x-file-name': encodeURIComponent(file.name) } }),
            ),
          ),
        );
      } catch {
        // Ohne lesbare Dateien öffnet die Import-Seite einfach leer
      }
      const target = new URL('./#/training/import?shared=1', self.registration.scope);
      return Response.redirect(target.href, 303);
    })(),
  );
});
