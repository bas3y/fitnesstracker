import { db } from './database';
import {
  addProgressPhoto,
  addProgressPhotos,
  deleteProgressPhoto,
  listProgressPhotos,
  loadPhotoFile,
  loadProgressPhoto,
  photoStorageBytes,
  updateProgressPhoto,
  type PhotoImage,
} from './photos';
import { resetDatabase } from './testUtils';

beforeEach(resetDatabase);

const testImage = (): PhotoImage => ({
  mimeType: 'image/jpeg',
  width: 1200,
  height: 1600,
  full: new Uint8Array([1, 2, 3, 4, 5]).buffer,
  thumb: new Uint8Array([9, 8]).buffer,
});

describe('Fortschrittsfotos', () => {
  it('speichert Foto und Bilddaten getrennt', async () => {
    const photo = await addProgressPhoto(
      { date: '2026-11-07', pose: 'side', note: ' morgens ' },
      testImage(),
    );
    expect(photo).toMatchObject({
      date: '2026-11-07',
      pose: 'side',
      note: 'morgens',
      width: 1200,
      height: 1600,
      bytes: 7,
    });
    const full = await loadPhotoFile(photo.id, 'full');
    expect(new Uint8Array(full!.data)).toEqual(new Uint8Array([1, 2, 3, 4, 5]));
    expect(full?.mimeType).toBe('image/jpeg');
    expect(new Uint8Array((await loadPhotoFile(photo.id, 'thumb'))!.data)).toEqual(
      new Uint8Array([9, 8]),
    );
    expect(await photoStorageBytes()).toBe(7);
    await expect(
      addProgressPhoto({ date: 'gestern', pose: 'front', note: '' }, testImage()),
    ).rejects.toThrow();
  });

  it('ändert Angaben und löscht die Bilddaten wirklich', async () => {
    const photo = await addProgressPhoto(
      { date: '2026-11-07', pose: 'front', note: '' },
      testImage(),
    );
    await addProgressPhoto({ date: '2026-11-01', pose: 'front', note: '' }, testImage());
    await updateProgressPhoto(photo.id, { date: '2026-11-06', pose: 'back', note: 'x' });
    expect(await loadProgressPhoto(photo.id)).toMatchObject({ date: '2026-11-06', pose: 'back' });

    await deleteProgressPhoto(photo.id);
    expect(await loadProgressPhoto(photo.id)).toBeNull();
    expect((await db.progressPhotos.get(photo.id))?.deletedAt).not.toBeNull();
    expect(await loadPhotoFile(photo.id, 'full')).toBeNull();
    expect(await db.photoFiles.count()).toBe(2);
    expect(await listProgressPhotos()).toHaveLength(1);
  });

  // Vorsorge (Schritt 22): gleicher Tag, gleiche Ansicht, gleichzeitig gespeichert
  const marked = (mark: number): PhotoImage => ({
    ...testImage(),
    full: new Uint8Array([mark, mark, mark]).buffer,
    thumb: new Uint8Array([mark]).buffer,
  });
  const same = { date: '2026-11-07', pose: 'front', note: '' } as const;

  async function expectOwnImages(photos: Array<{ id: string }>, marks: number[]) {
    expect(new Set(photos.map(({ id }) => id)).size).toBe(photos.length);
    for (const [index, photo] of photos.entries()) {
      const full = await loadPhotoFile(photo.id, 'full');
      const thumb = await loadPhotoFile(photo.id, 'thumb');
      expect(new Uint8Array(full!.data)[0]).toBe(marks[index]);
      expect(new Uint8Array(thumb!.data)[0]).toBe(marks[index]);
    }
  }

  it('hält bei gleichzeitigem Speichern jedes Foto mit seinen eigenen Bilddaten', async () => {
    const marks = [1, 2, 3, 4, 5, 6];
    const photos = await Promise.all(marks.map((mark) => addProgressPhoto(same, marked(mark))));
    await expectOwnImages(photos, marks);
    expect(await listProgressPhotos()).toHaveLength(6);
    expect(await db.photoFiles.count()).toBe(12);
  });

  it('speichert eine Mehrfachauswahl auf einmal, jedes Foto eindeutig', async () => {
    const photos = await addProgressPhotos([
      { input: same, image: marked(7) },
      { input: { ...same, pose: 'side', note: 'zwei' }, image: marked(8) },
      { input: same, image: marked(9) },
    ]);
    expect(photos.map(({ pose, note }) => [pose, note])).toEqual([
      ['front', ''],
      ['side', 'zwei'],
      ['front', ''],
    ]);
    await expectOwnImages(photos, [7, 8, 9]);
  });

  it('speichert bei einem ungültigen Eintrag gar nichts', async () => {
    await expect(
      addProgressPhotos([
        { input: same, image: marked(1) },
        { input: { ...same, date: 'gestern' }, image: marked(2) },
      ]),
    ).rejects.toThrow();
    expect(await db.progressPhotos.count()).toBe(0);
    expect(await db.photoFiles.count()).toBe(0);
  });
});
