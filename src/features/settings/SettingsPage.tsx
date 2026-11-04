import { useState } from 'react';
import { Card, LinkRow, Page } from '../../components/Page';
import { SegmentedControl } from '../../components/SegmentedControl';
import { Stepper } from '../../components/Stepper';
import { setCurrentBodyWeight } from '../../db/daily';
import {
  MAX_HEART_RATE,
  MAX_KCAL_GOAL,
  MAX_LOW_STOCK_DAYS,
  MAX_MACRO_GOAL_G,
  MAX_STEPS,
  MAX_WATER_ML,
  MIN_HEART_RATE,
} from '../../db/schemas';
import { getSettings, updateSettings } from '../../db/settings';
import type { NutritionGoal, NutritionGoals, Settings } from '../../db/types';
import { setRestTimerEnabled } from '../../db/workouts';
import { hoursToSeconds, secondsToHours } from '../../domain/daily';
import { formatDecimal } from '../../domain/format';
import { proteinPerKg } from '../../domain/nutrition';
import { displayToKg, kgToDisplay, roundTo } from '../../domain/units';
import { notificationState, requestNotifications } from '../supplements/notifications';
import { BackupSection } from './BackupSection';
import { ExportSection } from './ExportSection';
import { StorageSection } from './StorageSection';
import { useSettings } from './useSettings';

export function SettingsPage() {
  const settings = useSettings();

  return (
    <Page title="Einstellungen">
      {settings && (
        <>
          <ProfileCard settings={settings} />
          <Card title="Einheiten">
            <div className="flex flex-col gap-3">
              <SegmentedControl
                label="Gewicht"
                options={[
                  { value: 'kg', label: 'kg' },
                  { value: 'lb', label: 'lb' },
                ]}
                value={settings.weightUnit}
                onChange={(weightUnit) => void updateSettings({ weightUnit })}
              />
              <SegmentedControl
                label="Distanz"
                options={[
                  { value: 'km', label: 'km' },
                  { value: 'mi', label: 'mi' },
                ]}
                value={settings.distanceUnit}
                onChange={(distanceUnit) => void updateSettings({ distanceUnit })}
              />
            </div>
          </Card>
          <TrainingCard settings={settings} />
          <DailyGoalsCard settings={settings} />
          <NutritionGoalsCard settings={settings} />
          <SupplementSettingsCard settings={settings} />
          <Card title="Darstellung">
            <SegmentedControl
              label="Theme"
              options={[
                { value: 'system', label: 'System' },
                { value: 'light', label: 'Hell' },
                { value: 'dark', label: 'Dunkel' },
              ]}
              value={settings.theme}
              onChange={(theme) => void updateSettings({ theme })}
            />
          </Card>
          <BackupSection settings={settings} />
          <ExportSection unit={settings.weightUnit} />
          <StorageSection />
        </>
      )}
      <LinkRow to="/settings/about" label="Über & Lizenzen" hint="Datenquellen und Software" />
    </Page>
  );
}

function TrainingCard({ settings }: { settings: Settings }) {
  const checkbox = 'h-5 w-5 accent-emerald-600';
  return (
    <Card title="Training">
      <div className="flex flex-col gap-2">
        <label className="flex min-h-11 items-center gap-3">
          <input
            type="checkbox"
            className={checkbox}
            checked={settings.restTimerEnabled}
            onChange={(event) => void setRestTimerEnabled(event.target.checked)}
          />
          Pausen-Timer
        </label>
        {settings.restTimerEnabled && (
          <>
            <Stepper
              label="Pausenzeit nach einem Satz"
              value={settings.restTimerSeconds}
              unit="s"
              step={15}
              max={900}
              decimals={0}
              onChange={(value) =>
                value !== null && void updateSettings({ restTimerSeconds: value })
              }
            />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Pläne können je Übung eine eigene Pausenzeit festlegen.
            </p>
            <label className="flex min-h-11 items-center gap-3">
              <input
                type="checkbox"
                className={checkbox}
                checked={settings.restTimerSound}
                onChange={(event) => void updateSettings({ restTimerSound: event.target.checked })}
              />
              Ton am Ende der Pause
            </label>
            <label className="flex min-h-11 items-center gap-3">
              <input
                type="checkbox"
                className={checkbox}
                checked={settings.restTimerVibrate}
                onChange={(event) =>
                  void updateSettings({ restTimerVibrate: event.target.checked })
                }
              />
              Vibration (nicht auf dem iPhone)
            </label>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Signale kommen nur, solange die App geöffnet ist.
            </p>
          </>
        )}
        <h3 className="mt-2 font-semibold">Puls</h3>
        <Stepper
          label="Max. Puls"
          value={settings.maxHeartRate}
          unit="bpm"
          step={1}
          min={MIN_HEART_RATE}
          max={MAX_HEART_RATE}
          decimals={0}
          startValue={190}
          allowEmpty
          onChange={(maxHeartRate) => void updateSettings({ maxHeartRate })}
        />
        <Stepper
          label="Ruhepuls"
          value={settings.restingHeartRate}
          unit="bpm"
          step={1}
          min={MIN_HEART_RATE}
          max={MAX_HEART_RATE}
          decimals={0}
          startValue={60}
          allowEmpty
          onChange={(restingHeartRate) => void updateSettings({ restingHeartRate })}
        />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Für die Pulszonen importierter Einheiten. Mit Ruhepuls rechnet die App nach
          Herzfrequenzreserve (Karvonen), sonst in % des max. Pulses.
        </p>
        <h3 className="mt-2 font-semibold">Erweitert</h3>
        <label className="flex min-h-11 items-center gap-3">
          <input
            type="checkbox"
            className={checkbox}
            checked={settings.restAnalysisEnabled}
            onChange={(event) => void updateSettings({ restAnalysisEnabled: event.target.checked })}
          />
          Pausen-Auswertung
        </label>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Zeigt in der Statistik, wie sich die Pausenlänge auf den nächsten Satz auswirkt. Rechnet
          auch mit bisherigen Trainings und funktioniert ohne Pausen-Timer.
        </p>
      </div>
    </Card>
  );
}

function DailyGoalsCard({ settings }: { settings: Settings }) {
  return (
    <Card title="Tagesziele">
      <div className="flex flex-col gap-3">
        <Stepper
          label="Schritte pro Tag"
          value={settings.stepsGoal}
          step={500}
          min={500}
          max={MAX_STEPS}
          decimals={0}
          onChange={(stepsGoal) => stepsGoal !== null && void updateSettings({ stepsGoal })}
        />
        <Stepper
          label="Wasser pro Tag"
          value={settings.waterGoalMl}
          unit="ml"
          step={250}
          min={250}
          max={MAX_WATER_ML}
          decimals={0}
          onChange={(waterGoalMl) => waterGoalMl !== null && void updateSettings({ waterGoalMl })}
        />
        <Stepper
          label="Schlaf pro Nacht"
          value={secondsToHours(settings.sleepGoalSeconds)}
          unit="h"
          step={0.5}
          min={1}
          max={24}
          decimals={2}
          onChange={(hours) =>
            hours !== null && void updateSettings({ sleepGoalSeconds: hoursToSeconds(hours) })
          }
        />
      </div>
    </Card>
  );
}

const DAY_TYPES = [
  { key: 'training', label: 'Trainingstag' },
  { key: 'rest', label: 'Ruhetag' },
] as const;

function NutritionGoalsCard({ settings }: { settings: Settings }) {
  const hint = 'text-sm text-slate-500 dark:text-slate-400';
  // Aktuellen Stand lesen, damit schnelle Änderungen an zwei Feldern nichts verlieren
  const change = async (day: keyof NutritionGoals, changes: Partial<NutritionGoal>) => {
    const goals = (await getSettings())?.nutritionGoals ?? settings.nutritionGoals;
    await updateSettings({ nutritionGoals: { ...goals, [day]: { ...goals[day], ...changes } } });
  };

  return (
    <Card title="Ernährung">
      <div className="flex flex-col gap-3">
        <p className={hint}>
          Trainingstag = an dem Tag gibt es ein Workout oder eine Ausdauer-Einheit. Kohlenhydrate
          und Fett sind optional (leer = kein Ziel).
        </p>
        {DAY_TYPES.map(({ key, label }) => {
          const goal = settings.nutritionGoals[key];
          const perKg = proteinPerKg(goal.protein, settings.bodyWeightKg);
          return (
            <div key={key} className="flex flex-col gap-3">
              <h3 className="mt-1 font-semibold">{label}</h3>
              <Stepper
                label={`Kalorien (${label})`}
                value={goal.kcal}
                unit="kcal"
                step={50}
                min={500}
                max={MAX_KCAL_GOAL}
                decimals={0}
                onChange={(kcal) => kcal !== null && void change(key, { kcal })}
              />
              <Stepper
                label={`Protein (${label})`}
                value={goal.protein}
                unit="g"
                step={5}
                max={MAX_MACRO_GOAL_G}
                decimals={0}
                onChange={(protein) => protein !== null && void change(key, { protein })}
              />
              {perKg !== null && (
                <p className={hint}>≈ {formatDecimal(perKg, 1)} g pro kg Körpergewicht</p>
              )}
              <Stepper
                label={`Kohlenhydrate (${label})`}
                value={goal.carbs}
                unit="g"
                step={10}
                max={MAX_MACRO_GOAL_G}
                decimals={0}
                startValue={250}
                allowEmpty
                onChange={(carbs) => void change(key, { carbs })}
              />
              <Stepper
                label={`Fett (${label})`}
                value={goal.fat}
                unit="g"
                step={5}
                max={MAX_MACRO_GOAL_G}
                decimals={0}
                startValue={70}
                allowEmpty
                onChange={(fat) => void change(key, { fat })}
              />
            </div>
          );
        })}
        <label className="mt-1 flex min-h-11 items-center gap-3">
          <input
            type="checkbox"
            className="h-5 w-5 accent-emerald-600"
            checked={settings.addBurnedCalories}
            onChange={(event) => void updateSettings({ addBurnedCalories: event.target.checked })}
          />
          Verbrannte Kalorien zum Ziel addieren
        </label>
        <p className={hint}>
          Kalorien aus Ausdauer-Einheiten (von der Uhr oder eingetragen) erhöhen das Kalorienziel
          des Tages. Am besten dann für Trainings- und Ruhetag dasselbe Ziel wählen, sonst zählt das
          Training doppelt.
        </p>
      </div>
    </Card>
  );
}

function SupplementSettingsCard({ settings }: { settings: Settings }) {
  const checkbox = 'h-5 w-5 accent-emerald-600';
  const [permission, setPermission] = useState(notificationState);
  const toggleNotifications = async (enabled: boolean) => {
    if (enabled && permission !== 'granted') {
      const result = await requestNotifications();
      setPermission(result);
      if (result !== 'granted') return;
    }
    await updateSettings({ supplementNotificationsEnabled: enabled });
  };
  const hint = 'text-sm text-slate-500 dark:text-slate-400';

  return (
    <Card title="Supplements">
      <div className="flex flex-col gap-2">
        <Stepper
          label="Warnung ab Restbestand für"
          value={settings.supplementLowStockDays}
          unit="Tage"
          step={1}
          min={1}
          max={MAX_LOW_STOCK_DAYS}
          decimals={0}
          onChange={(days) =>
            days !== null && void updateSettings({ supplementLowStockDays: days })
          }
        />
        <label className="flex min-h-11 items-center gap-3">
          <input
            type="checkbox"
            className={checkbox}
            checked={settings.supplementRemindersEnabled}
            onChange={(event) =>
              void updateSettings({ supplementRemindersEnabled: event.target.checked })
            }
          />
          Erinnerungen
        </label>
        {settings.supplementRemindersEnabled && (
          <>
            <label className="flex min-h-11 items-center gap-3">
              <input
                type="checkbox"
                className={checkbox}
                disabled={permission === 'unsupported' || permission === 'denied'}
                checked={settings.supplementNotificationsEnabled && permission === 'granted'}
                onChange={(event) => void toggleNotifications(event.target.checked)}
              />
              Auch als Mitteilung, wenn die App im Hintergrund ist
            </label>
            {permission === 'denied' && (
              <p className={hint}>Mitteilungen sind für diese App im Browser blockiert.</p>
            )}
            {permission === 'unsupported' && (
              <p className={hint}>Dieser Browser unterstützt keine Mitteilungen.</p>
            )}
          </>
        )}
        <p className={hint}>
          Ohne Server gibt es keine echten Push-Nachrichten: Erinnerungen kommen nur, solange die
          App geöffnet ist oder noch im Hintergrund läuft. Ist sie geschlossen, siehst du offene
          Einnahmen beim nächsten Öffnen. Auf dem iPhone kommen sie nur in der geöffneten App.
        </p>
      </div>
    </Card>
  );
}

function ProfileCard({ settings }: { settings: Settings }) {
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const unit = settings.weightUnit;
  const bodyWeight =
    settings.bodyWeightKg === null ? null : roundTo(kgToDisplay(settings.bodyWeightKg, unit), 1);

  return (
    <Card title="Profil">
      <div className="flex flex-col gap-3">
        <div>
          <label htmlFor="settings-name" className="mb-1 block text-sm font-medium">
            Name
          </label>
          <input
            id="settings-name"
            autoComplete="given-name"
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-600 dark:bg-slate-900"
            value={nameDraft ?? settings.name}
            onChange={(event) => setNameDraft(event.target.value)}
            onBlur={() => {
              if (nameDraft !== null) void updateSettings({ name: nameDraft.trim() });
              setNameDraft(null);
            }}
          />
        </div>
        <Stepper
          label="Körpergewicht"
          value={bodyWeight}
          unit={unit}
          step={unit === 'kg' ? 0.5 : 1}
          min={20}
          max={unit === 'kg' ? 400 : 880}
          startValue={unit === 'kg' ? 75 : 165}
          allowEmpty
          onChange={(value) =>
            void setCurrentBodyWeight(value === null ? null : displayToKg(value, unit))
          }
        />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Wird auch als Gewicht von heute im Alltag eingetragen.
        </p>
      </div>
    </Card>
  );
}
