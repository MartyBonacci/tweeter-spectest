/**
 * Tweet API Client Functions
 * Feature: 909-user-profile-tweets-feed
 *
 * Client-side functions for fetching tweet data from the API
 */

import { z } from 'zod';
import type { TweetWithAuthorAndLikes } from '../../src/types/tweet';
import { getApiUrl } from '../utils/api';

/**
 * Zod schema for validating TweetWithAuthorAndLikes response
 */
const tweetWithAuthorAndLikesSchema = z.object({
  id: z.string().uuid(),
  content: z.string().min(1).max(140),
  createdAt: z.coerce.date(), // Coerce string to Date
  author: z.object({
    id: z.string().uuid(),
    username: z.string().min(1),
  }),
  likeCount: z.number().int().min(0),
  isLikedByUser: z.boolean(),
});

/**
 * Schema for validating array of tweets from API response
 */
const getUserTweetsResponseSchema = z.object({
  tweets: z.array(tweetWithAuthorAndLikesSchema),
});

/**
 * Fetch all tweets authored by a specific user
 *
 * @param username - Username of the profile user
 * @returns Promise resolving to array of tweets with author and like data
 * @throws Error if fetch fails or validation fails
 *
 * @example
 * ```typescript
 * const tweets = await fetchTweetsByUsername('johndoe');
 * console.log(tweets); // Array of TweetWithAuthorAndLikes
 * ```
 */
export async function fetchTweetsByUsername(
  username: string
): Promise<TweetWithAuthorAndLikes[]> {
  const response = await fetch(getApiUrl(`/api/tweets/user/${username}`), {
    credentials: 'include', // Include authentication cookie
  });

  if (!response.ok) {
    if (response.status === 404) {
      // User not found or has no tweets - return empty array
      return [];
    }
    throw new Error(`Failed to fetch tweets: ${response.statusText}`);
  }

  const data = await response.json();

  // Validate response structure with Zod
  const validated = getUserTweetsResponseSchema.parse(data);

  return validated.tweets;
}
