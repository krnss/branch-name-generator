const DEFAULT_SETTINGS = {
  enabled: true,
  branchNameStructure: '${prefix}/TP-${id}-${slug}'
};

const SETTINGS_KEY = 'branchNameGeneratorSettings';

export async function getSettings() {
  try {
    // Try chrome.storage.local first (for extension context)
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const result = await chrome.storage.local.get(SETTINGS_KEY);
      if (result[SETTINGS_KEY]) {
        return { ...DEFAULT_SETTINGS, ...result[SETTINGS_KEY] };
      }
    } else {
      // Fallback to localStorage (for popup context)
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    }
  } catch (error) {
    console.warn('Failed to load settings:', error);
  }
  return { ...DEFAULT_SETTINGS };
}

export async function saveSettings(settings) {
  try {
    // Save to both chrome.storage.local and localStorage for compatibility
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
    }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Failed to save settings:', error);
    return false;
  }
}

export async function updateSetting(key, value) {
  const currentSettings = await getSettings();
  const newSettings = { ...currentSettings, [key]: value };
  return await saveSettings(newSettings);
}

export async function isEnabled() {
  const settings = await getSettings();
  return settings.enabled;
}

export async function getBranchNameStructure() {
  const settings = await getSettings();
  return settings.branchNameStructure;
}
