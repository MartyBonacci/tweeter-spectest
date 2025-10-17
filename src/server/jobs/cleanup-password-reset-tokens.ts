/**
 * Cleanup job for expired password reset tokens and rate limits
 * Feature: 915-password-reset-flow-with-email-token-verification
 *
 * Principle 1: Functional Programming (pure function for cleanup logic)
 * Principle 4: Security-First (regular cleanup of sensitive data)
 *
 * Usage:
 * This can be run as a cron job or scheduled task.
 * Recommended schedule: Daily at 2 AM
 *
 * Example cron: 0 2 * * * node dist/server/jobs/cleanup-password-reset-tokens.js
 */

import type { Sql } from '../../db/connection.js';

/**
 * Delete expired and old password reset tokens
 * Removes tokens that expired more than 24 hours ago
 *
 * @param db - Database connection
 * @returns Number of tokens deleted
 *
 * @example
 * const deletedCount = await cleanupExpiredTokens(db);
 * console.log(`Deleted ${deletedCount} expired tokens`);
 */
export async function cleanupExpiredTokens(db: Sql): Promise<number> {
  try {
    const result = await db`
      DELETE FROM password_reset_tokens
      WHERE expires_at < NOW() - INTERVAL '24 hours'
      RETURNING id
    `;

    const deletedCount = result.count;
    console.log(`🧹 Cleaned up ${deletedCount} expired password reset tokens`);
    return deletedCount;
  } catch (error) {
    console.error('❌ Error cleaning up expired tokens:', error);
    throw error;
  }
}

/**
 * Delete old rate limit records
 * Removes rate limit records older than 24 hours (well past the 1-hour window)
 *
 * @param db - Database connection
 * @returns Number of rate limit records deleted
 *
 * @example
 * const deletedCount = await cleanupOldRateLimits(db);
 * console.log(`Deleted ${deletedCount} old rate limit records`);
 */
export async function cleanupOldRateLimits(db: Sql): Promise<number> {
  try {
    const result = await db`
      DELETE FROM password_reset_rate_limits
      WHERE requested_at < NOW() - INTERVAL '24 hours'
      RETURNING id
    `;

    const deletedCount = result.count;
    console.log(`🧹 Cleaned up ${deletedCount} old rate limit records`);
    return deletedCount;
  } catch (error) {
    console.error('❌ Error cleaning up rate limits:', error);
    throw error;
  }
}

/**
 * Run all password reset cleanup tasks
 * Combines token cleanup and rate limit cleanup
 *
 * @param db - Database connection
 * @returns Object with counts of deleted records
 *
 * @example
 * const result = await runPasswordResetCleanup(db);
 * console.log(`Total cleanup: ${result.tokensDeleted + result.rateLimitsDeleted} records`);
 */
export async function runPasswordResetCleanup(db: Sql): Promise<{
  tokensDeleted: number;
  rateLimitsDeleted: number;
}> {
  console.log('🚀 Starting password reset cleanup job...');

  const tokensDeleted = await cleanupExpiredTokens(db);
  const rateLimitsDeleted = await cleanupOldRateLimits(db);

  console.log(
    `✅ Cleanup complete: ${tokensDeleted} tokens, ${rateLimitsDeleted} rate limits`
  );

  return {
    tokensDeleted,
    rateLimitsDeleted,
  };
}

/**
 * Standalone script entry point
 * Can be executed directly: node dist/server/jobs/cleanup-password-reset-tokens.js
 */
async function main(): Promise<void> {
  const { getDb } = await import('../../db/connection.js');
  const { getEnv } = await import('../../config/env.js');

  const env = getEnv();
  const db = getDb(env.DATABASE_URL);

  try {
    await runPasswordResetCleanup(db);
    await db.end();
    process.exit(0);
  } catch (error) {
    console.error('💥 Cleanup job failed:', error);
    await db.end();
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
