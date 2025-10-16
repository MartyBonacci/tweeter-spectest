/**
 * Image Preview Utilities
 *
 * Pure functions for generating and managing blob URLs for image previews.
 */

/**
 * Create image preview URL
 *
 * Generates a blob URL for previewing an image file before upload.
 * Remember to call revokeImagePreview() when done to free memory.
 *
 * @param file - Image file to preview
 * @returns Blob URL string
 */
export const createImagePreview = (file: File): string => {
  return URL.createObjectURL(file);
};

/**
 * Revoke image preview URL
 *
 * Releases the blob URL to free memory.
 * Should be called when preview is no longer needed (e.g., component unmount).
 *
 * @param url - Blob URL to revoke
 */
export const revokeImagePreview = (url: string): void => {
  URL.revokeObjectURL(url);
};
