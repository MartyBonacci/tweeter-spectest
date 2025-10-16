/**
 * File Validation Utilities
 *
 * Pure functions for validating file uploads (type, size, magic numbers).
 * Provides defense-in-depth validation for avatar image uploads.
 */

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate file MIME type
 *
 * @param mimetype - The MIME type to validate
 * @returns True if MIME type is allowed
 */
export const validateFileType = (mimetype: string): boolean => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return allowedTypes.includes(mimetype);
};

/**
 * Validate file magic numbers (first bytes of file)
 *
 * Checks the actual file type by inspecting the file's binary signature,
 * preventing MIME type spoofing attacks.
 *
 * @param buffer - The file buffer to check
 * @returns True if magic number matches an allowed image type
 */
export const validateMagicNumber = (buffer: Buffer): boolean => {
  if (!buffer || buffer.length < 4) {
    return false;
  }

  // Check JPEG magic number: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return true;
  }

  // Check PNG magic number: 89 50 4E 47
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4E &&
    buffer[3] === 0x47
  ) {
    return true;
  }

  // Check GIF magic number: 47 49 46 38 (GIF8)
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return true;
  }

  // Check WebP magic number: 52 49 46 46 (RIFF) + WebP signature at offset 8
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return true;
  }

  return false;
};

/**
 * Validate file size
 *
 * @param size - File size in bytes
 * @returns True if size is within allowed limit (5MB)
 */
export const validateFileSize = (size: number): boolean => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  return size > 0 && size <= maxSize;
};

/**
 * Comprehensive file validation
 *
 * Validates file type, size, and magic numbers in one call.
 *
 * @param file - File object with mimetype, size, and buffer
 * @returns Validation result with error message if invalid
 */
export const validateFile = (file: {
  mimetype: string;
  size: number;
  buffer: Buffer;
}): FileValidationResult => {
  // Validate MIME type
  if (!validateFileType(file.mimetype)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.',
    };
  }

  // Validate file size
  if (!validateFileSize(file.size)) {
    return {
      valid: false,
      error: 'File size must be under 5MB.',
    };
  }

  // Validate magic number (defense against MIME type spoofing)
  if (!validateMagicNumber(file.buffer)) {
    return {
      valid: false,
      error: 'File appears to be corrupted or is not a valid image.',
    };
  }

  return { valid: true };
};
