import type { Settings } from './types';

const SETTINGS_KEY = 'settings';
const DEFAULT_SETTINGS: Settings = { enabled: true };

export async function getSettings(): Promise<Settings> {
  const result = await chrome.storage.local.get(SETTINGS_KEY);
  return (result[SETTINGS_KEY] as Settings) ?? DEFAULT_SETTINGS;
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
}

export function onSettingsChanged(
  callback: (settings: Settings) => void,
): void {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[SETTINGS_KEY]?.newValue) {
      callback(changes[SETTINGS_KEY].newValue as Settings);
    }
  });
}
