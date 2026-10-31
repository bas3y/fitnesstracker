import { useState } from 'react';
import { ProgressChart } from '../../components/charts';
import { Chip } from '../../components/Chip';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DeleteRowButton } from '../../components/DeleteRowButton';
import { Card, LinkRow, Page } from '../../components/Page';
import { Stepper } from '../../components/Stepper';
import { deleteBodyMeasurement, setBodyMeasure } from '../../db/daily';
import { MAX_BODY_MEASURE_M, MIN_BODY_MEASURE_M } from '../../db/schemas';
import {
  BODY_MEASURES,
  type BodyMeasure,
  type BodyMeasurement,
  type DayKey,
  type DistanceUnit,
} from '../../db/types';
import { formatBodyLength, latestMeasures, measurePoints } from '../../domain/daily';
import { BODY_MEASURE_LABELS } from '../../domain/labels';
import { formatDayKey } from '../../domain/stats';
import {
  bodyLengthToDisplay,
  bodyLengthUnit,
  displayToBodyLength,
  roundTo,
} from '../../domain/units';
import { useSettings } from '../settings/useSettings';
import { DayNavigator } from './DayNavigator';
import { useBodyMeasurement, useBodyMeasurements, useDayParam } from './useDaily';

const HINT = 'text-sm text-slate-500 dark:text-slate-400';
const DEFAULT_START_CM = 50;

export function BodyMeasurementsPage() {
  const settings = useSettings();
  const { date, today, setDate } = useDayParam();
  const entry = useBodyMeasurement(date);
  const entries = useBodyMeasurements();
  const unit = settings?.distanceUnit;

  return (
    <Page title="Körpermaße" backTo="/daily">
      <DayNavigator date={date} today={today} onChange={setDate} />
      {unit && entry !== undefined && entries && (
        <>
          <MeasureForm key={date} date={date} entry={entry} entries={entries} unit={unit} />
          {entries.length > 0 && <MeasureChart entries={entries} unit={unit} />}
          <EntryList entries={entries} unit={unit} />
        </>
      )}
    </Page>
  );
}

function MeasureForm({
  date,
  entry,
  entries,
  unit,
}: {
  date: DayKey;
  entry: BodyMeasurement | null;
  entries: BodyMeasurement[];
  unit: DistanceUnit;
}) {
  const latest = latestMeasures(entries);
  const toDisplay = (meters: number) => roundTo(bodyLengthToDisplay(meters, unit), 1);
  return (
    <Card title="Maße dieses Tages">
      <div className="flex flex-col gap-3">
        {BODY_MEASURES.map((measure) => {
          const value = entry?.values[measure];
          return (
            <Stepper
              key={measure}
              label={BODY_MEASURE_LABELS[measure]}
              value={value === undefined ? null : toDisplay(value)}
              unit={bodyLengthUnit(unit)}
              step={0.5}
              min={toDisplay(MIN_BODY_MEASURE_M)}
              max={toDisplay(MAX_BODY_MEASURE_M)}
              startValue={toDisplay(latest[measure] ?? DEFAULT_START_CM / 100)}
              allowEmpty
              onChange={(next) =>
                void setBodyMeasure(
                  date,
                  measure,
                  next === null ? null : displayToBodyLength(next, unit),
                )
              }
            />
          );
        })}
      </div>
    </Card>
  );
}

function MeasureChart({ entries, unit }: { entries: BodyMeasurement[]; unit: DistanceUnit }) {
  const [chosen, setChosen] = useState<BodyMeasure | null>(null);
  const available = BODY_MEASURES.filter((measure) =>
    entries.some(({ values }) => values[measure] !== undefined),
  );
  const measure = chosen && available.includes(chosen) ? chosen : available[0]!;
  const points = measurePoints(entries, measure, unit);
  const format = (value: number) => formatBodyLength(value, unit);
  const first = points[0]!.value;
  const last = points.at(-1)!.value;

  return (
    <Card title="Verlauf">
      <div className="flex flex-col gap-3">
        <div role="group" aria-label="Körpermaß" className="flex flex-wrap gap-2">
          {available.map((value) => (
            <Chip key={value} pressed={value === measure} onClick={() => setChosen(value)}>
              {BODY_MEASURE_LABELS[value]}
            </Chip>
          ))}
        </div>
        <ProgressChart
          label={`${BODY_MEASURE_LABELS[measure]} im Verlauf`}
          points={points}
          formatValue={format}
        />
        <p className={HINT} data-testid="measure-summary">
          {points.length > 1
            ? `${format(first)} → ${format(last)}`
            : 'Ab der zweiten Messung entsteht eine Kurve.'}
        </p>
      </div>
    </Card>
  );
}

function entryHint(entry: BodyMeasurement, unit: DistanceUnit) {
  return BODY_MEASURES.flatMap((measure) => {
    const value = entry.values[measure];
    if (value === undefined) return [];
    return `${BODY_MEASURE_LABELS[measure]} ${formatBodyLength(bodyLengthToDisplay(value, unit), unit)}`;
  }).join(', ');
}

function EntryList({ entries, unit }: { entries: BodyMeasurement[]; unit: DistanceUnit }) {
  const [deleting, setDeleting] = useState<BodyMeasurement | null>(null);
  if (entries.length === 0) return null;
  return (
    <section className="mb-4">
      <h2 className="mb-3 text-lg font-semibold">Messungen</h2>
      <ul aria-label="Messungen">
        {[...entries].reverse().map((entry) => (
          <li key={entry.id}>
            <LinkRow
              to={`/daily/measurements?date=${entry.date}`}
              label={formatDayKey(entry.date)}
              hint={entryHint(entry, unit)}
              action={
                <DeleteRowButton
                  name={`Messung vom ${formatDayKey(entry.date)}`}
                  onClick={() => setDeleting(entry)}
                />
              }
            />
          </li>
        ))}
      </ul>
      {deleting && (
        <ConfirmDialog
          title="Messung löschen?"
          confirmLabel="Löschen"
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            void deleteBodyMeasurement(deleting.id);
            setDeleting(null);
          }}
        >
          Alle Maße vom {formatDayKey(deleting.date)} werden entfernt.
        </ConfirmDialog>
      )}
    </section>
  );
}
