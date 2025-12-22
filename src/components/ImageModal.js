/**
 * ImageModal Component
 * Full-screen media viewer (images and videos)
 */

export class ImageModal {
  constructor() {
    this.modal = null;
    this.currentMediaUrl = null;
    this.currentMediaType = 'image';
    this.createModal();
  }

  /**
   * Create modal element
   */
  createModal() {
    this.modal = document.createElement('div');
    this.modal.className = 'image-modal';
    this.modal.id = 'imageModal';
    this.modal.style.display = 'none';
    
    this.modal.innerHTML = `
      <div class="image-modal-content">
        <button class="image-modal-close" aria-label="Close media">×</button>
        <div id="imageModalMediaContainer" class="image-modal-media-container"></div>
        <div class="image-modal-controls">
          <button class="image-modal-download" aria-label="Download media">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.modal);
    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const closeBtn = this.modal.querySelector('.image-modal-close');
    const downloadBtn = this.modal.querySelector('.image-modal-download');
    
    closeBtn?.addEventListener('click', () => this.hide());
    downloadBtn?.addEventListener('click', () => this.downloadMedia());
    
    // Close on background click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.hide();
      }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.style.display === 'flex') {
        this.hide();
      }
    });
  }

  /**
   * Show modal with media
   */
  show(mediaUrl, mediaType = 'image') {
    this.currentMediaUrl = mediaUrl;
    this.currentMediaType = mediaType;
    
    const mediaContainer = this.modal.querySelector('#imageModalMediaContainer');
    if (!mediaContainer) return;
    
    // Clear previous content
    mediaContainer.innerHTML = '';
    
    if (mediaType === 'video') {
      // Create video element
      const video = document.createElement('video');
      video.className = 'image-modal-img';
      video.src = mediaUrl;
      video.controls = true;
      video.autoplay = false;
      video.setAttribute('controlsList', 'nodownload');
      mediaContainer.appendChild(video);
    } else {
      // Create image element
      const img = document.createElement('img');
      img.className = 'image-modal-img';
      img.src = mediaUrl;
      img.alt = 'Full size media';
      mediaContainer.appendChild(img);
    }
    
    this.modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  /**
   * Hide modal
   */
  hide() {
    // Pause video if playing
    const video = this.modal.querySelector('video');
    if (video) {
      video.pause();
    }
    
    this.modal.style.display = 'none';
    document.body.style.overflow = '';
  }

  /**
   * Download current media
   */
  downloadMedia() {
    if (!this.currentMediaUrl) return;
    
    const extension = this.currentMediaType === 'video' ? 'mp4' : 'jpg';
    const link = document.createElement('a');
    link.href = this.currentMediaUrl;
    link.download = `media-${Date.now()}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Create singleton instance
export const imageModal = new ImageModal();

// Global function to open image modal
window.openImageModal = function(mediaUrl, mediaType = 'image') {
  imageModal.show(mediaUrl, mediaType);
};
