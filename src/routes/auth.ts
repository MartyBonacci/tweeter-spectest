import { Router } from 'express';
import { v7 as uuidv7 } from 'uuid';
import type { Request, Response } from 'express';
import { signupSchema, signinSchema } from '../schemas/auth.js';
import { forgotPasswordSchema, resetPasswordSchema } from '../server/schemas/password-reset.js';
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
import { generateResetToken, hashToken, getTokenExpirationTime, isTokenExpired, isTokenUsed } from '../server/utils/password-reset-tokens.js';
import { checkRateLimit, recordResetRequest } from '../server/utils/rate-limiting.js';
import { initMailgun, sendPasswordResetEmail, sendPasswordChangedEmail } from '../server/services/email.js';
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

        // Invalidate any existing tokens for this user (Bug 916 fix)
        // This ensures only 1 active token per user at any time
        // Prevents "already used" error when old tokens exist
        const deletedTokens = await db`
          DELETE FROM password_reset_tokens
          WHERE profile_id = ${user.id}
          RETURNING id
        `;
        console.log(`🧹 Cleaned up ${deletedTokens.count} old tokens for user ${user.id}`);

        // Store new token in database
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
   * GET /api/auth/verify-reset-token/:token
   * Verify password reset token validity
   * Feature: 915-password-reset-flow-with-email-token-verification
   */
  router.get('/verify-reset-token/:token', async (req: Request, res: Response) => {
    try {
      const { token } = req.params;

      // Validate token format (should be UUID)
      if (!token || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) {
        return res.status(400).json({
          error: 'Invalid token format',
          valid: false,
        });
      }

      // Hash the token to look it up in database
      const tokenHash = hashToken(token);

      // Query database for token with user email
      const [result] = await db`
        SELECT
          prt.expires_at,
          prt.used_at,
          p.email
        FROM password_reset_tokens prt
        JOIN profiles p ON prt.profile_id = p.id
        WHERE prt.token_hash = ${tokenHash}
      `;

      // Token not found
      if (!result) {
        return res.status(404).json({
          error: 'Invalid or expired token',
          valid: false,
        });
      }

      // Check if token is expired
      if (isTokenExpired(result.expiresAt)) {
        return res.status(410).json({
          error: 'Token has expired',
          valid: false,
          expired: true,
        });
      }

      // Check if token is already used
      if (isTokenUsed(result.usedAt)) {
        return res.status(410).json({
          error: 'Token has already been used',
          valid: false,
          used: true,
        });
      }

      // Token is valid
      return res.status(200).json({
        valid: true,
        email: result.email,
      });
    } catch (error) {
      console.error('Verify reset token error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        valid: false,
      });
    }
  });

  /**
   * POST /api/auth/reset-password
   * Complete password reset with new password
   * Feature: 915-password-reset-flow-with-email-token-verification
   */
  router.post('/reset-password', async (req: Request, res: Response) => {
    try {
      // Validate request body
      const result = resetPasswordSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: result.error.flatten().fieldErrors,
        });
      }

      const { token, password } = result.data;

      // Hash the token to look it up in database
      const tokenHash = hashToken(token);

      // Query database for token with user info
      const [tokenRecord] = await db`
        SELECT
          prt.id as token_id,
          prt.expires_at,
          prt.used_at,
          p.id as user_id,
          p.email
        FROM password_reset_tokens prt
        JOIN profiles p ON prt.profile_id = p.id
        WHERE prt.token_hash = ${tokenHash}
      `;

      // Token not found
      if (!tokenRecord) {
        return res.status(404).json({
          error: 'Invalid or expired token',
        });
      }

      // Check if token is expired
      if (isTokenExpired(tokenRecord.expiresAt)) {
        return res.status(410).json({
          error: 'Token has expired',
        });
      }

      // Check if token is already used
      if (isTokenUsed(tokenRecord.usedAt)) {
        return res.status(410).json({
          error: 'Token has already been used',
        });
      }

      // Hash the new password
      const passwordHash = await hashPassword(password);

      // Update password in database
      await db`
        UPDATE profiles
        SET password_hash = ${passwordHash}
        WHERE id = ${tokenRecord.userId}
      `;

      // Mark token as used
      await db`
        UPDATE password_reset_tokens
        SET used_at = NOW()
        WHERE id = ${tokenRecord.tokenId}
      `;

      // Create session for user (automatically sign in)
      const { cookie } = createSession(
        tokenRecord.userId,
        jwtSecret,
        cookieDomain,
        isProduction
      );

      // Send confirmation email
      const env = getEnv();
      const mailgunClient = initMailgun({
        apiKey: env.MAILGUN_API_KEY,
        domain: env.MAILGUN_DOMAIN,
        fromEmail: env.MAILGUN_FROM_EMAIL,
        fromName: env.MAILGUN_FROM_NAME,
      });

      await sendPasswordChangedEmail(
        mailgunClient,
        {
          apiKey: env.MAILGUN_API_KEY,
          domain: env.MAILGUN_DOMAIN,
          fromEmail: env.MAILGUN_FROM_EMAIL,
          fromName: env.MAILGUN_FROM_NAME,
        },
        tokenRecord.email
      );

      // Set session cookie and return success
      res.setHeader('Set-Cookie', cookie);
      return res.status(200).json({
        success: true,
        message: 'Password reset successful',
      });
    } catch (error) {
      console.error('Reset password error:', error);
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
          avatarUrl: user.avatarUrl,
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
