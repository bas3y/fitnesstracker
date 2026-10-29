import { useState } from 'react';
import { Card, LinkRow, Page } from '../../components/Page';
import { SegmentedControl } from '../../components/SegmentedControl';
import { Stepper } from '../../components/Stepper';
import { updateSettings } from '../../db/settings';
import type { Settings } from '../../db/types';
import { displayToKg, kgToDisplay, roundTo } from '../../domain/units';
import { BackupSection } from './BackupSection';
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
        <Stepper
          label="Pausenzeit nach einem Satz"
          value={settings.restTimerSeconds}
          unit="s"
          step={15}
          max={900}
          decimals={0}
          onChange={(value) => value !== null && void updateSettings({ restTimerSeconds: value })}
        />
        <p className="text-sm text-slate-500 dark:text-slate-400">0 s = kein Pausen-Timer</p>
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
            onChange={(event) => void updateSettings({ restTimerVibrate: event.target.checked })}
          />
          Vibration (nicht auf dem iPhone)
        </label>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Signale kommen nur, solange die App geöffnet ist.
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
            void updateSettings({ bodyWeightKg: value === null ? null : displayToKg(value, unit) })
          }
        />
      </div>
    </Card>
  );
}
