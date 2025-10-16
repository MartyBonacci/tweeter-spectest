/**
 * Cloudinary Upload Utility
 *
 * Pure function for uploading image buffers to Cloudinary with transformations.
 * Handles avatar image uploads with automatic optimization and cropping.
 */

import { cloudinary } from '../config/cloudinary';
import { cloudinaryResponseSchema, type CloudinaryResponse } from '../schemas/avatarUpload';

/**
 * Upload avatar image to Cloudinary
 *
 * Uploads image buffer to Cloudinary with avatar-specific transformations:
 * - Resized to 200x200 pixels
 * - Cropped to fill with face detection
 * - Automatic format optimization
 * - Stored in 'avatars/' folder
 *
 * @param fileBuffer - Image file buffer
 * @param filename - Unique filename for the upload
 * @returns Promise with Cloudinary upload result
 * @throws Error if upload fails or response validation fails
 */
export const uploadAvatar = async (
  fileBuffer: Buffer,
  filename: string
): Promise<CloudinaryResponse> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'avatars',
        public_id: filename,
        transformation: [
          {
            width: 200,
            height: 200,
            crop: 'fill',
            gravity: 'face', // Focus on faces when cropping
          },
        ],
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          console.error('🔴 Cloudinary Upload Error Details:', {
            message: error.message,
            name: error.name,
            stack: error.stack,
            http_code: (error as any).http_code,
            error: error,
          });
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
          return;
        }

        if (!result) {
          console.error('🔴 Cloudinary Upload Error: No result returned');
          reject(new Error('Cloudinary upload failed: No result returned'));
          return;
        }

        try {
          // Validate response with Zod schema
          const validated = cloudinaryResponseSchema.parse(result);
          console.log('✅ Cloudinary Upload Success:', { public_id: validated.public_id, secure_url: validated.secure_url });
          resolve(validated);
        } catch (validationError) {
          console.error('🔴 Cloudinary Response Validation Error:', validationError);
          reject(new Error(`Cloudinary response validation failed: ${validationError}`));
        }
      }
    );

    // Write buffer to upload stream
    uploadStream.end(fileBuffer);
  });
};
