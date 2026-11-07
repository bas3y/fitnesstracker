import { db } from './database';
import {
  addProgressPhoto,
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
});
