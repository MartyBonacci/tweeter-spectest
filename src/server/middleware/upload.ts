/**
 * File Upload Middleware
 *
 * Configures multer for handling multipart/form-data file uploads.
 * Uses memory storage (no disk writes) for avatar images.
 */

import multer from 'multer';

// Configure multer with memory storage and file validation
const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory (no disk writes)
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Only accept image files
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true); // Accept file
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
    }
  },
});

// Export middleware for single file upload with field name 'avatar'
export const avatarUpload = upload.single('avatar');
