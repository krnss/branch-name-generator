import { DEFAULT_SETTINGS, getSettings, updateSetting, saveSettings } from './utils/settings-utils.js';

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
    this.repoNameInput = document.getElementById('repoNameInput');
    this.repoTargetInput = document.getElementById('repoTargetInput');
    this.addRepoBtn = document.getElementById('addRepoBtn');
    this.repoList = document.getElementById('repoList');
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
    this.renderRepositories();
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

    this.addRepoBtn.addEventListener('click', async () => {
      await this.addRepository();
    });

    const addOnEnter = async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        await this.addRepository();
      }
    };
    this.repoNameInput.addEventListener('keydown', addOnEnter);
    this.repoTargetInput.addEventListener('keydown', addOnEnter);

    this.repoList.addEventListener('click', async (e) => {
      const removeBtn = e.target.closest('[data-remove-repo]');
      if (!removeBtn) return;
      await this.removeRepository(removeBtn.dataset.removeRepo);
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

  renderRepositories() {
    const repos = this.settings.repositories || [];
    this.repoList.innerHTML = '';

    if (!repos.length) {
      const empty = document.createElement('li');
      empty.className = 'repo-empty';
      empty.textContent = 'No repositories yet. Add one to enable Create PR.';
      this.repoList.appendChild(empty);
      return;
    }

    for (const repo of repos) {
      const item = document.createElement('li');
      item.className = 'repo-item';

      const details = document.createElement('div');
      const name = document.createElement('div');
      name.className = 'repo-item-name';
      name.textContent = repo.name;
      const target = document.createElement('div');
      target.className = 'repo-item-target';
      target.textContent = `target: ${repo.targetRef || 'develop'}`;
      details.appendChild(name);
      details.appendChild(target);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'repo-remove';
      removeBtn.dataset.removeRepo = repo.name;
      removeBtn.textContent = 'Remove';

      item.appendChild(details);
      item.appendChild(removeBtn);
      this.repoList.appendChild(item);
    }
  }

  async addRepository() {
    const name = this.repoNameInput.value.trim();
    const targetRef = this.repoTargetInput.value.trim() || 'develop';

    if (!name) {
      this.showStatus('Repository name is required.', 'error');
      return;
    }

    const repos = this.settings.repositories || [];
    if (repos.some((repo) => repo.name.toLowerCase() === name.toLowerCase())) {
      this.showStatus('That repository is already added.', 'error');
      return;
    }

    const next = [...repos, { name, targetRef }];
    this.settings.repositories = next;
    if (!this.settings.lastUsedRepo) {
      this.settings.lastUsedRepo = name;
    }

    await saveSettings(this.settings);
    this.repoNameInput.value = '';
    this.repoTargetInput.value = '';
    this.renderRepositories();
    this.showStatus('Repository added.', 'success');
  }

  async removeRepository(name) {
    const next = (this.settings.repositories || []).filter((repo) => repo.name !== name);
    this.settings.repositories = next;
    if (this.settings.lastUsedRepo === name) {
      this.settings.lastUsedRepo = next[0]?.name || '';
    }

    await saveSettings(this.settings);
    this.renderRepositories();
    this.showStatus('Repository removed.', 'success');
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
      ...DEFAULT_SETTINGS,
      repositories: DEFAULT_SETTINGS.repositories.map((repo) => ({ ...repo }))
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
