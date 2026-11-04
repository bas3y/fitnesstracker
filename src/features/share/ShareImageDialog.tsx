import { useEffect, useState } from 'react';
import { secondaryButton } from '../../components/buttons';
import { Dialog } from '../../components/Dialog';
import { SegmentedControl } from '../../components/SegmentedControl';
import { shareFileName, type ShareCardContent, type ShareFormat } from '../../domain/shareCard';
import { shareOrDownload } from '../settings/shareOrDownload';
import { renderShareImage } from './renderShareImage';

const FORMAT_OPTIONS: Array<{ value: ShareFormat; label: string }> = [
  { value: 'story', label: 'Bild' },
  { value: 'sticker', label: 'Sticker' },
];

/** Karomuster zeigt, dass der Sticker durchsichtig ist */
const CHECKERBOARD = {
  backgroundColor: '#94a3b8',
  backgroundImage:
    'linear-gradient(45deg, #64748b 25%, transparent 25%, transparent 75%, #64748b 75%), linear-gradient(45deg, #64748b 25%, transparent 25%, transparent 75%, #64748b 75%)',
  backgroundSize: '16px 16px',
  backgroundPosition: '0 0, 8px 8px',
};

type Status = 'idle' | 'busy' | 'shared' | 'downloaded' | 'error';

const STATUS_TEXT: Partial<Record<Status, string>> = {
  shared: 'Geteilt.',
  downloaded: 'Bild gespeichert (Downloads).',
  error: 'Das Bild konnte nicht erstellt werden.',
};

/** Vorschau und Teilen (Web Share, sonst Download); nur rendern, solange offen */
export function ShareImageDialog({
  content,
  startedAt,
  onClose,
}: {
  content: ShareCardContent;
  startedAt: string;
  onClose: () => void;
}) {
  const [format, setFormat] = useState<ShareFormat>('story');
  const [image, setImage] = useState<{ format: ShareFormat; blob: Blob; url: string } | null>(null);
  const [status, setStatus] = useState<Status>('idle');

  useEffect(() => {
    let cancelled = false;
    let url: string | null = null;
    renderShareImage(content, format).then(
      (blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setImage({ format, blob, url });
      },
      () => !cancelled && setStatus('error'),
    );
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [content, format]);

  const ready = image?.format === format ? image : null;
  const share = async () => {
    if (!ready) return;
    setStatus('busy');
    const file = new File([ready.blob], shareFileName(startedAt, format), { type: 'image/png' });
    const result = await shareOrDownload(file);
    setStatus(result === 'cancelled' ? 'idle' : result);
  };

  return (
    <Dialog title="Teilen-Bild" onClose={onClose}>
      <SegmentedControl
        label="Format"
        options={FORMAT_OPTIONS}
        value={format}
        onChange={(value) => {
          setFormat(value);
          setStatus('idle');
        }}
      />
      <div
        className="flex min-h-48 items-center justify-center overflow-hidden rounded-xl"
        style={format === 'sticker' ? CHECKERBOARD : undefined}
      >
        {ready ? (
          <img
            src={ready.url}
            alt={`Vorschau ${format === 'story' ? 'Bild' : 'Sticker'}`}
            className={format === 'story' ? 'max-h-[50vh] w-auto rounded-xl' : 'w-full'}
          />
        ) : (
          <span className="text-sm text-slate-500 dark:text-slate-400">Wird erstellt …</span>
        )}
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {format === 'story'
          ? 'Hochformat für Instagram-Storys und Chats.'
          : 'Durchsichtig: In der Story über ein eigenes Foto legen.'}
      </p>
      <button
        type="button"
        className={secondaryButton}
        disabled={!ready || status === 'busy'}
        onClick={() => void share()}
      >
        Teilen oder speichern
      </button>
      {STATUS_TEXT[status] && (
        <p role="status" className="text-sm font-medium">
          {STATUS_TEXT[status]}
        </p>
      )}
    </Dialog>
  );
}
