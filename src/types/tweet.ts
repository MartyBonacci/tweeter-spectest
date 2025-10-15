/**
 * Tweet Type Definitions
 * Feature: 002-tweet-posting-and-feed-system
 */

/**
 * Basic tweet structure
 */
export interface Tweet {
  id: string;
  profileId: string;
  content: string;
  createdAt: Date;
}

/**
 * Tweet with author information (for feed display)
 */
export interface TweetWithAuthor {
  id: string;
  content: string;
  createdAt: Date;
  author: {
    id: string;
    username: string;
  };
}

/**
 * Tweet with author and like information (for feed display with likes)
 * Feature: 003-like-functionality
 */
export interface TweetWithAuthorAndLikes extends TweetWithAuthor {
  likeCount: number;
  isLikedByUser: boolean;
}

/**
 * Database row type (snake_case from PostgreSQL)
 */
export interface TweetRow {
  id: string;
  profile_id: string;
  content: string;
  created_at: Date;
}

/**
 * Database row type for tweet with author (from JOIN query)
 */
export interface TweetWithAuthorRow {
  id: string;
  content: string;
  created_at: Date;
  profile_id: string;
  username: string;
}

/**
 * Database row type for tweet with author and likes (from JOIN query with aggregation)
 * Feature: 003-like-functionality
 * Note: postgres library converts snake_case to camelCase
 */
export interface TweetWithAuthorAndLikesRow {
  id: string;
  content: string;
  createdAt: Date;
  profileId: string;
  username: string;
  likeCount: string; // COUNT returns string
  isLikedByUser: boolean;
}

/**
 * Map database row (snake_case) to Tweet object (camelCase)
 */
export function mapTweetRowToTweet(row: TweetRow): Tweet {
  return {
    id: row.id,
    profileId: row.profile_id,
    content: row.content,
    createdAt: new Date(row.created_at),
  };
}

/**
 * Map database JOIN row to TweetWithAuthor object
 */
export function mapTweetWithAuthorRow(row: TweetWithAuthorRow): TweetWithAuthor {
  return {
    id: row.id,
    content: row.content,
    createdAt: new Date(row.created_at),
    author: {
      id: row.profile_id,
      username: row.username,
    },
  };
}

/**
 * Map database JOIN row with likes to TweetWithAuthorAndLikes object
 * Feature: 003-like-functionality
 */
export function mapTweetWithAuthorAndLikesRow(row: TweetWithAuthorAndLikesRow): TweetWithAuthorAndLikes {
  return {
    id: row.id,
    content: row.content,
    createdAt: new Date(row.createdAt),
    author: {
      id: row.profileId,
      username: row.username,
    },
    likeCount: parseInt(row.likeCount, 10),
    isLikedByUser: row.isLikedByUser,
  };
}
