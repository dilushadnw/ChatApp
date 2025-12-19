/**
 * VideoModal Component
 * Full-screen video viewer with controls
 */

export class VideoModal {
  constructor() {
    this.modal = null;
    this.createModal();
  }

  /**
   * Create modal element
   */
  createModal() {
    this.modal = document.createElement('div');
    this.modal.className = 'video-modal';
    this.modal.id = 'videoModal';
    this.modal.style.display = 'none';
    
    this.modal.innerHTML = `
      <div class="video-modal-content">
        <button class="video-modal-close" aria-label="Close video">×</button>
        <video class="video-modal-player" controls autoplay>
          <source src="" type="video/mp4">
          Your browser does not support the video tag.
        </video>
        <div class="video-modal-controls">
          <button class="video-modal-download" aria-label="Download video">
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
    const closeBtn = this.modal.querySelector('.video-modal-close');
    const downloadBtn = this.modal.querySelector('.video-modal-download');
    const video = this.modal.querySelector('.video-modal-player');
    
    closeBtn?.addEventListener('click', () => this.hide());
    downloadBtn?.addEventListener('click', () => this.downloadVideo());
    
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

    // Pause video when modal is closed
    this.modal.addEventListener('transitionend', () => {
      if (this.modal.style.display === 'none' && video) {
        video.pause();
        video.currentTime = 0;
      }
    });
  }

  /**
   * Show modal with video
   */
  show(videoUrl) {
    const video = this.modal.querySelector('.video-modal-player');
    const source = video?.querySelector('source');
    
    if (source && video) {
      source.src = videoUrl;
      video.load();
      this.modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
  }

  /**
   * Hide modal
   */
  hide() {
    const video = this.modal.querySelector('.video-modal-player');
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
    this.modal.style.display = 'none';
    document.body.style.overflow = '';
  }

  /**
   * Download current video
   */
  downloadVideo() {
    const video = this.modal.querySelector('.video-modal-player');
    const source = video?.querySelector('source');
    
    if (!source || !source.src) return;
    
    const link = document.createElement('a');
    link.href = source.src;
    link.download = `video-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Create singleton instance
export const videoModal = new VideoModal();

// Global function to open video modal
window.openVideoModal = function(videoUrl) {
  videoModal.show(videoUrl);
};
