import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useFromHere } from '../../components/backNavigation';
import { primaryButton, secondaryButton } from '../../components/buttons';
import { DeleteRowButton } from '../../components/DeleteRowButton';
import { Card, EmptyState, Page } from '../../components/Page';
import { addProgressPhotos, type PhotoImage as PreparedImage } from '../../db/photos';
import { PHOTO_POSES, type DayKey, type PhotoPose, type ProgressPhoto } from '../../db/types';
import { formatDayLabel } from '../../domain/daily';
import { PHOTO_POSE_LABELS } from '../../domain/labels';
import {
  defaultComparison,
  formatBytes,
  groupPhotosByDate,
  PHOTO_BATCH_MAX,
} from '../../domain/photos';
import { useDayBackTo, useDayParam } from '../daily/useDaily';
import { useStorageInfo } from '../settings/storage';
import { comparePath, photoPath } from './paths';
import { PhotoDateField, PhotoImage, PhotoNoteField, PoseChips } from './PhotoParts';
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
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [pending, setPending] = useState<PendingPhoto[] | null>(null);
  const busy = progress !== null;

  const handleFiles = async (list: FileList | null) => {
    const files = [...(list ?? [])];
    if (fileInput.current) fileInput.current.value = '';
    if (files.length === 0) return;
    const chosen = files.slice(0, PHOTO_BATCH_MAX);
    const messages: string[] = [];
    if (files.length > chosen.length) {
      messages.push(`Es werden die ersten ${PHOTO_BATCH_MAX} Fotos übernommen.`);
    }
    setNotes([]);
    // Nacheinander verkleinern: immer nur ein Bild gleichzeitig im Speicher
    const prepared: PendingPhoto[] = [];
    let failed = 0;
    for (const [index, file] of chosen.entries()) {
      setProgress({ done: index, total: chosen.length });
      try {
        prepared.push({ key: crypto.randomUUID(), image: await prepareImage(file) });
      } catch {
        failed += 1;
      }
    }
    setProgress(null);
    if (failed > 0) {
      messages.unshift(
        failed === chosen.length
          ? `${failed === 1 ? 'Das Bild konnte' : 'Die Bilder konnten'} nicht gelesen werden. Bitte JPEG- oder PNG-Fotos wählen.`
          : `${failed === 1 ? '1 Bild konnte' : `${failed} Bilder konnten`} nicht gelesen werden und ${failed === 1 ? 'fehlt' : 'fehlen'}.`,
      );
    }
    setNotes(messages);
    if (prepared.length > 0) setPending(prepared);
  };

  const shown = photos?.filter((photo) => !pose || photo.pose === pose) ?? [];
  const comparison = defaultComparison(shown);

  return (
    <Page title="Fortschrittsfotos" backTo={backTo}>
      <label className={`${primaryButton} mb-2 cursor-pointer ${busy ? 'opacity-50' : ''}`}>
        {!progress
          ? '+ Foto hinzufügen'
          : progress.total === 1
            ? 'Foto wird verkleinert …'
            : `Fotos werden verkleinert … (${progress.done + 1} von ${progress.total})`}
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          disabled={busy}
          onChange={(event) => void handleFiles(event.target.files)}
        />
      </label>
      <p className={`mb-4 ${HINT}`}>Bleibt nur auf diesem Gerät.</p>
      {notes.length > 0 && (
        <div role="alert" className="mb-4 text-sm text-danger">
          {notes.map((note) => (
            <p key={note}>{note}</p>
          ))}
        </div>
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
        <EmptyState
          text="Noch keine Fotos."
          info={{
            title: 'Tipp',
            content: (
              <p>
                Immer gleiches Licht, gleicher Ort und gleiche Haltung, z. B. morgens alle zwei
                Wochen von vorne, seitlich und hinten.
              </p>
            ),
          }}
        />
      )}

      {photos && <StorageCard photos={photos} />}

      {pending && (
        <AddPhotosDialog
          photos={pending}
          initialDate={date}
          initialPose={pose ?? 'front'}
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

/** Ausgewähltes, schon verkleinertes Foto; `key` nur für die Liste im Fenster */
interface PendingPhoto {
  key: string;
  image: PreparedImage;
}

interface PendingValues {
  pose: PhotoPose;
  note: string;
}

/** Ein Fenster für alle gewählten Fotos: Tag gemeinsam, Ansicht und Notiz je Foto */
function AddPhotosDialog({
  photos: initialPhotos,
  initialDate,
  initialPose,
  today,
  onClose,
}: {
  photos: PendingPhoto[];
  initialDate: DayKey;
  initialPose: PhotoPose;
  today: DayKey;
  onClose: () => void;
}) {
  const titleId = useId();
  const [photos, setPhotos] = useState(initialPhotos);
  const [date, setDate] = useState(initialDate);
  const [values, setValues] = useState<Record<string, PendingValues>>(() =>
    Object.fromEntries(initialPhotos.map(({ key }) => [key, { pose: initialPose, note: '' }])),
  );
  const [busy, setBusy] = useState(false);
  // Sperrt sofort (der Zustand greift erst nach dem nächsten Zeichnen): kein doppeltes Speichern
  const saving = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const single = photos.length === 1;

  const change = (key: string, next: Partial<PendingValues>) =>
    setValues((current) => ({ ...current, [key]: { ...current[key]!, ...next } }));
  const remove = (key: string) => {
    const rest = photos.filter((photo) => photo.key !== key);
    if (rest.length === 0) onClose();
    else setPhotos(rest);
  };
  const save = async () => {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    try {
      await addProgressPhotos(
        photos.map(({ key, image }) => ({ input: { date, ...values[key]! }, image })),
      );
      onClose();
    } catch (cause) {
      const quota = cause instanceof Error && cause.name.includes('Quota');
      setError(
        quota
          ? 'Kein Speicherplatz mehr frei. Lösche alte Fotos oder sichere sie per Backup.'
          : 'Speichern fehlgeschlagen.',
      );
      saving.current = false;
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
          {single ? 'Foto speichern' : `${photos.length} Fotos speichern`}
        </h2>
        <PhotoDateField value={date} today={today} onChange={setDate} />
        {photos.map(({ key, image }, index) => {
          const name = single ? 'Foto' : `Foto ${index + 1} von ${photos.length}`;
          return (
            <section
              key={key}
              aria-label={name}
              className={`flex flex-col gap-3 ${single ? '' : 'rounded-xl bg-subtle p-3'}`}
            >
              <div className={single ? 'flex flex-col gap-3' : 'flex items-start gap-3'}>
                <PendingPreview image={image} large={single} />
                <div className="min-w-0 flex-1">
                  {!single && <p className="font-medium">{name}</p>}
                  <p className={HINT}>
                    Verkleinert auf {image.width} × {image.height} px ·{' '}
                    {formatBytes(image.full.byteLength + image.thumb.byteLength)}
                  </p>
                </div>
                {!single && (
                  <DeleteRowButton name={name} verb="entfernen" onClick={() => remove(key)} />
                )}
              </div>
              <PoseChips
                label="Ansicht"
                value={values[key]!.pose}
                onChange={(pose) => pose && change(key, { pose })}
              />
              <PhotoNoteField
                value={values[key]!.note}
                onChange={(note) => change(key, { note })}
              />
            </section>
          );
        })}
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <button type="button" className={secondaryButton} onClick={onClose}>
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

/** Vorschau aus den verkleinerten Bilddaten; die Objekt-URL wird beim Entfernen freigegeben */
function PendingPreview({ image, large }: { image: PreparedImage; large: boolean }) {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const url = URL.createObjectURL(new Blob([image.thumb], { type: image.mimeType }));
    if (ref.current) ref.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [image]);
  const size = large ? 'mx-auto max-h-48 w-auto' : 'h-24 w-auto';
  return (
    <img
      ref={ref}
      alt="Vorschau"
      className={`${size} shrink-0 rounded-xl bg-subtle-strong object-contain`}
      width={image.width}
      height={image.height}
    />
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
