# Tasks: Bug 916 - Password Reset Token Already Used on First Click

**Workflow**: Bugfix (Regression-Test-First)
**Status**: Active
**Created**: 2025-10-16

---

## Execution Strategy

**Mode**: Sequential (regression-test-first methodology)
**Smart Integration**: Basic mode (no SpecTest/SpecSwarm)

---

## Phase 1: Regression Test Creation

### T001: Write Regression Test
**Description**: Implement integration test that proves old tokens interfere with new tokens
**File**: `src/server/__tests__/auth-password-reset-token-cleanup.test.ts`
**Test Logic**:
1. Create test user
2. Insert old used token for user
3. Request new password reset
4. Assert only 1 active (unused) token exists
**Validation**: Test code follows regression-test.md specification
**Parallel**: No (foundational)
**Expected**: Test file created with proper setup/teardown

### T002: Verify Test Fails
**Description**: Run regression test and confirm it fails (proves bug exists)
**Command**: `npx vitest run src/server/__tests__/auth-password-reset-token-cleanup.test.ts`
**Expected**: Test fails with "Expected 1 active token, found 2" or similar
**Validation**: Test failure proves multiple tokens can exist for same user
**Parallel**: No (depends on T001)
**Success Criteria**: Test fails showing old token not cleaned up

---

## Phase 2: Bug Fix Implementation

### T003: Add Token Cleanup to Forgot Password Endpoint
**Description**: Invalidate old tokens before creating new token in `POST /api/auth/forgot-password`
**File**: `src/routes/auth.ts` (lines 218-252)
**Changes Required**:
1. Before line 226 (`INSERT INTO password_reset_tokens`), add cleanup query:
   ```typescript
   // Invalidate any existing tokens for this user
   await db`
     DELETE FROM password_reset_tokens
     WHERE profile_id = ${user.id}
   `;
   ```
2. Alternative (soft delete): UPDATE existing tokens to set `used_at = NOW()`
3. Add comment explaining cleanup prevents multiple active tokens

**Tech Stack Validation**: Must use postgres package parameterized queries
**Parallel**: No (core fix)
**Implementation Notes**:
- Delete approach is simpler and cleaner
- Ensures only 1 active token per user at any time
- Doesn't break expired token cleanup job

### T004: Verify Test Passes
**Description**: Run regression test and confirm it passes (proves bug fixed)
**Command**: `npx vitest run src/server/__tests__/auth-password-reset-token-cleanup.test.ts`
**Expected**: Test passes - only 1 active token exists after requesting new reset
**Validation**: Test success proves old tokens cleaned up before new token created
**Parallel**: No (depends on T003)
**Success Criteria**: All assertions pass

---

## Phase 3: Regression Validation

### T005: Run Full Test Suite
**Description**: Verify no new regressions introduced
**Command**: `npx vitest run`
**Expected**: All tests pass (existing + new regression test)
**Validation**: 100% test pass rate
**Parallel**: No (final validation)
**Success Criteria**: No test failures

### T006: Manual Testing
**Description**: Manually test password reset flow end-to-end
**Steps**:
1. Start dev server: `npm run dev:server`
2. Go to `/forgot-password`
3. Enter test email
4. Click reset link from email (or copy from logs if email not configured)
5. Verify password reset form loads (no "already used" error)
6. Complete password reset
7. Request another reset for same email
8. Verify NEW link works (old link shows "already used")
**Expected**: First reset link always works, only after use does it show "already used"
**Parallel**: No (manual validation)

### T007: Add Logging for Debugging
**Description**: Add temporary debug logging to verify fix in production
**File**: `src/routes/auth.ts`
**Changes**:
```typescript
// After cleanup query in forgot-password endpoint
const deletedCount = await db`
  DELETE FROM password_reset_tokens
  WHERE profile_id = ${user.id}
  RETURNING id
`;
console.log(`🧹 Cleaned up ${deletedCount.count} old tokens for user ${user.id}`);
```
**Note**: Remove or convert to proper logging after verification
**Parallel**: Can be done with T003

---

## Summary

**Total Tasks**: 7
**Estimated Time**: 1-2 hours
**Parallel Opportunities**: T007 can be combined with T003

**Success Criteria**:
- ✅ Regression test created (T001)
- ✅ Test failed before fix (proved bug) (T002)
- ✅ Token cleanup implemented (T003)
- ✅ Test passed after fix (proved solution) (T004)
- ✅ No new regressions (T005)
- ✅ Manual testing confirms fix (T006)
- ✅ Debug logging added (T007)

---

## Root Cause Summary

**Bug**: `POST /api/auth/forgot-password` creates new tokens without invalidating old tokens for the same user. If a user requests multiple password resets, multiple tokens exist in the database. The verify endpoint may return an old (used) token instead of the newly created one.

**Fix**: Delete or invalidate all existing tokens for a user before creating a new reset token. This ensures only 1 active token per user at any time.

**Prevention**: Regression test ensures future changes can't reintroduce this bug.
