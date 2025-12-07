/**
 * Tests for Sanitization Utilities
 */

import { escapeHtml, sanitizeMessage, isValidImageType, isValidFileSize } from '../src/utils/sanitize.js';

describe('Sanitization Utilities', () => {
  describe('escapeHtml', () => {
    test('should escape HTML special characters', () => {
      const input = '<script>alert("XSS")</script>';
      const expected = '&lt;script&gt;alert("XSS")&lt;/script&gt;';
      expect(escapeHtml(input)).toBe(expected);
    });

    test('should handle empty input', () => {
      expect(escapeHtml('')).toBe('');
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
    });

    test('should escape ampersands', () => {
      const input = 'Tom & Jerry';
      const expected = 'Tom &amp; Jerry';
      expect(escapeHtml(input)).toBe(expected);
    });

    test('should handle quotes', () => {
      const input = 'He said "Hello"';
      const result = escapeHtml(input);
      // textContent handles quotes naturally, doesn't escape them to &quot;
      expect(result).toContain('Hello');
    });
  });

  describe('sanitizeMessage', () => {
    test('should escape HTML in messages', () => {
      const input = '<img src=x onerror=alert(1)>';
      const result = sanitizeMessage(input);
      expect(result).not.toContain('<img');
      expect(result).toContain('&lt;img');
    });

    test('should convert emoji shortcuts to emoji', () => {
      const input = 'Hello :smile: how are you?';
      const result = sanitizeMessage(input);
      expect(result).toContain('😊');
      expect(result).not.toContain(':smile:');
    });

    test('should convert multiple emoji shortcuts', () => {
      const input = 'Great work :thumbsup: :fire:';
      const result = sanitizeMessage(input);
      expect(result).toContain('👍');
      expect(result).toContain('🔥');
    });

    test('should convert URLs to links', () => {
      const input = 'Check out https://example.com';
      const result = sanitizeMessage(input);
      expect(result).toContain('<a href="https://example.com"');
      expect(result).toContain('target="_blank"');
      expect(result).toContain('rel="noopener noreferrer"');
    });

    test('should handle mixed content (XSS + emojis + URLs)', () => {
      const input = '<script>alert(1)</script> :smile: https://example.com';
      const result = sanitizeMessage(input);
      
      // Should escape script tags
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
      
      // Should convert emoji
      expect(result).toContain('😊');
      
      // Should linkify URL
      expect(result).toContain('<a href="https://example.com"');
    });

    test('should handle plain text without special content', () => {
      const input = 'Hello, how are you today?';
      const result = sanitizeMessage(input);
      expect(result).toBe(input);
    });
  });

  describe('isValidImageType', () => {
    test('should accept valid image types', () => {
      const validTypes = [
        { type: 'image/jpeg' },
        { type: 'image/jpg' },
        { type: 'image/png' },
        { type: 'image/gif' },
        { type: 'image/webp' }
      ];

      validTypes.forEach(file => {
        expect(isValidImageType(file)).toBe(true);
      });
    });

    test('should reject invalid file types', () => {
      const invalidTypes = [
        { type: 'application/pdf' },
        { type: 'text/plain' },
        { type: 'video/mp4' },
        { type: 'application/javascript' }
      ];

      invalidTypes.forEach(file => {
        expect(isValidImageType(file)).toBe(false);
      });
    });
  });

  describe('isValidFileSize', () => {
    test('should accept files within size limit', () => {
      const validSizes = [
        { size: 1024 * 1024 },      // 1 MB
        { size: 2 * 1024 * 1024 },  // 2 MB
        { size: 5 * 1024 * 1024 }   // 5 MB (default max)
      ];

      validSizes.forEach(file => {
        expect(isValidFileSize(file)).toBe(true);
      });
    });

    test('should reject files exceeding size limit', () => {
      const file = { size: 6 * 1024 * 1024 }; // 6 MB
      expect(isValidFileSize(file)).toBe(false);
    });

    test('should accept custom size limits', () => {
      const file = { size: 8 * 1024 * 1024 }; // 8 MB
      
      // Should fail with default 5MB limit
      expect(isValidFileSize(file)).toBe(false);
      
      // Should pass with 10MB limit
      expect(isValidFileSize(file, 10)).toBe(true);
    });

    test('should handle zero-size files', () => {
      const file = { size: 0 };
      expect(isValidFileSize(file)).toBe(true);
    });
  });
});
