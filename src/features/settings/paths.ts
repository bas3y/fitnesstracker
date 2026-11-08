export const SETTINGS_PATH = '/settings';
/** App installieren und an andere weitergeben */
export const SHARE_APP_PATH = '/settings/app';
export const ABOUT_PATH = '/settings/about';

/** Unterseiten der Einstellungen (`/settings/:section`) */
export const SETTINGS_SECTIONS = [
  'profile',
  'training',
  'goals',
  'nutrition',
  'supplements',
  'appearance',
  'backup',
  'data',
] as const;
export type SettingsSection = (typeof SETTINGS_SECTIONS)[number];

export const settingsPath = (section: SettingsSection) => `${SETTINGS_PATH}/${section}`;

export function isSettingsSection(value: string | undefined): value is SettingsSection {
  return SETTINGS_SECTIONS.includes(value as SettingsSection);
}
