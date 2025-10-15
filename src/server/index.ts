import 'dotenv/config';
import { getEnv } from '../config/env.js';
import { getDb } from '../db/connection.js';
import { runMigrations } from '../db/migrate.js';
import { createApp } from './app.js';

/**
 * Start the Express server
 */
async function start(): Promise<void> {
  try {
    // Load environment variables
    const env = getEnv();

    console.log('🚀 Starting Tweeter server...');

    // Connect to database
    console.log('📦 Connecting to database...');
    const db = getDb(env.DATABASE_URL);

    // Run migrations
    await runMigrations(db);

    // Create Express app
    const isProduction = env.NODE_ENV === 'production';
    const app = createApp(
      db,
      env.JWT_SECRET,
      env.COOKIE_DOMAIN,
      isProduction
    );

    // Start server
    const port = env.PORT;
    app.listen(port, () => {
      console.log(`✅ Server running on http://localhost:${port}`);
      console.log(`📍 API available at http://localhost:${port}/api`);
      console.log(`🏥 Health check: http://localhost:${port}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Start the server
start();
