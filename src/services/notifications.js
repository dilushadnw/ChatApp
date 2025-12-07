/**
 * Notification Service
 * Handles desktop notifications, sounds, and vibrations for the chat app
 */

export class NotificationService {
  constructor() {
    this.permission = 'default';
    this.settings = this.loadSettings();
    this.notificationSound = null;
    this.unreadCount = 0;
    this.originalTitle = document.title;
    this.initSound();
  }

  /**
   * Load notification settings from localStorage
   */
  loadSettings() {
    const defaultSettings = {
      soundEnabled: true,
      notificationsEnabled: true,
      vibrationEnabled: true,
      dndStart: null,
      dndEnd: null
    };

    try {
      const stored = localStorage.getItem('notificationSettings');
      return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
    } catch (e) {
      console.error('Error loading notification settings:', e);
      return defaultSettings;
    }
  }

  /**
   * Save notification settings to localStorage
   */
  saveSettings(settings) {
    this.settings = { ...this.settings, ...settings };
    try {
      localStorage.setItem('notificationSettings', JSON.stringify(this.settings));
    } catch (e) {
      console.error('Error saving notification settings:', e);
    }
  }

  /**
   * Initialize notification sound
   */
  initSound() {
    // Create a simple notification sound using Web Audio API
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  }

  /**
   * Play notification sound
   */
  playSound() {
    if (!this.settings.soundEnabled || !this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.3);
    } catch (e) {
      console.error('Error playing sound:', e);
    }
  }

  /**
   * Trigger vibration on mobile devices
   */
  vibrate() {
    if (!this.settings.vibrationEnabled) return;

    try {
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    } catch (e) {
      console.error('Error vibrating:', e);
    }
  }

  /**
   * Check if we're in do-not-disturb hours
   */
  isDoNotDisturb() {
    if (!this.settings.dndStart || !this.settings.dndEnd) return false;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = this.settings.dndStart.split(':').map(Number);
    const [endHour, endMinute] = this.settings.dndEnd.split(':').map(Number);
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    if (startTime < endTime) {
      return currentTime >= startTime && currentTime < endTime;
    } else {
      // DND spans midnight
      return currentTime >= startTime || currentTime < endTime;
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.permission = 'granted';
      return true;
    }

    if (Notification.permission !== 'denied') {
      try {
        const permission = await Notification.requestPermission();
        this.permission = permission;
        return permission === 'granted';
      } catch (e) {
        console.error('Error requesting notification permission:', e);
        return false;
      }
    }

    return false;
  }

  /**
   * Show a desktop notification
   */
  showNotification(title, options = {}) {
    if (!this.settings.notificationsEnabled || this.isDoNotDisturb()) {
      return null;
    }

    // Don't show notification if window is focused and visible
    if (document.hasFocus() && document.visibilityState === 'visible') {
      this.playSound();
      this.vibrate();
      return null;
    }

    if (Notification.permission !== 'granted') {
      this.playSound();
      this.vibrate();
      return null;
    }

    try {
      const notification = new Notification(title, {
        icon: options.icon || '/assets/chat-icon.png',
        body: options.body || '',
        tag: options.tag || 'chat-message',
        requireInteraction: false,
        ...options
      });

      // Click to focus
      notification.onclick = () => {
        window.focus();
        notification.close();
        if (options.onClick) {
          options.onClick();
        }
      };

      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);

      this.playSound();
      this.vibrate();

      return notification;
    } catch (e) {
      console.error('Error showing notification:', e);
      this.playSound();
      this.vibrate();
      return null;
    }
  }

  /**
   * Update page title with unread count
   */
  updateUnreadCount(count) {
    this.unreadCount = count;
    if (count > 0) {
      document.title = `(${count}) ${this.originalTitle}`;
    } else {
      document.title = this.originalTitle;
    }
  }

  /**
   * Handle new message notification
   */
  notifyNewMessage(senderName, messageText, conversationId) {
    const preview = messageText.length > 50 
      ? messageText.substring(0, 50) + '...' 
      : messageText;

    this.showNotification(`${senderName}`, {
      body: preview,
      tag: `chat-${conversationId}`,
      onClick: () => {
        // Focus on the specific conversation
        console.log('Notification clicked for conversation:', conversationId);
      }
    });
  }

  /**
   * Reset unread count when user focuses
   */
  clearUnreadCount() {
    this.updateUnreadCount(0);
  }
}

// Create singleton instance
export const notificationService = new NotificationService();
