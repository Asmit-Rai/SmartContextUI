import { MessageType } from '../shared/types';
import type { ToggleExtensionMessage } from '../shared/types';
import { getSettings, saveSettings } from '../shared/settings';

document.addEventListener('DOMContentLoaded', async () => {
  const toggle = document.getElementById('enabled-toggle') as HTMLInputElement;

  const settings = await getSettings();
  toggle.checked = settings.enabled;

  toggle.addEventListener('change', async () => {
    const enabled = toggle.checked;
    const current = await getSettings();
    await saveSettings({ ...current, enabled });
    chrome.runtime.sendMessage({
      type: MessageType.TOGGLE_EXTENSION,
      payload: { enabled },
    } satisfies ToggleExtensionMessage);
  });
});
