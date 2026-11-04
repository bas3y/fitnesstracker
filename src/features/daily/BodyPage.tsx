import { useFromHere } from '../../components/backNavigation';
import { secondaryButton } from '../../components/buttons';
import { Card, LinkRow, Page } from '../../components/Page';
import { Stepper } from '../../components/Stepper';
import { addWater, updateDailyLog } from '../../db/daily';
import {
  MAX_BODY_WEIGHT_KG,
  MAX_HRV_MS,
  MAX_RESTING_HEART_RATE,
  MAX_STEPS,
  MAX_WATER_ML,
  MIN_BODY_WEIGHT_KG,
  MIN_RESTING_HEART_RATE,
} from '../../db/schemas';
import type { DailyLog, DayKey, Settings } from '../../db/types';
import { hoursToSeconds, formatSleep, secondsToHours } from '../../domain/daily';
import { formatDecimal } from '../../domain/format';
import { DAILY_IMPORT_FIELD_LABELS } from '../../domain/labels';
import { displayToKg, kgToDisplay, roundTo } from '../../domain/units';
import { useSettings } from '../settings/useSettings';
import { DayNavigator } from './DayNavigator';
import { GoalBar } from './GoalBar';
import { HEALTH_IMPORT_PATH, MEASUREMENTS_PATH, withDate } from './paths';
import { RatingPicker } from './RatingPicker';
import { SleepPhasesBar } from './SleepPhasesBar';
import { useBodyMeasurement, useDailyLog, useDayBackTo, useDayParam } from './useDaily';

const WATER_STEP_ML = 250;
const WATER_BOTTLE_ML = 500;
const HINT = 'text-sm text-slate-500 dark:text-slate-400';

/** Körper & Befinden: Tageswerte und Verweis auf die Körpermaße */
export function BodyPage() {
  const settings = useSettings();
  const { date, today, setDate } = useDayParam();
  const log = useDailyLog(date);
  const measurement = useBodyMeasurement(date);
  const backTo = useDayBackTo(date, today);
  const measured = measurement ? Object.keys(measurement.values).length : 0;
  const from = useFromHere();

  return (
    <Page title="Körper & Befinden" backTo={backTo}>
      <DayNavigator date={date} today={today} onChange={setDate} />
      {settings && log !== undefined && (
        <DayForm key={date} date={date} log={log} settings={settings} />
      )}
      <LinkRow
        to={withDate(MEASUREMENTS_PATH, date, today)}
        label="Körpermaße"
        hint={
          measured > 0
            ? `${measured} ${measured === 1 ? 'Maß' : 'Maße'} an diesem Tag`
            : 'Brust, Taille, Arme und mehr'
        }
      />
      <LinkRow
        to={HEALTH_IMPORT_PATH}
        state={from}
        label="Gesundheitsdaten importieren"
        hint="Apple Health, Garmin: Schlaf, Schritte, Ruhepuls, HRV"
      />
    </Page>
  );
}

function DayForm({
  date,
  log,
  settings,
}: {
  date: DayKey;
  log: DailyLog | null;
  settings: Settings;
}) {
  const change = (changes: Parameters<typeof updateDailyLog>[1]) =>
    void updateDailyLog(date, changes);
  const water = log?.waterMl ?? 0;
  const steps = log?.steps ?? 0;
  const unit = settings.weightUnit;
  const toDisplay = (kg: number) => roundTo(kgToDisplay(kg, unit), 1);

  const imported = log?.importedFields ?? [];

  return (
    <>
      {imported.length > 0 && (
        <p className={`mb-3 ${HINT}`} data-testid="imported-fields">
          Aus dem Import: {imported.map((field) => DAILY_IMPORT_FIELD_LABELS[field]).join(', ')}.
          Änderst du einen Wert, bleibt er beim nächsten Import erhalten.
        </p>
      )}
      <Card title="Wasser">
        <div className="flex flex-col gap-3">
          <p className="tabular-nums">
            {formatDecimal(water, 0)} von {formatDecimal(settings.waterGoalMl, 0)} ml
          </p>
          <GoalBar label="Wasserziel" value={water} goal={settings.waterGoalMl} />
          <div className="flex gap-2">
            {[WATER_STEP_ML, WATER_BOTTLE_ML].map((ml) => (
              <button
                key={ml}
                type="button"
                className={secondaryButton}
                onClick={() => void addWater(date, ml)}
              >
                +{ml} ml
              </button>
            ))}
          </div>
          <Stepper
            label="Wasser gesamt"
            value={water}
            unit="ml"
            step={WATER_STEP_ML}
            max={MAX_WATER_ML}
            decimals={0}
            onChange={(value) => value !== null && change({ waterMl: value })}
          />
        </div>
      </Card>

      <Card title="Schritte">
        <div className="flex flex-col gap-3">
          <p className="tabular-nums">
            {formatDecimal(steps, 0)} von {formatDecimal(settings.stepsGoal, 0)}
          </p>
          <GoalBar label="Schrittziel" value={steps} goal={settings.stepsGoal} />
          <Stepper
            label="Schritte gesamt"
            value={steps}
            step={500}
            max={MAX_STEPS}
            decimals={0}
            onChange={(value) => value !== null && change({ steps: value })}
          />
        </div>
      </Card>

      <Card title="Schlaf">
        <div className="flex flex-col gap-3">
          <p className={HINT}>
            Die Nacht vor diesem Tag. Ziel: {formatSleep(settings.sleepGoalSeconds)}
          </p>
          <Stepper
            label="Schlafdauer"
            value={log?.sleepSeconds == null ? null : secondsToHours(log.sleepSeconds)}
            unit="h"
            step={0.5}
            max={24}
            decimals={2}
            startValue={secondsToHours(settings.sleepGoalSeconds)}
            allowEmpty
            onChange={(hours) =>
              change({ sleepSeconds: hours === null ? null : hoursToSeconds(hours) })
            }
          />
          {log?.sleepPhases && <SleepPhasesBar phases={log.sleepPhases} />}
          <RatingPicker
            label="Schlafqualität"
            low="schlecht"
            high="sehr gut"
            value={log?.sleepQuality ?? null}
            onChange={(sleepQuality) => change({ sleepQuality })}
          />
        </div>
      </Card>

      <Card title="Gewicht">
        <Stepper
          label="Körpergewicht an diesem Tag"
          value={log?.weightKg == null ? null : toDisplay(log.weightKg)}
          unit={unit}
          step={0.1}
          min={toDisplay(MIN_BODY_WEIGHT_KG)}
          max={toDisplay(MAX_BODY_WEIGHT_KG)}
          startValue={toDisplay(settings.bodyWeightKg ?? 75)}
          allowEmpty
          onChange={(value) =>
            change({ weightKg: value === null ? null : displayToKg(value, unit) })
          }
        />
      </Card>

      <Card title="Erholung">
        <div className="flex flex-col gap-3">
          <Stepper
            label="Ruhepuls"
            value={log?.restingHeartRate ?? null}
            unit="bpm"
            step={1}
            min={MIN_RESTING_HEART_RATE}
            max={MAX_RESTING_HEART_RATE}
            decimals={0}
            startValue={settings.restingHeartRate ?? 60}
            allowEmpty
            onChange={(restingHeartRate) => change({ restingHeartRate })}
          />
          <Stepper
            label="HRV"
            value={log?.hrvMs ?? null}
            unit="ms"
            step={1}
            min={1}
            max={MAX_HRV_MS}
            decimals={0}
            startValue={50}
            allowEmpty
            onChange={(hrvMs) => change({ hrvMs })}
          />
        </div>
      </Card>

      <Card title="Befinden">
        <div className="flex flex-col gap-3">
          <RatingPicker
            label="Stimmung"
            low="schlecht"
            high="sehr gut"
            value={log?.mood ?? null}
            onChange={(mood) => change({ mood })}
          />
          <RatingPicker
            label="Energie"
            low="niedrig"
            high="hoch"
            value={log?.energy ?? null}
            onChange={(energy) => change({ energy })}
          />
        </div>
      </Card>
    </>
  );
}
