/**
 * Composer Component
 * Message input with media upload (images/videos), drag-and-drop, and emoji support
 */

import { isValidMediaType, isValidFileSize, getMediaType } from '../utils/sanitize.js';

export class Composer {
  constructor(container, onSendMessage) {
    this.container = container;
    this.onSendMessage = onSendMessage;
    this.selectedFile = null;
    this.isUploading = false;
    this.uploadProgress = 0;
    this.render();
  }

  /**
   * Render the composer
   */
  render() {
    this.container.innerHTML = `
      <div class="composer">
        <!-- Upload Progress Bar -->
        <div class="upload-progress" id="uploadProgress" style="display: none;">
          <div class="upload-progress-bar">
            <div class="upload-progress-fill" id="uploadProgressFill" style="width: 0%;"></div>
          </div>
          <span class="upload-progress-text" id="uploadProgressText">Uploading... 0%</span>
        </div>
        
        <!-- File Preview -->
        <div class="file-preview" id="filePreview" style="display: none;">
          <div class="preview-content" id="previewContent"></div>
          <button class="remove-file-btn" id="removeFileBtn" aria-label="Remove file">×</button>
        </div>
        
        <!-- Drag and Drop Overlay -->
        <div class="drag-drop-overlay" id="dragDropOverlay" style="display: none;">
          <div class="drag-drop-content">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
            <p>Drop media file here</p>
          </div>
        </div>
        
        <div class="composer-row">
          <button class="attach-btn" id="attachBtn" aria-label="Attach media" title="Attach image or video">
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
    this.setupDragAndDrop();
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

    // Listen for global upload events
    window.addEventListener('setUploadingState', (e) => {
      if (e.detail && typeof e.detail.uploading !== 'undefined') {
        this.setUploadingState(e.detail.uploading);
      }
    });

    window.addEventListener('uploadProgress', (e) => {
      if (e.detail && typeof e.detail.progress !== 'undefined') {
        this.updateUploadProgress(e.detail.progress);
      }
    });

    window.addEventListener('hideUploadProgress', () => {
      this.hideUploadProgress();
    });

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
   * Setup drag and drop functionality
   */
  setupDragAndDrop() {
    const composer = this.container.querySelector('.composer');
    const overlay = this.container.querySelector('#dragDropOverlay');
    
    if (!composer || !overlay) return;

    let dragCounter = 0;

    // Prevent default drag behaviors on the document
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      document.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      }, false);
    });

    // Show overlay when dragging over composer
    composer.addEventListener('dragenter', (e) => {
      e.preventDefault();
      dragCounter++;
      overlay.style.display = 'flex';
    });

    overlay.addEventListener('dragenter', (e) => {
      e.preventDefault();
      dragCounter++;
    });

    overlay.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter === 0) {
        overlay.style.display = 'none';
      }
    });

    composer.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter === 0) {
        overlay.style.display = 'none';
      }
    });

    overlay.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    // Handle file drop
    overlay.addEventListener('drop', (e) => {
      e.preventDefault();
      dragCounter = 0;
      overlay.style.display = 'none';
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handleFileSelect({ target: { files } });
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

    // Prevent sending if already uploading
    if (this.isUploading) {
      return;
    }

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
   * Set uploading state and disable/enable send button
   */
  setUploadingState(isUploading) {
    this.isUploading = isUploading;
    const sendBtn = this.container.querySelector('#sendBtn');
    const attachBtn = this.container.querySelector('#attachBtn');
    const input = this.container.querySelector('#msgInput');

    if (sendBtn) {
      sendBtn.disabled = isUploading;
      sendBtn.style.opacity = isUploading ? '0.5' : '1';
      sendBtn.style.cursor = isUploading ? 'not-allowed' : 'pointer';
    }

    if (attachBtn) {
      attachBtn.disabled = isUploading;
      attachBtn.style.opacity = isUploading ? '0.5' : '1';
      attachBtn.style.cursor = isUploading ? 'not-allowed' : 'pointer';
    }

    if (input) {
      input.disabled = isUploading;
      input.style.opacity = isUploading ? '0.7' : '1';
    }
  }

  /**
   * Update upload progress
   */
  updateUploadProgress(progress) {
    this.uploadProgress = progress;
    const progressBar = this.container.querySelector('#uploadProgressFill');
    const progressText = this.container.querySelector('#uploadProgressText');
    const progressContainer = this.container.querySelector('#uploadProgress');

    if (progressContainer) {
      progressContainer.style.display = progress > 0 && progress < 100 ? 'block' : 'none';
    }

    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }

    if (progressText) {
      progressText.textContent = `Uploading... ${Math.round(progress)}%`;
    }
  }

  /**
   * Hide upload progress
   */
  hideUploadProgress() {
    const progressContainer = this.container.querySelector('#uploadProgress');
    if (progressContainer) {
      progressContainer.style.display = 'none';
    }
    this.uploadProgress = 0;
  }

  /**
   * Handle file selection
   */
  async handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type (images and videos)
    if (!isValidMediaType(file)) {
      alert('Please select a valid media file.\nSupported formats:\n• Images: JPG, PNG, WebP, GIF\n• Videos: MP4, WebM, OGG');
      return;
    }

    const mediaType = getMediaType(file);
    const maxSize = mediaType === 'image' ? 5 : 50;

    // Validate file size
    if (!isValidFileSize(file, maxSize)) {
      alert(`File size must be less than ${maxSize}MB for ${mediaType}s`);
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
    const previewContent = this.container.querySelector('#previewContent');

    if (!preview || !previewContent) return;

    const mediaType = getMediaType(file);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      if (mediaType === 'image') {
        previewContent.innerHTML = `
          <img src="${e.target.result}" alt="Preview" class="preview-image">
          <span class="preview-label">Image</span>
        `;
      } else if (mediaType === 'video') {
        previewContent.innerHTML = `
          <video src="${e.target.result}" class="preview-video" muted></video>
          <span class="preview-label">Video</span>
        `;
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
