/**
 * Like Database Functions
 * Feature: 003-like-functionality
 *
 * Pure functions for like CRUD operations
 */

import type { Sql } from 'postgres';
import type { Like, LikeRow } from '../../app/types/like.js';
import { mapLikeRowToLike } from '../../app/types/like.js';

/**
 * Create a new like in the database
 *
 * @param db - PostgreSQL connection
 * @param tweetId - UUID of the tweet being liked
 * @param profileId - UUID of the user liking the tweet
 * @returns Created like object
 * @throws Error with UNIQUE constraint violation if user already liked the tweet (code 23505)
 * @throws Error if tweet or profile doesn't exist (FK constraint violation)
 */
export async function createLike(
  db: Sql,
  tweetId: string,
  profileId: string
): Promise<Like> {
  try {
    const rows = await db<LikeRow[]>`
      INSERT INTO likes (id, tweet_id, profile_id)
      VALUES (uuid_generate_v7(), ${tweetId}, ${profileId})
      RETURNING id, tweet_id, profile_id, created_at
    `;

    if (rows.length === 0) {
      throw new Error('Failed to create like');
    }

    return mapLikeRowToLike(rows[0]);
  } catch (error: any) {
    // PostgreSQL error code 23505: unique_violation
    if (error.code === '23505') {
      throw new Error('DUPLICATE_LIKE');
    }
    // PostgreSQL error code 23503: foreign_key_violation
    if (error.code === '23503') {
      throw new Error('TWEET_NOT_FOUND');
    }
    throw error;
  }
}

/**
 * Delete a like from the database by composite key (tweetId + profileId)
 *
 * @param db - PostgreSQL connection
 * @param tweetId - UUID of the tweet
 * @param profileId - UUID of the user
 * @returns true if like was deleted, false if not found
 */
export async function deleteLike(
  db: Sql,
  tweetId: string,
  profileId: string
): Promise<boolean> {
  const rows = await db<LikeRow[]>`
    DELETE FROM likes
    WHERE tweet_id = ${tweetId} AND profile_id = ${profileId}
    RETURNING id
  `;

  return rows.length > 0;
}

/**
 * Count total likes for a tweet
 *
 * @param db - PostgreSQL connection
 * @param tweetId - UUID of the tweet
 * @returns Number of likes (0 if tweet doesn't exist or has no likes)
 */
export async function countLikes(db: Sql, tweetId: string): Promise<number> {
  const rows = await db<{ count: string }[]>`
    SELECT COUNT(*) as count
    FROM likes
    WHERE tweet_id = ${tweetId}
  `;

  // COUNT(*) returns string, convert to number
  return parseInt(rows[0].count, 10);
}

/**
 * Check if a user has liked a specific tweet
 *
 * @param db - PostgreSQL connection
 * @param tweetId - UUID of the tweet
 * @param profileId - UUID of the user
 * @returns true if user has liked the tweet, false otherwise
 */
export async function hasUserLikedTweet(
  db: Sql,
  tweetId: string,
  profileId: string
): Promise<boolean> {
  const rows = await db<{ exists: boolean }[]>`
    SELECT EXISTS(
      SELECT 1 FROM likes
      WHERE tweet_id = ${tweetId} AND profile_id = ${profileId}
    ) as exists
  `;

  return rows[0].exists;
}
