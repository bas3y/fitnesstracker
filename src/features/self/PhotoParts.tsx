import { useId } from 'react';
import { inputField } from '../../components/buttons';
import { Chip } from '../../components/Chip';
import type { PhotoInput } from '../../db/schemas';
import { PHOTO_POSES, type DayKey, type PhotoPose, type ProgressPhoto } from '../../db/types';
import { PHOTO_POSE_LABELS } from '../../domain/labels';
import { photoLabel } from '../../domain/photos';
import { usePhotoUrl } from './useSelf';

/** Bild bzw. Vorschau aus der Datenbank; Platzhalter, solange es lädt */
export function PhotoImage({
  photo,
  variant,
  className = '',
}: {
  photo: Pick<ProgressPhoto, 'id' | 'pose' | 'date' | 'width' | 'height'>;
  variant: 'full' | 'thumb';
  className?: string;
}) {
  const url = usePhotoUrl(photo.id, variant);
  if (!url) {
    return (
      <div
        role="img"
        aria-label={url === null ? `${photoLabel(photo)} (Bild fehlt)` : photoLabel(photo)}
        className={`flex items-center justify-center bg-subtle-strong text-sm text-muted ${className}`}
        style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
      >
        {url === null ? 'Bild fehlt' : ''}
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={photoLabel(photo)}
      width={photo.width}
      height={photo.height}
      className={className}
      draggable={false}
    />
  );
}

/** Tag, Ansicht und Notiz eines Fotos */
export function PhotoFields({
  value,
  today,
  onChange,
}: {
  value: PhotoInput;
  today: DayKey;
  onChange: (value: PhotoInput) => void;
}) {
  const dateId = useId();
  const noteId = useId();
  return (
    <>
      <div>
        <label htmlFor={dateId} className="mb-1 block text-sm font-medium">
          Tag
        </label>
        <input
          id={dateId}
          type="date"
          max={today}
          className={inputField}
          value={value.date}
          onChange={(event) =>
            event.target.value && onChange({ ...value, date: event.target.value })
          }
        />
      </div>
      <PoseChips
        label="Ansicht"
        value={value.pose}
        onChange={(pose) => pose && onChange({ ...value, pose })}
      />
      <div>
        <label htmlFor={noteId} className="mb-1 block text-sm font-medium">
          Notiz (optional)
        </label>
        <textarea
          id={noteId}
          rows={2}
          maxLength={1000}
          className={`${inputField} h-auto py-2`}
          value={value.note}
          onChange={(event) => onChange({ ...value, note: event.target.value })}
        />
      </div>
    </>
  );
}

/** Auswahl der Ansicht; mit `allLabel` auch „alle“ (`null`) */
export function PoseChips({
  label,
  value,
  allLabel,
  onChange,
}: {
  label: string;
  value: PhotoPose | null;
  allLabel?: string;
  onChange: (pose: PhotoPose | null) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-sm font-medium">{label}</p>
      <div role="group" aria-label={label} className="flex flex-wrap gap-2">
        {allLabel && (
          <Chip pressed={value === null} onClick={() => onChange(null)}>
            {allLabel}
          </Chip>
        )}
        {PHOTO_POSES.map((pose) => (
          <Chip key={pose} pressed={value === pose} onClick={() => onChange(pose)}>
            {PHOTO_POSE_LABELS[pose]}
          </Chip>
        ))}
      </div>
    </div>
  );
}
