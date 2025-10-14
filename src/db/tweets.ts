/**
 * Tweet Database Functions
 * Feature: 002-tweet-posting-and-feed-system
 *
 * Pure functions for tweet CRUD operations
 */

import type { Sql } from 'postgres';
import type { Tweet, TweetWithAuthor, TweetWithAuthorAndLikes, TweetRow, TweetWithAuthorRow, TweetWithAuthorAndLikesRow } from '../types/tweet.js';
import { mapTweetRowToTweet, mapTweetWithAuthorRow, mapTweetWithAuthorAndLikesRow } from '../types/tweet.js';

/**
 * Create a new tweet in the database
 *
 * @param db - PostgreSQL connection
 * @param data - Tweet data (id, profileId, content)
 * @returns Created tweet
 * @throws Error if database insertion fails or FK constraint violated
 */
export async function createTweet(
  db: Sql,
  data: { id: string; profileId: string; content: string }
): Promise<Tweet> {
  const rows = await db<TweetRow[]>`
    INSERT INTO tweets (id, profile_id, content)
    VALUES (${data.id}, ${data.profileId}, ${data.content})
    RETURNING id, profile_id, content, created_at
  `;

  if (rows.length === 0) {
    throw new Error('Failed to create tweet');
  }

  return mapTweetRowToTweet(rows[0]);
}

/**
 * Get all tweets with author information, ordered by newest first
 *
 * @param db - PostgreSQL connection
 * @returns Array of tweets with author info (empty if no tweets)
 */
export async function getAllTweets(db: Sql): Promise<TweetWithAuthor[]> {
  const rows = await db<TweetWithAuthorRow[]>`
    SELECT
      t.id,
      t.content,
      t.created_at,
      t.profile_id,
      p.username
    FROM tweets t
    INNER JOIN profiles p ON t.profile_id = p.id
    ORDER BY t.created_at DESC
  `;

  return rows.map(mapTweetWithAuthorRow);
}

/**
 * Get a single tweet by ID with author information
 *
 * @param db - PostgreSQL connection
 * @param id - Tweet UUID
 * @returns Tweet with author info, or null if not found
 */
export async function getTweetById(db: Sql, id: string): Promise<TweetWithAuthor | null> {
  const rows = await db<TweetWithAuthorRow[]>`
    SELECT
      t.id,
      t.content,
      t.created_at,
      t.profile_id,
      p.username
    FROM tweets t
    INNER JOIN profiles p ON t.profile_id = p.id
    WHERE t.id = ${id}
  `;

  if (rows.length === 0) {
    return null;
  }

  return mapTweetWithAuthorRow(rows[0]);
}

/**
 * Get all tweets with author and like information, ordered by newest first
 * Feature: 003-like-functionality
 *
 * @param db - PostgreSQL connection
 * @param currentUserId - UUID of current authenticated user (null if unauthenticated)
 * @returns Array of tweets with author and like info (empty if no tweets)
 */
export async function getAllTweetsWithLikes(
  db: Sql,
  currentUserId: string | null
): Promise<TweetWithAuthorAndLikes[]> {
  const rows = await db<TweetWithAuthorAndLikesRow[]>`
    SELECT
      t.id,
      t.content,
      t.created_at,
      t.profile_id,
      p.username,
      COUNT(l.id) as like_count,
      ${currentUserId ? db`EXISTS(
        SELECT 1 FROM likes
        WHERE tweet_id = t.id AND profile_id = ${currentUserId}
      )` : db`false`} as is_liked_by_user
    FROM tweets t
    INNER JOIN profiles p ON t.profile_id = p.id
    LEFT JOIN likes l ON t.id = l.tweet_id
    GROUP BY t.id, p.username
    ORDER BY t.created_at DESC
  `;

  return rows.map(mapTweetWithAuthorAndLikesRow);
}

/**
 * Get a single tweet by ID with author and like information
 * Feature: 003-like-functionality
 *
 * @param db - PostgreSQL connection
 * @param id - Tweet UUID
 * @param currentUserId - UUID of current authenticated user (null if unauthenticated)
 * @returns Tweet with author and like info, or null if not found
 */
export async function getTweetByIdWithLikes(
  db: Sql,
  id: string,
  currentUserId: string | null
): Promise<TweetWithAuthorAndLikes | null> {
  const rows = await db<TweetWithAuthorAndLikesRow[]>`
    SELECT
      t.id,
      t.content,
      t.created_at,
      t.profile_id,
      p.username,
      COUNT(l.id) as like_count,
      ${currentUserId ? db`EXISTS(
        SELECT 1 FROM likes
        WHERE tweet_id = t.id AND profile_id = ${currentUserId}
      )` : db`false`} as is_liked_by_user
    FROM tweets t
    INNER JOIN profiles p ON t.profile_id = p.id
    LEFT JOIN likes l ON t.id = l.tweet_id
    WHERE t.id = ${id}
    GROUP BY t.id, p.username
  `;

  if (rows.length === 0) {
    return null;
  }

  return mapTweetWithAuthorAndLikesRow(rows[0]);
}

/**
 * Get all tweets from a specific user with like information
 * Feature: 004-user-profile-system
 *
 * @param db - PostgreSQL connection
 * @param username - Username to filter by
 * @param currentUserId - UUID of current authenticated user (null if unauthenticated)
 * @returns Array of user's tweets with author and like info (empty if no tweets)
 */
export async function getUserTweetsWithLikes(
  db: Sql,
  username: string,
  currentUserId: string | null
): Promise<TweetWithAuthorAndLikes[]> {
  const rows = await db<TweetWithAuthorAndLikesRow[]>`
    SELECT
      t.id,
      t.content,
      t.created_at,
      t.profile_id,
      p.username,
      COUNT(l.id) as like_count,
      ${currentUserId ? db`EXISTS(
        SELECT 1 FROM likes
        WHERE tweet_id = t.id AND profile_id = ${currentUserId}
      )` : db`false`} as is_liked_by_user
    FROM tweets t
    INNER JOIN profiles p ON t.profile_id = p.id
    LEFT JOIN likes l ON t.id = l.tweet_id
    WHERE LOWER(p.username) = LOWER(${username})
    GROUP BY t.id, p.username
    ORDER BY t.created_at DESC
  `;

  return rows.map(mapTweetWithAuthorAndLikesRow);
}
