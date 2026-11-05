import {
  BarcodeFormat,
  BinaryBitmap,
  DecodeHintType,
  HybridBinarizer,
  MultiFormatReader,
  RGBLuminanceSource,
} from '@zxing/library';
import type { FrameDecoder } from './detector';

/** Breite, auf die das Kamerabild verkleinert wird (schneller, reicht für EAN) */
const MAX_WIDTH = 720;

/** Graustufenbild (ein Byte je Pixel) → Strichcode-Text, `null` = keiner erkannt */
export type LuminanceDecoder = (
  luminances: Uint8ClampedArray,
  width: number,
  height: number,
) => string | null;

export function createLuminanceDecoder(): LuminanceDecoder {
  const reader = new MultiFormatReader();
  reader.setHints(
    new Map<DecodeHintType, unknown>([
      [
        DecodeHintType.POSSIBLE_FORMATS,
        [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A],
      ],
      [DecodeHintType.TRY_HARDER, true],
    ]),
  );
  return (luminances, width, height) => {
    try {
      const bitmap = new BinaryBitmap(
        new HybridBinarizer(new RGBLuminanceSource(luminances, width, height)),
      );
      return reader.decodeWithState(bitmap).getText();
    } catch {
      // NotFoundException u. a.: in diesem Bild kein Strichcode
      return null;
    } finally {
      reader.reset();
    }
  };
}

export function createZxingDecoder(): FrameDecoder {
  const decode = createLuminanceDecoder();
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });

  return async (video) => {
    if (!context || video.videoWidth === 0) return null;
    const scale = Math.min(1, MAX_WIDTH / video.videoWidth);
    const width = Math.round(video.videoWidth * scale);
    const height = Math.round(video.videoHeight * scale);
    canvas.width = width;
    canvas.height = height;
    context.drawImage(video, 0, 0, width, height);
    const { data } = context.getImageData(0, 0, width, height);
    const luminances = new Uint8ClampedArray(width * height);
    for (let i = 0, p = 0; i < luminances.length; i++, p += 4) {
      luminances[i] = (data[p]! * 306 + data[p + 1]! * 601 + data[p + 2]! * 117) >> 10;
    }
    return decode(luminances, width, height);
  };
}
