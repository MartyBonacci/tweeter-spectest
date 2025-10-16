/**
 * Cloudinary Configuration
 *
 * Configures Cloudinary SDK with credentials from environment variables.
 * Used for server-side avatar image uploads.
 */

import { v2 as cloudinary } from 'cloudinary';

// Debug: Log environment variable availability
console.log('🔧 Cloudinary Config Check:', {
  hasCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
  hasApiKey: !!process.env.CLOUDINARY_API_KEY,
  hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
});

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };
