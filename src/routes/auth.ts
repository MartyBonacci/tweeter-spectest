import { Router } from 'express';
import { v7 as uuidv7 } from 'uuid';
import type { Request, Response } from 'express';
import { signupSchema, signinSchema } from '../schemas/auth.js';
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
      const cookie = destroySession(cookieDomain);

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

  return router;
}
