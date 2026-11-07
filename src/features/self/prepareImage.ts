import type { PhotoImage } from '../../db/photos';
import {
  fitWithin,
  PHOTO_MAX_SIDE,
  PHOTO_QUALITY,
  THUMB_MAX_SIDE,
  THUMB_QUALITY,
} from '../../domain/photos';

type Source = ImageBitmap | HTMLImageElement;

/** Lädt die Datei als Bild; Drehung aus den EXIF-Daten wird angewandt */
async function decode(file: Blob): Promise<Source> {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      // Ältere Browser kennen die Option nicht oder das Format nicht → über <img>
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function sizeOf(source: Source) {
  return source instanceof HTMLImageElement
    ? { width: source.naturalWidth, height: source.naturalHeight }
    : { width: source.width, height: source.height };
}

async function encode(source: Source, maxSide: number, quality: number) {
  const size = fitWithin(sizeOf(source).width, sizeOf(source).height, maxSide);
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Bild kann nicht verarbeitet werden');
  context.imageSmoothingQuality = 'high';
  context.drawImage(source, 0, 0, size.width, size.height);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', quality),
  );
  if (!blob) throw new Error('Bild kann nicht gespeichert werden');
  return { ...size, data: await blob.arrayBuffer() };
}

/** Verkleinert ein Foto (JPEG, längste Seite 1600 px) und erzeugt eine Vorschau */
export async function prepareImage(file: Blob): Promise<PhotoImage> {
  const source = await decode(file);
  try {
    const full = await encode(source, PHOTO_MAX_SIDE, PHOTO_QUALITY);
    const thumb = await encode(source, THUMB_MAX_SIDE, THUMB_QUALITY);
    return {
      mimeType: 'image/jpeg',
      width: full.width,
      height: full.height,
      full: full.data,
      thumb: thumb.data,
    };
  } finally {
    if ('close' in source) source.close();
  }
}
