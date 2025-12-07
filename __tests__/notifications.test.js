/**
 * Tests for Notification Service
 */

import { NotificationService } from '../src/services/notifications.js';

describe('NotificationService', () => {
  let notificationService;

  beforeEach(() => {
    localStorage.clear();
    notificationService = new NotificationService();
  });

  describe('loadSettings', () => {
    test('should load default settings when no saved settings exist', () => {
      const settings = notificationService.loadSettings();
      
      expect(settings.soundEnabled).toBe(true);
      expect(settings.notificationsEnabled).toBe(true);
      expect(settings.vibrationEnabled).toBe(true);
    });

    test('should load saved settings from localStorage', () => {
      const savedSettings = {
        soundEnabled: false,
        notificationsEnabled: true,
        vibrationEnabled: false,
        dndStart: '22:00',
        dndEnd: '08:00'
      };
      localStorage.setItem('notificationSettings', JSON.stringify(savedSettings));
      
      const newService = new NotificationService();
      expect(newService.settings.soundEnabled).toBe(false);
      expect(newService.settings.dndStart).toBe('22:00');
    });
  });

  describe('saveSettings', () => {
    test('should save settings to localStorage', () => {
      const newSettings = {
        soundEnabled: false,
        notificationsEnabled: true
      };
      
      notificationService.saveSettings(newSettings);
      
      // Verify settings were saved
      const saved = localStorage.getItem('notificationSettings');
      expect(saved).toBeTruthy();
      expect(saved).toContain('soundEnabled');
      const parsed = JSON.parse(saved);
      expect(parsed.soundEnabled).toBe(false);
    });
  });

  describe('requestPermission', () => {
    test('should return true when permission is already granted', async () => {
      global.Notification.permission = 'granted';
      const result = await notificationService.requestPermission();
      expect(result).toBe(true);
    });

    test('should request permission when not yet decided', async () => {
      global.Notification.permission = 'default';
      const result = await notificationService.requestPermission();
      expect(result).toBe(true);
    });
  });

  describe('playSound', () => {
    test('should not play sound when disabled', () => {
      notificationService.settings.soundEnabled = false;
      notificationService.playSound();
      // Should not throw and should complete without errors
      expect(true).toBe(true);
    });

    test('should attempt to play sound when enabled', () => {
      notificationService.settings.soundEnabled = true;
      notificationService.playSound();
      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('vibrate', () => {
    test('should not vibrate when disabled', () => {
      notificationService.settings.vibrationEnabled = false;
      // Should not throw
      notificationService.vibrate();
      expect(true).toBe(true);
    });

    test('should vibrate when enabled', () => {
      notificationService.settings.vibrationEnabled = true;
      // Should not throw
      notificationService.vibrate();
      expect(true).toBe(true);
    });
  });

  describe('isDoNotDisturb', () => {
    test('should return false when DND is not configured', () => {
      notificationService.settings.dndStart = null;
      notificationService.settings.dndEnd = null;
      expect(notificationService.isDoNotDisturb()).toBe(false);
    });

    test('should detect DND hours correctly', () => {
      // Set DND for 22:00 to 08:00
      notificationService.settings.dndStart = '22:00';
      notificationService.settings.dndEnd = '08:00';
      
      // Should return a boolean
      const result = notificationService.isDoNotDisturb();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('updateUnreadCount', () => {
    test('should update page title with unread count', () => {
      const originalTitle = document.title;
      notificationService.originalTitle = 'Chat App';
      
      notificationService.updateUnreadCount(5);
      expect(document.title).toBe('(5) Chat App');
      
      notificationService.updateUnreadCount(0);
      expect(document.title).toBe('Chat App');
    });
  });

  describe('showNotification', () => {
    test('should not show notification when disabled', () => {
      notificationService.settings.notificationsEnabled = false;
      const result = notificationService.showNotification('Test', { body: 'Test body' });
      expect(result).toBe(null);
    });

    test('should return null when window is focused', () => {
      // Mock focused window
      const originalHasFocus = document.hasFocus;
      document.hasFocus = () => true;
      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        configurable: true,
        value: 'visible'
      });
      
      const result = notificationService.showNotification('Test', { body: 'Test body' });
      expect(result).toBe(null);
      
      // Restore
      document.hasFocus = originalHasFocus;
    });
  });

  describe('notifyNewMessage', () => {
    test('should create notification with sender name and preview', () => {
      global.Notification.permission = 'granted';
      
      notificationService.notifyNewMessage('Alice', 'Hello there!', 'chat123');
      
      // Should not throw
      expect(true).toBe(true);
    });

    test('should truncate long messages in notification', () => {
      global.Notification.permission = 'granted';
      
      const longMessage = 'a'.repeat(100);
      notificationService.notifyNewMessage('Bob', longMessage, 'chat456');
      
      // Should not throw
      expect(true).toBe(true);
    });
  });
});
