import { Router } from 'express';
import { v7 as uuidv7 } from 'uuid';
import type { Request, Response } from 'express';
import { signupSchema, signinSchema } from '../schemas/auth.js';
import { forgotPasswordSchema } from '../server/schemas/password-reset.js';
import { hashPassword, verifyPassword } from '../auth/password.js';
import { createSession, destroySession } from '../auth/session.js';
import { toPublicUser } from '../types/user.js';
import {
  createUser,
  usernameExists,
  emailExists,
  findUserByEmail,
} from '../db/users.js';
import type { Sql } from '../db/connection.js';
import { generateResetToken, hashToken, getTokenExpirationTime } from '../server/utils/password-reset-tokens.js';
import { checkRateLimit, recordResetRequest } from '../server/utils/rate-limiting.js';
import { initMailgun, sendPasswordResetEmail } from '../server/services/email.js';
import { getEnv } from '../config/env.js';

/**
 * Create authentication router
 * @param db - Database connection
 * @param jwtSecret - JWT secret for token signing
 * @param cookieDomain - Cookie domain
 * @param isProduction - Production environment flag
 */
export function createAuthRouter(
  db: Sql,
  jwtSecret: string,
  cookieDomain: string,
  isProduction: boolean
): Router {
  const router = Router();

  /**
   * POST /api/auth/signup
   * Create new user account
   */
  router.post('/signup', async (req: Request, res: Response) => {
    try {
      // Validate request body
      const result = signupSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: result.error.flatten().fieldErrors,
        });
      }

      const { username, email, password } = result.data;

      // Check username uniqueness
      if (await usernameExists(db, username)) {
        return res.status(409).json({
          error: 'Username already taken',
          field: 'username',
        });
      }

      // Check email uniqueness
      if (await emailExists(db, email)) {
        return res.status(409).json({
          error: 'Email already registered',
          field: 'email',
        });
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Generate UUID v7 for new user
      const userId = uuidv7();

      // Create user
      const user = await createUser(db, {
        id: userId,
        username,
        email,
        passwordHash,
      });

      // Create session
      const { cookie } = createSession(
        user.id,
        jwtSecret,
        cookieDomain,
        isProduction
      );

      // Return user data and set cookie
      res.setHeader('Set-Cookie', cookie);
      return res.status(201).json({
        user: toPublicUser(user),
      });
    } catch (error) {
      console.error('Signup error:', error);
      return res.status(500).json({
        error: 'Internal server error',
      });
    }
  });

  /**
   * POST /api/auth/signin
   * Authenticate existing user
   */
  router.post('/signin', async (req: Request, res: Response) => {
    try {
      // Validate request body
      const result = signinSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: result.error.flatten().fieldErrors,
        });
      }

      const { email, password } = result.data;

      // Find user by email
      const user = await findUserByEmail(db, email);

      if (!user) {
        return res.status(401).json({
          error: 'Invalid credentials',
        });
      }

      // Verify password
      const isValid = await verifyPassword(user.passwordHash, password);

      if (!isValid) {
        return res.status(401).json({
          error: 'Invalid credentials',
        });
      }

      // Create session
      const { cookie } = createSession(
        user.id,
        jwtSecret,
        cookieDomain,
        isProduction
      );

      // Return user data and set cookie
      res.setHeader('Set-Cookie', cookie);
      return res.status(200).json({
        user: toPublicUser(user),
      });
    } catch (error) {
      console.error('Signin error:', error);
      return res.status(500).json({
        error: 'Internal server error',
      });
    }
  });

  /**
   * POST /api/auth/signout
   * End user session
   */
  router.post('/signout', (req: Request, res: Response) => {
    try {
      // Clear session cookie
      const cookie = destroySession(cookieDomain, isProduction);

      res.setHeader('Set-Cookie', cookie);
      return res.status(200).json({
        success: true,
      });
    } catch (error) {
      console.error('Signout error:', error);
      return res.status(500).json({
        error: 'Internal server error',
      });
    }
  });

  /**
   * POST /api/auth/forgot-password
   * Initiate password reset flow
   * Feature: 915-password-reset-flow-with-email-token-verification
   */
  router.post('/forgot-password', async (req: Request, res: Response) => {
    try {
      // Validate request body
      const result = forgotPasswordSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: result.error.flatten().fieldErrors,
        });
      }

      const { email } = result.data;

      // Check rate limit (3 requests/hour per email)
      const rateLimitExceeded = await checkRateLimit(db, email);

      if (rateLimitExceeded) {
        return res.status(429).json({
          error: 'Too many password reset requests',
          message: 'Please wait before requesting another reset',
        });
      }

      // Look up user by email
      const user = await findUserByEmail(db, email);

      // Record request for rate limiting (even if user doesn't exist)
      await recordResetRequest(db, email);

      // If user exists, send reset email
      if (user) {
        // Generate reset token
        const token = generateResetToken();
        const tokenHash = hashToken(token);
        const expiresAt = getTokenExpirationTime();

        // Store token in database
        await db`
          INSERT INTO password_reset_tokens (profile_id, token_hash, expires_at)
          VALUES (${user.id}, ${tokenHash}, ${expiresAt})
        `;

        // Initialize Mailgun and send email
        const env = getEnv();
        const mailgunClient = initMailgun({
          apiKey: env.MAILGUN_API_KEY,
          domain: env.MAILGUN_DOMAIN,
          fromEmail: env.MAILGUN_FROM_EMAIL,
          fromName: env.MAILGUN_FROM_NAME,
        });

        await sendPasswordResetEmail(
          mailgunClient,
          {
            apiKey: env.MAILGUN_API_KEY,
            domain: env.MAILGUN_DOMAIN,
            fromEmail: env.MAILGUN_FROM_EMAIL,
            fromName: env.MAILGUN_FROM_NAME,
          },
          email,
          token,
          env.APP_BASE_URL
        );
      }

      // Always return generic success message (prevent email enumeration)
      return res.status(200).json({
        message: "If your email is registered, you'll receive a password reset link",
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      return res.status(500).json({
        error: 'Internal server error',
      });
    }
  });

  /**
   * GET /api/auth/me
   * Get current authenticated user info
   */
  router.get('/me', async (req: Request, res: Response) => {
    try {
      console.log('=== /api/auth/me Debug ===');
      console.log('Cookie header:', req.headers.cookie);
      console.log('Cookies from parser:', req.cookies);
      console.log('req.user:', req.user);

      // Check if user is authenticated (req.user set by optional auth middleware)
      if (!req.user || !req.user.userId) {
        // Not authenticated - return null user instead of 401
        console.log('No user in request, returning null');
        return res.status(200).json({ user: null });
      }

      console.log('User authenticated, userId:', req.user.userId);

      // Get user from database
      const [user] = await db`
        SELECT id, username, email, bio, avatar_url
        FROM profiles
        WHERE id = ${req.user.userId}
      `;

      console.log('User from database:', user ? user.username : 'not found');

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          bio: user.bio,
          avatarUrl: user.avatar_url,
        },
      });
    } catch (error) {
      console.error('Get current user error:', error);
      return res.status(500).json({
        error: 'Internal server error',
      });
    }
  });

  return router;
}
