import { createZip, gzip } from '../../test/importFiles';
import { ImportFileError } from './types';
import { decompress, listZipEntries, readZipEntry, type ZipEntry } from './zip';

// Stark komprimierbarer Inhalt: 1 MB Nullen werden wenige KB groß (Prinzip der ZIP-Bombe)
const zeros = new Uint8Array(1024 * 1024);

describe('Entpacken mit Obergrenze', () => {
  it('entpackt bis zur Grenze und bricht darüber ab', async () => {
    const packed = new Blob([(await gzip(zeros)) as BlobPart]);
    expect(packed.size).toBeLessThan(20_000);
    await expect(decompress(packed, 'gzip', zeros.length)).resolves.toHaveProperty(
      'size',
      zeros.length,
    );
    await expect(decompress(packed, 'gzip', 100_000)).rejects.toThrow(ImportFileError);
    await expect(decompress(packed, 'gzip', 100_000)).rejects.toThrow('zu groß');
  });

  it('prüft ZIP-Einträge am tatsächlichen Inhalt, gepackt und ungepackt', async () => {
    const content = zeros.subarray(0, 50_000);
    const zip = new Blob([
      (await createZip([
        { name: 'gepackt.fit', data: content },
        { name: 'roh.fit', data: content, store: true },
      ])) as BlobPart,
    ]);
    const [packed, stored] = (await listZipEntries(zip)) as [ZipEntry, ZipEntry];
    await expect(readZipEntry(zip, packed, 10_000)).rejects.toThrow('zu groß');
    await expect(readZipEntry(zip, stored, 10_000)).rejects.toThrow('zu groß');
    await expect(readZipEntry(zip, packed)).resolves.toHaveProperty('size', content.length);
  });
});
