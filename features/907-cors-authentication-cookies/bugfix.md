# Bug 907: Cross-Origin Authentication Cookie Failures

**Status**: Active
**Created**: 2025-10-14
**Priority**: High
**Severity**: Critical

## Symptoms

Authentication cookies are not being properly set/sent between the Vite dev server (localhost:5173) and Express API (localhost:3000), causing multiple UI failures:

- **Navbar**: After successful sign-in, navbar still shows guest buttons ("Sign In"/"Sign Up") instead of authenticated navigation (Home, Profile, username, Sign Out)
- **Like Button**: Clicking the like button on a tweet causes the page to redirect to a blank page instead of updating the like state
- **Session Persistence**: User authentication state is not persisted across requests despite successful login

## Reproduction Steps

### Navbar Issue:
1. Navigate to http://localhost:5173
2. Click "Sign In" button
3. Enter valid credentials (email/password)
4. Submit sign-in form
5. **Expected**: Navbar updates to show "Home", "Profile", username, "Sign Out"
6. **Actual**: Navbar still shows "Sign In" and "Sign Up" buttons

### Like Button Issue:
1. Sign in to the application (if possible)
2. Navigate to the Feed page
3. Click the heart icon on any tweet
4. **Expected**: Heart fills with red color, like count increments, stays on feed page
5. **Actual**: Page redirects to a blank page

**Expected Behavior**:
- After sign-in, navbar should immediately reflect authenticated state
- Like button should update UI optimistically without page navigation
- Authentication cookie should be sent with all subsequent API requests

**Actual Behavior**:
- Navbar remains in guest state
- Like action causes navigation to blank page
- Authentication state is lost

## Root Cause Analysis

**Primary Issue**: Cross-Origin Cookie Configuration

The application uses separate development servers:
- **Frontend (Vite)**: `localhost:5173`
- **Backend (Express)**: `localhost:3000`

This creates a cross-origin scenario that requires specific cookie and CORS configuration.

**Current Implementation Problems**:

1. **Cookie SameSite Policy** (`src/auth/session.ts:41`):
   - Currently set to `SameSite=Lax`
   - `Lax` prevents cookies from being sent on cross-origin POST requests
   - Sign-in POST to `localhost:3000` from `localhost:5173` doesn't set cookie
   - Like POST to `localhost:3000` from `localhost:5173` doesn't send cookie

2. **Cookie Domain Attribute** (`src/auth/session.ts:38`):
   - Set to `Domain=localhost`
   - For localhost development with different ports, Domain attribute can cause issues
   - Should use host-only cookies (no Domain attribute) for localhost

3. **Missing Secure Flag for SameSite=None**:
   - `SameSite=None` requires `Secure` flag
   - Browsers allow `Secure` for localhost even without HTTPS

4. **Frontend credentials Missing** (was fixed):
   - All fetch calls need `credentials: 'include'` to send/receive cookies
   - This has been added but cookies still aren't working due to issues 1-3

**Affected Files**:
- `src/auth/session.ts`: Cookie configuration (lines 26-52, 61-72)
- `src/routes/auth.ts`: Sign-out uses destroySession (line 164)
- `app/pages/Signin.tsx`: Sign-in action (line 37)
- `app/pages/Signup.tsx`: Sign-up action (line 37)
- `app/root.tsx`: Root loader for current user (line 19)
- `app/actions/likes.ts`: Like/unlike actions (lines 28, 43)

**Conditions Required to Trigger**:
- Development environment (separate Vite and Express servers)
- Cross-origin requests between localhost:5173 and localhost:3000
- Any authenticated action (sign-in, API calls requiring auth)

## Impact Assessment

**Affected Users**: All users in development environment
- Cannot maintain authenticated sessions
- Cannot use any authenticated features (likes, profiles, etc.)

**Affected Features**:
- **Authentication System**: Completely broken
  - Sign-in appears to succeed but session not maintained
  - Navbar doesn't reflect auth state
- **Like Functionality**: Completely broken
  - Like button causes blank page navigation
  - No error feedback to user
- **Profile System**: Partially broken
  - Cannot access own profile (requires auth)
  - Cannot edit profile (requires auth)

**Severity Justification**:
- Critical severity because authentication is fundamental to the application
- Blocks testing and development of all authenticated features
- Affects 100% of user workflows beyond guest browsing

**Workaround Available**: No
- Cannot work around CORS/cookie issues from browser
- Potential workaround: Use Vite proxy, but this requires significant configuration changes

## Regression Test Requirements

The regression test must verify cookie behavior across cross-origin requests:

1. **Test Sign-In Cookie Setting**:
   - Send sign-in POST to localhost:3000
   - Verify Set-Cookie header is present
   - Verify cookie has correct attributes (SameSite, Secure, HttpOnly, no Domain)
   - Verify cookie is stored by browser

2. **Test Authenticated Request with Cookie**:
   - After sign-in, send GET to /api/auth/me
   - Verify Cookie header is sent automatically
   - Verify request succeeds with user data

3. **Test Cross-Origin POST with Cookie**:
   - After sign-in, send POST to /api/likes
   - Verify Cookie header is sent
   - Verify request succeeds

**Test Success Criteria**:
- ✅ Test fails before fix (proves bug exists - cookies not working)
- ✅ Test passes after fix (proves bug fixed - cookies working)
- ✅ No new regressions introduced

**Test Implementation Approach**:
Since we cannot test actual browser cookie behavior easily, we'll use:
- **Unit Tests**: Test session.ts cookie string generation
- **Manual Browser Testing**: Verify DevTools shows correct cookie attributes and headers

## Proposed Solution

**Fix Cookie Configuration for Cross-Origin Localhost Development**:

### Changes Required:

**File 1: `src/auth/session.ts`** (lines 26-52, 61-72)

Current problematic code:
```typescript
const attributes = [
  `auth_token=${token}`,
  `Max-Age=${COOKIE_MAX_AGE}`,
  `Domain=${cookieDomain}`, // ❌ Problem: Domain on localhost
  'Path=/',
  'HttpOnly',
  'SameSite=Lax', // ❌ Problem: Lax blocks cross-origin POST
];
```

**Fix**:
```typescript
// Build cookie attributes
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
  // SameSite=None requires Secure, but browsers allow it for localhost
  attributes.push('SameSite=None');
  attributes.push('Secure');
}
```

Apply same pattern to `destroySession` function.

**File 2: `src/routes/auth.ts`** (line 164)

Update `destroySession` call to pass `isProduction` parameter:
```typescript
const cookie = destroySession(cookieDomain, isProduction);
```

**Verification Steps**:
1. Restart backend server (tsx watch will auto-reload)
2. **Clear all localhost cookies in browser DevTools**
3. Sign in again
4. Check DevTools → Application → Cookies:
   - Should see `auth_token` cookie
   - Should have `SameSite=None` and `Secure=true`
   - Should NOT have Domain attribute (host-only)
5. Check Network tab → Sign-in request:
   - Response should have `Set-Cookie` header
6. Check subsequent requests (e.g., /api/auth/me):
   - Request should have `Cookie: auth_token=...` header

**Risks**:
- **Low Risk**: This is standard configuration for cross-origin localhost development
- **Production Safe**: Production path still uses secure defaults (SameSite=Lax, Domain, Secure)
- **Browser Compatibility**: All modern browsers support SameSite=None with Secure on localhost

**Alternative Approaches**:

1. **Vite Proxy Configuration** (NOT chosen):
   - Configure Vite to proxy API requests to localhost:3000
   - Frontend would call `/api/*` which Vite proxies
   - Same-origin from browser perspective
   - **Why not**: More complex setup, hides the cross-origin reality, doesn't teach proper CORS handling

2. **Single Server** (NOT chosen):
   - Serve Vite build from Express server
   - **Why not**: Slower development experience, requires build step

3. **Different Cookie Strategy** (NOT chosen):
   - Use localStorage for tokens instead of cookies
   - **Why not**: Less secure (vulnerable to XSS), doesn't leverage HttpOnly protection

---

## Tech Stack Compliance

**Tech Stack File**: /memory/tech-stack.md
**Validation Status**: Compliant

This fix:
- ✅ Uses functional approach (factory functions, not classes)
- ✅ Maintains TypeScript strict mode compliance
- ✅ Follows Express best practices for cookie configuration
- ✅ Preserves security in production (HttpOnly, Secure, SameSite=Lax)
- ✅ Does not introduce new dependencies

---

## Metadata

**Workflow**: Bugfix (regression-test-first)
**Created By**: SpecLab Plugin v1.0.0
**Smart Integration**: Basic mode (SpecSwarm/SpecTest not detected in tweeter-spectest)
