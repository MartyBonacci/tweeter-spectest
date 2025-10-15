# Regression Test: Bug 907 - CORS Authentication Cookies

**Purpose**: Prove bug exists, validate fix, prevent future regressions

**Test Type**: Manual Browser Testing + Unit Tests
**Created**: 2025-10-14

---

## Test Objective

Write tests that:
1. ✅ **Fail before fix** (proves bug exists - cookies not working cross-origin)
2. ✅ **Pass after fix** (proves bug fixed - cookies working properly)
3. ✅ **Prevent regression** (catches if cookie config breaks again)

---

## Test Specification

### Part A: Unit Tests for Cookie String Generation

#### Test Setup

- **Test Framework**: Vitest (already configured)
- **Test File**: `src/auth/session.test.ts` (to be created)
- **Dependencies**: None (pure functions)

#### Test Cases

**Test 1: Development Cookie Attributes**
```typescript
describe('createSession', () => {
  it('should create development cookies with SameSite=None and no Domain', () => {
    const result = createSession('user-123', 'secret', 'localhost', false);

    expect(result.cookie).toContain('auth_token=');
    expect(result.cookie).toContain('SameSite=None');
    expect(result.cookie).toContain('Secure');
    expect(result.cookie).toContain('HttpOnly');
    expect(result.cookie).not.toContain('Domain='); // No domain attribute
  });
});
```

**Test 2: Production Cookie Attributes**
```typescript
it('should create production cookies with SameSite=Lax and Domain', () => {
  const result = createSession('user-123', 'secret', 'example.com', true);

  expect(result.cookie).toContain('auth_token=');
  expect(result.cookie).toContain('SameSite=Lax');
  expect(result.cookie).toContain('Secure');
  expect(result.cookie).toContain('HttpOnly');
  expect(result.cookie).toContain('Domain=example.com');
});
```

**Test 3: Destroy Session Cookie Attributes**
```typescript
describe('destroySession', () => {
  it('should create development destroy cookie with SameSite=None', () => {
    const cookie = destroySession('localhost', false);

    expect(cookie).toContain('auth_token=');
    expect(cookie).toContain('Max-Age=0');
    expect(cookie).toContain('SameSite=None');
    expect(cookie).toContain('Secure');
    expect(cookie).not.toContain('Domain=');
  });

  it('should create production destroy cookie with SameSite=Lax', () => {
    const cookie = destroySession('example.com', true);

    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Domain=example.com');
  });
});
```

#### Unit Test Validation

**Before Fix**:
- ❌ Tests MUST fail (cookie strings have wrong attributes)
- Current implementation has `SameSite=Lax` and `Domain=localhost` for development

**After Fix**:
- ✅ Tests MUST pass (cookie strings have correct attributes)
- Development: `SameSite=None`, `Secure`, no `Domain`
- Production: `SameSite=Lax`, `Secure`, with `Domain`

---

### Part B: Manual Browser Testing

Since cookie behavior across cross-origin requests requires actual browser testing, these tests must be performed manually with DevTools.

#### Test Setup

1. **Clear All Cookies**:
   - Open DevTools → Application tab → Cookies
   - Delete all cookies for `localhost:5173` and `localhost:3000`

2. **Verify Servers Running**:
   - Frontend: `http://localhost:5173` (Vite dev server)
   - Backend: `http://localhost:3000` (Express API server)

3. **Open Network Tab**:
   - DevTools → Network tab
   - Enable "Preserve log" checkbox

#### Test Execution

**Test 1: Sign-In Cookie Setting**

1. Navigate to `http://localhost:5173`
2. Click "Sign In" button
3. Enter credentials:
   - Email: (any registered user)
   - Password: (correct password)
4. Submit form
5. **Open DevTools → Network tab**
6. Find the POST request to `localhost:3000/api/auth/signin`
7. Click on the request → Headers tab

**Assertions**:
- ✅ Response Headers should contain `Set-Cookie: auth_token=...`
- ✅ Set-Cookie header should contain `SameSite=None`
- ✅ Set-Cookie header should contain `Secure`
- ✅ Set-Cookie header should contain `HttpOnly`
- ✅ Set-Cookie header should NOT contain `Domain=` attribute
- ✅ Set-Cookie header should contain `Path=/`
- ✅ Set-Cookie header should contain `Max-Age=2592000`

**Test 2: Cookie Storage Verification**

1. After successful sign-in, open DevTools → Application tab → Cookies
2. Expand `http://localhost:3000` section (cookie is stored for backend origin)

**Assertions**:
- ✅ Cookie named `auth_token` should be present
- ✅ Value should be a JWT token (long alphanumeric string)
- ✅ Domain should be `localhost` (host-only, no leading dot)
- ✅ Path should be `/`
- ✅ Expires should be ~30 days from now
- ✅ HttpOnly should be checked
- ✅ Secure should be checked
- ✅ SameSite should show `None`

**Test 3: Authenticated GET Request with Cookie**

1. After sign-in, observe Network tab
2. Find the GET request to `localhost:3000/api/auth/me` (root loader)
3. Click request → Headers tab

**Assertions**:
- ✅ Request Headers should contain `Cookie: auth_token=...`
- ✅ Response should be 200 OK
- ✅ Response JSON should contain user data (not null)

**Test 4: Navbar Updates with User Data**

1. After sign-in, observe the navbar at top of page

**Assertions**:
- ✅ Navbar should show "Home" link
- ✅ Navbar should show "Profile" link
- ✅ Navbar should show username
- ✅ Navbar should show "Sign Out" button
- ✅ Navbar should NOT show "Sign In" button
- ✅ Navbar should NOT show "Sign Up" button

**Test 5: Cross-Origin POST with Cookie (Like Functionality)**

1. Navigate to `/feed` page
2. Click heart icon on any tweet
3. Observe Network tab → Find POST to `localhost:3000/api/likes`
4. Click request → Headers tab

**Assertions**:
- ✅ Request Headers should contain `Cookie: auth_token=...`
- ✅ Response should be 307 Redirect (or 200 OK)
- ✅ Page should NOT navigate to blank page
- ✅ Page should stay on feed
- ✅ Heart icon should fill with red
- ✅ Like count should increment by 1

---

### Test Teardown

After all tests:
1. Sign out (if possible)
2. Clear cookies again
3. Close DevTools

---

## Manual Test Validation Criteria

**Before Fix** (Current Broken State):

1. **Unit Tests**: ❌ MUST fail
   - Cookie strings have `SameSite=Lax` and `Domain=localhost`

2. **Sign-In Cookie Setting**: ❌ MUST show incorrect attributes
   - Set-Cookie header has `SameSite=Lax` (wrong for cross-origin)
   - Set-Cookie header has `Domain=localhost` (problematic)

3. **Cookie Storage**: ⚠️ May or may not be stored correctly
   - Even if stored, won't be sent on cross-origin POST

4. **Authenticated GET**: ❌ MUST fail
   - Cookie not sent with request
   - Response returns null user

5. **Navbar Updates**: ❌ MUST fail
   - Navbar stays in guest state (Sign In/Sign Up buttons visible)

6. **Cross-Origin POST (Like)**: ❌ MUST fail
   - Cookie not sent with request
   - Backend returns 401 Unauthorized or error
   - Frontend redirects to blank page

**After Fix** (Expected Working State):

1. **Unit Tests**: ✅ MUST pass
   - Cookie strings have correct attributes for dev and prod

2. **Sign-In Cookie Setting**: ✅ MUST show correct attributes
   - `SameSite=None`
   - `Secure`
   - No `Domain` attribute

3. **Cookie Storage**: ✅ MUST be stored
   - Visible in DevTools Application tab

4. **Authenticated GET**: ✅ MUST succeed
   - Cookie sent automatically with request
   - Response contains user data

5. **Navbar Updates**: ✅ MUST succeed
   - Navbar shows authenticated navigation immediately after sign-in

6. **Cross-Origin POST (Like)**: ✅ MUST succeed
   - Cookie sent with request
   - Like created/deleted successfully
   - Page stays on feed, UI updates

---

## Edge Cases to Test

### Edge Case 1: Sign-Out Cookie Clearing

1. Sign in successfully
2. Click "Sign Out" button
3. Observe Network tab → POST to `/api/auth/signout`
4. Check response Set-Cookie header

**Assertions**:
- ✅ Set-Cookie header should have `Max-Age=0` (clears cookie)
- ✅ Set-Cookie header should have same SameSite/Secure/Domain as creation
- ✅ Cookie should be removed from Application tab after sign-out

### Edge Case 2: Expired Cookie

1. Sign in
2. Manually edit cookie expiration in DevTools to past date
3. Refresh page

**Assertions**:
- ✅ Cookie should be automatically removed by browser
- ✅ Navbar should show guest state
- ✅ Subsequent requests should not include expired cookie

### Edge Case 3: Multiple Sign-Ins

1. Sign in as User A
2. Without signing out, sign in as User B
3. Check cookie value

**Assertions**:
- ✅ Cookie should be overwritten with User B's token
- ✅ Only one auth_token cookie should exist
- ✅ Navbar should show User B's username

---

## Test Implementation Files

### New Files to Create

**File 1**: `src/auth/session.test.ts`
- Unit tests for cookie string generation
- Tests both development and production configurations
- Tests createSession and destroySession functions

**File 2**: `features/907-cors-authentication-cookies/manual-test-checklist.md`
- Step-by-step checklist for manual browser testing
- Screenshots of expected DevTools output
- Pass/fail criteria for each test

### Test Execution Commands

```bash
# Run unit tests
npm run test -- src/auth/session.test.ts

# Run all tests
npm run test

# Manual tests
# Follow checklist in manual-test-checklist.md
```

---

## Success Criteria Summary

✅ Unit tests created for cookie generation functions
✅ Unit tests fail before fix (prove wrong cookie attributes)
✅ Unit tests pass after fix (prove correct cookie attributes)
✅ Manual browser tests show correct Set-Cookie headers after fix
✅ Manual browser tests show cookies stored and sent after fix
✅ Manual browser tests show navbar updates after sign-in
✅ Manual browser tests show like button works without blank page
✅ No new regressions in existing functionality
✅ All edge cases tested and passing

---

## Metadata

**Workflow**: Bugfix (regression-test-first)
**Test Strategy**: Hybrid (Unit + Manual Browser)
**Automation Level**: Partial (cookie string generation automated, browser behavior manual)
**Created By**: SpecLab Plugin v1.0.0

**Why Manual Testing Required**:
- Browser cookie behavior cannot be fully tested in Node.js environment
- Cross-origin cookie sending requires actual browser CORS implementation
- DevTools inspection is most reliable way to verify Set-Cookie headers
- E2E tests with Playwright could automate this, but would require significant setup
