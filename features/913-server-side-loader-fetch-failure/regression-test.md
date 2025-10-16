# Regression Test: Bug 913

**Purpose**: Prove bug exists, validate fix, prevent future regressions

**Test Type**: Regression Test (Critical Blocker Fix)
**Created**: 2025-10-15

---

## Test Objective

Validate that:
1. ✅ **Server-side loaders work** (absolute URLs in Node.js)
2. ✅ **Client-side code works** (relative URLs with Vite proxy)
3. ✅ **Environment detection works** (correct URL for each context)
4. ✅ **Production build succeeds** (environment variables supported)

---

## Test Specification

### Test 1: Server-Side Loader Fetch

**Purpose**: Verify server-side loaders can fetch from backend API using absolute URLs

#### Test Setup
- Start Express backend on port 3000
- Start Vite dev server (React Router SSR mode)
- Helper function `getApiUrl()` implemented

#### Test Execution
1. Navigate to http://localhost:5173/feed
2. Server-side loader runs in Node.js
3. Loader calls `fetch(getApiUrl('/api/tweets'))`
4. Verify fetch uses absolute URL: `http://localhost:3000/api/tweets`
5. Check server console for successful API response

#### Test Assertions
- ✅ No "Failed to parse URL" errors
- ✅ Loader completes successfully
- ✅ Page renders with tweet data
- ✅ Server console shows API request/response
- ✅ getApiUrl() returns absolute URL server-side

---

### Test 2: Client-Side Fetch with Vite Proxy

**Purpose**: Verify client-side code still uses Vite proxy for API calls

#### Test Setup
- App loaded in browser
- Vite proxy configured (Bug 912)
- Browser dev tools Network tab open

#### Test Execution
1. Click "Like" button on a tweet (client-side fetch)
2. Observe network request in browser dev tools
3. Verify request goes to `/api/likes` (relative URL)
4. Verify request is proxied to Express backend
5. Check response is successful

#### Test Assertions
- ✅ Network tab shows request to `/api/likes` (not absolute URL)
- ✅ Request is proxied to backend via Vite
- ✅ No CORS errors
- ✅ getApiUrl() returns relative URL client-side ('')
- ✅ Vite proxy from Bug 912 still works

---

### Test 3: Environment Detection

**Purpose**: Verify `getApiUrl()` returns correct URL based on execution context

#### Test Setup
- API helper implemented in app/utils/api.ts
- Both server and client contexts available

#### Test Execution
1. **Server-side test**: Run loader, log `getApiUrl('/api/test')`
2. **Client-side test**: Run client code, log `getApiUrl('/api/test')`
3. Verify different results based on `typeof window`

#### Test Assertions
- ✅ Server-side: `getApiUrl('/api/test')` returns `'http://localhost:3000/api/test'`
- ✅ Client-side: `getApiUrl('/api/test')` returns `'/api/test'`
- ✅ `getApiBaseUrl()` returns `''` when `typeof window !== 'undefined'`
- ✅ `getApiBaseUrl()` returns `'http://localhost:3000'` when `typeof window === 'undefined'`

---

### Test 4: All Loaders and Actions Updated

**Purpose**: Verify all fetch calls use the API helper

#### Test Setup
- Search codebase for direct fetch calls to `/api/*`

#### Test Execution
1. Search: `grep -r "fetch('/api" app/`
2. Verify all matches use `getApiUrl()` wrapper
3. Check no direct relative URL fetch calls remain

#### Test Assertions
- ✅ No `fetch('/api/` patterns without `getApiUrl()`
- ✅ All loaders import and use `getApiUrl()`
- ✅ All actions import and use `getApiUrl()`
- ✅ All client-side API calls use `getApiUrl()`

---

### Test 5: Production Build with Environment Variables

**Purpose**: Verify production build supports API_BASE_URL environment variable

#### Test Setup
- Set `API_BASE_URL=https://api.example.com` in environment
- Run production build

#### Test Execution
1. Set environment variable: `export API_BASE_URL=https://api.example.com`
2. Build: `npm run build`
3. Start production server: `npm run preview`
4. Verify server-side code uses environment variable

#### Test Assertions
- ✅ Build completes without errors
- ✅ Server-side code uses `https://api.example.com` when env var is set
- ✅ Falls back to `http://localhost:3000` when env var is missing
- ✅ Client-side code unaffected by environment variable

---

### Test 6: End-to-End Page Load

**Purpose**: Verify all pages load successfully with fixed loaders

#### Test Setup
- Express backend running on port 3000
- Vite dev server running with API helper implemented
- Test user account exists

#### Test Execution
1. Navigate to http://localhost:5173/ (Landing)
2. Navigate to /signin
3. Sign in as test user
4. Navigate to /feed (loader fetches tweets + current user)
5. Navigate to /profile/:username (loader fetches profile + tweets)
6. Navigate to /profile/:username/edit (loader fetches profile)
7. Navigate to /tweet/:id (loader fetches tweet)

#### Test Assertions
- ✅ All pages load without errors
- ✅ No "Failed to parse URL" errors in server console
- ✅ All loaders complete successfully
- ✅ Data displays correctly on each page
- ✅ Navigation works smoothly

---

## Test Implementation

### Automated Test Script

**File**: `scripts/test-api-helper.sh`

```bash
#!/bin/bash

echo "Testing API Helper Environment Detection..."

# Test 1: Check getApiUrl helper exists
if grep -q "getApiUrl" app/utils/api.ts; then
  echo "✅ API helper function exists"
else
  echo "❌ API helper function missing"
  exit 1
fi

# Test 2: Check all loaders use getApiUrl
DIRECT_FETCH=$(grep -r "fetch('/api" app/ --include="*.tsx" --include="*.ts" | grep -v "getApiUrl" | wc -l)
if [ "$DIRECT_FETCH" -eq 0 ]; then
  echo "✅ All fetch calls use getApiUrl helper"
else
  echo "❌ Found $DIRECT_FETCH direct fetch calls without helper"
  grep -r "fetch('/api" app/ --include="*.tsx" --include="*.ts" | grep -v "getApiUrl"
  exit 1
fi

# Test 3: Test build
echo "Testing production build..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Production build succeeded"
else
  echo "❌ Production build failed"
  exit 1
fi

echo ""
echo "✅ All API helper tests passed!"
```

---

## Manual Testing Checklist

After automated tests pass, manually verify in browser:

**Development Environment**:
- [ ] Start Express backend: `node src/server.js`
- [ ] Start Vite dev server: `npm run dev`
- [ ] Open browser to http://localhost:5173
- [ ] Check server console for no fetch errors
- [ ] Navigate to /feed - page loads successfully
- [ ] Navigate to /profile/:username - page loads successfully
- [ ] Sign in as user - authentication works
- [ ] Create a tweet - action works
- [ ] Like a tweet - client-side fetch works with Vite proxy
- [ ] Delete a tweet - action works
- [ ] Edit profile - loader and action work
- [ ] All pages render without errors

**Server Console Verification**:
- [ ] No "Failed to parse URL" errors
- [ ] API requests show absolute URLs: `http://localhost:3000/api/*`
- [ ] All loaders complete successfully

**Browser DevTools Verification**:
- [ ] Network tab shows relative URLs: `/api/*`
- [ ] Requests are proxied to backend (Vite proxy)
- [ ] No CORS errors
- [ ] All API calls succeed

---

## Success Criteria

**Before Fix**:
- ❌ Server-side loaders crash with "Failed to parse URL"
- ❌ Application cannot load any page
- ❌ Complete blocker - app unusable

**After Fix**:
- ✅ Server-side loaders use absolute URLs
- ✅ Client-side code uses relative URLs (Vite proxy)
- ✅ All pages load successfully
- ✅ Environment detection works correctly
- ✅ Production build supports API_BASE_URL env var
- ✅ Application fully functional

---

## Regression Prevention

**Future Code Reviews**:
- Always use `getApiUrl()` for API fetch calls
- Never use direct `fetch('/api/...)` in loaders/actions
- Document environment-aware API pattern in CLAUDE.md

**Lint Rule** (optional future enhancement):
```json
{
  "rules": {
    "no-restricted-syntax": [
      "error",
      {
        "selector": "CallExpression[callee.name='fetch'] > Literal[value=/^\\/api/]",
        "message": "Use getApiUrl() helper for API calls instead of relative URLs"
      }
    ]
  }
}
```

---

## Metadata

**Workflow**: Bugfix (critical blocker fix)
**Created By**: SpecLab Plugin v1.0.0
**Test Coverage**: Environment detection + SSR + client-side fetch + integration
