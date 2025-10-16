/**
 * Profile Update Utility
 *
 * Pure function for updating profile avatar_url in database.
 * Uses parameterized queries for security.
 */

import type { Sql } from '../../db/connection.js';

export interface Profile {
  id: string;
  username: string;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: Date;
}

/**
 * Update profile avatar URL
 *
 * Updates the avatar_url field for a given profile.
 * Uses parameterized query to prevent SQL injection.
 * The postgres package automatically handles snake_case ↔ camelCase conversion.
 *
 * @param db - Database connection
 * @param profileId - UUID of the profile to update
 * @param avatarUrl - New avatar URL from Cloudinary
 * @returns Promise with updated profile
 * @throws Error if profile not found or database error occurs
 */
export const updateProfileAvatar = async (
  db: Sql,
  profileId: string,
  avatarUrl: string
): Promise<Profile> => {
  const [profile] = await db<Profile[]>`
    UPDATE profiles
    SET avatar_url = ${avatarUrl}
    WHERE id = ${profileId}
    RETURNING *
  `;

  if (!profile) {
    throw new Error('Profile not found');
  }

  return profile; // postgres package handles camelCase conversion
};
