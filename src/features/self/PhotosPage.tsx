import { useId, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useFromHere } from '../../components/backNavigation';
import { primaryButton, secondaryButton } from '../../components/buttons';
import { Card, Page } from '../../components/Page';
import { addProgressPhoto, type PhotoImage as PreparedImage } from '../../db/photos';
import type { PhotoInput } from '../../db/schemas';
import { PHOTO_POSES, type DayKey, type PhotoPose, type ProgressPhoto } from '../../db/types';
import { formatDayLabel } from '../../domain/daily';
import { PHOTO_POSE_LABELS } from '../../domain/labels';
import { defaultComparison, formatBytes, groupPhotosByDate } from '../../domain/photos';
import { useDayBackTo, useDayParam } from '../daily/useDaily';
import { useStorageInfo } from '../settings/storage';
import { comparePath, photoPath } from './paths';
import { PhotoFields, PhotoImage, PoseChips } from './PhotoParts';
import { prepareImage } from './prepareImage';
import { useProgressPhotos } from './useSelf';

const HINT = 'text-sm text-muted';

function usePoseFilter(): [PhotoPose | null, (pose: PhotoPose | null) => void] {
  const [params, setParams] = useSearchParams();
  const { state } = useLocation();
  const value = params.get('pose');
  const pose = PHOTO_POSES.find((item) => item === value) ?? null;
  // Tag und Herkunft für „Zurück“ bleiben erhalten
  const setPose = (next: PhotoPose | null) =>
    setParams(
      (current) => {
        const params = new URLSearchParams(current);
        if (next) params.set('pose', next);
        else params.delete('pose');
        return params;
      },
      { replace: true, state },
    );
  return [pose, setPose];
}

/** Fortschrittsfotos nach Datum, Filter nach Ansicht, Vergleich */
export function PhotosPage() {
  const { date, today } = useDayParam();
  const backTo = useDayBackTo(date, today);
  const photos = useProgressPhotos();
  const [pose, setPose] = usePoseFilter();
  const from = useFromHere();
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PreparedImage | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (fileInput.current) fileInput.current.value = '';
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      setPending(await prepareImage(file));
    } catch {
      setError('Das Bild konnte nicht gelesen werden. Bitte ein JPEG- oder PNG-Foto wählen.');
    } finally {
      setBusy(false);
    }
  };

  const shown = photos?.filter((photo) => !pose || photo.pose === pose) ?? [];
  const comparison = defaultComparison(shown);

  return (
    <Page title="Fortschrittsfotos" backTo={backTo}>
      <label className={`${primaryButton} mb-2 cursor-pointer ${busy ? 'opacity-50' : ''}`}>
        {busy ? 'Foto wird verkleinert …' : '+ Foto hinzufügen'}
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={busy}
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />
      </label>
      <p className={`mb-4 ${HINT}`}>
        Aufnehmen oder aus der Galerie wählen. Bleibt nur auf diesem Gerät.
      </p>
      {error && (
        <p role="alert" className="mb-4 text-sm text-danger">
          {error}
        </p>
      )}

      {photos && photos.length > 0 && (
        <>
          <div className="mb-3">
            <PoseChips label="Ansicht" value={pose} allLabel="Alle" onChange={setPose} />
          </div>
          {comparison && (
            <Link
              to={comparePath(comparison[0].id, comparison[1].id)}
              state={from}
              className={`${secondaryButton} mb-4`}
            >
              Vergleichen
            </Link>
          )}
          <PhotoGrid photos={shown} today={today} from={from} />
          {shown.length === 0 && (
            <Card>
              <p className={HINT}>Keine Fotos mit der Ansicht „{PHOTO_POSE_LABELS[pose!]}“.</p>
            </Card>
          )}
        </>
      )}
      {photos?.length === 0 && (
        <Card>
          <p className={HINT}>
            Noch keine Fotos. Tipp: immer gleiches Licht, gleicher Ort und gleiche Haltung, z. B.
            morgens alle zwei Wochen von vorne, seitlich und hinten.
          </p>
        </Card>
      )}

      {photos && <StorageCard photos={photos} />}

      {pending && (
        <AddPhotoDialog
          image={pending}
          initial={{ date, pose: pose ?? 'front', note: '' }}
          today={today}
          onClose={() => setPending(null)}
        />
      )}
    </Page>
  );
}

function PhotoGrid({
  photos,
  today,
  from,
}: {
  photos: ProgressPhoto[];
  today: DayKey;
  from: ReturnType<typeof useFromHere>;
}) {
  return (
    <>
      {groupPhotosByDate(photos).map((group) => (
        <section key={group.date} aria-label={formatDayLabel(group.date, today)} className="mb-4">
          <h2 className="mb-2 font-semibold">{formatDayLabel(group.date, today)}</h2>
          <ul className="grid grid-cols-3 gap-2">
            {group.photos.map((photo) => (
              <li key={photo.id}>
                <Link to={photoPath(photo.id)} state={from} className="relative block">
                  <PhotoImage
                    photo={photo}
                    variant="thumb"
                    className="aspect-[3/4] w-full rounded-xl object-cover"
                  />
                  <span className="absolute bottom-1 left-1 rounded-md bg-scrim px-1.5 text-xs text-white">
                    {PHOTO_POSE_LABELS[photo.pose]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}

function AddPhotoDialog({
  image,
  initial,
  today,
  onClose,
}: {
  image: PreparedImage;
  initial: PhotoInput;
  today: DayKey;
  onClose: () => void;
}) {
  const titleId = useId();
  const [value, setValue] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview] = useState(() =>
    URL.createObjectURL(new Blob([image.thumb], { type: image.mimeType })),
  );
  const close = () => {
    URL.revokeObjectURL(preview);
    onClose();
  };
  const save = async () => {
    setBusy(true);
    try {
      await addProgressPhoto(value, image);
      close();
    } catch (cause) {
      const quota = cause instanceof Error && cause.name.includes('Quota');
      setError(
        quota
          ? 'Kein Speicherplatz mehr frei. Lösche alte Fotos oder sichere sie per Backup.'
          : 'Speichern fehlgeschlagen.',
      );
      setBusy(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[90dvh] w-full max-w-sm flex-col gap-3 overflow-y-auto rounded-2xl bg-surface p-4 shadow-lg"
      >
        <h2 id={titleId} className="text-lg font-semibold">
          Foto speichern
        </h2>
        <img
          src={preview}
          alt="Vorschau"
          className="mx-auto max-h-48 rounded-xl object-contain"
          width={image.width}
          height={image.height}
        />
        <p className={HINT}>
          Verkleinert auf {image.width} × {image.height} px ·{' '}
          {formatBytes(image.full.byteLength + image.thumb.byteLength)}
        </p>
        <PhotoFields value={value} today={today} onChange={setValue} />
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <button type="button" className={secondaryButton} onClick={close}>
            Abbrechen
          </button>
          <button type="button" className={primaryButton} disabled={busy} onClick={save}>
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
}

/** Wie viel Platz die Fotos belegen und was das Gerät noch hergibt */
function StorageCard({ photos }: { photos: ProgressPhoto[] }) {
  const storage = useStorageInfo();
  const bytes = photos.reduce((sum, photo) => sum + photo.bytes, 0);
  const free =
    storage?.usage != null && storage.quota != null
      ? `App gesamt ${formatBytes(storage.usage)} von etwa ${formatBytes(storage.quota)} verfügbarem Speicher.`
      : null;
  return (
    <Card title="Speicher">
      <p className="text-sm" data-testid="photo-storage">
        {photos.length === 1 ? '1 Foto' : `${photos.length} Fotos`} belegen {formatBytes(bytes)}.{' '}
        {free}
      </p>
      <p className={`mt-2 ${HINT}`}>
        Fotos sind nur im Backup, wenn du beim Export „Fotos einschließen“ wählst (Einstellungen ›
        Datensicherung). Sonst gehen sie mit dem Gerät oder beim Löschen der Browserdaten verloren.
      </p>
      {storage?.persisted === false && (
        <p className={`mt-2 ${HINT}`}>
          Der Speicher ist nicht als dauerhaft markiert: Der Browser darf ihn bei Platzmangel
          leeren. Die App über das Symbol auf dem Startbildschirm zu öffnen hilft.
        </p>
      )}
    </Card>
  );
}
