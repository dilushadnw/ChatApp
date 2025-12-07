/**
 * Typing indicator utility with debouncing
 */

export class TypingIndicator {
  constructor(firestore, userId) {
    this.db = firestore;
    this.userId = userId;
    this.typingTimeout = null;
    this.listeners = new Map();
  }

  /**
   * Start typing in a conversation (debounced)
   */
  startTyping(conversationId) {
    // Clear existing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    // Set typing status (would update Firestore in production)
    this.setTypingStatus(conversationId, true);

    // Auto-stop after 3 seconds of no activity
    this.typingTimeout = setTimeout(() => {
      this.stopTyping(conversationId);
    }, 3000);
  }

  /**
   * Stop typing in a conversation
   */
  stopTyping(conversationId) {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }

    this.setTypingStatus(conversationId, false);
  }

  /**
   * Set typing status (placeholder for Firestore update)
   */
  async setTypingStatus(conversationId, isTyping) {
    // In a production app, this would update Firestore
    // For now, we'll use a simple event system
    const event = new CustomEvent('typingStatus', {
      detail: { conversationId, userId: this.userId, isTyping }
    });
    window.dispatchEvent(event);
  }

  /**
   * Listen for typing status from another user
   */
  onTypingStatusChange(conversationId, callback) {
    const handler = (event) => {
      if (event.detail.conversationId === conversationId && 
          event.detail.userId !== this.userId) {
        callback(event.detail.isTyping);
      }
    };

    window.addEventListener('typingStatus', handler);
    this.listeners.set(conversationId, handler);
  }

  /**
   * Stop listening for typing status
   */
  offTypingStatusChange(conversationId) {
    const handler = this.listeners.get(conversationId);
    if (handler) {
      window.removeEventListener('typingStatus', handler);
      this.listeners.delete(conversationId);
    }
  }

  /**
   * Clean up
   */
  destroy() {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    this.listeners.forEach((handler) => {
      window.removeEventListener('typingStatus', handler);
    });
    this.listeners.clear();
  }
}
