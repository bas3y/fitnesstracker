import { db } from './database';
import { create, listActive, softDelete, update } from './repository';
import { photoInputSchema, type PhotoInput } from './schemas';
import type { PhotoFile, PhotoVariant, ProgressPhoto } from './types';

const isActive = (entity: { deletedAt: string | null }) => entity.deletedAt === null;

export interface PhotoImage {
  mimeType: string;
  width: number;
  height: number;
  full: ArrayBuffer;
  thumb: ArrayBuffer;
}

export function listProgressPhotos(): Promise<ProgressPhoto[]> {
  return listActive(db.progressPhotos);
}

export async function loadProgressPhoto(id: string): Promise<ProgressPhoto | null> {
  const photo = await db.progressPhotos.get(id);
  return photo && isActive(photo) ? photo : null;
}

/** Bilddaten in der gewünschten Größe; `null` = Foto gelöscht oder Daten fehlen */
export async function loadPhotoFile(
  photoId: string,
  variant: PhotoVariant,
): Promise<PhotoFile | null> {
  const file = await db.photoFiles.get({ photoId, variant });
  return file && isActive(file) ? file : null;
}

export async function addProgressPhoto(
  input: PhotoInput,
  image: PhotoImage,
): Promise<ProgressPhoto> {
  const values = photoInputSchema.parse(input);
  return db.transaction('rw', db.progressPhotos, db.photoFiles, async () => {
    const photo = await create<ProgressPhoto>(db.progressPhotos, {
      ...values,
      width: image.width,
      height: image.height,
      bytes: image.full.byteLength + image.thumb.byteLength,
    });
    for (const variant of ['full', 'thumb'] as const) {
      await create<PhotoFile>(db.photoFiles, {
        photoId: photo.id,
        variant,
        mimeType: image.mimeType,
        data: image[variant],
      });
    }
    return photo;
  });
}

export async function updateProgressPhoto(id: string, input: PhotoInput): Promise<void> {
  await update(db.progressPhotos, id, photoInputSchema.parse(input));
}

/** Das Foto wird weich gelöscht, die Bilddaten wirklich (sonst bliebe der Speicher belegt) */
export function deleteProgressPhoto(id: string): Promise<void> {
  return db.transaction('rw', db.progressPhotos, db.photoFiles, async () => {
    await softDelete(db.progressPhotos, id);
    await db.photoFiles.where('[photoId+variant]').between([id, ''], [id, '￿']).delete();
  });
}

/** Belegter Speicher aller Fotos in Bytes */
export async function photoStorageBytes(): Promise<number> {
  const photos = await listProgressPhotos();
  return photos.reduce((sum, photo) => sum + photo.bytes, 0);
}
