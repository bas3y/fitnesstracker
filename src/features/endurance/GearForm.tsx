import { useId, useState, type FormEvent } from 'react';
import { inputField, primaryButton, secondaryButton } from '../../components/buttons';
import { Chip } from '../../components/Chip';
import { Card } from '../../components/Page';
import { Stepper } from '../../components/Stepper';
import {
  DISTANCE_SPORTS,
  MAX_GEAR_METERS,
  gearFieldsSchema,
  type GearInput,
  type GearValues,
} from '../../db/schemas';
import type { DistanceUnit } from '../../db/types';
import { ENDURANCE_SPORT_LABELS } from '../../domain/labels';
import { displayToMeters, metersToDisplay, roundTo } from '../../domain/units';

const LABEL = 'mb-1 block text-sm font-medium';
const HINT = 'text-sm text-muted';

export function GearForm({
  initial,
  unit,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: GearInput;
  unit: DistanceUnit;
  submitLabel: string;
  onSubmit: (values: GearValues) => Promise<void>;
  onCancel: () => void;
}) {
  const nameId = useId();
  const notesId = useId();
  const [input, setInput] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const change = (changes: Partial<GearInput>) => {
    setInput({ ...input, ...changes });
    setError(null);
  };
  const toDisplay = (meters: number) => roundTo(metersToDisplay(meters, unit), 1);
  const maxDisplay = roundTo(metersToDisplay(MAX_GEAR_METERS, unit), 0);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const result = gearFieldsSchema.safeParse(input);
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
              placeholder="z. B. Laufschuh Pegasus"
              value={input.name}
              onChange={(event) => change({ name: event.target.value })}
            />
          </div>
          <div>
            <span className={LABEL}>Sportarten</span>
            <div role="group" aria-label="Sportarten" className="flex flex-wrap gap-1">
              {DISTANCE_SPORTS.map((sport) => (
                <Chip
                  key={sport}
                  pressed={input.sports.includes(sport)}
                  className="px-3"
                  onClick={() =>
                    change({
                      sports: input.sports.includes(sport)
                        ? input.sports.filter((item) => item !== sport)
                        : DISTANCE_SPORTS.filter(
                            (item) => item === sport || input.sports.includes(item),
                          ),
                    })
                  }
                >
                  {ENDURANCE_SPORT_LABELS[sport].icon} {ENDURANCE_SPORT_LABELS[sport].name}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card title="Kilometerstand">
        <div className="flex flex-col gap-4">
          <Stepper
            label="Bisherige Strecke"
            value={toDisplay(input.initialDistanceMeters)}
            unit={unit}
            step={10}
            max={maxDisplay}
            decimals={1}
            onChange={(value) =>
              value !== null && change({ initialDistanceMeters: displayToMeters(value, unit) })
            }
          />
          <Stepper
            label="Warnung ab"
            value={input.warnDistanceMeters == null ? null : toDisplay(input.warnDistanceMeters)}
            unit={unit}
            step={50}
            min={1}
            max={maxDisplay}
            decimals={0}
            startValue={unit === 'km' ? 700 : 450}
            allowEmpty
            onChange={(value) =>
              change({ warnDistanceMeters: value === null ? null : displayToMeters(value, unit) })
            }
          />
          <p className={HINT}>
            Bisherige Strecke = vor dem Erfassen in der App. Laufschuhe halten meist 600–800 km.
            Leer = keine Warnung.
          </p>
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
          className={`${inputField} h-auto py-2`}
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
