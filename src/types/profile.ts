/**
 * Profile Type Definitions
 * Feature: 004-user-profile-system
 *
 * Public profile types for API responses and frontend display
 */

/**
 * Public profile data (safe for API responses)
 * Includes bio and avatar, excludes email and passwordHash
 */
export interface PublicProfile {
  id: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: Date;
}

/**
 * Profile with additional statistics
 * Used for profile page display
 */
export interface ProfileWithStats extends PublicProfile {
  tweetCount: number;
}

/**
 * Profile update request data
 */
export interface ProfileUpdateRequest {
  bio?: string;
}

/**
 * Avatar upload response
 */
export interface AvatarUploadResponse {
  avatarUrl: string;
}

/**
 * Convert User to PublicProfile (remove sensitive fields)
 * Pure function with no side effects
 *
 * @param user - Complete user record (from User type)
 * @returns Public profile data (excludes email, passwordHash)
 */
export function toPublicProfile(user: {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: Date;
}): PublicProfile {
  return {
    id: user.id,
    username: user.username,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
}
