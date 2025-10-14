/**
 * Authentication Middleware
 * Feature: 001-user-authentication-system (Phase 5 - cross-cutting)
 *
 * Express middleware to verify JWT from httpOnly cookie
 */

import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../auth/jwt.js';

/**
 * Extend Express Request to include user data
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
      };
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT from cookie and attaches userId to request
 *
 * @param jwtSecret - Secret used to verify JWT tokens
 * @returns Express middleware function
 */
export function createAuthenticateMiddleware(jwtSecret: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Extract JWT token from cookie
    const token = req.cookies.auth_token;

    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Verify token
    const payload = verifyToken(token, jwtSecret);

    if (!payload) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // Attach user data to request
    req.user = {
      userId: payload.userId,
    };

    next();
  };
}
