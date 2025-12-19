/**
 * Composer Component
 * Message input with file upload and emoji support
 */

import { isValidImageType, isValidVideoType, isValidMediaType, isValidFileSize, isVideoFile } from '../utils/sanitize.js';

// Video preview placeholder icon
const VIDEO_PREVIEW_ICON = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjMzMzIi8+Cjxwb2x5Z29uIHBvaW50cz0iNDAsMzAgNDAsNzAgNzAsNTAiIGZpbGw9IiNmZmYiLz4KPC9zdmc+';

export class Composer {
  constructor(container, onSendMessage) {
    this.container = container;
    this.onSendMessage = onSendMessage;
    this.selectedFile = null;
    this.render();
  }

  /**
   * Render the composer
   */
  render() {
    this.container.innerHTML = `
      <div class="composer">
        <div class="file-preview" id="filePreview" style="display: none;">
          <img id="previewImage" alt="Preview" class="preview-image">
          <button class="remove-file-btn" id="removeFileBtn" aria-label="Remove file">×</button>
        </div>
        <div class="composer-row">
          <button class="attach-btn" id="attachBtn" aria-label="Attach file" title="Attach image">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5a2.5 2.5 0 0 1 5 0v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5a2.5 2.5 0 0 0 5 0V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
            </svg>
          </button>
          <button class="emoji-btn" id="emojiBtn" aria-label="Add emoji" title="Add emoji">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
            </svg>
          </button>
          <textarea 
            id="msgInput" 
            class="message-input"
            placeholder="Type a message..."
            rows="1"
            aria-label="Message input"
          ></textarea>
          <button id="sendBtn" class="send-btn" aria-label="Send message">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
        <input type="file" id="fileInput" accept="image/*,video/*" style="display: none;">
        <div class="emoji-picker" id="emojiPicker" style="display: none;"></div>
      </div>
    `;

    this.setupEventListeners();
    this.setupEmojiPicker();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const input = this.container.querySelector('#msgInput');
    const sendBtn = this.container.querySelector('#sendBtn');
    const attachBtn = this.container.querySelector('#attachBtn');
    const emojiBtn = this.container.querySelector('#emojiBtn');
    const fileInput = this.container.querySelector('#fileInput');
    const removeFileBtn = this.container.querySelector('#removeFileBtn');

    // Auto-resize textarea
    input?.addEventListener('input', (e) => {
      this.handleInput(e);
      this.autoResize(e.target);
    });

    // Send on Enter, new line on Shift+Enter
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });

    sendBtn?.addEventListener('click', () => this.handleSend());
    attachBtn?.addEventListener('click', () => fileInput?.click());
    emojiBtn?.addEventListener('click', () => this.toggleEmojiPicker());
    fileInput?.addEventListener('change', (e) => this.handleFileSelect(e));
    removeFileBtn?.addEventListener('click', () => this.removeFile());

    // Close emoji picker when clicking outside
    document.addEventListener('click', (e) => {
      const emojiPicker = this.container.querySelector('#emojiPicker');
      const emojiBtn = this.container.querySelector('#emojiBtn');
      if (emojiPicker && !emojiPicker.contains(e.target) && e.target !== emojiBtn) {
        emojiPicker.style.display = 'none';
      }
    });
  }

  /**
   * Handle input change (for typing indicator)
   */
  handleInput(e) {
    const event = new CustomEvent('composerInput', {
      detail: { value: e.target.value }
    });
    window.dispatchEvent(event);
  }

  /**
   * Auto-resize textarea
   */
  autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }

  /**
   * Handle send button click
   */
  handleSend() {
    const input = this.container.querySelector('#msgInput');
    const text = input?.value.trim();

    if (!text && !this.selectedFile) return;

    if (this.onSendMessage) {
      this.onSendMessage({
        text: text || '',
        file: this.selectedFile
      });
    }

    // Clear input and reset
    if (input) {
      input.value = '';
      input.style.height = 'auto';
    }
    this.removeFile();
  }

  /**
   * Handle file selection
   */
  async handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!isValidMediaType(file)) {
      alert('Please select a valid image (JPEG, PNG, GIF, WebP) or video file (MP4, WebM, MOV)');
      return;
    }

    // Validate file size
    const maxSize = isVideoFile(file) ? 50 : 5;
    if (!isValidFileSize(file)) {
      alert(`File size must be less than ${maxSize}MB`);
      return;
    }

    this.selectedFile = file;
    this.showFilePreview(file);
  }

  /**
   * Show file preview
   */
  showFilePreview(file) {
    const preview = this.container.querySelector('#filePreview');
    const previewImage = this.container.querySelector('#previewImage');

    if (!preview || !previewImage) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      if (isVideoFile(file)) {
        // For videos, show a video icon
        previewImage.src = VIDEO_PREVIEW_ICON;
        previewImage.alt = `Video: ${file.name}`;
      } else {
        previewImage.src = e.target.result;
        previewImage.alt = `Image: ${file.name}`;
      }
      preview.style.display = 'flex';
    };
    reader.readAsDataURL(file);
  }

  /**
   * Remove selected file
   */
  removeFile() {
    this.selectedFile = null;
    const preview = this.container.querySelector('#filePreview');
    const fileInput = this.container.querySelector('#fileInput');
    
    if (preview) preview.style.display = 'none';
    if (fileInput) fileInput.value = '';
  }

  /**
   * Setup emoji picker
   */
  setupEmojiPicker() {
    const emojiPicker = this.container.querySelector('#emojiPicker');
    if (!emojiPicker) return;

    const emojis = [
      '😊', '😂', '❤️', '👍', '👎', '🔥', '🎉', '🚀', 
      '👀', '🤔', '👋', '👏', '🙏', '💯', '😢', '😠', 
      '😎', '😉', '😘', '⭐', '✨', '💪', '🎈', '🌟'
    ];

    emojis.forEach(emoji => {
      const btn = document.createElement('button');
      btn.className = 'emoji-item';
      btn.textContent = emoji;
      btn.setAttribute('type', 'button');
      btn.setAttribute('aria-label', `Insert ${emoji} emoji`);
      btn.addEventListener('click', () => this.insertEmoji(emoji));
      emojiPicker.appendChild(btn);
    });
  }

  /**
   * Toggle emoji picker
   */
  toggleEmojiPicker() {
    const emojiPicker = this.container.querySelector('#emojiPicker');
    if (emojiPicker) {
      emojiPicker.style.display = 
        emojiPicker.style.display === 'none' ? 'grid' : 'none';
    }
  }

  /**
   * Insert emoji at cursor position
   */
  insertEmoji(emoji) {
    const input = this.container.querySelector('#msgInput');
    if (!input) return;

    const start = input.selectionStart;
    const end = input.selectionEnd;
    const text = input.value;
    
    input.value = text.substring(0, start) + emoji + text.substring(end);
    input.selectionStart = input.selectionEnd = start + emoji.length;
    input.focus();

    // Hide picker
    const emojiPicker = this.container.querySelector('#emojiPicker');
    if (emojiPicker) {
      emojiPicker.style.display = 'none';
    }
  }

  /**
   * Focus the input
   */
  focus() {
    const input = this.container.querySelector('#msgInput');
    input?.focus();
  }

  /**
   * Clear the input
   */
  clear() {
    const input = this.container.querySelector('#msgInput');
    if (input) {
      input.value = '';
      input.style.height = 'auto';
    }
    this.removeFile();
  }
}
