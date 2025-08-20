import { getSettings, updateSetting, saveSettings } from './utils/settings-utils.js';

class SettingsPopup {
  constructor() {
    this.settings = null;
    this.init();
  }

  async init() {
    this.settings = await getSettings();
    this.bindElements();
    this.loadSettings();
    this.bindEvents();
    this.updatePreview();
  }

  bindElements() {
    this.enableToggle = document.getElementById('enableToggle');
    this.structureInput = document.getElementById('structureInput');
    this.previewText = document.getElementById('previewText');
    this.resetBtn = document.getElementById('resetBtn');
    this.saveBtn = document.getElementById('saveBtn');
    this.status = document.getElementById('status');
  }

  loadSettings() {
    // Set toggle state
    if (this.settings.enabled) {
      this.enableToggle.classList.add('active');
    } else {
      this.enableToggle.classList.remove('active');
    }

    // Set structure input
    this.structureInput.value = this.settings.branchNameStructure;
  }

  bindEvents() {
    // Toggle switch
    this.enableToggle.addEventListener('click', async () => {
      this.settings.enabled = !this.settings.enabled;
      if (this.settings.enabled) {
        this.enableToggle.classList.add('active');
      } else {
        this.enableToggle.classList.remove('active');
      }
      await this.updateSetting('enabled', this.settings.enabled);
    });

    // Structure input
    this.structureInput.addEventListener('input', async (e) => {
      this.settings.branchNameStructure = e.target.value;
      this.updatePreview();
      await this.updateSetting('branchNameStructure', e.target.value);
    });

    // Reset button
    this.resetBtn.addEventListener('click', async () => {
      await this.resetToDefault();
    });

    // Save button
    this.saveBtn.addEventListener('click', async () => {
      await this.saveAllSettings();
    });
  }

  updatePreview() {
    const structure = this.structureInput.value;
    const preview = structure
      .replace(/\$\{prefix\}/g, 'feat')
      .replace(/\$\{id\}/g, '1234')
      .replace(/\$\{slug\}/g, 'example-task-title');
    
    this.previewText.textContent = preview || 'Enter a valid structure...';
  }

  async updateSetting(key, value) {
    await updateSetting(key, value);
    this.settings[key] = value;
  }

  async resetToDefault() {
    this.settings = {
      enabled: true,
      branchNameStructure: '${prefix}/TP-${id}-${slug}'
    };

    this.loadSettings();
    this.updatePreview();
    
    // Save reset settings
    await saveSettings(this.settings);
    
    this.showStatus('Settings reset to default!', 'success');
  }

  async saveAllSettings() {
    if (await saveSettings(this.settings)) {
      this.showStatus('Settings saved successfully!', 'success');
    } else {
      this.showStatus('Failed to save settings!', 'error');
    }
  }

  showStatus(message, type) {
    this.status.textContent = message;
    this.status.className = `status ${type}`;
    this.status.style.display = 'block';
    
    setTimeout(() => {
      this.status.style.display = 'none';
    }, 3000);
  }
}

// Initialize the popup when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new SettingsPopup();
});
