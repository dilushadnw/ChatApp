/**
 * Settings Component
 * User preferences for notifications, sounds, and DND
 */

export class Settings {
  constructor(notificationService) {
    this.notificationService = notificationService;
    this.modal = null;
  }

  /**
   * Show settings modal
   */
  show() {
    this.createModal();
    this.render();
    this.setupEventListeners();
    this.modal.style.display = 'flex';
  }

  /**
   * Hide settings modal
   */
  hide() {
    if (this.modal) {
      this.modal.style.display = 'none';
    }
  }

  /**
   * Create modal element
   */
  createModal() {
    if (this.modal) {
      return;
    }

    this.modal = document.createElement('div');
    this.modal.className = 'settings-modal';
    this.modal.id = 'settingsModal';
    document.body.appendChild(this.modal);
  }

  /**
   * Render settings content
   */
  render() {
    const settings = this.notificationService.settings;

    this.modal.innerHTML = `
      <div class="settings-content">
        <div class="settings-header">
          <h2>Settings</h2>
          <button class="close-btn" id="closeSettingsBtn" aria-label="Close settings">×</button>
        </div>
        <div class="settings-body">
          <div class="setting-section">
            <h3>Notifications</h3>
            <div class="setting-item">
              <label for="notificationsEnabled">
                <span class="setting-label">Desktop Notifications</span>
                <span class="setting-description">Show desktop notifications for new messages</span>
              </label>
              <label class="switch">
                <input type="checkbox" id="notificationsEnabled" ${settings.notificationsEnabled ? 'checked' : ''}>
                <span class="slider"></span>
              </label>
            </div>
            <div class="setting-item">
              <label for="soundEnabled">
                <span class="setting-label">Sound</span>
                <span class="setting-description">Play sound when receiving messages</span>
              </label>
              <label class="switch">
                <input type="checkbox" id="soundEnabled" ${settings.soundEnabled ? 'checked' : ''}>
                <span class="slider"></span>
              </label>
            </div>
            <div class="setting-item">
              <label for="vibrationEnabled">
                <span class="setting-label">Vibration</span>
                <span class="setting-description">Vibrate on mobile devices (if supported)</span>
              </label>
              <label class="switch">
                <input type="checkbox" id="vibrationEnabled" ${settings.vibrationEnabled ? 'checked' : ''}>
                <span class="slider"></span>
              </label>
            </div>
          </div>
          
          <div class="setting-section">
            <h3>Do Not Disturb</h3>
            <div class="setting-item">
              <label for="dndEnabled">
                <span class="setting-label">Enable DND Hours</span>
                <span class="setting-description">Silence notifications during specific hours</span>
              </label>
              <label class="switch">
                <input type="checkbox" id="dndEnabled" ${settings.dndStart ? 'checked' : ''}>
                <span class="slider"></span>
              </label>
            </div>
            <div class="setting-item dnd-times" id="dndTimes" style="display: ${settings.dndStart ? 'flex' : 'none'};">
              <div class="time-input">
                <label for="dndStart">Start</label>
                <input type="time" id="dndStart" value="${settings.dndStart || '22:00'}">
              </div>
              <div class="time-input">
                <label for="dndEnd">End</label>
                <input type="time" id="dndEnd" value="${settings.dndEnd || '08:00'}">
              </div>
            </div>
          </div>

          <div class="setting-section">
            <h3>Permissions</h3>
            <div class="setting-item">
              <span class="setting-label">Notification Permission</span>
              <button id="requestPermissionBtn" class="secondary-btn">
                ${Notification.permission === 'granted' ? 'Granted ✓' : 'Request Permission'}
              </button>
            </div>
          </div>
        </div>
        <div class="settings-footer">
          <button id="saveSettingsBtn" class="primary-btn">Save Settings</button>
        </div>
      </div>
    `;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const closeBtn = this.modal.querySelector('#closeSettingsBtn');
    const saveBtn = this.modal.querySelector('#saveSettingsBtn');
    const requestPermissionBtn = this.modal.querySelector('#requestPermissionBtn');
    const dndEnabledCheckbox = this.modal.querySelector('#dndEnabled');
    const dndTimes = this.modal.querySelector('#dndTimes');

    closeBtn?.addEventListener('click', () => this.hide());
    saveBtn?.addEventListener('click', () => this.saveSettings());
    requestPermissionBtn?.addEventListener('click', async () => {
      const granted = await this.notificationService.requestPermission();
      if (granted) {
        requestPermissionBtn.textContent = 'Granted ✓';
        requestPermissionBtn.disabled = true;
      }
    });

    dndEnabledCheckbox?.addEventListener('change', (e) => {
      if (dndTimes) {
        dndTimes.style.display = e.target.checked ? 'flex' : 'none';
      }
    });

    // Close on background click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.hide();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.style.display === 'flex') {
        this.hide();
      }
    });
  }

  /**
   * Save settings
   */
  saveSettings() {
    const notificationsEnabled = this.modal.querySelector('#notificationsEnabled')?.checked;
    const soundEnabled = this.modal.querySelector('#soundEnabled')?.checked;
    const vibrationEnabled = this.modal.querySelector('#vibrationEnabled')?.checked;
    const dndEnabled = this.modal.querySelector('#dndEnabled')?.checked;
    const dndStart = this.modal.querySelector('#dndStart')?.value;
    const dndEnd = this.modal.querySelector('#dndEnd')?.value;

    const newSettings = {
      notificationsEnabled,
      soundEnabled,
      vibrationEnabled,
      dndStart: dndEnabled ? dndStart : null,
      dndEnd: dndEnabled ? dndEnd : null
    };

    this.notificationService.saveSettings(newSettings);
    this.hide();

    // Show confirmation
    this.showToast('Settings saved successfully');
  }

  /**
   * Show toast notification
   */
  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('show');
    }, 100);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }
}
