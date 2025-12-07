/**
 * MessageBubble Component
 * Renders individual message bubbles with status indicators
 */

import { sanitizeMessage } from '../utils/sanitize.js';

export class MessageBubble {
  constructor(message, isOwn, senderName) {
    this.message = message;
    this.isOwn = isOwn;
    this.senderName = senderName;
  }

  /**
   * Render the message bubble
   */
  render() {
    const div = document.createElement('div');
    div.className = 'message';
    div.setAttribute('data-message-id', this.message.id || this.message.timestamp);

    const bubble = document.createElement('div');
    bubble.className = `bubble ${this.isOwn ? 'you' : 'other'}`;

    // Add status class if message is being sent
    if (this.message.status === 'sending') {
      bubble.classList.add('sending');
    }

    const senderLabel = this.isOwn ? 'You' : this.senderName;
    const statusIcon = this.getStatusIcon();
    
    bubble.innerHTML = `
      <span class="sender">${this.escapeHtml(senderLabel)}</span>
      <div class="message-content">${sanitizeMessage(this.message.text)}</div>
      ${this.message.imageUrl ? this.renderImage() : ''}
      <div class="message-footer">
        <span class="time">${this.formatTime(this.message.timestamp)}</span>
        ${this.isOwn ? statusIcon : ''}
      </div>
    `;

    div.appendChild(bubble);
    return div;
  }

  /**
   * Render image if present
   */
  renderImage() {
    return `
      <div class="message-image-container">
        <img 
          src="${this.escapeHtml(this.message.imageUrl)}" 
          alt="Shared image" 
          class="message-image"
          loading="lazy"
          onclick="window.openImageModal('${this.escapeHtml(this.message.imageUrl)}')"
        >
      </div>
    `;
  }

  /**
   * Get status icon based on message status
   */
  getStatusIcon() {
    const status = this.message.status || 'sent';
    
    const icons = {
      sending: '<span class="status-icon sending" title="Sending">⏱</span>',
      sent: '<span class="status-icon sent" title="Sent">✓</span>',
      delivered: '<span class="status-icon delivered" title="Delivered">✓✓</span>',
      read: '<span class="status-icon read" title="Read">✓✓</span>'
    };

    return icons[status] || icons.sent;
  }

  /**
   * Format timestamp
   */
  formatTime(timestamp) {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (e) {
      return '';
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Update message status
   */
  updateStatus(newStatus) {
    this.message.status = newStatus;
  }
}

/**
 * Create and render a message element
 */
export function createMessageElement(message, isOwn, senderName) {
  const bubble = new MessageBubble(message, isOwn, senderName);
  return bubble.render();
}
