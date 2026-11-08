import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useBackTo } from '../../components/backNavigation';
import { dangerButton, primaryButton, secondaryButton } from '../../components/buttons';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Card, Page } from '../../components/Page';
import { deleteProgressPhoto, updateProgressPhoto } from '../../db/photos';
import type { PhotoInput } from '../../db/schemas';
import type { ProgressPhoto } from '../../db/types';
import { dayKey } from '../../domain/daily';
import { formatGoalDate } from '../../domain/goals';
import { PHOTO_POSE_LABELS } from '../../domain/labels';
import { defaultComparison, formatBytes } from '../../domain/photos';
import { comparePath, PHOTOS_PATH } from './paths';
import { PhotoFields, PhotoImage } from './PhotoParts';
import { useProgressPhoto, useProgressPhotos } from './useSelf';

const HINT = 'text-sm text-muted';

/** Ein Foto groß, Angaben ändern, löschen, vergleichen */
export function PhotoPage() {
  const { id = '' } = useParams();
  const photo = useProgressPhoto(id);
  const backTo = useBackTo(PHOTOS_PATH);
  if (!photo) {
    return (
      <Page title="Foto" backTo={backTo}>
        {photo === null && <p className={HINT}>Foto nicht gefunden.</p>}
      </Page>
    );
  }
  return <PhotoDetail key={photo.id} photo={photo} backTo={backTo} />;
}

function PhotoDetail({ photo, backTo }: { photo: ProgressPhoto; backTo: string }) {
  const navigate = useNavigate();
  const photos = useProgressPhotos();
  const [editing, setEditing] = useState<PhotoInput | null>(null);
  const [deleting, setDeleting] = useState(false);

  const others = photos?.filter((other) => other.id !== photo.id) ?? [];
  // Mit dem ältesten (bzw. sonst neuesten) Foto derselben Ansicht vergleichen
  const partner =
    defaultComparison([photo, ...others.filter((other) => other.pose === photo.pose)])?.find(
      (other) => other.id !== photo.id,
    ) ?? others[0];

  return (
    <Page
      title={`${PHOTO_POSE_LABELS[photo.pose]} · ${formatGoalDate(photo.date)}`}
      backTo={backTo}
    >
      <PhotoImage photo={photo} variant="full" className="mb-3 h-auto w-full rounded-2xl" />
      {editing ? (
        <Card title="Angaben ändern">
          <div className="flex flex-col gap-3">
            <PhotoFields value={editing} today={dayKey(new Date())} onChange={setEditing} />
            <div className="flex gap-2">
              <button type="button" className={secondaryButton} onClick={() => setEditing(null)}>
                Abbrechen
              </button>
              <button
                type="button"
                className={primaryButton}
                onClick={() => {
                  void updateProgressPhoto(photo.id, editing).then(() => setEditing(null));
                }}
              >
                Speichern
              </button>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          {photo.note && <p className="mb-2 whitespace-pre-wrap">{photo.note}</p>}
          <p className={HINT}>
            {photo.width} × {photo.height} px · {formatBytes(photo.bytes)}
          </p>
          <button
            type="button"
            className={`${secondaryButton} mt-3`}
            onClick={() => setEditing({ date: photo.date, pose: photo.pose, note: photo.note })}
          >
            Angaben ändern
          </button>
        </Card>
      )}
      {partner && (
        <Link
          to={comparePath(
            partner.date <= photo.date ? partner.id : photo.id,
            partner.date <= photo.date ? photo.id : partner.id,
          )}
          className={`${primaryButton} mb-2`}
        >
          Vergleichen
        </Link>
      )}
      <button type="button" className={dangerButton} onClick={() => setDeleting(true)}>
        Foto löschen
      </button>
      {deleting && (
        <ConfirmDialog
          title="Foto löschen?"
          confirmLabel="Löschen"
          onConfirm={() => {
            void deleteProgressPhoto(photo.id).then(() => navigate(backTo, { replace: true }));
          }}
          onCancel={() => setDeleting(false)}
        >
          Das Foto wird von diesem Gerät entfernt. Nur ein Backup mit Fotos enthält es noch.
        </ConfirmDialog>
      )}
    </Page>
  );
}
