/**
 * Rate limiting functions for password reset
 * Feature: 915-password-reset-flow-with-email-token-verification
 *
 * Implements database-based rate limiting (max 3 requests/hour per email)
 * Principle 1: Functional Programming (pure functions with explicit DB dependency)
 * Principle 4: Security-First (prevent abuse)
 */

import type { Sql } from '../../db/connection.js';

/**
 * Check if email has exceeded rate limit
 * Rate limit: 3 requests per hour
 *
 * @param db - Database connection
 * @param email - Email address to check
 * @returns true if rate limit exceeded, false if still allowed
 *
 * @example
 * const exceeded = await checkRateLimit(db, "user@example.com");
 * if (exceeded) {
 *   return res.status(429).json({ error: "Too many requests" });
 * }
 */
export async function checkRateLimit(
  db: Sql,
  email: string
): Promise<boolean> {
  // Count requests in the last hour
  const result = await db<[{ count: string }]>`
    SELECT COUNT(*) as count
    FROM password_reset_rate_limits
    WHERE email = ${email}
      AND requested_at > NOW() - INTERVAL '1 hour'
  `;

  const count = parseInt(result[0]?.count || '0', 10);
  return count >= 3; // Exceeded if 3 or more requests
}

/**
 * Record a password reset request for rate limiting
 * Should be called for both valid and invalid emails (prevent enumeration)
 *
 * @param db - Database connection
 * @param email - Email address making the request
 *
 * @example
 * await recordResetRequest(db, "user@example.com");
 */
export async function recordResetRequest(
  db: Sql,
  email: string
): Promise<void> {
  await db`
    INSERT INTO password_reset_rate_limits (email)
    VALUES (${email})
  `;
}

/**
 * Clean up old rate limit entries (older than 24 hours)
 * Should be run as a background job (e.g., daily cron)
 *
 * @param db - Database connection
 * @returns Number of entries deleted
 *
 * @example
 * const deleted = await cleanupOldRateLimits(db);
 * console.log(`Cleaned up ${deleted} old rate limit entries`);
 */
export async function cleanupOldRateLimits(db: Sql): Promise<number> {
  const result = await db`
    DELETE FROM password_reset_rate_limits
    WHERE requested_at < NOW() - INTERVAL '24 hours'
    RETURNING id
  `;

  return result.length;
}

/**
 * Get current rate limit status for an email
 * Useful for debugging or admin dashboards
 *
 * @param db - Database connection
 * @param email - Email address to check
 * @returns Object with count and remaining requests
 *
 * @example
 * const status = await getRateLimitStatus(db, "user@example.com");
 * // { count: 2, remaining: 1, resetAt: Date }
 */
export async function getRateLimitStatus(
  db: Sql,
  email: string
): Promise<{ count: number; remaining: number; resetAt: Date }> {
  const result = await db<[{ count: string; oldestRequest: Date }]>`
    SELECT
      COUNT(*) as count,
      MIN(requested_at) as oldest_request
    FROM password_reset_rate_limits
    WHERE email = ${email}
      AND requested_at > NOW() - INTERVAL '1 hour'
  `;

  const count = parseInt(result[0]?.count || '0', 10);
  const oldestRequest = result[0]?.oldestRequest;

  // Reset time is 1 hour after the oldest request
  const resetAt = oldestRequest
    ? new Date(oldestRequest.getTime() + 60 * 60 * 1000)
    : new Date();

  return {
    count,
    remaining: Math.max(0, 3 - count),
    resetAt,
  };
}
