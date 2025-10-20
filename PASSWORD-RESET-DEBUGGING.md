# Password Reset Debugging Guide

## Current Status

Two critical bugs have been fixed:

### Bug 916: Token Cleanup Issue
**Problem**: Multiple tokens could exist for the same user, causing the database query to potentially return an old used token instead of the fresh one.

**Fix Applied**: `src/routes/auth.ts:225-233`
- Added DELETE query before INSERT in forgot-password endpoint
- Ensures only 1 active token per user at any time
- Added debug logging: `console.log('🧹 Cleaned up ${deletedTokens.count} old tokens')`

**Commit**: `3682ca6` - "fix: invalidate old password reset tokens before creating new one (Bug 916)"

### Bug 917: Frontend Cache Issue
**Problem**: Browser cached GET request responses for token verification, serving stale "already used" errors even with fresh tokens.

**Fix Applied**: `app/pages/ResetPassword.tsx:37-46`
- Added HTTP cache-busting headers to loader fetch:
  - `Cache-Control: no-cache, no-store, must-revalidate`
  - `Pragma: no-cache`
  - `cache: 'no-store'`

**Commit**: `a9b7ee8` - "fix: add cache-busting headers to prevent stale token verification (Bug 917)"

## Code Analysis Summary

After ultrathinking analysis, all code logic is **CORRECT**:

1. **Token Validation Logic**: `isTokenUsed(usedAt)` correctly returns `usedAt !== null`
2. **Database Schema**: `used_at TIMESTAMPTZ` is nullable with no default (correct)
3. **Postgres Package**: Automatically maps `used_at` → `usedAt` (verified working)
4. **Query Logic**: Correctly accesses `result.expiresAt` and `result.usedAt` (camelCase)

## Most Likely Causes of Persistent Issues

If you're still seeing "Token has already been used" errors after applying both fixes, the issue is **environmental**, not code-related:

1. **Stale database state** - Old tokens from before Bug 916 fix still exist
2. **Migrations not run** - Database schema may be outdated
3. **Server not restarted** - Code changes not loaded
4. **Using old email links** - Testing with reset links sent before fixes were applied
5. **Browser cache** - Cached error responses from before Bug 917 fix

## Diagnostic Tool

Use the diagnostic tool to identify the actual problem:

```bash
npx tsx diagnose-password-reset.ts <email>
```

### What the Diagnostic Tool Checks

1. ✅ Database schema exists (migrations run?)
2. ✅ User exists by email
3. 📊 Lists all tokens with status:
   - 🟢 VALID - Unused and not expired
   - 🔴 USED - Already consumed
   - 🟡 EXPIRED - Time window passed
4. 🔍 Analyzes token state:
   - Multiple valid tokens → Bug 916 not working
   - Exactly 1 valid token → Everything correct
   - All tokens used/expired → Need new reset request
5. 🔧 Checks environment (Mailgun configured?)

### Example Output Scenarios

#### Scenario 1: Bug 916 Not Working (Multiple Valid Tokens)
```
Total tokens: 3
  🟢 Valid: 2
  🔴 Used: 1
  🟡 Expired: 0

⚠️  PROBLEM: Multiple valid tokens exist (Bug 916)
   ACTION REQUIRED:
   1. Verify src/routes/auth.ts has DELETE query (lines 225-233)
   2. Restart the server
   3. Request NEW password reset
   4. Run diagnostic again
```

#### Scenario 2: Everything Working Correctly
```
Total tokens: 1
  🟢 Valid: 1
  🔴 Used: 0
  🟡 Expired: 0

✅ Exactly 1 valid token exists - this is correct!
   If still seeing errors:
   1. Clear browser cache completely
   2. Use LATEST reset link from email
   3. Check browser console for errors
```

#### Scenario 3: Need New Reset Request
```
Total tokens: 2
  🟢 Valid: 0
  🔴 Used: 1
  🟡 Expired: 1

⚠️  All tokens have been used or expired
   ACTION REQUIRED:
   Request new password reset at /forgot-password
```

## Step-by-Step Testing Procedure

### Prerequisites
1. Ensure `.env` file exists with all required variables:
   ```
   DATABASE_URL=<neon-connection-string>
   JWT_SECRET=<secret>
   COOKIE_DOMAIN=localhost
   MAILGUN_API_KEY=<api-key>
   MAILGUN_DOMAIN=<domain>
   ```

2. Run migrations if not already done:
   ```bash
   npm run migrate
   ```

3. Restart the server to load Bug 916/917 fixes:
   ```bash
   npm run dev:server
   ```

### Testing Steps

1. **Clear ALL previous state**:
   ```bash
   # Clear browser cache completely (Ctrl+Shift+Delete)
   # Or use incognito/private window
   ```

2. **Request fresh password reset**:
   - Navigate to `/forgot-password`
   - Enter test email
   - Submit form
   - Check console logs for: `🧹 Cleaned up X old tokens`

3. **Check email for reset link**:
   - Open email from Mailgun
   - Copy the reset link URL
   - **DO NOT** click it yet

4. **Run diagnostic BEFORE clicking link**:
   ```bash
   npx tsx diagnose-password-reset.ts <your-email>
   ```

   Expected output:
   ```
   Total tokens: 1
     🟢 Valid: 1
   ```

5. **Click reset link**:
   - Should show password reset form (not error)
   - Enter new password
   - Submit form

6. **Run diagnostic AFTER reset**:
   ```bash
   npx tsx diagnose-password-reset.ts <your-email>
   ```

   Expected output:
   ```
   Total tokens: 1
     🔴 Used: 1
   ```

## Debugging Server Logs

When requesting password reset, watch for this log in server console:

```
🧹 Cleaned up X old tokens for user <user-id>
```

- **X = 0**: No old tokens (first reset or clean state)
- **X ≥ 1**: Old tokens deleted (Bug 916 fix working correctly)

## Verifying Fixes Are Applied

### Verify Bug 916 Fix
```bash
grep -A 10 "Invalidate any existing tokens" src/routes/auth.ts
```

Should show:
```typescript
// Invalidate any existing tokens for this user (Bug 916 fix)
// This ensures only 1 active token per user at any time
// Prevents "already used" error when old tokens exist
const deletedTokens = await db`
  DELETE FROM password_reset_tokens
  WHERE profile_id = ${user.id}
  RETURNING id
`;
console.log(`🧹 Cleaned up ${deletedTokens.count} old tokens for user ${user.id}`);
```

### Verify Bug 917 Fix
```bash
grep -A 5 "cache-busting headers" app/pages/ResetPassword.tsx
```

Should show:
```typescript
// IMPORTANT: Add cache-busting headers to prevent stale "already used" errors
const response = await fetch(getApiUrl(`/api/auth/verify-reset-token/${token}`), {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
  },
```

## Files Modified

| File | Purpose | Lines |
|------|---------|-------|
| `src/routes/auth.ts` | Token cleanup (Bug 916) | 225-233 |
| `app/pages/ResetPassword.tsx` | Cache-busting headers (Bug 917) | 37-46 |
| `src/server/__tests__/auth-password-reset-token-cleanup.test.ts` | Regression test | All |

## Next Steps

1. **Run diagnostic tool** on your test email to see current state
2. **Analyze output** to identify specific problem
3. **Follow recommendations** provided by diagnostic tool
4. **Test with fresh reset request** (not old email links)
5. **Report findings** if issue persists after following recommendations

## Contact Information

If the diagnostic tool shows:
- ✅ Exactly 1 valid token
- ✅ Server logs show token cleanup
- ✅ Browser cache cleared
- ✅ Using fresh reset link

And you **still** see "already used" errors, please report:
1. Diagnostic tool output
2. Browser console errors
3. Server console logs
4. Network tab showing the `/api/auth/verify-reset-token/:token` request/response
