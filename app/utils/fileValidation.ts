/**
 * Client-Side File Validation
 *
 * Pure functions for validating file uploads before submission.
 * Provides immediate user feedback for invalid files.
 */

import { z } from 'zod';

/**
 * Client-side file validation schema
 *
 * Validates File objects before upload to provide immediate user feedback
 */
export const clientFileSchema = z.custom<File>((file) => {
  if (!(file instanceof File)) return false;

  // Size check (5MB max)
  if (file.size > 5 * 1024 * 1024) return false;

  // MIME type check
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.includes(file.type);
}, {
  message: 'File must be an image under 5MB (JPEG, PNG, GIF, or WebP)',
});

/**
 * Validate image file
 *
 * Pure function that validates a File object for avatar uploads.
 *
 * @param file - File object to validate
 * @returns Validation result with error message if invalid
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const result = clientFileSchema.safeParse(file);

  if (!result.success) {
    return {
      valid: false,
      error: result.error.errors[0]?.message || 'Invalid file',
    };
  }

  return { valid: true };
};
