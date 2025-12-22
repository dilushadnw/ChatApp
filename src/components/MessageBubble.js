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
    
    // Build message content
    let mediaContent = '';
    if (this.message.imageUrl) {
      mediaContent = this.renderImage();
    } else if (this.message.videoUrl) {
      mediaContent = this.renderVideo();
    }
    
    const textContent = this.message.text ? 
      `<div class="message-content">${sanitizeMessage(this.message.text)}</div>` : '';
    
    bubble.innerHTML = `
      <span class="sender">${this.escapeHtml(senderLabel)}</span>
      ${textContent}
      ${mediaContent}
      <div class="message-footer">
        <span class="time">${this.formatTime(this.message.timestamp)}</span>
        ${this.isOwn ? statusIcon : ''}
      </div>
    `;

    div.appendChild(bubble);
    
    // Add event listener for media clicks
    if (this.message.imageUrl) {
      const img = bubble.querySelector('.message-image');
      if (img) {
        img.addEventListener('click', () => {
          if (window.openImageModal) {
            window.openImageModal(this.message.imageUrl);
          }
        });
      }
    } else if (this.message.videoUrl) {
      const video = bubble.querySelector('.message-video');
      if (video) {
        video.addEventListener('click', () => {
          if (window.openImageModal) {
            window.openImageModal(this.message.videoUrl, 'video');
          }
        });
      }
    }
    
    return div;
  }

  /**
   * Render image if present
   */
  renderImage() {
    const imageUrl = this.escapeHtml(this.message.imageUrl);
    return `
      <div class="message-image-container">
        <img 
          src="${imageUrl}" 
          alt="Shared image" 
          class="message-image"
          loading="lazy"
          data-image-url="${imageUrl}"
          style="cursor: pointer;"
        >
      </div>
    `;
  }

  /**
   * Render video if present
   */
  renderVideo() {
    const videoUrl = this.escapeHtml(this.message.videoUrl);
    return `
      <div class="message-video-container">
        <video 
          src="${videoUrl}" 
          class="message-video"
          controls
          preload="metadata"
          data-video-url="${videoUrl}"
        >
          Your browser does not support the video tag.
        </video>
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
