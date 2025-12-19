/**
 * Sanitization utilities to prevent XSS attacks
 */

/**
 * Escape HTML special characters
 */
export function escapeHtml(text) {
  if (!text) return '';
  
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Sanitize message text for display
 */
export function sanitizeMessage(text) {
  if (!text) return '';
  
  // First escape HTML
  let sanitized = escapeHtml(text);
  
  // Convert URLs to links
  sanitized = linkifyUrls(sanitized);
  
  // Convert emoji shortcuts to emoji
  sanitized = convertEmojiShortcuts(sanitized);
  
  return sanitized;
}

/**
 * Convert URLs in text to clickable links
 */
function linkifyUrls(text) {
  const urlPattern = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
  return text.replace(urlPattern, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
}

// Pre-compiled emoji patterns for better performance
const emojiMap = {
  ':smile:': '😊',
  ':laugh:': '😂',
  ':heart:': '❤️',
  ':thumbsup:': '👍',
  ':thumbsdown:': '👎',
  ':fire:': '🔥',
  ':tada:': '🎉',
  ':rocket:': '🚀',
  ':eyes:': '👀',
  ':thinking:': '🤔',
  ':wave:': '👋',
  ':clap:': '👏',
  ':pray:': '🙏',
  ':100:': '💯',
  ':cry:': '😢',
  ':angry:': '😠',
  ':cool:': '😎',
  ':wink:': '😉',
  ':kiss:': '😘',
  ':star:': '⭐'
};

// Create a single regex pattern for all emoji shortcuts
const emojiPattern = new RegExp(
  Object.keys(emojiMap)
    .map(key => key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|'),
  'g'
);

/**
 * Convert emoji shortcuts like :smile: to emoji
 */
function convertEmojiShortcuts(text) {
  return text.replace(emojiPattern, match => emojiMap[match] || match);
}

/**
 * Validate file type for uploads (images and videos)
 */
export function isValidImageType(file) {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.includes(file.type);
}

/**
 * Validate video file type for uploads
 */
export function isValidVideoType(file) {
  const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
  return validTypes.includes(file.type);
}

/**
 * Validate if file is image or video
 */
export function isValidMediaType(file) {
  return isValidImageType(file) || isValidVideoType(file);
}

/**
 * Check if file is a video
 */
export function isVideoFile(file) {
  return file?.type?.startsWith('video/') || false;
}

/**
 * Validate file size (max 5MB for images, 50MB for videos)
 */
export function isValidFileSize(file, maxSizeMB = null) {
  // Default: 50MB for videos, 5MB for images
  const defaultMax = isVideoFile(file) ? 50 : 5;
  const maxSize = maxSizeMB || defaultMax;
  return file.size <= maxSize * 1024 * 1024;
}
