/**
 * ChatWindow Component
 * Main chat interface with messages and composer
 */

import { createMessageElement } from './MessageBubble.js';
import { Composer } from './Composer.js';

export class ChatWindow {
  constructor(container) {
    this.container = container;
    this.messages = [];
    this.composer = null;
    this.currentConversation = null;
    this.isUserScrolling = false;
    this.scrollPinned = false;
    this.render();
  }

  /**
   * Render the chat window
   */
  render() {
    this.container.innerHTML = `
      <div class="chat-window">
        <div class="chat-header" id="chatHeader">
          <button class="back-btn" id="backBtn" aria-label="Back to conversations">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
          </button>
          <div class="chat-header-info">
            <h3 class="chat-title" id="chatTitle">Select a conversation</h3>
            <span class="chat-status" id="chatStatus"></span>
          </div>
        </div>
        <div class="messages-container" id="messagesContainer">
          <div id="messages" class="messages"></div>
          <div class="typing-indicator" id="typingIndicator" style="display: none;">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        <div class="scroll-to-bottom" id="scrollToBottom" style="display: none;">
          <button aria-label="Scroll to bottom">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 14l-6-6h12z"/>
            </svg>
          </button>
        </div>
        <div class="composer-container" id="composerContainer"></div>
      </div>
    `;

    this.setupComposer();
    this.setupEventListeners();
  }

  /**
   * Setup composer
   */
  setupComposer() {
    const composerContainer = this.container.querySelector('#composerContainer');
    if (composerContainer) {
      this.composer = new Composer(composerContainer, (data) => {
        this.handleSendMessage(data);
      });
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const messagesContainer = this.container.querySelector('#messagesContainer');
    const backBtn = this.container.querySelector('#backBtn');
    const scrollToBottomBtn = this.container.querySelector('#scrollToBottom');

    // Detect user scrolling
    messagesContainer?.addEventListener('scroll', () => {
      this.handleScroll();
    });

    // Back button (for mobile)
    backBtn?.addEventListener('click', () => {
      this.handleBackClick();
    });

    // Scroll to bottom button
    scrollToBottomBtn?.addEventListener('click', () => {
      this.scrollToBottom(true);
    });

    // Listen for typing input
    window.addEventListener('composerInput', (e) => {
      this.handleTypingInput();
    });
  }

  /**
   * Handle scroll event
   */
  handleScroll() {
    const messagesContainer = this.container.querySelector('#messagesContainer');
    const scrollToBottomBtn = this.container.querySelector('#scrollToBottom');
    
    if (!messagesContainer) return;

    const isAtBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop <= messagesContainer.clientHeight + 50;
    
    this.isUserScrolling = !isAtBottom;
    
    // Show/hide scroll to bottom button
    if (scrollToBottomBtn) {
      scrollToBottomBtn.style.display = isAtBottom ? 'none' : 'flex';
    }
  }

  /**
   * Handle back button click
   */
  handleBackClick() {
    const event = new CustomEvent('closeChatWindow');
    window.dispatchEvent(event);
  }

  /**
   * Handle typing input
   */
  handleTypingInput() {
    if (!this.currentConversation) return;
    
    const event = new CustomEvent('userTyping', {
      detail: { conversationId: this.currentConversation.id }
    });
    window.dispatchEvent(event);
  }

  /**
   * Set current conversation
   */
  setConversation(conversation) {
    this.currentConversation = conversation;
    this.messages = [];
    
    const chatTitle = this.container.querySelector('#chatTitle');
    if (chatTitle) {
      chatTitle.textContent = conversation.name;
    }
    
    this.clearMessages();
  }

  /**
   * Add a message to the chat
   */
  addMessage(message, isOwn, senderName, animate = true) {
    const messagesDiv = this.container.querySelector('#messages');
    if (!messagesDiv) return;

    const messageElement = createMessageElement(message, isOwn, senderName);
    
    if (animate) {
      messageElement.style.opacity = '0';
      messageElement.style.transform = 'translateY(20px)';
    }
    
    messagesDiv.appendChild(messageElement);
    
    if (animate) {
      // Trigger animation
      requestAnimationFrame(() => {
        messageElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        messageElement.style.opacity = '1';
        messageElement.style.transform = 'translateY(0)';
      });
    }

    this.messages.push(message);
    
    // Auto-scroll if user is not scrolling or if it's own message
    if (!this.isUserScrolling || isOwn) {
      this.scrollToBottom();
    }
  }

  /**
   * Clear all messages
   */
  clearMessages() {
    const messagesDiv = this.container.querySelector('#messages');
    if (messagesDiv) {
      messagesDiv.innerHTML = '';
    }
    this.messages = [];
  }

  /**
   * Scroll to bottom
   */
  scrollToBottom(force = false) {
    const messagesContainer = this.container.querySelector('#messagesContainer');
    if (!messagesContainer) return;

    if (force || !this.isUserScrolling) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  /**
   * Show typing indicator
   */
  showTypingIndicator(show = true) {
    const typingIndicator = this.container.querySelector('#typingIndicator');
    if (typingIndicator) {
      typingIndicator.style.display = show ? 'flex' : 'none';
      if (show) {
        this.scrollToBottom();
      }
    }
  }

  /**
   * Handle send message
   */
  handleSendMessage(data) {
    const event = new CustomEvent('sendMessage', {
      detail: {
        text: data.text,
        file: data.file,
        conversationId: this.currentConversation?.id
      }
    });
    window.dispatchEvent(event);
  }

  /**
   * Update message status
   */
  updateMessageStatus(messageId, status) {
    const messageElement = this.container.querySelector(`[data-message-id="${messageId}"]`);
    if (!messageElement) return;

    const statusIcon = messageElement.querySelector('.status-icon');
    if (!statusIcon) return;

    const icons = {
      sending: '⏱',
      sent: '✓',
      delivered: '✓✓',
      read: '✓✓'
    };

    statusIcon.textContent = icons[status] || icons.sent;
    statusIcon.className = `status-icon ${status}`;
    statusIcon.title = status.charAt(0).toUpperCase() + status.slice(1);
  }

  /**
   * Focus composer
   */
  focusComposer() {
    this.composer?.focus();
  }
}
