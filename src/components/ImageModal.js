/**
 * ImageModal Component
 * Full-screen image viewer
 */

export class ImageModal {
  constructor() {
    this.modal = null;
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
        <button class="image-modal-close" aria-label="Close image">×</button>
        <img class="image-modal-img" alt="Full size image">
        <div class="image-modal-controls">
          <button class="image-modal-download" aria-label="Download image">
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
    downloadBtn?.addEventListener('click', () => this.downloadImage());
    
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
   * Show modal with image
   */
  show(imageUrl) {
    const img = this.modal.querySelector('.image-modal-img');
    if (img) {
      img.src = imageUrl;
      img.alt = 'Full size image';
    }
    this.modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  /**
   * Hide modal
   */
  hide() {
    this.modal.style.display = 'none';
    document.body.style.overflow = '';
  }

  /**
   * Download current image
   */
  downloadImage() {
    const img = this.modal.querySelector('.image-modal-img');
    if (!img || !img.src) return;
    
    const link = document.createElement('a');
    link.href = img.src;
    link.download = `image-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Create singleton instance
export const imageModal = new ImageModal();

// Global function to open image modal
window.openImageModal = function(imageUrl) {
  imageModal.show(imageUrl);
};
