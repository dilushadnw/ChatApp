/**
 * ConversationList Component
 * Displays list of conversations with unread badges
 */

export class ConversationList {
  constructor(container, onConversationSelect) {
    this.container = container;
    this.onConversationSelect = onConversationSelect;
    this.conversations = [];
    this.activeConversationId = null;
    this.render();
  }

  /**
   * Render the conversation list
   */
  render() {
    this.container.innerHTML = `
      <div class="conversation-list">
        <div class="conversation-list-header">
          <h2>Messages</h2>
          <button class="settings-btn" id="settingsBtn" aria-label="Settings">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M17.43 10.98c.04-.32.07-.64.07-.98 0-.34-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C12.46 2.18 12.25 2 12 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98 0 .33.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM10 13c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3z"/>
            </svg>
          </button>
        </div>
        <div class="search-container">
          <input 
            type="text" 
            id="searchUser" 
            class="search-input"
            placeholder="Search or start new chat..."
            aria-label="Search users"
          >
          <button id="searchBtn" class="search-btn" aria-label="Search">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M12.9 14.32a8 8 0 1 1 1.41-1.41l5.35 5.33-1.42 1.42-5.33-5.34zM8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z"/>
            </svg>
          </button>
        </div>
        <ul id="userList" class="user-list" role="list"></ul>
        <ul id="conversationsList" class="conversations" role="list"></ul>
      </div>
    `;

    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const searchInput = this.container.querySelector('#searchUser');
    const searchBtn = this.container.querySelector('#searchBtn');
    const settingsBtn = this.container.querySelector('#settingsBtn');

    searchInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.handleSearch();
      }
    });

    searchBtn?.addEventListener('click', () => this.handleSearch());
    settingsBtn?.addEventListener('click', () => this.handleSettingsClick());
  }

  /**
   * Handle search button click
   */
  handleSearch() {
    const searchInput = this.container.querySelector('#searchUser');
    if (window.searchUser && typeof window.searchUser === 'function') {
      window.searchUser();
    }
  }

  /**
   * Handle settings button click
   */
  handleSettingsClick() {
    const event = new CustomEvent('openSettings');
    window.dispatchEvent(event);
  }

  /**
   * Add a conversation to the list
   */
  addConversation(conversation) {
    const exists = this.conversations.find(c => c.id === conversation.id);
    if (!exists) {
      this.conversations.push(conversation);
      this.updateConversationsList();
    }
  }

  /**
   * Update the conversations list display
   */
  updateConversationsList() {
    const listContainer = this.container.querySelector('#conversationsList');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    if (this.conversations.length === 0) {
      listContainer.innerHTML = '<li class="empty-state">Search for users to start chatting</li>';
      return;
    }

    this.conversations.forEach(conv => {
      const li = document.createElement('li');
      li.className = 'conversation-item';
      li.setAttribute('role', 'listitem');
      li.setAttribute('tabindex', '0');
      
      if (conv.id === this.activeConversationId) {
        li.classList.add('active');
      }

      const unreadBadge = conv.unreadCount > 0 
        ? `<span class="unread-badge" aria-label="${conv.unreadCount} unread messages">${conv.unreadCount}</span>` 
        : '';

      const avatar = conv.avatar 
        ? `<img src="${conv.avatar}" alt="${conv.name}" class="avatar">` 
        : `<div class="avatar-placeholder">${conv.name.charAt(0).toUpperCase()}</div>`;

      const lastMessage = conv.lastMessage || 'Start conversation';
      const timestamp = conv.lastMessageTime 
        ? this.formatTime(conv.lastMessageTime) 
        : '';

      li.innerHTML = `
        ${avatar}
        <div class="conversation-info">
          <div class="conversation-header">
            <span class="conversation-name">${this.escapeHtml(conv.name)}</span>
            <span class="conversation-time">${timestamp}</span>
          </div>
          <div class="conversation-preview">
            <span class="last-message">${this.escapeHtml(lastMessage)}</span>
            ${unreadBadge}
          </div>
        </div>
      `;

      li.addEventListener('click', () => this.selectConversation(conv.id));
      li.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.selectConversation(conv.id);
        }
      });

      listContainer.appendChild(li);
    });
  }

  /**
   * Select a conversation
   */
  selectConversation(conversationId) {
    this.activeConversationId = conversationId;
    this.updateConversationsList();
    
    if (this.onConversationSelect) {
      const conversation = this.conversations.find(c => c.id === conversationId);
      this.onConversationSelect(conversation);
    }
  }

  /**
   * Update unread count for a conversation
   */
  updateUnreadCount(conversationId, count) {
    const conv = this.conversations.find(c => c.id === conversationId);
    if (conv) {
      conv.unreadCount = count;
      this.updateConversationsList();
    }
  }

  /**
   * Format timestamp
   */
  formatTime(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Less than 1 minute
    if (diff < 60000) {
      return 'Just now';
    }
    
    // Less than 1 hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m`;
    }
    
    // Less than 24 hours
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h`;
    }
    
    // Less than 7 days
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days}d`;
    }
    
    // Older
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Get total unread count
   */
  getTotalUnreadCount() {
    return this.conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
  }
}
