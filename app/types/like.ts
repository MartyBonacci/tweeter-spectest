import { z } from 'zod';

// ===== Database Row Types (snake_case) =====

/**
 * Database query result type
 * Mirrors database schema (snake_case)
 */
export interface LikeRow {
  id: string;
  tweet_id: string;
  profile_id: string;
  created_at: Date;
}

// ===== Application Types (camelCase) =====

/**
 * Like record (internal use)
 */
export interface Like {
  id: string;              // UUID v7
  tweetId: string;         // UUID v7 of tweet
  profileId: string;       // UUID v7 of user who liked
  createdAt: Date;         // When like was created
}

/**
 * Tweet with like metadata (for UI display)
 * Extends basic Tweet type with like information
 */
export interface TweetWithLikes {
  id: string;
  content: string;
  profileId: string;       // Tweet author
  createdAt: Date;
  // Like metadata:
  likeCount: number;       // Total likes from all users
  isLikedByUser: boolean;  // Current user's like status
}

// ===== Zod Schemas =====

/**
 * Validation schema for creating a like
 */
export const CreateLikeRequestSchema = z.object({
  tweetId: z.string().uuid('Invalid tweet ID format'),
});

export type CreateLikeRequest = z.infer<typeof CreateLikeRequestSchema>;

/**
 * Response type for like creation
 */
export interface CreateLikeResponse {
  like: Like;
}

/**
 * Validation schema for deleting a like
 */
export const DeleteLikeRequestSchema = z.object({
  tweetId: z.string().uuid('Invalid tweet ID format'),
});

export type DeleteLikeRequest = z.infer<typeof DeleteLikeRequestSchema>;

/**
 * Response type for like deletion
 */
export interface DeleteLikeResponse {
  success: boolean;
}

// ===== Case Mapping Helpers =====

/**
 * Convert database row (snake_case) to application type (camelCase)
 */
export function mapLikeRowToLike(row: LikeRow): Like {
  return {
    id: row.id,
    tweetId: row.tweet_id,
    profileId: row.profile_id,
    createdAt: row.created_at,
  };
}
