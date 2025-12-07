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

/**
 * Convert emoji shortcuts like :smile: to emoji
 */
function convertEmojiShortcuts(text) {
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

  let result = text;
  for (const [shortcut, emoji] of Object.entries(emojiMap)) {
    result = result.replace(new RegExp(shortcut.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), emoji);
  }
  return result;
}

/**
 * Validate file type for uploads
 */
export function isValidImageType(file) {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.includes(file.type);
}

/**
 * Validate file size (max 5MB)
 */
export function isValidFileSize(file, maxSizeMB = 5) {
  return file.size <= maxSizeMB * 1024 * 1024;
}
