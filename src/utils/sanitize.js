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
 * Validate file type for uploads (images only - for backward compatibility)
 */
export function isValidImageType(file) {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.includes(file.type);
}

/**
 * Validate video file type
 */
export function isValidVideoType(file) {
  const validTypes = ['video/mp4', 'video/webm', 'video/ogg'];
  return validTypes.includes(file.type);
}

/**
 * Validate media file type (images and videos)
 * Note: For media upload, use the mediaUpload service's validation instead
 */
export function isValidMediaType(file) {
  return isValidImageType(file) || isValidVideoType(file);
}

/**
 * Validate file size (max 5MB for images, 50MB for videos)
 */
export function isValidFileSize(file, maxSizeMB = 5) {
  return file.size <= maxSizeMB * 1024 * 1024;
}

/**
 * Get media type from file
 */
export function getMediaType(file) {
  if (isValidImageType(file)) return 'image';
  if (isValidVideoType(file)) return 'video';
  return 'unknown';
}
