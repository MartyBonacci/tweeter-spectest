/**
 * Pure functions for password reset token operations
 * Feature: 915-password-reset-flow-with-email-token-verification
 *
 * All functions are pure (no side effects)
 * Principle 1: Functional Programming
 */

import { createHash, randomUUID } from 'crypto';

/**
 * Generate a cryptographically secure reset token
 * Uses crypto.randomUUID() for 128-bit entropy
 *
 * @returns UUID v4 token (36 characters with hyphens)
 *
 * @example
 * const token = generateResetToken();
 * // "550e8400-e29b-41d4-a716-446655440000"
 */
export function generateResetToken(): string {
  return randomUUID();
}

/**
 * Hash a token using SHA-256
 * One-way hash for secure storage
 *
 * @param token - Original token to hash
 * @returns SHA-256 hash (64 hex characters)
 *
 * @example
 * const hash = hashToken("550e8400-e29b-41d4-a716-446655440000");
 * // "9b74c9897bac770ffc029102a200c5de..." (64 chars)
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Check if a token has expired
 * Pure function - no Date.now() side effect
 *
 * @param expiresAt - Token expiration timestamp
 * @param now - Current time (defaults to Date.now() for convenience)
 * @returns true if expired, false if still valid
 *
 * @example
 * const expiresAt = new Date('2025-10-16T12:00:00Z');
 * const now = new Date('2025-10-16T13:00:00Z');
 * isTokenExpired(expiresAt, now); // true (expired)
 */
export function isTokenExpired(
  expiresAt: Date,
  now: Date = new Date()
): boolean {
  return now > expiresAt;
}

/**
 * Check if a token has been used
 * Pure function
 *
 * @param usedAt - Timestamp when token was used (null if unused)
 * @returns true if used, false if unused
 *
 * @example
 * isTokenUsed(null); // false (not used)
 * isTokenUsed(new Date()); // true (used)
 */
export function isTokenUsed(usedAt: Date | null): boolean {
  return usedAt !== null;
}

/**
 * Calculate token expiration time (1 hour from now)
 * Pure function when provided with 'now' parameter
 *
 * @param now - Current time (defaults to Date.now() for convenience)
 * @returns Expiration time (now + 1 hour)
 *
 * @example
 * const now = new Date('2025-10-16T12:00:00Z');
 * const expiresAt = getTokenExpirationTime(now);
 * // Returns: new Date('2025-10-16T13:00:00Z')
 */
export function getTokenExpirationTime(now: Date = new Date()): Date {
  const expiresAt = new Date(now);
  expiresAt.setHours(expiresAt.getHours() + 1);
  return expiresAt;
}
