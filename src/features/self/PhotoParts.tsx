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
  return (
    <>
      <PhotoDateField
        value={value.date}
        today={today}
        onChange={(date) => onChange({ ...value, date })}
      />
      <PoseChips
        label="Ansicht"
        value={value.pose}
        onChange={(pose) => pose && onChange({ ...value, pose })}
      />
      <PhotoNoteField value={value.note} onChange={(note) => onChange({ ...value, note })} />
    </>
  );
}

export function PhotoDateField({
  value,
  today,
  onChange,
}: {
  value: DayKey;
  today: DayKey;
  onChange: (date: DayKey) => void;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        Tag
      </label>
      <input
        id={id}
        type="date"
        max={today}
        className={inputField}
        value={value}
        onChange={(event) => event.target.value && onChange(event.target.value)}
      />
    </div>
  );
}

export function PhotoNoteField({
  value,
  onChange,
}: {
  value: string;
  onChange: (note: string) => void;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        Notiz (optional)
      </label>
      <textarea
        id={id}
        rows={2}
        maxLength={1000}
        className={`${inputField} h-auto py-2`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
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
