/**
 * Avatar Upload Validation Schemas
 *
 * Zod schemas for validating file upload requests and Cloudinary responses.
 * Provides runtime type safety and validation at API boundaries.
 */

import { z } from 'zod';

/**
 * Server-side file validation schema
 *
 * Validates multer file objects for avatar uploads
 */
export const serverFileSchema = z.object({
  fieldname: z.literal('avatar'),
  originalname: z.string(),
  encoding: z.string(),
  mimetype: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp'], {
    errorMap: () => ({ message: 'File must be JPEG, PNG, GIF, or WebP' }),
  }),
  size: z.number().max(5 * 1024 * 1024, 'File size must be under 5MB'),
  buffer: z.instanceof(Buffer),
});

/**
 * Cloudinary upload response schema
 *
 * Validates the response from Cloudinary upload API
 */
export const cloudinaryResponseSchema = z.object({
  public_id: z.string(),
  secure_url: z.string().url(),
  width: z.number(),
  height: z.number(),
  format: z.string(),
  resource_type: z.literal('image'),
  created_at: z.string(),
});

/**
 * Avatar upload API response schema
 *
 * Validates the complete API response sent to the client
 */
export const avatarUploadResponseSchema = z.object({
  profile: z.object({
    id: z.string().uuid(),
    username: z.string(),
    bio: z.string().nullable(),
    avatarUrl: z.string().url(),
  }),
});

// Type inference from schemas
export type ServerFile = z.infer<typeof serverFileSchema>;
export type CloudinaryResponse = z.infer<typeof cloudinaryResponseSchema>;
export type AvatarUploadResponse = z.infer<typeof avatarUploadResponseSchema>;
