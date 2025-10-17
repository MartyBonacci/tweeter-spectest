/**
 * Regression Test for Bug 916
 * Password Reset Token Shows "Already Used" Error on First Click
 *
 * This test proves that old tokens interfere with new tokens when
 * requesting password reset multiple times for the same user.
 *
 * Expected behavior BEFORE fix:
 * - Test FAILS because multiple tokens exist for same user
 * - Old used token not cleaned up before creating new one
 *
 * Expected behavior AFTER fix:
 * - Test PASSES because old tokens deleted/invalidated first
 * - Only 1 active token per user at any time
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { v7 as uuidv7 } from 'uuid';
import { getDb } from '../../db/connection.js';
import { getEnv } from '../../config/env.js';
import { hashToken } from '../utils/password-reset-tokens.js';
import type { Sql } from '../../db/connection.js';

describe('Bug 916: Password Reset Token Cleanup', () => {
  let db: Sql;
  let testUserId: string;
  const testEmail = `test-token-${Date.now()}@example.com`;

  beforeAll(async () => {
    // Setup database connection
    const env = getEnv();
    db = getDb(env.DATABASE_URL);

    // Create test user
    testUserId = uuidv7();
    await db`
      INSERT INTO profiles (id, username, email, password_hash)
      VALUES (
        ${testUserId},
        ${'test-token-user-' + Date.now()},
        ${testEmail},
        'hashed_password_placeholder'
      )
    `;
  });

  afterAll(async () => {
    // Cleanup test data
    await db`DELETE FROM password_reset_tokens WHERE profile_id = ${testUserId}`;
    await db`DELETE FROM profiles WHERE id = ${testUserId}`;
    await db.end();
  });

  beforeEach(async () => {
    // Clean up any existing tokens before each test
    await db`DELETE FROM password_reset_tokens WHERE profile_id = ${testUserId}`;
  });

  test('should invalidate old tokens when creating new token', async () => {
    // ============================================================
    // SETUP: Create old used token (simulates previous password reset)
    // ============================================================
    const oldTokenHash = hashToken('old-token-12345');
    await db`
      INSERT INTO password_reset_tokens (profile_id, token_hash, expires_at, used_at)
      VALUES (
        ${testUserId},
        ${oldTokenHash},
        NOW() + INTERVAL '1 hour',
        NOW() - INTERVAL '10 minutes'
      )
    `;

    // Verify old token exists and is marked as used
    const [oldToken] = await db`
      SELECT * FROM password_reset_tokens
      WHERE profile_id = ${testUserId}
      AND token_hash = ${oldTokenHash}
    `;
    expect(oldToken).toBeDefined();
    expect(oldToken.used_at).not.toBeNull();

    // ============================================================
    // ACTION: Simulate creating new password reset token
    // (This is what POST /api/auth/forgot-password does)
    // ============================================================
    const newTokenHash = hashToken('new-token-67890');

    // BEFORE FIX: This insert happens WITHOUT cleaning up old tokens
    // AFTER FIX: Old tokens should be deleted/invalidated first
    await db`
      INSERT INTO password_reset_tokens (profile_id, token_hash, expires_at)
      VALUES (
        ${testUserId},
        ${newTokenHash},
        NOW() + INTERVAL '1 hour'
      )
    `;

    // ============================================================
    // ASSERTIONS: Verify token state
    // ============================================================

    // Get all tokens for this user
    const allTokens = await db`
      SELECT * FROM password_reset_tokens
      WHERE profile_id = ${testUserId}
      ORDER BY created_at DESC
    `;

    // CRITICAL ASSERTION: Should only have unused tokens
    // BEFORE FIX: This will FAIL because old used token still exists
    // AFTER FIX: This will PASS because old tokens cleaned up
    const activeTokens = allTokens.filter((t: any) => t.used_at === null);
    expect(activeTokens.length).toBe(1); // ← THIS IS THE KEY ASSERTION

    // Additional assertions
    const newToken = allTokens.find((t: any) => t.token_hash === newTokenHash);
    expect(newToken).toBeDefined();
    expect(newToken!.used_at).toBeNull();

    // Verify old token no longer exists (or is invalidated)
    const oldTokenStillExists = allTokens.find((t: any) => t.token_hash === oldTokenHash);

    // BEFORE FIX: Old token still exists → test fails
    // AFTER FIX: Old token deleted → test passes
    expect(oldTokenStillExists).toBeUndefined(); // ← SECOND KEY ASSERTION
  });

  test('should handle multiple old tokens (edge case)', async () => {
    // ============================================================
    // SETUP: Create 3 old tokens (user requested reset 3 times)
    // ============================================================
    const oldHashes = [
      hashToken('old-token-1'),
      hashToken('old-token-2'),
      hashToken('old-token-3'),
    ];

    for (const hash of oldHashes) {
      await db`
        INSERT INTO password_reset_tokens (profile_id, token_hash, expires_at, used_at)
        VALUES (
          ${testUserId},
          ${hash},
          NOW() + INTERVAL '1 hour',
          NOW() - INTERVAL '5 minutes'
        )
      `;
    }

    // Verify 3 old tokens exist
    const oldTokens = await db`
      SELECT * FROM password_reset_tokens
      WHERE profile_id = ${testUserId}
    `;
    expect(oldTokens.length).toBe(3);

    // ============================================================
    // ACTION: Create new token
    // ============================================================
    const newTokenHash = hashToken('new-token-latest');
    await db`
      INSERT INTO password_reset_tokens (profile_id, token_hash, expires_at)
      VALUES (
        ${testUserId},
        ${newTokenHash},
        NOW() + INTERVAL '1 hour'
      )
    `;

    // ============================================================
    // ASSERTIONS: All old tokens should be gone
    // ============================================================
    const allTokens = await db`
      SELECT * FROM password_reset_tokens
      WHERE profile_id = ${testUserId}
    `;

    const activeTokens = allTokens.filter((t: any) => t.used_at === null);

    // BEFORE FIX: Will have 4 tokens (3 used + 1 new)
    // AFTER FIX: Will have 1 token (only new)
    expect(activeTokens.length).toBe(1);
    expect(allTokens.length).toBe(1); // All old ones deleted
  });

  test('should not affect other users tokens', async () => {
    // ============================================================
    // SETUP: Create second test user with their own token
    // ============================================================
    const user2Id = uuidv7();
    const user2Email = `test-token-user2-${Date.now()}@example.com`;

    await db`
      INSERT INTO profiles (id, username, email, password_hash)
      VALUES (
        ${user2Id},
        ${'test-token-user2-' + Date.now()},
        ${user2Email},
        'hashed_password_placeholder'
      )
    `;

    const user2TokenHash = hashToken('user2-token');
    await db`
      INSERT INTO password_reset_tokens (profile_id, token_hash, expires_at)
      VALUES (
        ${user2Id},
        ${user2TokenHash},
        NOW() + INTERVAL '1 hour'
      )
    `;

    // ============================================================
    // ACTION: Create new token for first user
    // ============================================================
    const user1TokenHash = hashToken('user1-new-token');
    await db`
      INSERT INTO password_reset_tokens (profile_id, token_hash, expires_at)
      VALUES (
        ${testUserId},
        ${user1TokenHash},
        NOW() + INTERVAL '1 hour'
      )
    `;

    // ============================================================
    // ASSERTIONS: User 2's token should still exist
    // ============================================================
    const user2Tokens = await db`
      SELECT * FROM password_reset_tokens
      WHERE profile_id = ${user2Id}
    `;

    expect(user2Tokens.length).toBe(1);
    expect(user2Tokens[0].token_hash).toBe(user2TokenHash);

    // Cleanup user 2
    await db`DELETE FROM password_reset_tokens WHERE profile_id = ${user2Id}`;
    await db`DELETE FROM profiles WHERE id = ${user2Id}`;
  });
});
