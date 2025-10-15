# Tasks: Bug 907 - CORS Authentication Cookies

**Workflow**: Bugfix (Regression-Test-First)
**Status**: Active
**Created**: 2025-10-14

---

## Execution Strategy

**Mode**: Sequential (regression-test-first requires ordered execution)
**Smart Integration**: Basic mode (no SpecSwarm/SpecTest detected in this project)

---

## Phase 1: Regression Test Creation

### T001: Write Unit Tests for Cookie Generation
**Description**: Create unit tests for `createSession` and `destroySession` functions in `src/auth/session.test.ts`

**File to Create**: `src/auth/session.test.ts`

**Test Cases**:
1. Development mode: `SameSite=None`, `Secure`, no `Domain` attribute
2. Production mode: `SameSite=Lax`, `Secure`, `Domain=cookieDomain`
3. Destroy session: Same SameSite/Domain rules as creation
4. Cookie string format validation

**Validation**:
- Test file created with 6+ test cases
- Tests cover both `createSession` and `destroySession`
- Tests check for presence/absence of cookie attributes
- Tests distinguish between development and production modes

**Parallel**: No (foundational)

---

### T002: Verify Unit Tests Fail (Prove Bug Exists)
**Description**: Run unit tests and confirm they fail, proving current cookie configuration is wrong

**Command**:
```bash
cd /home/marty/code-projects/tweeter-spectest
npm run test -- src/auth/session.test.ts
```

**Expected Result**: Tests MUST fail with errors like:
- `Expected cookie to contain 'SameSite=None' but found 'SameSite=Lax'`
- `Expected cookie not to contain 'Domain=' but found 'Domain=localhost'`

**Validation**:
- At least 2-3 tests fail
- Failures prove current implementation has wrong cookie attributes
- If tests pass, test implementation is wrong (not testing the bug)

**Parallel**: No (depends on T001)

---

### T003: Manual Browser Test - Before Fix
**Description**: Perform manual browser testing to document current broken behavior

**Steps**: Follow checklist in `regression-test.md` Part B

**Key Checks**:
1. Clear all localhost cookies in DevTools
2. Sign in and inspect Set-Cookie header in Network tab
3. Verify cookie attributes are wrong (`SameSite=Lax`, `Domain=localhost`)
4. Verify navbar stays in guest state after sign-in
5. Verify like button causes blank page

**Expected Results** (proves bug):
- ❌ Set-Cookie has `SameSite=Lax` (wrong)
- ❌ Set-Cookie has `Domain=localhost` (problematic)
- ❌ Navbar shows "Sign In"/"Sign Up" after successful sign-in
- ❌ Like button navigates to blank page

**Validation**: Screenshots or notes documenting all 5 failures

**Parallel**: No (requires T002 completion for context)

---

## Phase 2: Bug Fix Implementation

### T004: Fix Cookie Configuration in session.ts
**Description**: Implement the cookie configuration fix specified in `bugfix.md`

**File**: `src/auth/session.ts`

**Changes**:

**Change 1** - Update `createSession` function (lines 26-52):
```typescript
// Remove hardcoded SameSite=Lax and Domain attributes
// Replace with conditional logic based on isProduction

const attributes = [
  `auth_token=${token}`,
  `Max-Age=${COOKIE_MAX_AGE}`,
  'Path=/',
  'HttpOnly',
];

if (isProduction) {
  // Production: use domain, SameSite=Lax, and Secure
  attributes.push(`Domain=${cookieDomain}`);
  attributes.push('SameSite=Lax');
  attributes.push('Secure');
} else {
  // Development: no domain (host-only), SameSite=None for cross-origin
  attributes.push('SameSite=None');
  attributes.push('Secure');
}
```

**Change 2** - Update `destroySession` function signature (line 61):
```typescript
export function destroySession(cookieDomain: string, isProduction: boolean = false): string
```

**Change 3** - Update `destroySession` implementation (lines 62-72):
- Apply same conditional logic as createSession
- Development: `SameSite=None`, `Secure`, no `Domain`
- Production: `SameSite=Lax`, `Secure`, with `Domain`

**Tech Stack Validation**: Manual
- ✅ Uses functional approach (factory functions)
- ✅ TypeScript strict mode compliant
- ✅ No new dependencies
- ✅ Maintains security in production

**Parallel**: No (core fix)

---

### T005: Update destroySession Call in auth.ts
**Description**: Update the `destroySession` function call to pass `isProduction` parameter

**File**: `src/routes/auth.ts` (line 164)

**Change**:
```typescript
// Before:
const cookie = destroySession(cookieDomain);

// After:
const cookie = destroySession(cookieDomain, isProduction);
```

**Validation**: TypeScript compilation succeeds, no errors

**Parallel**: No (depends on T004)

---

### T006: Restart Backend Server
**Description**: Restart the Express backend server to apply cookie configuration changes

**Commands**:
```bash
# Kill existing backend process
pkill -f "tsx.*src/server/index.ts"

# Start backend server
cd /home/marty/code-projects/tweeter-spectest
npm run dev:server
```

**Expected Output**:
```
🚀 Starting Tweeter server...
📦 Connecting to database...
✅ Server running on http://localhost:3000
```

**Validation**: Server starts successfully without errors

**Parallel**: No (depends on T004-T005)

---

## Phase 3: Regression Test Validation

### T007: Verify Unit Tests Pass (Prove Fix Works)
**Description**: Run unit tests again and confirm they now pass, proving cookie configuration is correct

**Command**:
```bash
cd /home/marty/code-projects/tweeter-spectest
npm run test -- src/auth/session.test.ts
```

**Expected Result**: All tests MUST pass
- ✅ Development cookies have `SameSite=None`, `Secure`, no `Domain`
- ✅ Production cookies have `SameSite=Lax`, `Secure`, with `Domain`
- ✅ Destroy cookies match creation attributes

**Validation**:
- 100% test pass rate for session.test.ts
- Tests prove cookie attributes are now correct
- If any tests fail, fix is incomplete

**Parallel**: No (depends on T004-T006)

---

### T008: Manual Browser Test - After Fix (USER PERFORMS)
**Description**: User performs manual browser testing to verify fix works in actual browser

**Steps**: Follow checklist in `regression-test.md` Part B

**Important**: User MUST clear all localhost cookies before testing!

**Key Checks**:
1. Clear all localhost cookies in DevTools (critical!)
2. Sign in and inspect Set-Cookie header in Network tab
3. Verify cookie attributes are correct (`SameSite=None`, `Secure`, no `Domain`)
4. Verify cookie is stored in Application tab
5. Verify navbar updates to authenticated state immediately after sign-in
6. Navigate to feed and click like button
7. Verify like works without blank page navigation

**Expected Results** (proves fix):
- ✅ Set-Cookie has `SameSite=None` and `Secure`
- ✅ Set-Cookie does NOT have `Domain=` attribute
- ✅ Cookie stored in Application tab with correct attributes
- ✅ GET to /api/auth/me includes Cookie header
- ✅ Navbar shows "Home", "Profile", username, "Sign Out"
- ✅ Like button works, page stays on feed, heart fills red

**Validation**: All 7 checks pass

**Parallel**: No (depends on T007)
**Owner**: User (Claude cannot perform browser testing)

---

### T009: Run Full Test Suite
**Description**: Verify no new regressions introduced by cookie configuration changes

**Command**:
```bash
cd /home/marty/code-projects/tweeter-spectest
npm run test
```

**Expected Result**: All existing tests pass + new session tests pass

**Validation**:
- 100% test pass rate across entire codebase
- No new failing tests introduced
- New session.test.ts included in passing tests

**Parallel**: No (final validation)

---

## Summary

**Total Tasks**: 9
**Estimated Time**: 1-2 hours
**Parallel Opportunities**: None (regression-test-first is inherently sequential)

**Critical Path**:
1. Write tests → Verify they fail (proves bug)
2. Fix code → Verify tests pass (proves fix)
3. Manual testing → Verify browser behavior (proves user-facing fix)

**Success Criteria**:
- ✅ Unit tests created (T001)
- ✅ Tests failed before fix (T002) - proved bug exists
- ✅ Manual test confirmed broken state (T003)
- ✅ Cookie configuration fixed (T004-T005)
- ✅ Backend restarted (T006)
- ✅ Unit tests passed after fix (T007) - proved technical fix
- ✅ Manual test confirmed working state (T008) - proved user-facing fix
- ✅ No regressions (T009)

---

## Current Status

**Tasks T004-T006 Already Partially Completed**:

Note: Earlier debugging attempts already applied parts of the fix to `src/auth/session.ts`. Current state needs verification:
- Check if `createSession` already has conditional logic for isProduction
- Check if `destroySession` already has isProduction parameter
- Check if auth.ts already passes isProduction to destroySession

**Next Action**: Verify current state of files before proceeding with tasks.

---

## Metadata

**Workflow**: Bugfix (regression-test-first)
**Created By**: SpecLab Plugin v1.0.0
**Integration**: Basic mode
