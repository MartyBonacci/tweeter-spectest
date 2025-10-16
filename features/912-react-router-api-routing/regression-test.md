# Regression Test: Bug 912

**Purpose**: Prove architectural issue exists, validate fix, prevent future regressions

**Test Type**: Regression Test (Architecture Validation)
**Created**: 2025-10-15

---

## Test Objective

Validate that:
1. ✅ **API proxy is configured** (Vite forwards `/api/*` to backend)
2. ✅ **Relative URLs work** (no hardcoded localhost URLs remain)
3. ✅ **Production build succeeds** (no build-time URL issues)

---

## Test Specification

### Test 1: Vite Proxy Configuration

**Purpose**: Verify Vite dev server correctly proxies API requests

#### Test Setup
- Start Express backend on port 3000
- Start Vite dev server
- vite.config.ts has proxy configuration

#### Test Execution
1. Make request to `/api/tweets` from browser dev tools
2. Verify request is proxied to `http://localhost:3000/api/tweets`
3. Verify response comes from Express backend

#### Test Assertions
- ✅ Request to `/api/tweets` returns data (not 404)
- ✅ Network tab shows request to `/api/tweets` (not `http://localhost:3000`)
- ✅ Express backend logs show incoming request
- ✅ No CORS errors

---

### Test 2: Relative URL Pattern Validation

**Purpose**: Verify no hardcoded localhost URLs remain in codebase

#### Test Setup
- Codebase ready for inspection

#### Test Execution
1. Search for hardcoded URLs: `grep -r "http://localhost:3000" app/`
2. Verify all API calls use relative URLs
3. Check specific files:
   - app/root.tsx
   - app/actions/likes.ts
   - app/actions/tweets.ts
   - app/pages/Feed.tsx
   - app/pages/Profile.tsx
   - app/pages/ProfileEdit.tsx
   - app/pages/TweetDetail.tsx
   - app/components/DeleteButton.tsx

#### Test Assertions
- ✅ No matches for `http://localhost:3000/api` in app/ directory
- ✅ All fetch calls use relative URLs: `fetch('/api/...')`
- ✅ All files updated to use relative URLs

---

### Test 3: Production Build Test

**Purpose**: Verify build process works without hardcoded URLs

#### Test Setup
- Clean build directory
- Run production build command

#### Test Execution
1. Run: `npm run build`
2. Check for build errors
3. Inspect generated files for hardcoded URLs

#### Test Assertions
- ✅ Build completes without errors
- ✅ No hardcoded localhost URLs in dist/ directory
- ✅ Build output includes API routes properly

---

### Test 4: End-to-End API Integration

**Purpose**: Verify all API endpoints work with relative URLs in development

#### Test Setup
- Express backend running on port 3000
- Vite dev server running with proxy
- Test user account exists

#### Test Execution
1. Sign in: POST `/api/auth/signin`
2. Get user: GET `/api/auth/me`
3. Fetch tweets: GET `/api/tweets`
4. Create tweet: POST `/api/tweets`
5. Like tweet: POST `/api/likes`
6. Unlike tweet: DELETE `/api/likes/:id`
7. Delete tweet: DELETE `/api/tweets/:id`
8. Get profile: GET `/api/profiles/:username`
9. Update profile: PUT `/api/profiles/:username`

#### Test Assertions
- ✅ All API calls succeed with 200/201/204 status codes
- ✅ Authentication works correctly
- ✅ Data is retrieved/created/updated/deleted successfully
- ✅ No console errors
- ✅ No network errors

---

## Test Implementation

### Automated Test Script

**File**: `scripts/test-api-proxy.sh`

```bash
#!/bin/bash

echo "Testing API Proxy Configuration..."

# Check vite.config.ts has proxy configuration
if grep -q "proxy" vite.config.ts; then
  echo "✅ Vite proxy configuration found"
else
  echo "❌ Vite proxy configuration missing"
  exit 1
fi

# Check for hardcoded localhost URLs
HARDCODED=$(grep -r "http://localhost:3000/api" app/ | wc -l)
if [ "$HARDCODED" -eq 0 ]; then
  echo "✅ No hardcoded localhost URLs found"
else
  echo "❌ Found $HARDCODED hardcoded localhost URLs"
  grep -r "http://localhost:3000/api" app/
  exit 1
fi

# Test build
echo "Testing production build..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Production build succeeded"
else
  echo "❌ Production build failed"
  exit 1
fi

echo ""
echo "✅ All architectural tests passed!"
```

---

## Manual Testing Checklist

After automated tests pass, manually verify in browser:

**Development Environment**:
- [ ] Start Express backend: `node src/server.js`
- [ ] Start Vite dev server: `npm run dev`
- [ ] Open browser to http://localhost:5173
- [ ] Open browser dev tools → Network tab
- [ ] Sign in as user
- [ ] Verify network requests show `/api/*` (not `http://localhost:3000/api/*`)
- [ ] Verify all API calls succeed
- [ ] Create a tweet
- [ ] Like a tweet
- [ ] Delete a tweet
- [ ] Edit profile
- [ ] Verify no errors in console
- [ ] Verify no CORS errors

**Production Build Test**:
- [ ] Build app: `npm run build`
- [ ] Preview build: `npm run preview`
- [ ] Test all functionality works
- [ ] Verify no hardcoded URLs in dist/

---

## Success Criteria

**Before Fix**:
- ❌ Hardcoded URLs throughout codebase
- ❌ Relative URLs don't work (404 errors)
- ❌ Architecture violates React Router conventions

**After Fix**:
- ✅ Vite proxy configured in vite.config.ts
- ✅ All API calls use relative URLs
- ✅ No hardcoded localhost URLs remain
- ✅ Development environment works with proxy
- ✅ Production build succeeds
- ✅ Architecture follows React Router v7 patterns

---

## Metadata

**Workflow**: Bugfix (architectural refactoring)
**Created By**: SpecLab Plugin v1.0.0
**Test Coverage**: Architecture validation + integration testing
