/** Liest einen Strichcode aus dem aktuellen Kamerabild, `null` = keiner erkannt */
export type FrameDecoder = (video: HTMLVideoElement) => Promise<string | null>;

// Fehlt in den TypeScript-DOM-Typen (Shape Detection API, Chrome/Android)
interface NativeBarcodeDetector {
  detect(source: CanvasImageSource): Promise<Array<{ rawValue: string }>>;
}
interface NativeBarcodeDetectorClass {
  new (options: { formats: string[] }): NativeBarcodeDetector;
  getSupportedFormats(): Promise<string[]>;
}

const NATIVE_FORMATS = ['ean_13', 'ean_8', 'upc_a'];

async function nativeDecoder(): Promise<FrameDecoder | null> {
  const Detector = (window as unknown as { BarcodeDetector?: NativeBarcodeDetectorClass })
    .BarcodeDetector;
  if (!Detector) return null;
  try {
    const supported = await Detector.getSupportedFormats();
    const formats = NATIVE_FORMATS.filter((format) => supported.includes(format));
    if (!formats.includes('ean_13')) return null;
    const detector = new Detector({ formats });
    return async (video) => (await detector.detect(video))[0]?.rawValue ?? null;
  } catch {
    return null;
  }
}

/**
 * `BarcodeDetector`, wo vorhanden (Android Chrome), sonst ZXing (iPhone). ZXing wird erst hier
 * nachgeladen und landet so nicht im Hauptbundle.
 */
export async function createFrameDecoder(): Promise<FrameDecoder> {
  const native = await nativeDecoder();
  if (native) return native;
  const { createZxingDecoder } = await import('./zxingDecoder');
  return createZxingDecoder();
}
