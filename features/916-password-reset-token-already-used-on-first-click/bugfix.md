# Bug 916: Password Reset Token Shows "Already Used" Error on First Click

**Status**: Active
**Created**: 2025-10-16
**Priority**: High
**Severity**: Major

## Symptoms

Password reset link shows "Token has already been used" error immediately on first click, preventing users from resetting their password.

- User receives reset link via email
- Clicks link for the first time
- Sees error page: "Reset Link Already Used - Token has already been used"
- Cannot reset password

## Reproduction Steps

1. Go to /forgot-password
2. Enter email and submit
3. Check email for reset link
4. Click the reset link from email (first time)
5. Error appears: "Reset Link Already Used - Token has already been used"

**Expected Behavior**: Should show password reset form with email pre-filled

**Actual Behavior**: Shows "already used" error page immediately

## Root Cause Analysis

**Hypothesis 1: Stale Database State (Most Likely)**
- Previous testing may have created tokens that are marked as used
- Database contains tokens with `used_at` timestamp already set
- When user requests new reset, email contains old token hash that was previously used

**Hypothesis 2: Logic Bug in Token Verification**
- Loader in `app/pages/ResetPassword.tsx` calls `GET /api/auth/verify-reset-token/:token`
- Endpoint in `src/routes/auth.ts:271-335` checks `isTokenUsed(result.used_at)`
- If logic error exists, might incorrectly mark fresh tokens as used

**Hypothesis 3: Race Condition**
- Loader and action both verify token
- If both run simultaneously, could cause double-marking
- Unlikely given React Router's sequential execution model

**Code Locations:**
- `src/routes/auth.ts:271-335` - Token verification endpoint
- `src/routes/auth.ts:342-450` - Password reset endpoint
- `app/pages/ResetPassword.tsx:24-58` - Loader calling verify endpoint
- `src/server/utils/password-reset-tokens.ts:39-42` - isTokenUsed function

**Conditions Required:**
- Database contains old password_reset_tokens records
- Tokens have `used_at` timestamp set from previous testing

## Impact Assessment

**Affected Users**: All users attempting password reset (100% failure rate)

**Affected Features**:
- Password reset flow: Completely broken
- User account recovery: Blocked

**Severity Justification**:
- Blocks critical security feature (password reset)
- No workaround available for users
- Requires database investigation to diagnose

**Workaround Available**: No - Database cleanup required

## Regression Test Requirements

Test must verify token verification logic and database state handling:

1. **Fresh Token Test**: Create new token, verify it's not marked as used
2. **Used Token Detection**: Mark token as used, verify detection works
3. **Database State Isolation**: Ensure old tokens don't interfere with new ones

**Test Success Criteria**:
- ✅ Test fails before fix (reproduces "already used" error on fresh token)
- ✅ Test passes after fix (fresh token correctly identified as unused)
- ✅ No new regressions in password reset flow

## Proposed Solution

**Primary Fix: Database Cleanup + Token Generation Uniqueness**

1. **Immediate Fix**: Clean up stale tokens in database
   ```sql
   DELETE FROM password_reset_tokens WHERE used_at IS NOT NULL;
   DELETE FROM password_reset_tokens WHERE expires_at < NOW();
   ```

2. **Root Cause Fix**: Ensure token generation creates truly unique tokens
   - Verify `generateResetToken()` uses `crypto.randomUUID()` correctly
   - Add database constraint to prevent duplicate token_hash
   - Consider adding created_at timestamp to token generation

3. **Validation Fix**: Add database query logging to verify token lookup
   - Log token_hash being queried
   - Log result.used_at value
   - Verify isTokenUsed() receives correct value

**Changes Required**:
- `src/routes/auth.ts`: Add logging to verify-reset-token endpoint (lines 271-335)
- `src/server/utils/password-reset-tokens.ts`: Verify isTokenUsed logic (lines 39-42)
- Database: Clean up stale tokens
- `migrations/004_create_password_reset_tokens_table.sql`: Consider adding UNIQUE constraint on token_hash

**Risks**:
- Database cleanup will invalidate any legitimately pending reset tokens
- Users mid-reset will need to request new link

**Alternative Approaches**:
1. **Token Expiration Only**: Rely only on expires_at, ignore used_at
   - Pros: Simpler logic
   - Cons: Doesn't prevent token reuse attacks
   - Not chosen: Security risk

2. **Separate Verification from Usage**: Don't check used_at during verification
   - Pros: Allows form to load
   - Cons: Vulnerable to race conditions
   - Not chosen: Security concern

---

## Tech Stack Compliance

**Tech Stack File**: /memory/tech-stack.md
**Validation Status**: Pending

**Expected Compliance**:
- PostgreSQL database queries (postgres package)
- TypeScript strict mode
- Functional programming patterns
- Zod validation maintained

---

## Metadata

**Workflow**: Bugfix (regression-test-first)
**Created By**: SpecLab Plugin v1.0.0 + Claude Code
**Smart Integration**: Sequential (no SpecTest/SpecSwarm parallel mode)
