/**
 * Profile API Routes
 * Feature: 004-user-profile-system
 *
 * Express routes for profile operations
 */

import { Router, type Request, type Response } from 'express';
import { createDbConnection } from '../db/connection.js';
import { getProfileWithStats, updateProfileBio } from '../db/profiles.js';
import { updateProfileRequestSchema } from '../schemas/profile.js';
import { loadEnv } from '../config/env.js';

const router = Router();
const { DATABASE_URL } = loadEnv();
const db = createDbConnection(DATABASE_URL);

/**
 * GET /api/profiles/:username
 * Get public profile data with tweet count (public endpoint)
 */
router.get('/:username', async (req: Request, res: Response) => {
  const { username } = req.params;

  try {
    const profile = await getProfileWithStats(db, username);

    if (!profile) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ profile });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * PUT /api/profiles/:username
 * Update profile bio (requires authentication and authorization)
 */
router.put('/:username', async (req: Request, res: Response) => {
  // Check authentication (added by authenticate middleware)
  if (!req.user || !req.user.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { username } = req.params;
  const userId = req.user.userId;

  // Get current user's username from database for authorization check
  const [currentUser] = await db`
    SELECT username FROM profiles WHERE id = ${userId}
  `;

  if (!currentUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Authorization check: User can only update their own profile
  if (currentUser.username.toLowerCase() !== username.toLowerCase()) {
    return res
      .status(403)
      .json({ error: 'You can only update your own profile' });
  }

  // Validate request body
  const result = updateProfileRequestSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: result.error.flatten().fieldErrors,
    });
  }

  const { bio } = result.data;

  // Bio is optional in update request
  if (bio === undefined) {
    return res.status(400).json({ error: 'No bio provided for update' });
  }

  try {
    // Sanitize bio content (basic HTML tag removal)
    const sanitizedBio = bio.replace(/<[^>]*>/g, '').trim();

    const profile = await updateProfileBio(db, userId, sanitizedBio);
    return res.status(200).json({ profile });
  } catch (error: any) {
    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ error: 'Profile not found' });
    }

    console.error('Profile update error:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
