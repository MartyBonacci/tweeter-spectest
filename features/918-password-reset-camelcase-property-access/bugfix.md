# Bug 918: Password Reset Token - CamelCase Property Access

**Status**: Fixed
**Priority**: Critical
**Type**: Logic Error (Property Access)
**Created**: 2025-10-16
**Fixed**: 2025-10-16

---

## Bug Description

Password reset tokens show "Token has already been used" error even with fresh, unused tokens. The database confirms tokens are VALID with `used_at=NULL`, but the server incorrectly reports them as already used.

---

## Root Cause Analysis

### The Problem

The database connection is configured with `transform: postgres.camel` (src/db/connection.ts:15), which automatically converts snake_case database columns to camelCase JavaScript properties:

```typescript
// src/db/connection.ts:13-15
const sql = postgres(databaseUrl, {
  transform: postgres.camel,  // ← Converts snake_case to camelCase
});
```

However, the code in src/routes/auth.ts was accessing token properties using snake_case names:

```typescript
// Lines 316, 325 (BEFORE FIX)
if (isTokenExpired(result.expires_at)) {  // ← Should be result.expiresAt
if (isTokenUsed(result.used_at)) {        // ← Should be result.usedAt
```

### Why This Caused the Bug

1. **Database columns**: `expires_at`, `used_at` (snake_case)
2. **After postgres.camel transform**: `expiresAt`, `usedAt` (camelCase properties)
3. **Code accessed**: `result.expires_at`, `result.used_at` (wrong property names)
4. **Result**: `undefined` (property doesn't exist with snake_case name)
5. **Function call**: `isTokenUsed(undefined)`
6. **Check**: `undefined !== null` → **`true`**
7. **Error**: Token incorrectly treated as "already used"

### Evidence

The `isTokenUsed()` function signature:

```typescript
// src/server/utils/password-reset-tokens.ts:71-73
export function isTokenUsed(usedAt: Date | null): boolean {
  return usedAt !== null;
}
```

JavaScript behavior:
```javascript
undefined !== null  // true  ← BUG! Treats unused token as used
null !== null       // false ← CORRECT for unused tokens
```

---

## Impact

### User Impact
- **Severity**: Critical
- **Affected Users**: All users attempting password reset
- **Failure Rate**: 100% of reset attempts
- **User Experience**: Complete failure of password reset feature

### Technical Impact
- **Affected Endpoints**:
  - GET /api/auth/verify-reset-token/:token (lines 316, 325)
  - POST /api/auth/reset-password (lines 390, 397, 410, 417, 422)
  - GET /api/auth/me (line 501)

---

## The Fix

### Changes Made

Fixed all snake_case property accesses to use camelCase (matching postgres.camel transform):

**File**: src/routes/auth.ts

#### Fix 1: Verify Reset Token Endpoint (Lines 316, 325)
```typescript
// BEFORE
if (isTokenExpired(result.expires_at)) {
if (isTokenUsed(result.used_at)) {

// AFTER
if (isTokenExpired(result.expiresAt)) {
if (isTokenUsed(result.usedAt)) {
```

#### Fix 2: Reset Password Endpoint (Lines 390, 397, 410, 417, 422)
```typescript
// BEFORE
if (isTokenExpired(tokenRecord.expires_at)) {
if (isTokenUsed(tokenRecord.used_at)) {
WHERE id = ${tokenRecord.user_id}
WHERE id = ${tokenRecord.token_id}
createSession(tokenRecord.user_id, ...)

// AFTER
if (isTokenExpired(tokenRecord.expiresAt)) {
if (isTokenUsed(tokenRecord.usedAt)) {
WHERE id = ${tokenRecord.userId}
WHERE id = ${tokenRecord.tokenId}
createSession(tokenRecord.userId, ...)
```

#### Fix 3: Get Current User Endpoint (Line 501)
```typescript
// BEFORE
avatarUrl: user.avatar_url,

// AFTER
avatarUrl: user.avatarUrl,
```

### Why This Works

After the fix:
1. Properties accessed with correct camelCase names (`expiresAt`, `usedAt`)
2. postgres.camel transform provides these properties
3. `isTokenUsed(null)` → `null !== null` → `false` ✅
4. Unused tokens correctly identified as valid

---

## Testing

### Manual Testing

1. Request password reset for test email
2. Click reset link from email
3. **Before Fix**: "Token has already been used" error
4. **After Fix**: Password reset form displays correctly ✅

### Expected Behavior

- Fresh tokens (used_at = NULL) → Token valid, show reset form
- Used tokens (used_at = timestamp) → "Already used" error
- Expired tokens (expires_at < NOW()) → "Expired" error

---

## Prevention

### Pattern to Follow

Always use camelCase when accessing database query results:

```typescript
// ✅ CORRECT - Use camelCase (matches postgres.camel transform)
result.expiresAt
result.usedAt
user.passwordHash
user.avatarUrl
user.createdAt

// ❌ WRONG - Do NOT use snake_case
result.expires_at
result.used_at
user.password_hash
user.avatar_url
user.created_at
```

### Configuration Reference

Database connection configured in src/db/connection.ts:
```typescript
transform: postgres.camel  // Converts all columns to camelCase
```

---

## Related Issues

This bug was discovered during investigation of:
- **Bug 916**: Multiple tokens per user (fixed - token cleanup)
- **Bug 917**: Cached error responses (fixed - cache-busting headers)
- **Bug 918**: THIS BUG - Property naming mismatch

All three bugs contributed to the "already used" error:
1. Bug 916: Database allowed multiple tokens
2. Bug 917: Frontend cached stale responses
3. Bug 918: Backend accessed wrong property names → undefined → false positive

---

## Metadata

**Workflow**: Bugfix (Ultrathinking Analysis)
**Discovery Method**: Deep code analysis of postgres.camel transform behavior
**Fix Complexity**: Low (property name changes only)
**Risk**: Low (no logic changes, only property access)
**Test Coverage**: Manual testing (all scenarios pass)
