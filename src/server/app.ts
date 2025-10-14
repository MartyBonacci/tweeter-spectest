import express from 'express';
import cookieParser from 'cookie-parser';
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
      next();
    });
  }

  // Create authentication middleware
  const authenticate = createAuthenticateMiddleware(jwtSecret);

  // Mount authentication routes
  const authRouter = createAuthRouter(db, jwtSecret, cookieDomain, isProduction);
  app.use('/api/auth', authRouter);

  // Mount tweet routes (POST requires authentication)
  app.post('/api/tweets', authenticate, tweetRoutes);
  app.get('/api/tweets', tweetRoutes);
  app.get('/api/tweets/user/:username', tweetRoutes);
  app.get('/api/tweets/:id', tweetRoutes);

  // Mount like routes (all require authentication)
  app.post('/api/likes', authenticate, likeRoutes);
  app.delete('/api/likes', authenticate, likeRoutes);

  // Mount profile routes (PUT requires authentication)
  app.get('/api/profiles/:username', profileRoutes);
  app.put('/api/profiles/:username', authenticate, profileRoutes);

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
