/**
 * Tweet Validation Schemas
 * Feature: 002-tweet-posting-and-feed-system
 *
 * Zod schemas for runtime validation at API boundaries
 */

import { z } from 'zod';

/**
 * Helper function to check if string is whitespace-only
 */
export function isWhitespaceOnly(str: string): boolean {
  return str.trim().length === 0;
}

/**
 * Schema for creating a tweet
 * - Content must be 1-140 characters
 * - Content must not be whitespace-only
 */
export const createTweetSchema = z.object({
  content: z
    .string()
    .min(1, 'Tweet cannot be empty')
    .max(140, 'Tweet cannot exceed 140 characters')
    .trim()
    .refine((val) => !isWhitespaceOnly(val), {
      message: 'Tweet cannot be whitespace only',
    }),
});

/**
 * Schema for tweet response (single tweet)
 */
export const tweetResponseSchema = z.object({
  id: z.string().uuid(),
  profileId: z.string().uuid(),
  content: z.string(),
  createdAt: z.date(),
});

/**
 * Schema for tweet with author (used in feed)
 */
export const tweetWithAuthorSchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
  createdAt: z.date(),
  author: z.object({
    id: z.string().uuid(),
    username: z.string(),
  }),
});

/**
 * Schema for multiple tweets response (feed)
 */
export const tweetsResponseSchema = z.array(tweetWithAuthorSchema);

/**
 * Schema for deleting a tweet (path parameter validation)
 * Feature: 910-allow-the-logged-in-user-to-delete-their-own-tweets
 */
export const deleteTweetParamsSchema = z.object({
  id: z.string().uuid('Invalid tweet ID format'),
});

/**
 * Schema for delete tweet error responses
 * Feature: 910-allow-the-logged-in-user-to-delete-their-own-tweets
 */
export const deleteTweetErrorSchema = z.object({
  error: z.string().min(1),
  details: z.string().optional(),
});

/**
 * Inferred TypeScript types from Zod schemas
 */
export type CreateTweetInput = z.infer<typeof createTweetSchema>;
export type TweetResponse = z.infer<typeof tweetResponseSchema>;
export type TweetWithAuthorResponse = z.infer<typeof tweetWithAuthorSchema>;
export type TweetsResponse = z.infer<typeof tweetsResponseSchema>;
export type DeleteTweetParams = z.infer<typeof deleteTweetParamsSchema>;
export type DeleteTweetError = z.infer<typeof deleteTweetErrorSchema>;
