# Regression Test: Bug 916

**Purpose**: Prove bug exists (old tokens interfere with new tokens), validate fix, prevent future regressions

**Test Type**: Regression Test
**Created**: 2025-10-16

---

## Test Objective

Write a test that:
1. ✅ **Fails before fix** (proves old tokens interfere with new tokens)
2. ✅ **Passes after fix** (proves old tokens invalidated before creating new one)
3. ✅ **Prevents regression** (catches if multiple active tokens allowed again)

---

## Test Specification

### Test Setup

**Prerequisites**:
- Database connection available
- Test user exists in profiles table
- password_reset_tokens table exists

**Initial State**:
1. Create test user: `test-token@example.com`
2. Create OLD token in database:
   ```sql
   INSERT INTO password_reset_tokens (profile_id, token_hash, expires_at, used_at)
   VALUES (
     [test_user_id],
     'old_token_hash_12345',
     NOW() + INTERVAL '1 hour',
     NOW() - INTERVAL '10 minutes'  -- Already used!
   );
   ```
3. Verify old token exists and is marked as used

### Test Execution

**Scenario**: Request new password reset while old (used) token exists

1. Call `POST /api/auth/forgot-password` with `test-token@example.com`
2. Extract new token from response/email (or mock email service)
3. Call `GET /api/auth/verify-reset-token/:new_token`
4. Observe response

### Test Assertions

**Before Fix** (Test MUST fail):
- ❌ Assertion 1: `GET /api/auth/verify-reset-token/:new_token` returns 410 "Token has already been used"
- ❌ Assertion 2: Database query returns old token instead of new token
- ❌ Assertion 3: Multiple tokens exist for same profile_id

**After Fix** (Test MUST pass):
- ✅ Assertion 1: `GET /api/auth/verify-reset-token/:new_token` returns 200 with `valid: true`
- ✅ Assertion 2: Old token is invalidated or deleted
- ✅ Assertion 3: Only one active (unused) token exists for profile_id
- ✅ Assertion 4: New token has `used_at = NULL`

### Test Teardown

**Cleanup**:
- Delete test user from profiles
- Delete all test tokens from password_reset_tokens
- Reset rate_limits if needed

---

## Test Implementation

### Test File Location

**File**: `src/server/__tests__/auth-password-reset-token-cleanup.test.ts`

**Function/Test Name**: `test_bug_916_old_tokens_invalidated_before_new_token_creation`

### Test Code Structure

```typescript
describe('Bug 916: Password Reset Token Cleanup', () => {
  let testUserId: string;
  let db: Sql;

  beforeAll(async () => {
    // Setup database connection
    // Create test user
  });

  afterAll(async () => {
    // Cleanup test data
  });

  test('should invalidate old tokens when creating new token', async () => {
    // SETUP: Create old used token
    await db`
      INSERT INTO password_reset_tokens (profile_id, token_hash, expires_at, used_at)
      VALUES (${testUserId}, 'old_hash', NOW() + INTERVAL '1 hour', NOW())
    `;

    // Verify old token exists
    const [oldToken] = await db`
      SELECT * FROM password_reset_tokens
      WHERE profile_id = ${testUserId}
    `;
    expect(oldToken.used_at).not.toBeNull();

    // ACTION: Request new password reset
    const response = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'test-token@example.com' });

    expect(response.status).toBe(200);

    // Get newly created token from database
    const tokens = await db`
      SELECT * FROM password_reset_tokens
      WHERE profile_id = ${testUserId}
      ORDER BY created_at DESC
    `;

    // ASSERTION 1: Old token should be deleted or invalidated
    const activeTokens = tokens.filter(t => t.used_at === null);
    expect(activeTokens.length).toBe(1); // Only new token

    // ASSERTION 2: New token should be unused
    const newToken = tokens[0];
    expect(newToken.used_at).toBeNull();

    // ASSERTION 3: Verify new token works
    // (Requires extracting actual token from email mock)
    // const verifyResponse = await request(app)
    //   .get(`/api/auth/verify-reset-token/${actualNewToken}`);
    // expect(verifyResponse.status).toBe(200);
    // expect(verifyResponse.body.valid).toBe(true);
  });
});
```

### Test Validation Criteria

**Before Fix**:
- ❌ Test MUST fail at "Only 1 active token" assertion
- ❌ Multiple tokens will exist (old used + new unused)
- ❌ If database query uses wrong token, verify endpoint will fail

**After Fix**:
- ✅ Test MUST pass (old tokens deleted/invalidated before new one created)
- ✅ All existing tests still pass (no regressions)
- ✅ Only one active token per profile_id at any time

---

## Edge Cases to Test

**Additional scenarios to validate**:

1. **Multiple old tokens**: User requested reset 3 times, all should be cleaned up
2. **Expired tokens**: Old expired tokens should also be cleaned up
3. **Different users**: Cleanup shouldn't affect other users' tokens
4. **Concurrent requests**: Two simultaneous reset requests for same user
5. **No old tokens**: First-time reset (no old tokens to clean up)

### Edge Case Test Structure

```typescript
test('should handle multiple old tokens', async () => {
  // Create 3 old tokens
  // Request new reset
  // Assert only 1 active token remains
});

test('should clean up expired tokens too', async () => {
  // Create expired token
  // Request new reset
  // Assert expired token deleted
});

test('should not affect other users tokens', async () => {
  // Create tokens for User A and User B
  // Request reset for User A
  // Assert User B's tokens unchanged
});
```

---

## Metadata

**Workflow**: Bugfix (regression-test-first)
**Created By**: SpecLab Plugin v1.0.0 + Claude Code
**Root Cause**: Missing token cleanup before creating new token (allows multiple active tokens per user)
