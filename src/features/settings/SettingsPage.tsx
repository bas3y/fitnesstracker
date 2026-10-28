import { useState } from 'react';
import { Card, Page } from '../../components/Page';
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
    </Page>
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
