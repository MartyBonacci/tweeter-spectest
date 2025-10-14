/**
 * Profile Validation Schemas
 * Feature: 004-user-profile-system
 *
 * Zod schemas for validating profile update requests
 */

import { z } from 'zod';

/**
 * Bio validation schema
 * - Optional/nullable
 * - Maximum 160 characters
 */
export const bioSchema = z
  .string()
  .max(160, 'Bio must be 160 characters or less')
  .nullable()
  .optional();

/**
 * Bio update request schema
 */
export const bioUpdateSchema = z.object({
  bio: z.string().max(160, 'Bio must be 160 characters or less'),
});

/**
 * Profile update request schema
 * Used for PUT /api/profiles/:username
 */
export const updateProfileRequestSchema = z.object({
  bio: z.string().max(160, 'Bio must be 160 characters or less').optional(),
});

/**
 * Avatar URL validation schema
 */
export const avatarUrlSchema = z.string().url('Invalid avatar URL format');

/**
 * Avatar file validation (for client-side)
 * Note: Server-side validation happens in endpoint handler
 */
export const avatarFileSchema = z.object({
  type: z.enum(['image/jpeg', 'image/png', 'image/gif'], {
    errorMap: () => ({ message: 'File must be JPEG, PNG, or GIF' }),
  }),
  size: z
    .number()
    .max(5 * 1024 * 1024, 'File size must not exceed 5 MB'),
});
