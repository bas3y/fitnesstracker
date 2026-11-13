import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ChevronRightIcon, Icon } from '../../components/icons';
import { Card, GroupRow, LinkGroup, Page } from '../../components/Page';
import { SegmentedControl } from '../../components/SegmentedControl';
import { Stepper } from '../../components/Stepper';
import { Switch } from '../../components/Switch';
import { useBackTo } from '../../components/backNavigation';
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
import type {
  NutritionGoal,
  NutritionGoals,
  Settings,
  ThemePreference as Theme,
} from '../../db/types';
import { setRestTimerEnabled } from '../../db/workouts';
import { daysSince } from '../../domain/backupReminder';
import { hoursToSeconds, secondsToHours } from '../../domain/daily';
import { formatDaysAgo, formatDecimal } from '../../domain/format';
import { PALETTE_LABELS } from '../../domain/labels';
import { proteinPerKg } from '../../domain/nutrition';
import { displayToKg, kgToDisplay, roundTo } from '../../domain/units';
import { notificationState, requestNotifications } from '../supplements/notifications';
import { BackupSection } from './BackupSection';
import { ExportSection } from './ExportSection';
import { PalettePicker } from './PalettePicker';
import {
  ABOUT_PATH,
  isSettingsSection,
  SETTINGS_PATH,
  settingsPath,
  SHARE_APP_PATH,
  type SettingsSection,
} from './paths';
import { StorageSection } from './StorageSection';
import { useSettings } from './useSettings';

const HINT = 'text-sm text-muted';

const THEME_LABELS: Record<Theme, string> = {
  system: 'System',
  light: 'Hell',
  dark: 'Dunkel',
};

const SECTION_TITLES: Record<SettingsSection, string> = {
  profile: 'Profil & Einheiten',
  training: 'Training',
  goals: 'Tagesziele',
  nutrition: 'Ernährung',
  supplements: 'Supplements',
  appearance: 'Darstellung',
  backup: 'Datensicherung',
  data: 'Export & Speicher',
};

/** Übersicht: Profil oben, darunter Bereiche als gruppierte Listen mit Unterseiten */
export function SettingsPage() {
  const settings = useSettings();
  if (!settings) return <Page title="Einstellungen">{null}</Page>;
  const { nutritionGoals: goals } = settings;
  const bodyWeight =
    settings.bodyWeightKg === null
      ? null
      : `${formatDecimal(roundTo(kgToDisplay(settings.bodyWeightKg, settings.weightUnit), 1), 1)} ${settings.weightUnit}`;

  return (
    <Page title="Einstellungen">
      <Link
        to={settingsPath('profile')}
        className="tone-accent mb-5 flex min-h-20 items-center gap-4 rounded-2xl p-4 active:opacity-90"
      >
        <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-full bg-primary-soft">
          <Icon name="user" className="h-7 w-7" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[1.0625rem] font-semibold">
            {settings.name || SECTION_TITLES.profile}
          </span>
          <span className={`block ${HINT}`}>
            {[
              settings.name ? SECTION_TITLES.profile : null,
              bodyWeight,
              `${settings.weightUnit} und ${settings.distanceUnit}`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </span>
        <ChevronRightIcon className="h-5 w-5 shrink-0" />
      </Link>

      <LinkGroup title="Bereiche">
        <GroupRow
          to={settingsPath('training')}
          icon="dumbbell"
          solid
          label={SECTION_TITLES.training}
          hint={
            settings.restTimerEnabled
              ? `Pause ${settings.restTimerSeconds} s · Puls`
              : 'Pausen-Timer aus · Puls'
          }
        />
        <GroupRow
          to={settingsPath('goals')}
          icon="target"
          solid
          label={SECTION_TITLES.goals}
          hint={`${settings.stepsGoal.toLocaleString('de-DE')} Schritte · ${formatDecimal(
            settings.waterGoalMl / 1000,
            2,
          )} l · ${formatDecimal(secondsToHours(settings.sleepGoalSeconds), 1)} h Schlaf`}
        />
        <GroupRow
          to={settingsPath('nutrition')}
          icon="utensils"
          solid
          label={SECTION_TITLES.nutrition}
          hint={
            settings.proteinOnly
              ? `Nur Protein · ${goals.training.protein} g`
              : `${goals.training.kcal.toLocaleString('de-DE')} kcal · ${goals.training.protein} g Protein`
          }
        />
        <GroupRow
          to={settingsPath('supplements')}
          icon="pill"
          solid
          label={SECTION_TITLES.supplements}
          hint={`Erinnerungen ${settings.supplementRemindersEnabled ? 'an' : 'aus'}`}
        />
      </LinkGroup>

      <LinkGroup title="App & Daten">
        <GroupRow
          to={settingsPath('appearance')}
          icon="palette"
          solid
          label={SECTION_TITLES.appearance}
          hint={`${PALETTE_LABELS[settings.palette]} · ${THEME_LABELS[settings.theme]}`}
        />
        <GroupRow
          to={settingsPath('backup')}
          icon="shield"
          solid
          label={SECTION_TITLES.backup}
          hint={`Letztes Backup: ${
            settings.lastBackupAt
              ? formatDaysAgo(daysSince(settings.lastBackupAt, new Date()))
              : 'noch nie'
          }`}
        />
        <GroupRow
          to={settingsPath('data')}
          icon="download"
          solid
          label={SECTION_TITLES.data}
          hint="CSV-Export, Speicherplatz"
        />
      </LinkGroup>

      <LinkGroup title="Mehr">
        <GroupRow
          to={SHARE_APP_PATH}
          icon="share"
          solid
          label="App weitergeben & installieren"
          hint="Link teilen, Anleitung für Android und iPhone"
        />
        <GroupRow
          to={ABOUT_PATH}
          icon="info"
          solid
          label="Über & Lizenzen"
          hint="Datenquellen und Software"
        />
      </LinkGroup>
    </Page>
  );
}

/** Unterseite `/settings/:section` */
export function SettingsSectionPage() {
  const { section } = useParams();
  const settings = useSettings();
  const backTo = useBackTo(SETTINGS_PATH);
  if (!isSettingsSection(section)) return <Navigate to={SETTINGS_PATH} replace />;
  return (
    <Page title={SECTION_TITLES[section]} backTo={backTo}>
      {settings && <SectionContent section={section} settings={settings} />}
    </Page>
  );
}

function SectionContent({ section, settings }: { section: SettingsSection; settings: Settings }) {
  switch (section) {
    case 'profile':
      return (
        <>
          <ProfileCard settings={settings} />
          <UnitsCard settings={settings} />
        </>
      );
    case 'training':
      return <TrainingSettings settings={settings} />;
    case 'goals':
      return <DailyGoalsCard settings={settings} />;
    case 'nutrition':
      return <NutritionGoalsCard settings={settings} />;
    case 'supplements':
      return <SupplementSettingsCard settings={settings} />;
    case 'appearance':
      return <AppearanceCard settings={settings} />;
    case 'backup':
      return <BackupSection settings={settings} />;
    case 'data':
      return (
        <>
          <ExportSection unit={settings.weightUnit} />
          <StorageSection />
        </>
      );
  }
}

function UnitsCard({ settings }: { settings: Settings }) {
  return (
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
  );
}

function AppearanceCard({ settings }: { settings: Settings }) {
  return (
    <Card>
      <div className="flex flex-col gap-4">
        <SegmentedControl
          label="Theme"
          options={(['system', 'light', 'dark'] as const).map((value) => ({
            value,
            label: THEME_LABELS[value],
          }))}
          value={settings.theme}
          onChange={(theme) => void updateSettings({ theme })}
        />
        <PalettePicker
          value={settings.palette}
          onChange={(palette) => void updateSettings({ palette })}
        />
      </div>
    </Card>
  );
}

function TrainingSettings({ settings }: { settings: Settings }) {
  return (
    <>
      <Card title="Pausen">
        <div className="flex flex-col gap-2">
          <Switch
            label="Pausen-Timer"
            checked={settings.restTimerEnabled}
            onChange={(enabled) => void setRestTimerEnabled(enabled)}
          />
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
              <p className={HINT}>Pläne können je Übung eine eigene Pausenzeit festlegen.</p>
              <Switch
                label="Ton am Ende der Pause"
                checked={settings.restTimerSound}
                onChange={(restTimerSound) => void updateSettings({ restTimerSound })}
              />
              <Switch
                label="Vibration (nicht auf dem iPhone)"
                checked={settings.restTimerVibrate}
                onChange={(restTimerVibrate) => void updateSettings({ restTimerVibrate })}
              />
              <p className={HINT}>Signale kommen nur, solange die App geöffnet ist.</p>
            </>
          )}
        </div>
      </Card>
      <Card title="Puls">
        <div className="flex flex-col gap-2">
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
          <p className={HINT}>
            Für die Pulszonen importierter Einheiten. Mit Ruhepuls rechnet die App nach
            Herzfrequenzreserve (Karvonen), sonst in % des max. Pulses.
          </p>
        </div>
      </Card>
      <Card title="Erweitert">
        <Switch
          label="Pausen-Auswertung"
          checked={settings.restAnalysisEnabled}
          onChange={(restAnalysisEnabled) => void updateSettings({ restAnalysisEnabled })}
        />
        <p className={HINT}>
          Zeigt in der Statistik, wie sich die Pausenlänge auf den nächsten Satz auswirkt. Rechnet
          auch mit bisherigen Trainings und funktioniert ohne Pausen-Timer.
        </p>
      </Card>
    </>
  );
}

function DailyGoalsCard({ settings }: { settings: Settings }) {
  return (
    <Card>
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
  // Aktuellen Stand lesen, damit schnelle Änderungen an zwei Feldern nichts verlieren
  const change = async (day: keyof NutritionGoals, changes: Partial<NutritionGoal>) => {
    const goals = (await getSettings())?.nutritionGoals ?? settings.nutritionGoals;
    await updateSettings({ nutritionGoals: { ...goals, [day]: { ...goals[day], ...changes } } });
  };

  return (
    <>
      <Card>
        <Switch
          label="Nur Protein erfassen"
          checked={settings.proteinOnly}
          onChange={(proteinOnly) => void updateSettings({ proteinOnly })}
        />
        <p className={HINT}>
          {settings.proteinOnly
            ? 'Die Ernährung zeigt nur ein Protein-Feld mit Buttons wie beim Wasser, ohne Lebensmittel und Kalorien. Bisherige Mahlzeiten bleiben gespeichert.'
            : 'Statt Mahlzeiten nur die Protein-Menge des Tages eintragen (ohne Lebensmittel und Kalorien).'}
        </p>
      </Card>
      {DAY_TYPES.map(({ key, label }) => {
        const goal = settings.nutritionGoals[key];
        const perKg = proteinPerKg(goal.protein, settings.bodyWeightKg);
        return (
          <Card key={key} title={label}>
            <div className="flex flex-col gap-3">
              {!settings.proteinOnly && (
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
              )}
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
                <p className={HINT}>≈ {formatDecimal(perKg, 1)} g pro kg Körpergewicht</p>
              )}
              {!settings.proteinOnly && (
                <>
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
                </>
              )}
            </div>
          </Card>
        );
      })}
      <p className={`mb-4 px-1 ${HINT}`}>
        Trainingstag = an dem Tag gibt es ein Workout oder eine Ausdauer-Einheit.
        {!settings.proteinOnly && ' Kohlenhydrate und Fett sind optional (leer = kein Ziel).'}
      </p>
      {!settings.proteinOnly && (
        <Card>
          <Switch
            label="Verbrannte Kalorien zum Ziel addieren"
            checked={settings.addBurnedCalories}
            onChange={(addBurnedCalories) => void updateSettings({ addBurnedCalories })}
          />
          <p className={HINT}>
            Kalorien aus Ausdauer-Einheiten (von der Uhr oder eingetragen) erhöhen das Kalorienziel
            des Tages. Am besten dann für Trainings- und Ruhetag dasselbe Ziel wählen, sonst zählt
            das Training doppelt.
          </p>
        </Card>
      )}
    </>
  );
}

function SupplementSettingsCard({ settings }: { settings: Settings }) {
  const [permission, setPermission] = useState(notificationState);
  const toggleNotifications = async (enabled: boolean) => {
    if (enabled && permission !== 'granted') {
      const result = await requestNotifications();
      setPermission(result);
      if (result !== 'granted') return;
    }
    await updateSettings({ supplementNotificationsEnabled: enabled });
  };

  return (
    <Card>
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
        <Switch
          label="Erinnerungen"
          checked={settings.supplementRemindersEnabled}
          onChange={(supplementRemindersEnabled) =>
            void updateSettings({ supplementRemindersEnabled })
          }
        />
        {settings.supplementRemindersEnabled && (
          <>
            <Switch
              label="Auch als Mitteilung, wenn die App im Hintergrund ist"
              disabled={permission === 'unsupported' || permission === 'denied'}
              checked={settings.supplementNotificationsEnabled && permission === 'granted'}
              onChange={(enabled) => void toggleNotifications(enabled)}
            />
            {permission === 'denied' && (
              <p className={HINT}>Mitteilungen sind für diese App im Browser blockiert.</p>
            )}
            {permission === 'unsupported' && (
              <p className={HINT}>Dieser Browser unterstützt keine Mitteilungen.</p>
            )}
          </>
        )}
        <p className={HINT}>
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
            className="h-11 w-full rounded-xl border border-line bg-subtle px-3 outline-none focus:border-primary focus:bg-surface"
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
        <p className={HINT}>Wird auch als Gewicht von heute im Alltag eingetragen.</p>
      </div>
    </Card>
  );
}
