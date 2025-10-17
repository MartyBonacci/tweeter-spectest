# Bug 917: Password Reset Shows Cached "Already Used" Error with Fresh Tokens

**Status**: Fixed
**Created**: 2025-10-16
**Priority**: High
**Severity**: Major

## Symptoms

Password reset shows "Reset Link Already Used" error even when database confirms token is valid with `used_at = NULL`. The frontend loader serves cached verification responses instead of fetching fresh token status.

- Database query shows token is valid (used_at IS NULL)
- User clicks fresh reset link for first time
- Frontend shows "Reset Link Already Used" error
- Error persists across page refreshes

## Reproduction Steps

1. Request password reset via /forgot-password
2. Click reset link from email (first time)
3. Database shows token with `used_at = NULL` (valid)
4. Frontend shows "Reset Link Already Used" error
5. Refresh page - same error persists

**Expected Behavior**: Fresh token validation on every page load

**Actual Behavior**: Cached "already used" response served by browser/React Router

## Root Cause Analysis

**Root Cause: Missing Cache-Control Headers in Loader Fetch**

The loader in `app/pages/ResetPassword.tsx` (lines 36-41, before fix) called the verification endpoint without cache-busting headers:

```typescript
// BEFORE FIX (missing cache control):
const response = await fetch(getApiUrl(`/api/auth/verify-reset-token/${token}`), {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
});
```

**Why This Caused the Bug:**
1. Browser/React Router cached GET request responses by default
2. If user previously tried a reset with old token, browser cached "already used" response
3. When new reset link clicked, browser served cached error instead of fresh API call
4. Database had valid fresh token, but frontend never checked it

**Code Location:**
- `app/pages/ResetPassword.tsx:36-47` - Loader fetch (missing cache headers)
- Browser cache behavior for GET requests
- React Router loader caching mechanism

## Impact Assessment

**Affected Users**: All users attempting password reset after previous attempts

**Affected Features**:
- Password reset flow: Broken for repeat users
- Account recovery: Blocked after first attempt

**Severity Justification**:
- Critical security feature completely broken for returning users
- No workaround except clearing browser cache manually
- Affects user trust in password reset system

**Workaround Available**: Yes (manual) - Clear browser cache before reset attempt

## Regression Test Requirements

Test must verify cache-busting headers prevent stale responses:

1. **Fresh Fetch Test**: Verify token verification always hits API, never cache
2. **Multiple Request Test**: Request reset twice, verify both links work independently
3. **Cache Header Test**: Verify `Cache-Control: no-store` header present in request

**Test Success Criteria**:
- ✅ Test fails before fix (cached response returned)
- ✅ Test passes after fix (fresh API call every time)
- ✅ No stale "already used" errors with valid tokens

## Proposed Solution

**Primary Fix: Add Cache-Busting Headers to Loader Fetch**

Add HTTP cache-control headers to force fresh verification:

```typescript
const response = await fetch(getApiUrl(`/api/auth/verify-reset-token/${token}`), {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
  },
  credentials: 'include',
  cache: 'no-store', // Fetch API cache option
});
```

**Cache-Control Header Explanation:**
- `no-cache`: Revalidate with server before using cached copy
- `no-store`: Don't store response in cache at all
- `must-revalidate`: Always check with server, even if cached
- `Pragma: no-cache`: HTTP/1.0 backward compatibility
- `cache: 'no-store'`: Fetch API-level cache bypass

**Changes Required**:
- `app/pages/ResetPassword.tsx`: Add cache headers to loader fetch (lines 38-46)
- Comment explaining why cache-busting is critical

**Risks**: None - Only makes requests stricter, no breaking changes

**Alternative Approaches**:
1. **Server-side cache headers**: Add `Cache-Control` to API response
   - Pros: Centralized control
   - Cons: Doesn't prevent client-side caching by fetch API
   - Not chosen: Client-side headers more reliable

2. **Query string cache buster**: Add `?timestamp=${Date.now()}`
   - Pros: Simple
   - Cons: Hacky, doesn't express intent
   - Not chosen: Proper headers are cleaner

3. **POST instead of GET**: Change verification to POST request
   - Pros: POST not cached by default
   - Cons: Violates REST semantics (verification is read-only)
   - Not chosen: GET is semantically correct

---

## Tech Stack Compliance

**Tech Stack File**: /memory/tech-stack.md
**Validation Status**: Compliant

**Compliance Check:**
- ✅ React Router v7 loader pattern maintained
- ✅ TypeScript strict mode
- ✅ Functional programming (no classes)
- ✅ Fetch API standard headers

---

## Fix Verification

**Applied Fix** (lines 37-46):
```typescript
// IMPORTANT: Add cache-busting headers to prevent stale "already used" errors
const response = await fetch(getApiUrl(`/api/auth/verify-reset-token/${token}`), {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
  },
  credentials: 'include',
  cache: 'no-store', // Force fresh verification every time
});
```

**Status**: ✅ Fixed

---

## Metadata

**Workflow**: Bugfix (regression-test-first)
**Created By**: SpecLab Plugin v1.0.0 + Claude Code
**Smart Integration**: Sequential (no SpecTest/SpecSwarm parallel mode)
**Related Bug**: Bug 916 (token cleanup) - This bug became apparent after 916 was fixed
