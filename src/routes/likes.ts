/**
 * Like API Routes
 * Feature: 003-like-functionality
 *
 * Express routes for like operations
 */

import { Router, type Request, type Response } from 'express';
import { createDbConnection } from '../db/connection.js';
import { createLike, deleteLike } from '../db/likes.js';
import { CreateLikeRequestSchema, DeleteLikeRequestSchema } from '../../app/types/like.js';
import { loadEnv } from '../config/env.js';

const router = Router();
const { DATABASE_URL } = loadEnv();
const db = createDbConnection(DATABASE_URL);

/**
 * POST /api/likes
 * Create a like (requires authentication)
 */
router.post('/', async (req: Request, res: Response) => {
  // Check authentication (added by authenticate middleware)
  if (!req.user || !req.user.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Validate request body
  const result = CreateLikeRequestSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: result.error.flatten().fieldErrors,
    });
  }

  const { tweetId } = result.data;
  const profileId = req.user.userId;

  try {
    const like = await createLike(db, tweetId, profileId);
    return res.status(201).json({ like });
  } catch (error: any) {
    // Handle duplicate like (user already liked this tweet)
    if (error.message === 'DUPLICATE_LIKE') {
      return res.status(409).json({ error: 'You have already liked this tweet' });
    }

    // Handle tweet not found (invalid tweet ID)
    if (error.message === 'TWEET_NOT_FOUND') {
      return res.status(404).json({ error: 'Tweet not found' });
    }

    console.error('Like creation error:', error);
    return res.status(500).json({ error: 'Failed to create like' });
  }
});

/**
 * DELETE /api/likes
 * Delete a like (requires authentication)
 * Request body: { tweetId: string }
 * Uses composite key: tweetId from body + profileId from session
 */
router.delete('/', async (req: Request, res: Response) => {
  // Check authentication
  if (!req.user || !req.user.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Validate request body
  const result = DeleteLikeRequestSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: result.error.flatten().fieldErrors,
    });
  }

  const { tweetId } = result.data;
  const profileId = req.user.userId;

  try {
    const deleted = await deleteLike(db, tweetId, profileId);

    if (!deleted) {
      return res.status(404).json({ error: 'Like not found' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Like deletion error:', error);
    return res.status(500).json({ error: 'Failed to delete like' });
  }
});

export default router;
