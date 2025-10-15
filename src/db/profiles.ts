/**
 * Profile Database Functions
 * Feature: 004-user-profile-system
 *
 * Pure functions for profile operations
 */

import type { Sql } from './connection.js';
import type { User } from '../types/user.js';
import type { PublicProfile } from '../types/profile.js';
import { toPublicProfile } from '../types/profile.js';

/**
 * Get profile by username (public data only)
 *
 * @param db - PostgreSQL connection
 * @param username - Username to search for (case-insensitive)
 * @returns Public profile data, or null if not found
 */
export async function getProfileByUsername(
  db: Sql,
  username: string
): Promise<PublicProfile | null> {
  const [user] = await db<User[]>`
    SELECT * FROM profiles
    WHERE LOWER(username) = LOWER(${username})
  `;

  if (!user) {
    return null;
  }

  return toPublicProfile(user);
}

/**
 * Update profile bio
 *
 * @param db - PostgreSQL connection
 * @param userId - UUID of user updating their profile
 * @param bio - New bio text (0-160 chars, validated by caller)
 * @returns Updated public profile
 * @throws Error if user not found or database error
 */
export async function updateProfileBio(
  db: Sql,
  userId: string,
  bio: string
): Promise<PublicProfile> {
  const [user] = await db<User[]>`
    UPDATE profiles
    SET bio = ${bio}
    WHERE id = ${userId}
    RETURNING *
  `;

  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  return toPublicProfile(user);
}

/**
 * Update profile avatar URL
 *
 * @param db - PostgreSQL connection
 * @param userId - UUID of user updating their avatar
 * @param avatarUrl - New avatar URL (from Cloudinary or external service)
 * @returns Updated public profile
 * @throws Error if user not found or database error
 */
export async function updateProfileAvatar(
  db: Sql,
  userId: string,
  avatarUrl: string
): Promise<PublicProfile> {
  const [user] = await db<User[]>`
    UPDATE profiles
    SET avatar_url = ${avatarUrl}
    WHERE id = ${userId}
    RETURNING *
  `;

  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  return toPublicProfile(user);
}

/**
 * Get profile with tweet count
 *
 * @param db - PostgreSQL connection
 * @param username - Username to search for
 * @returns Public profile with tweet count, or null if not found
 */
export async function getProfileWithStats(
  db: Sql,
  username: string
): Promise<(PublicProfile & { tweetCount: number }) | null> {
  const [result] = await db<
    Array<User & { tweet_count: string }>
  >`
    SELECT
      p.*,
      COUNT(t.id) as tweet_count
    FROM profiles p
    LEFT JOIN tweets t ON p.id = t.profile_id
    WHERE LOWER(p.username) = LOWER(${username})
    GROUP BY p.id
  `;

  if (!result) {
    return null;
  }

  const profile = toPublicProfile(result);
  return {
    ...profile,
    tweetCount: parseInt(result.tweet_count, 10),
  };
}
