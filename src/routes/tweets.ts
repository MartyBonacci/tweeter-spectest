/**
 * Tweet API Routes
 * Feature: 002-tweet-posting-and-feed-system
 *
 * Express routes for tweet operations
 */

import { Router, type Request, type Response } from 'express';
import { v7 as uuidv7 } from 'uuid';
import { createDbConnection } from '../db/connection.js';
import { createTweet, getAllTweetsWithLikes, getTweetByIdWithLikes, getUserTweetsWithLikes, deleteTweet } from '../db/tweets.js';
import { createTweetSchema, deleteTweetParamsSchema } from '../schemas/tweet.js';
import { sanitizeContent } from '../utils/sanitizeContent.js';
import { loadEnv } from '../config/env.js';
import { createAuthenticateMiddleware } from '../middleware/auth.js';

const router = Router();
const { DATABASE_URL, JWT_SECRET } = loadEnv();
const db = createDbConnection(DATABASE_URL);
const authenticate = createAuthenticateMiddleware(JWT_SECRET);

/**
 * POST /api/tweets
 * Create a new tweet (requires authentication)
 */
router.post('/', authenticate, async (req: Request, res: Response) => {
  // Check authentication (added by authenticate middleware)
  if (!req.user || !req.user.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Validate request body
  const result = createTweetSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: result.error.flatten().fieldErrors,
    });
  }

  const { content } = result.data;

  try {
    // Sanitize content before storing (XSS prevention)
    const sanitizedContent = sanitizeContent(content);

    // Create tweet
    const tweetId = uuidv7();
    const tweet = await createTweet(db, {
      id: tweetId,
      profileId: req.user.userId,
      content: sanitizedContent,
    });

    return res.status(201).json({ tweet });
  } catch (error) {
    console.error('Tweet creation error:', error);
    return res.status(500).json({ error: 'Failed to create tweet' });
  }
});

/**
 * GET /api/tweets
 * Get all tweets with like information (public, no auth required)
 * Feature: 003-like-functionality - Extended to include like counts and user status
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Get current user ID from session if authenticated, null otherwise
    const currentUserId = req.user?.userId ?? null;
    const tweets = await getAllTweetsWithLikes(db, currentUserId);
    return res.status(200).json({ tweets });
  } catch (error) {
    console.error('Get tweets error:', error);
    return res.status(500).json({ error: 'Failed to fetch tweets' });
  }
});

/**
 * GET /api/tweets/user/:username
 * Get all tweets from a specific user with like information (public, no auth required)
 * Feature: 004-user-profile-system
 */
router.get('/user/:username', async (req: Request, res: Response) => {
  const { username } = req.params;

  try {
    // Get current user ID from session if authenticated, null otherwise
    const currentUserId = req.user?.userId ?? null;
    const tweets = await getUserTweetsWithLikes(db, username, currentUserId);
    return res.status(200).json({ tweets });
  } catch (error) {
    console.error('Get user tweets error:', error);
    return res.status(500).json({ error: 'Failed to fetch user tweets' });
  }
});

/**
 * GET /api/tweets/:id
 * Get single tweet by ID with like information (public, no auth required)
 * Feature: 003-like-functionality - Extended to include like count and user status
 */
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return res.status(400).json({ error: 'Invalid tweet ID format' });
  }

  try {
    // Get current user ID from session if authenticated, null otherwise
    const currentUserId = req.user?.userId ?? null;
    const tweet = await getTweetByIdWithLikes(db, id, currentUserId);

    if (!tweet) {
      return res.status(404).json({ error: 'Tweet not found' });
    }

    return res.status(200).json({ tweet });
  } catch (error) {
    console.error('Get tweet by ID error:', error);
    return res.status(500).json({ error: 'Failed to fetch tweet' });
  }
});

/**
 * DELETE /api/tweets/:id
 * Delete a tweet owned by the authenticated user (requires authentication)
 * Feature: 910-allow-the-logged-in-user-to-delete-their-own-tweets
 */
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  // Check authentication (added by authenticate middleware)
  if (!req.user || !req.user.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Validate tweet ID (path parameter)
  const result = deleteTweetParamsSchema.safeParse({
    id: req.params.id,
  });

  if (!result.success) {
    return res.status(400).json({
      error: 'Invalid request',
      details: result.error.flatten().fieldErrors,
    });
  }

  const { id: tweetId } = result.data;
  const userId = req.user.userId;

  try {
    // Delete tweet (ownership check + deletion in single atomic query)
    const deleted = await deleteTweet(db, tweetId, userId);

    if (!deleted) {
      // Either not found or not owned (we don't distinguish to prevent timing leak)
      return res.status(404).json({
        error: 'Tweet not found',
      });
    }

    // Success: 204 No Content
    return res.status(204).send();
  } catch (error) {
    console.error('Delete tweet error:', error);
    return res.status(500).json({ error: 'Failed to delete tweet' });
  }
});

export default router;
