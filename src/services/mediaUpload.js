/**
 * Media Upload Service
 * Handles secure file uploads to Firebase Storage
 */

import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-storage.js";

/**
 * Valid media types for upload
 */
const VALID_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const VALID_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
const VALID_MEDIA_TYPES = [...VALID_IMAGE_TYPES, ...VALID_VIDEO_TYPES];

/**
 * Maximum file sizes (in bytes)
 */
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Validate media file type
 */
export function isValidMediaType(file) {
  return VALID_MEDIA_TYPES.includes(file.type);
}

/**
 * Validate media file size
 */
export function isValidMediaSize(file) {
  if (VALID_IMAGE_TYPES.includes(file.type)) {
    return file.size <= MAX_IMAGE_SIZE;
  } else if (VALID_VIDEO_TYPES.includes(file.type)) {
    return file.size <= MAX_VIDEO_SIZE;
  }
  return false;
}

/**
 * Get media type (image or video)
 */
export function getMediaType(file) {
  if (VALID_IMAGE_TYPES.includes(file.type)) {
    return 'image';
  } else if (VALID_VIDEO_TYPES.includes(file.type)) {
    return 'video';
  }
  return 'unknown';
}

/**
 * Generate unique filename to prevent collisions and security issues
 */
function generateUniqueFilename(file, userId) {
  // Sanitize original filename - remove path traversal characters
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  // Get file extension
  const extension = sanitizedName.split('.').pop();
  
  // Generate unique name with timestamp and random string
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  
  return `${userId}_${timestamp}_${randomString}.${extension}`;
}

/**
 * Upload media file to Firebase Storage
 * @param {File} file - File to upload
 * @param {string} userId - Current user ID
 * @param {Function} onProgress - Progress callback (percentage)
 * @param {Function} onComplete - Completion callback (downloadURL)
 * @param {Function} onError - Error callback
 */
export async function uploadMedia(file, userId, onProgress, onComplete, onError) {
  try {
    // Validate file type
    if (!isValidMediaType(file)) {
      const error = new Error('Invalid file type. Only images (JPG, PNG, WebP, GIF) and videos (MP4, WebM) are allowed.');
      if (onError) onError(error);
      return;
    }

    // Validate file size
    if (!isValidMediaSize(file)) {
      const mediaType = getMediaType(file);
      const maxSize = mediaType === 'image' ? '5MB' : '50MB';
      const error = new Error(`File size exceeds maximum allowed size of ${maxSize}`);
      if (onError) onError(error);
      return;
    }

    // Get storage reference
    const storage = getStorage();
    const mediaType = getMediaType(file);
    
    // Generate unique filename
    const uniqueFilename = generateUniqueFilename(file, userId);
    
    // Create storage reference with path: media/{type}/{userId}/{filename}
    const storageRef = ref(storage, `media/${mediaType}/${userId}/${uniqueFilename}`);

    // Upload file with progress tracking
    const uploadTask = uploadBytesResumable(storageRef, file);

    // Monitor upload progress
    uploadTask.on('state_changed',
      (snapshot) => {
        // Calculate upload progress percentage
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
          onProgress(progress);
        }
      },
      (error) => {
        // Handle upload errors
        console.error('Upload error:', error);
        if (onError) {
          onError(error);
        }
      },
      async () => {
        // Upload completed successfully, get download URL
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          if (onComplete) {
            onComplete({
              url: downloadURL,
              type: mediaType,
              filename: uniqueFilename,
              originalName: file.name,
              size: file.size,
              mimeType: file.type
            });
          }
        } catch (error) {
          console.error('Error getting download URL:', error);
          if (onError) {
            onError(error);
          }
        }
      }
    );

    return uploadTask;
  } catch (error) {
    console.error('Upload initialization error:', error);
    if (onError) {
      onError(error);
    }
  }
}

/**
 * Cancel an ongoing upload
 */
export function cancelUpload(uploadTask) {
  if (uploadTask) {
    uploadTask.cancel();
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
