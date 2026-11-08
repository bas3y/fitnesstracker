import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { inputField, primaryButton } from '../../../components/buttons';
import { Card } from '../../../components/Page';
import { parseBarcode } from '../../../domain/barcode';
import { createFrameDecoder } from './detector';

const SCAN_INTERVAL_MS = 200;
const HINT = 'text-sm text-muted';

type CameraState = 'starting' | 'running' | { error: string };

function cameraError(cause: unknown): string {
  const name = cause instanceof DOMException ? cause.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'Kamera nicht freigegeben. In den Browser-Einstellungen erlauben oder die Nummer eintippen.';
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return 'Keine Kamera gefunden. Nummer unter dem Strichcode eintippen.';
  }
  if (name === 'NotReadableError') {
    return 'Kamera wird gerade von einer anderen App benutzt.';
  }
  return 'Kamera konnte nicht gestartet werden. Nummer unter dem Strichcode eintippen.';
}

/** Kamerabild mit Erkennung und Eingabefeld für die Nummer; meldet nur gültige Strichcodes */
export function BarcodeScanner({ onDetected }: { onDetected: (code: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [camera, setCamera] = useState<CameraState>('starting');
  const [manual, setManual] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);
  const inputId = useId();
  const detected = useRef(onDetected);

  useEffect(() => {
    detected.current = onDetected;
  }, [onDetected]);

  useEffect(() => {
    let stopped = false;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new DOMException('Kamera nicht verfügbar', 'NotFoundError');
      }
      const [media, decode] = await Promise.all([
        navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
        }),
        createFrameDecoder(),
      ]);
      stream = media;
      const element = video.current;
      if (stopped || !element) return;
      element.srcObject = media;
      await element.play();
      setCamera('running');

      const scan = async () => {
        if (stopped) return;
        const raw = element.readyState >= 2 ? await decode(element).catch(() => null) : null;
        const code = raw ? parseBarcode(raw) : null;
        if (stopped) return;
        if (code) {
          navigator.vibrate?.(50);
          detected.current(code);
          return;
        }
        timer = setTimeout(() => void scan(), SCAN_INTERVAL_MS);
      };
      void scan();
    };

    start().catch((cause: unknown) => {
      if (!stopped) setCamera({ error: cameraError(cause) });
    });
    return () => {
      stopped = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const code = parseBarcode(manual);
    if (!code) {
      setManualError(
        'Ungültige Nummer: 8 oder 13 Ziffern unter dem Strichcode, Prüfziffer prüfen.',
      );
      return;
    }
    onDetected(code);
  };

  return (
    <div className="flex flex-col gap-4">
      {typeof camera === 'object' ? (
        <p
          role="alert"
          className="rounded-xl bg-warn-soft px-4 py-3 text-sm font-medium text-on-warn-soft"
        >
          {camera.error}
        </p>
      ) : (
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-black">
          <video
            ref={video}
            className="h-full w-full object-cover"
            playsInline
            muted
            aria-label="Kamerabild"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-8 top-1/2 h-24 -translate-y-1/2 rounded-xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]"
          />
          <p
            role="status"
            className="absolute inset-x-0 bottom-0 bg-scrim px-3 py-2 text-center text-sm text-white"
          >
            {camera === 'starting' ? 'Kamera startet …' : 'Strichcode in den Rahmen halten'}
          </p>
        </div>
      )}

      <Card title="Nummer eintippen">
        <form className="flex flex-col gap-3" onSubmit={submit}>
          <label htmlFor={inputId} className="sr-only">
            Strichcode-Nummer
          </label>
          <input
            id={inputId}
            className={inputField}
            inputMode="numeric"
            autoComplete="off"
            maxLength={20}
            placeholder="z. B. 4001234567890"
            value={manual}
            onChange={(event) => {
              setManual(event.target.value);
              setManualError(null);
            }}
          />
          {manualError && (
            <p role="alert" className="text-sm font-medium text-danger">
              {manualError}
            </p>
          )}
          <button type="submit" className={primaryButton}>
            Übernehmen
          </button>
          <p className={HINT}>Die Nummer steht unter den Strichen auf der Verpackung.</p>
        </form>
      </Card>
    </div>
  );
}
