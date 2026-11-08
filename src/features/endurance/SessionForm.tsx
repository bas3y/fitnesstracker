import { useId, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { inputField, primaryButton, secondaryButton } from '../../components/buttons';
import { Chip } from '../../components/Chip';
import { Card } from '../../components/Page';
import { Stepper } from '../../components/Stepper';
import {
  MAX_ELEVATION_METERS,
  MAX_HEART_RATE,
  MAX_LAPS,
  MAX_POOL_METERS,
  MAX_SESSION_KCAL,
  MAX_SESSION_METERS,
  MAX_SWOLF,
  MIN_HEART_RATE,
  enduranceSessionInputSchema,
  type EnduranceSessionInput,
  type EnduranceSessionValues,
} from '../../db/schemas';
import { SWIM_STROKES, type DistanceUnit, type Gear } from '../../db/types';
import { DurationInput } from '../../components/DurationInput';
import {
  formatDistance,
  formatPace,
  gearOptions,
  hasDistance,
  paceLabel,
} from '../../domain/endurance';
import { ENDURANCE_SPORT_LABELS, SWIM_STROKE_LABELS } from '../../domain/labels';
import { displayToMeters, metersToDisplay, roundTo } from '../../domain/units';
import { fromDateTimeInput, toDateInput, toTimeInput } from '../../domain/workout';
import { RatingPicker } from '../daily/RatingPicker';
import { GEAR_PATH } from './paths';

const LABEL = 'mb-1 block text-sm font-medium';
const HINT = 'text-sm text-muted';

export function SessionForm({
  initial,
  gear,
  unit,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: EnduranceSessionInput;
  gear: Gear[];
  unit: DistanceUnit;
  submitLabel: string;
  onSubmit: (values: EnduranceSessionValues) => Promise<void>;
  onCancel: () => void;
}) {
  const titleId = useId();
  const dateId = useId();
  const timeId = useId();
  const gearId = useId();
  const notesId = useId();
  const [input, setInput] = useState(initial);
  const [date, setDate] = useState(toDateInput(initial.startedAt));
  const [time, setTime] = useState(toTimeInput(initial.startedAt));
  const [error, setError] = useState<string | null>(null);
  const change = (changes: Partial<EnduranceSessionInput>) => {
    setInput({ ...input, ...changes });
    setError(null);
  };

  const { sport } = input;
  const swim = sport === 'swim';
  const withDistance = hasDistance(sport);
  const lapDistance =
    swim && input.laps != null && input.poolLengthMeters != null
      ? input.laps * input.poolLengthMeters
      : null;
  const distance = lapDistance ?? input.distanceMeters ?? null;
  const pace = formatPace(sport, distance, input.durationSeconds, unit);
  const options = gearOptions(gear, sport, input.gearId ?? null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const startedAt = fromDateTimeInput(date, time);
    if (!startedAt) {
      setError('Bitte Datum und Beginn angeben');
      return;
    }
    const result = enduranceSessionInputSchema.safeParse({ ...input, startedAt });
    if (result.success) await onSubmit(result.data);
    else setError(result.error.issues[0]?.message ?? 'Eingabe prüfen');
  };

  return (
    <form onSubmit={(event) => void submit(event)}>
      <Card>
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor={titleId} className={LABEL}>
              Titel (optional)
            </label>
            <input
              id={titleId}
              className={inputField}
              maxLength={80}
              placeholder={ENDURANCE_SPORT_LABELS[sport].name}
              value={input.title}
              onChange={(event) => change({ title: event.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor={dateId} className={LABEL}>
                Datum
              </label>
              <input
                id={dateId}
                type="date"
                className={inputField}
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor={timeId} className={LABEL}>
                Beginn
              </label>
              <input
                id={timeId}
                type="time"
                className={inputField}
                value={time}
                onChange={(event) => setTime(event.target.value)}
              />
            </div>
          </div>
          <DurationInput
            value={input.durationSeconds}
            onChange={(durationSeconds) => change({ durationSeconds })}
          />
        </div>
      </Card>

      {withDistance && (
        <Card title="Strecke">
          <div className="flex flex-col gap-4">
            {swim && (
              <>
                <Stepper
                  label="Bahnlänge"
                  value={input.poolLengthMeters ?? null}
                  unit="m"
                  step={25}
                  min={10}
                  max={MAX_POOL_METERS}
                  decimals={1}
                  startValue={25}
                  allowEmpty
                  onChange={(poolLengthMeters) => change({ poolLengthMeters })}
                />
                <Stepper
                  label="Bahnen"
                  value={input.laps ?? null}
                  step={2}
                  min={1}
                  max={MAX_LAPS}
                  decimals={0}
                  startValue={20}
                  allowEmpty
                  onChange={(laps) => change({ laps })}
                />
              </>
            )}
            {lapDistance !== null ? (
              <p data-testid="lap-distance" className="font-medium tabular-nums">
                Distanz: {formatDistance(lapDistance, sport, unit)}
              </p>
            ) : swim ? (
              <Stepper
                label="Distanz"
                value={input.distanceMeters ?? null}
                unit="m"
                step={50}
                min={1}
                max={MAX_SESSION_METERS}
                decimals={0}
                startValue={1000}
                allowEmpty
                onChange={(distanceMeters) => change({ distanceMeters })}
              />
            ) : (
              <Stepper
                label="Distanz"
                value={
                  input.distanceMeters == null
                    ? null
                    : roundTo(metersToDisplay(input.distanceMeters, unit), 2)
                }
                unit={unit}
                step={1}
                min={0.01}
                max={roundTo(metersToDisplay(MAX_SESSION_METERS, unit), 0)}
                decimals={2}
                startValue={5}
                allowEmpty
                onChange={(value) =>
                  change({ distanceMeters: value === null ? null : displayToMeters(value, unit) })
                }
              />
            )}
            {swim && lapDistance === null && (
              <p className={HINT}>Mit Bahnlänge und Bahnen wird die Distanz berechnet.</p>
            )}
            <p data-testid="pace-preview" className={HINT}>
              {paceLabel(sport)}: {pace ?? '–'}
            </p>
            {!swim && (
              <Stepper
                label="Höhenmeter"
                value={input.elevationGainMeters ?? null}
                unit="m"
                step={10}
                max={MAX_ELEVATION_METERS}
                decimals={0}
                startValue={50}
                allowEmpty
                onChange={(elevationGainMeters) => change({ elevationGainMeters })}
              />
            )}
          </div>
        </Card>
      )}

      {swim && (
        <Card title="Schwimmen">
          <div className="flex flex-col gap-4">
            <div role="group" aria-label="Stil" className="flex flex-wrap gap-1">
              {SWIM_STROKES.map((stroke) => (
                <Chip
                  key={stroke}
                  pressed={input.swimStroke === stroke}
                  className="px-3"
                  onClick={() =>
                    change({ swimStroke: input.swimStroke === stroke ? null : stroke })
                  }
                >
                  {SWIM_STROKE_LABELS[stroke]}
                </Chip>
              ))}
            </div>
            <Stepper
              label="SWOLF"
              value={input.swolf ?? null}
              step={1}
              min={1}
              max={MAX_SWOLF}
              decimals={0}
              startValue={40}
              allowEmpty
              onChange={(swolf) => change({ swolf })}
            />
            <p className={HINT}>
              SWOLF = Zeit + Züge pro Bahn, steht in der Auswertung deiner Uhr.
            </p>
          </div>
        </Card>
      )}

      <Card title="Körper">
        <div className="flex flex-col gap-4">
          <Stepper
            label="Puls Ø"
            value={input.avgHeartRate ?? null}
            unit="bpm"
            step={1}
            min={MIN_HEART_RATE}
            max={MAX_HEART_RATE}
            decimals={0}
            startValue={140}
            allowEmpty
            onChange={(avgHeartRate) => change({ avgHeartRate })}
          />
          <Stepper
            label="Puls max."
            value={input.maxHeartRate ?? null}
            unit="bpm"
            step={1}
            min={MIN_HEART_RATE}
            max={MAX_HEART_RATE}
            decimals={0}
            startValue={input.avgHeartRate ?? 170}
            allowEmpty
            onChange={(maxHeartRate) => change({ maxHeartRate })}
          />
          <Stepper
            label="Kalorien"
            value={input.calories ?? null}
            unit="kcal"
            step={10}
            max={MAX_SESSION_KCAL}
            decimals={0}
            startValue={300}
            allowEmpty
            onChange={(calories) => change({ calories })}
          />
          <RatingPicker
            label="Bewertung"
            low="schlecht"
            high="super"
            value={input.rating ?? null}
            onChange={(rating) => change({ rating })}
          />
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-4">
          {withDistance && (
            <div>
              <label htmlFor={gearId} className={LABEL}>
                Ausrüstung
              </label>
              {options.length > 0 ? (
                <select
                  id={gearId}
                  className={inputField}
                  value={input.gearId ?? ''}
                  onChange={(event) => change({ gearId: event.target.value || null })}
                >
                  <option value="">Keine</option>
                  {options.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                      {item.archivedAt !== null ? ' (ausgemustert)' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <p className={HINT}>
                  Noch keine Ausrüstung für {ENDURANCE_SPORT_LABELS[sport].name}.{' '}
                  <Link
                    to={`${GEAR_PATH}/new?sport=${sport}`}
                    className="font-semibold text-primary-text"
                  >
                    Anlegen
                  </Link>
                </p>
              )}
            </div>
          )}
          <div>
            <label htmlFor={notesId} className={LABEL}>
              Notiz
            </label>
            <textarea
              id={notesId}
              rows={3}
              maxLength={1000}
              className={`${inputField} h-auto py-2`}
              value={input.notes}
              onChange={(event) => change({ notes: event.target.value })}
            />
          </div>
        </div>
      </Card>

      {error && (
        <p role="alert" className="mb-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <div className="mb-4 flex gap-2">
        <button type="button" className={secondaryButton} onClick={onCancel}>
          Abbrechen
        </button>
        <button type="submit" className={primaryButton}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
