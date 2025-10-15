import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import type { Express } from 'express';
import type { Sql } from '../db/connection.js';
import { createAuthRouter } from '../routes/auth.js';
import { createAuthenticateMiddleware } from '../middleware/auth.js';
import tweetRoutes from '../routes/tweets.js';
import likeRoutes from '../routes/likes.js';
import profileRoutes from '../routes/profiles.js';

/**
 * Create and configure Express application
 *
 * @param db - Database connection
 * @param jwtSecret - JWT secret for token signing
 * @param cookieDomain - Cookie domain
 * @param isProduction - Production environment flag
 * @returns Configured Express app
 */
export function createApp(
  db: Sql,
  jwtSecret: string,
  cookieDomain: string,
  isProduction: boolean = false
): Express {
  const app = express();

  // Body parser middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Cookie parser middleware
  app.use(cookieParser());

  // CORS middleware (if needed for dev)
  if (!isProduction) {
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');

      // Handle preflight OPTIONS requests
      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }

      next();
    });
  }

  // Create authentication middleware
  const authenticate = createAuthenticateMiddleware(jwtSecret);

  // Optional auth middleware - adds user to request if authenticated, but doesn't reject
  const optionalAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const token = req.cookies.auth_token;
    if (token) {
      try {
        const payload = jwt.verify(token, jwtSecret) as { userId: string };
        req.user = { userId: payload.userId };
      } catch (error) {
        // Invalid token, continue without user
      }
    }
    next();
  };

  // Mount tweet routes with optional auth - must use app.use() to mount routers
  app.use('/api/tweets', optionalAuth, tweetRoutes);

  // Mount like routes with required auth
  app.use('/api/likes', authenticate, likeRoutes);

  // Mount profile routes with optional auth
  app.use('/api/profiles', optionalAuth, profileRoutes);

  // Mount authentication routes with optional auth
  const authRouter = createAuthRouter(db, jwtSecret, cookieDomain, isProduction);
  app.use('/api/auth', optionalAuth, authRouter);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Error handling middleware
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
