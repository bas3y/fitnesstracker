import { useId, useState, type FormEvent } from 'react';
import { inputField, primaryButton, secondaryButton } from '../../components/buttons';
import { Switch } from '../../components/Switch';
import { Chip } from '../../components/Chip';
import { DeleteRowButton } from '../../components/DeleteRowButton';
import { Card } from '../../components/Page';
import { SegmentedControl } from '../../components/SegmentedControl';
import { Stepper } from '../../components/Stepper';
import {
  MAX_SUPPLEMENT_AMOUNT,
  MAX_SUPPLEMENT_DOSES,
  supplementInputSchema,
  type SupplementInput,
  type SupplementValues,
} from '../../db/schemas';
import {
  SUPPLEMENT_PERIODS,
  SUPPLEMENT_SCHEDULES,
  SUPPLEMENT_TIMINGS,
  TRAINING_KINDS,
  type SupplementDose,
} from '../../db/types';
import { WEEKDAYS } from '../../domain/plans';
import {
  SUPPLEMENT_PERIOD_LABELS,
  SUPPLEMENT_SCHEDULE_LABELS,
  SUPPLEMENT_TIMING_LABELS,
  TRAINING_KIND_LABELS,
} from '../../domain/supplements';

const LABEL = 'mb-1 block text-sm font-medium';
const HINT = 'text-sm text-muted';

function newDose(): SupplementDose {
  return { id: crypto.randomUUID(), amount: 1, timing: 'time', time: '08:00', period: null };
}

export function SupplementForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: SupplementInput;
  submitLabel: string;
  onSubmit: (input: SupplementValues) => Promise<void>;
  onCancel: () => void;
}) {
  const nameId = useId();
  const unitId = useId();
  const notesId = useId();
  const [input, setInput] = useState<SupplementInput>(
    initial.doses.length > 0 ? initial : { ...initial, doses: [newDose()] },
  );
  const [error, setError] = useState<string | null>(null);
  const change = (changes: Partial<SupplementInput>) => {
    setInput({ ...input, ...changes });
    setError(null);
  };
  const changeDose = (id: string, changes: Partial<SupplementDose>) =>
    change({
      doses: input.doses.map((dose) => (dose.id === id ? { ...dose, ...changes } : dose)),
    });
  const toggleWeekday = (weekday: number) =>
    change({
      weekdays: input.weekdays.includes(weekday)
        ? input.weekdays.filter((value) => value !== weekday)
        : [...input.weekdays, weekday],
    });
  const tracksStock = input.stock !== null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const result = supplementInputSchema.safeParse(input);
    if (result.success) await onSubmit(result.data);
    else setError(result.error.issues[0]?.message ?? 'Eingabe prüfen');
  };

  return (
    <form onSubmit={(event) => void submit(event)}>
      <Card>
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor={nameId} className={LABEL}>
              Name
            </label>
            <input
              id={nameId}
              className={inputField}
              maxLength={80}
              placeholder="z. B. Kreatin"
              value={input.name}
              onChange={(event) => change({ name: event.target.value })}
            />
          </div>
          <div>
            <label htmlFor={unitId} className={LABEL}>
              Einheit
            </label>
            <input
              id={unitId}
              className={inputField}
              maxLength={20}
              placeholder="z. B. g, Kapseln, ml"
              value={input.unit}
              onChange={(event) => change({ unit: event.target.value })}
            />
          </div>
        </div>
      </Card>

      <Card title="Einnahmen">
        <p className={`mb-3 ${HINT}`}>
          Pro fälligem Tag. „Vor/Nach dem Training“ wird mit dem Start bzw. Ende des Workouts
          fällig.
        </p>
        <ol aria-label="Einnahmen" className="flex flex-col gap-4">
          {input.doses.map((dose, index) => (
            <DoseFields
              key={dose.id}
              dose={dose}
              index={index}
              unit={input.unit}
              removable={input.doses.length > 1}
              onChange={(changes) => changeDose(dose.id, changes)}
              onRemove={() =>
                change({ doses: input.doses.filter((other) => other.id !== dose.id) })
              }
            />
          ))}
        </ol>
        {input.doses.length < MAX_SUPPLEMENT_DOSES && (
          <button
            type="button"
            className={`${secondaryButton} mt-3`}
            onClick={() => change({ doses: [...input.doses, newDose()] })}
          >
            + Einnahme
          </button>
        )}
      </Card>

      <Card title="Rhythmus">
        <div className="flex flex-col gap-3">
          <SegmentedControl
            label="Rhythmus"
            options={SUPPLEMENT_SCHEDULES.map((value) => ({
              value,
              label: SUPPLEMENT_SCHEDULE_LABELS[value],
            }))}
            value={input.schedule}
            onChange={(schedule) => change({ schedule })}
          />
          {input.schedule === 'weekdays' && (
            <div role="group" aria-label="Wochentage" className="flex flex-wrap gap-1">
              {WEEKDAYS.map(({ value, label }) => (
                <Chip
                  key={value}
                  pressed={input.weekdays.includes(value)}
                  className="px-3"
                  onClick={() => toggleWeekday(value)}
                >
                  {label}
                </Chip>
              ))}
            </div>
          )}
          {input.schedule === 'training' && (
            <>
              <SegmentedControl
                label="Training"
                options={TRAINING_KINDS.map((value) => ({
                  value,
                  label: TRAINING_KIND_LABELS[value],
                }))}
                value={input.trainingKind}
                onChange={(trainingKind) => change({ trainingKind })}
              />
              <p className={HINT}>
                Trainingstag = an dem Tag gibt es ein Workout oder eine Ausdauer-Einheit. Ausdauer
                zählt bei einer Einheit (außer Mobility) oder einem Workout mit Ausdauerübung.
              </p>
            </>
          )}
        </div>
      </Card>

      <Card title="Bestand">
        <div className="flex flex-col gap-3">
          <Switch
            label="Bestand erfassen"
            checked={tracksStock}
            onChange={(checked) => change({ stock: checked ? (input.packageSize ?? 0) : null })}
          />
          {tracksStock && (
            <>
              <Stepper
                label="Aktueller Bestand"
                value={input.stock ?? 0}
                unit={input.unit}
                step={1}
                max={MAX_SUPPLEMENT_AMOUNT}
                decimals={2}
                onChange={(stock) => stock !== null && change({ stock })}
              />
              <Stepper
                label="Packungsgröße"
                value={input.packageSize ?? null}
                unit={input.unit}
                step={1}
                min={0.01}
                max={MAX_SUPPLEMENT_AMOUNT}
                decimals={2}
                startValue={input.stock || 100}
                allowEmpty
                onChange={(packageSize) => change({ packageSize })}
              />
              <p className={HINT}>
                Jede Einnahme zieht ihre Menge ab. „Neue Packung“ addiert die Packungsgröße.
              </p>
            </>
          )}
        </div>
      </Card>

      <Card>
        <label htmlFor={notesId} className={LABEL}>
          Notiz
        </label>
        <textarea
          id={notesId}
          rows={2}
          maxLength={500}
          className="w-full rounded-xl border border-line bg-subtle px-3 outline-none focus:border-primary focus:bg-surface py-2 text-base"
          placeholder="z. B. mit Wasser, nicht zusammen mit Kaffee"
          value={input.notes}
          onChange={(event) => change({ notes: event.target.value })}
        />
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

function DoseFields({
  dose,
  index,
  unit,
  removable,
  onChange,
  onRemove,
}: {
  dose: SupplementDose;
  index: number;
  unit: string;
  removable: boolean;
  onChange: (changes: Partial<SupplementDose>) => void;
  onRemove: () => void;
}) {
  const timeId = useId();
  const suffix = ` (${index + 1})`;
  const changeTiming = (timing: SupplementDose['timing']) =>
    onChange({
      timing,
      time: timing === 'time' ? (dose.time ?? '08:00') : dose.time,
      period: timing === 'period' ? (dose.period ?? 'morning') : dose.period,
    });

  return (
    <li className="rounded-xl border border-line p-3">
      <div className="flex items-end gap-1">
        <div className="min-w-0 flex-1">
          <Stepper
            label={`Menge${suffix}`}
            value={dose.amount}
            unit={unit}
            step={1}
            min={0.01}
            max={MAX_SUPPLEMENT_AMOUNT}
            decimals={2}
            onChange={(amount) => amount !== null && onChange({ amount })}
          />
        </div>
        {removable && <DeleteRowButton name={`Einnahme ${index + 1}`} onClick={onRemove} />}
      </div>
      <div role="group" aria-label={`Zeitpunkt${suffix}`} className="mt-3 flex flex-wrap gap-1">
        {SUPPLEMENT_TIMINGS.map((timing) => (
          <Chip
            key={timing}
            pressed={dose.timing === timing}
            className="px-3"
            onClick={() => changeTiming(timing)}
          >
            {SUPPLEMENT_TIMING_LABELS[timing]}
          </Chip>
        ))}
      </div>
      {dose.timing === 'time' && (
        <div className="mt-3">
          <label htmlFor={timeId} className={LABEL}>
            Uhrzeit{suffix}
          </label>
          <input
            id={timeId}
            type="time"
            className={inputField}
            value={dose.time ?? ''}
            onChange={(event) => onChange({ time: event.target.value || null })}
          />
        </div>
      )}
      {dose.timing === 'period' && (
        <div role="group" aria-label={`Tageszeit${suffix}`} className="mt-3 flex flex-wrap gap-1">
          {SUPPLEMENT_PERIODS.map((period) => (
            <Chip
              key={period}
              pressed={dose.period === period}
              className="px-3"
              onClick={() => onChange({ period })}
            >
              {SUPPLEMENT_PERIOD_LABELS[period]}
            </Chip>
          ))}
        </div>
      )}
    </li>
  );
}
