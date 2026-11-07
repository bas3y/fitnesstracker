import { useLiveQuery } from 'dexie-react-hooks';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useBackTo } from '../../components/backNavigation';
import { secondaryButton } from '../../components/buttons';
import { Page } from '../../components/Page';
import { Select } from '../../components/Select';
import { loadBodyWeights } from '../../db/daily';
import type { ProgressPhoto } from '../../db/types';
import { formatGoalDate } from '../../domain/goals';
import { PHOTO_POSE_LABELS } from '../../domain/labels';
import { formatPhotoGap, sortPhotos, weightNear } from '../../domain/photos';
import { formatWeight } from '../../domain/workout';
import { useSettings } from '../settings/useSettings';
import { PHOTOS_PATH } from './paths';
import { PhotoImage } from './PhotoParts';
import { useProgressPhotos } from './useSelf';

const HINT = 'text-sm text-slate-500 dark:text-slate-400';

/** Zwei Fotos nebeneinander (Vorher/Nachher) mit Abstand und Gewicht */
export function PhotoComparePage() {
  const [params, setParams] = useSearchParams();
  const { state } = useLocation();
  const backTo = useBackTo(PHOTOS_PATH);
  const photos = useProgressPhotos();
  const weights = useLiveQuery(loadBodyWeights, []);
  const settings = useSettings();

  if (!photos)
    return (
      <Page title="Vergleich" backTo={backTo}>
        {null}
      </Page>
    );
  const sorted = sortPhotos(photos).reverse();
  const find = (id: string | null) => sorted.find((photo) => photo.id === id) ?? null;
  const first = find(params.get('a')) ?? sorted[0] ?? null;
  const second = find(params.get('b')) ?? sorted.at(-1) ?? null;
  // Herkunft (`state`) bleibt erhalten, damit „Zurück“ weiter zur aufrufenden Seite führt
  const show = (a: string, b: string) => setParams({ a, b }, { replace: true, state });
  const labels = Object.fromEntries(
    sorted.map((photo) => [
      photo.id,
      `${formatGoalDate(photo.date)} · ${PHOTO_POSE_LABELS[photo.pose]}`,
    ]),
  );

  const describe = (photo: ProgressPhoto) => {
    const weight = weights ? weightNear(weights, photo.date) : null;
    if (!weight || !settings) return null;
    const value = formatWeight(weight.weightKg, settings.weightUnit);
    return weight.date === photo.date ? value : `${value} (am ${formatGoalDate(weight.date)})`;
  };

  if (!first || !second || sorted.length < 2) {
    return (
      <Page title="Vergleich" backTo={backTo}>
        <p className={HINT}>Für einen Vergleich braucht es mindestens zwei Fotos.</p>
      </Page>
    );
  }

  return (
    <Page title="Vergleich" backTo={backTo}>
      <p className="mb-3 text-center font-semibold" data-testid="photo-gap">
        {formatPhotoGap(first.date, second.date)}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {[
          { key: 'a' as const, photo: first, label: 'Vorher' },
          { key: 'b' as const, photo: second, label: 'Nachher' },
        ].map(({ key, photo, label }) => {
          const weight = describe(photo);
          return (
            <section key={key} aria-label={label} className="min-w-0">
              <PhotoImage
                photo={photo}
                variant="full"
                className="mb-2 aspect-[3/4] w-full rounded-xl bg-slate-200 object-contain dark:bg-slate-700"
              />
              {weight && <p className="mb-1 text-sm font-semibold tabular-nums">{weight}</p>}
              <Select
                label={label}
                value={photo.id}
                options={sorted.map((item) => item.id)}
                labels={labels}
                onChange={(id) => {
                  if (id) show(key === 'a' ? id : first.id, key === 'b' ? id : second.id);
                }}
              />
            </section>
          );
        })}
      </div>
      <button
        type="button"
        className={`${secondaryButton} mt-4`}
        onClick={() => show(second.id, first.id)}
      >
        Seiten tauschen
      </button>
    </Page>
  );
}
