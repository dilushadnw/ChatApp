/**
 * Tests for MessageBubble Component
 */

import { MessageBubble, createMessageElement } from '../src/components/MessageBubble.js';

describe('MessageBubble', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('render', () => {
    test('should render a message bubble for own messages', () => {
      const message = {
        id: '1',
        text: 'Hello world',
        timestamp: Date.now(),
        sender: 'user1'
      };

      const bubble = new MessageBubble(message, true, 'Alice');
      const element = bubble.render();

      expect(element.classList.contains('message')).toBe(true);
      expect(element.querySelector('.bubble.you')).toBeTruthy();
      expect(element.textContent).toContain('You');
      expect(element.textContent).toContain('Hello world');
    });

    test('should render a message bubble for other user messages', () => {
      const message = {
        id: '2',
        text: 'Hi there',
        timestamp: Date.now(),
        sender: 'user2'
      };

      const bubble = new MessageBubble(message, false, 'Bob');
      const element = bubble.render();

      expect(element.querySelector('.bubble.other')).toBeTruthy();
      expect(element.textContent).toContain('Bob');
      expect(element.textContent).toContain('Hi there');
    });

    test('should show sending status for pending messages', () => {
      const message = {
        id: '3',
        text: 'Sending...',
        timestamp: Date.now(),
        status: 'sending'
      };

      const bubble = new MessageBubble(message, true, 'You');
      const element = bubble.render();

      expect(element.querySelector('.bubble.sending')).toBeTruthy();
    });

    test('should display timestamp in correct format', () => {
      const now = new Date('2024-01-01T12:30:00');
      const message = {
        id: '4',
        text: 'Test message',
        timestamp: now.getTime()
      };

      const bubble = new MessageBubble(message, true, 'You');
      const element = bubble.render();
      const timeElement = element.querySelector('.time');

      expect(timeElement).toBeTruthy();
      expect(timeElement.textContent).toMatch(/\d{1,2}:\d{2}/);
    });

    test('should include status icon for own messages', () => {
      const message = {
        id: '5',
        text: 'Test',
        timestamp: Date.now(),
        status: 'sent'
      };

      const bubble = new MessageBubble(message, true, 'You');
      const element = bubble.render();

      expect(element.querySelector('.status-icon')).toBeTruthy();
    });

    test('should not include status icon for other user messages', () => {
      const message = {
        id: '6',
        text: 'Test',
        timestamp: Date.now(),
        status: 'sent'
      };

      const bubble = new MessageBubble(message, false, 'Bob');
      const element = bubble.render();

      // Status icon should only appear for own messages
      const statusIcon = element.querySelector('.status-icon');
      expect(statusIcon).toBeFalsy();
    });

    test('should escape HTML in message text', () => {
      const message = {
        id: '7',
        text: '<script>alert("XSS")</script>',
        timestamp: Date.now()
      };

      const bubble = new MessageBubble(message, true, 'You');
      const element = bubble.render();

      // Should not contain actual script tag
      expect(element.innerHTML).not.toContain('<script>alert');
      // Should contain escaped version
      expect(element.innerHTML).toContain('&lt;script&gt;');
    });

    test('should render image when imageUrl is present', () => {
      const message = {
        id: '8',
        text: 'Check this out',
        timestamp: Date.now(),
        imageUrl: 'https://example.com/image.jpg'
      };

      const bubble = new MessageBubble(message, true, 'You');
      const element = bubble.render();

      const img = element.querySelector('.message-image');
      expect(img).toBeTruthy();
      expect(img.src).toContain('example.com/image.jpg');
    });
  });

  describe('getStatusIcon', () => {
    test('should return correct icon for sending status', () => {
      const message = { status: 'sending', timestamp: Date.now(), text: 'Test' };
      const bubble = new MessageBubble(message, true, 'You');
      const icon = bubble.getStatusIcon();

      expect(icon).toContain('sending');
      expect(icon).toContain('⏱');
    });

    test('should return correct icon for sent status', () => {
      const message = { status: 'sent', timestamp: Date.now(), text: 'Test' };
      const bubble = new MessageBubble(message, true, 'You');
      const icon = bubble.getStatusIcon();

      expect(icon).toContain('sent');
      expect(icon).toContain('✓');
    });

    test('should return correct icon for delivered status', () => {
      const message = { status: 'delivered', timestamp: Date.now(), text: 'Test' };
      const bubble = new MessageBubble(message, true, 'You');
      const icon = bubble.getStatusIcon();

      expect(icon).toContain('delivered');
      expect(icon).toContain('✓✓');
    });

    test('should return correct icon for read status', () => {
      const message = { status: 'read', timestamp: Date.now(), text: 'Test' };
      const bubble = new MessageBubble(message, true, 'You');
      const icon = bubble.getStatusIcon();

      expect(icon).toContain('read');
      expect(icon).toContain('✓✓');
    });
  });

  describe('createMessageElement', () => {
    test('should create and return a message element', () => {
      const message = {
        id: '9',
        text: 'Test message',
        timestamp: Date.now()
      };

      const element = createMessageElement(message, true, 'You');

      expect(element).toBeInstanceOf(HTMLElement);
      expect(element.classList.contains('message')).toBe(true);
    });
  });

  describe('formatTime', () => {
    test('should format timestamp correctly', () => {
      const date = new Date('2024-01-01T14:30:00');
      const message = {
        text: 'Test',
        timestamp: date.getTime()
      };

      const bubble = new MessageBubble(message, true, 'You');
      const formatted = bubble.formatTime(message.timestamp);

      // Should be in format like "2:30 PM" or "14:30"
      expect(formatted).toMatch(/\d{1,2}:\d{2}/);
    });

    test('should return empty string for invalid timestamp', () => {
      const message = { text: 'Test', timestamp: null };
      const bubble = new MessageBubble(message, true, 'You');
      const formatted = bubble.formatTime(message.timestamp);

      expect(formatted).toBe('');
    });
  });
});
