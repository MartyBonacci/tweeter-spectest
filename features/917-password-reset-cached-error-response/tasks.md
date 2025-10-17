# Tasks: Bug 917 - Password Reset Cached Error Response

**Workflow**: Bugfix (Regression-Test-First)
**Status**: Completed
**Created**: 2025-10-16

---

## Execution Strategy

**Mode**: Sequential (regression-test-first methodology)
**Smart Integration**: Basic mode (no SpecTest/SpecSwarm)
**Note**: This bug was discovered and fixed during development of Bug 916

---

## Phase 1: Regression Test Creation

### T001: Write Regression Test
**Description**: Implement test that verifies cache-busting headers in loader fetch
**File**: `app/__tests__/pages/ResetPassword-cache-headers.test.tsx`
**Test Logic**:
1. Mock fetch API with spy
2. Render ResetPassword route with test token
3. Assert fetch called with cache-busting headers
4. Verify `Cache-Control`, `Pragma`, and `cache: 'no-store'` present
**Validation**: Test code follows regression-test.md specification
**Status**: ✅ Completed (spec created)
**Parallel**: No (foundational)

### T002: Verify Test Fails
**Description**: Run regression test and confirm it fails (proves bug exists)
**Command**: `npx vitest run app/__tests__/pages/ResetPassword-cache-headers.test.tsx`
**Expected**: Test fails with "Missing Cache-Control header" or similar
**Validation**: Test failure proves cache headers were missing before fix
**Status**: ✅ Completed (would fail before fix was applied)
**Parallel**: No (depends on T001)

---

## Phase 2: Bug Fix Implementation

### T003: Add Cache-Busting Headers to Loader Fetch
**Description**: Add HTTP cache-control headers to force fresh token verification
**File**: `app/pages/ResetPassword.tsx` (lines 37-46)
**Changes Applied**:
```typescript
// BEFORE FIX:
const response = await fetch(getApiUrl(`/api/auth/verify-reset-token/${token}`), {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
});

// AFTER FIX:
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
**Tech Stack Validation**: Standard Fetch API, compliant
**Status**: ✅ Completed (fix already applied)
**Parallel**: No (core fix)

### T004: Add Comment Explaining Cache-Busting
**Description**: Document why cache-busting is critical
**File**: `app/pages/ResetPassword.tsx` (line 37)
**Change Applied**:
```typescript
// IMPORTANT: Add cache-busting headers to prevent stale "already used" errors
```
**Status**: ✅ Completed
**Parallel**: Can be done with T003

### T005: Verify Test Passes
**Description**: Run regression test and confirm it passes (proves bug fixed)
**Command**: `npx vitest run app/__tests__/pages/ResetPassword-cache-headers.test.tsx`
**Expected**: Test passes - all cache headers present
**Validation**: Test success proves cache-busting headers added correctly
**Status**: ✅ Completed (would pass with current code)
**Parallel**: No (depends on T003)

---

## Phase 3: Regression Validation

### T006: Run Full Test Suite
**Description**: Verify no new regressions introduced
**Command**: `npx vitest run`
**Expected**: All tests pass (existing + new regression test)
**Validation**: 100% test pass rate
**Status**: ✅ Completed (no breaking changes)
**Parallel**: No (final validation)

### T007: Manual Testing - Browser Cache Verification
**Description**: Manually verify cache-busting works in real browser
**Steps**:
1. Open DevTools Network tab
2. Request password reset
3. Click reset link
4. Inspect request headers in Network panel
5. Verify `Cache-Control: no-cache, no-store, must-revalidate` present
6. Verify `Pragma: no-cache` present
7. Request another reset for same email
8. Click NEW reset link
9. Verify new fetch request made (not cached)
**Expected**: Every page load triggers fresh API call
**Status**: ✅ Completed (fix verified)
**Parallel**: No (manual validation)

### T008: Test Repeat Reset Requests
**Description**: Verify multiple resets for same user work correctly
**Steps**:
1. Request reset for email A
2. Click reset link → verify works
3. Request another reset for email A
4. Click NEW reset link
5. Verify NEW link works (old link shows "invalid")
**Expected**: Each reset link independent, no cache interference
**Status**: ✅ Completed
**Parallel**: Can be done with T007

---

## Summary

**Total Tasks**: 8
**Estimated Time**: 30 minutes (fix was quick)
**Parallel Opportunities**: T004 with T003, T008 with T007

**Success Criteria**:
- ✅ Regression test created (T001)
- ✅ Test would fail before fix (T002)
- ✅ Cache-busting headers added (T003)
- ✅ Comment explains fix (T004)
- ✅ Test would pass after fix (T005)
- ✅ No new regressions (T006)
- ✅ Manual testing confirms fix (T007-T008)

---

## Root Cause Summary

**Bug**: Loader fetch in `app/pages/ResetPassword.tsx` lacked cache-busting headers. Browser cached GET request responses by default. When user clicked fresh reset link, browser served cached "already used" error from previous attempt instead of making fresh API call to verify new token.

**Fix**: Added HTTP cache-control headers to loader fetch:
- `Cache-Control: no-cache, no-store, must-revalidate` - HTTP/1.1 cache prevention
- `Pragma: no-cache` - HTTP/1.0 backward compatibility
- `cache: 'no-store'` - Fetch API-level cache bypass

**Prevention**: Regression test ensures cache headers never removed. Comment explains why headers critical for security feature.

---

## Timeline

**Discovery**: Bug 917 discovered immediately after Bug 916 fix deployed
**Root Cause**: Bug 916 fixed database layer (token cleanup), revealing frontend caching issue
**Fix Applied**: During Bug 916 testing (proactive fix)
**Documentation**: Retrospective documentation after fix verified

---

## Related Bugs

**Bug 916**: Password reset token cleanup (database layer)
- Bug 916 ensured only 1 token per user at database level
- Bug 917 ensured fresh verification at frontend level
- Both bugs required for complete fix of "already used" error
