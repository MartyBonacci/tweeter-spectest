# Bug 913: Server-Side Loaders Fail with Relative API URLs

**Status**: Active
**Created**: 2025-10-15
**Priority**: Critical
**Severity**: Blocker (Application Broken)

## Symptoms

After Bug 912 fix (Vite proxy configuration), the application is completely broken:

1. **All pages fail to load**: Server-side loaders throw errors
2. **Error message**: `TypeError: Failed to parse URL from /api/auth/me`
3. **Root cause**: Node.js fetch() doesn't support relative URLs
4. **Client-side works**: Vite proxy handles browser requests correctly
5. **Server-side fails**: SSR loaders have no base URL context

## Reproduction Steps

1. Apply Bug 912 fix (Vite proxy + relative URLs)
2. Start dev server: `npm run dev`
3. Navigate to any page (e.g., http://localhost:5173/feed)
4. Server-side loader attempts `fetch('/api/auth/me')`
5. Node.js throws: "Failed to parse URL from /api/auth/me"
6. Page fails to load, app is completely broken

**Expected Behavior**:
- Server-side loaders use absolute URLs for backend API
- Client-side code uses relative URLs (Vite proxy)
- Both environments work seamlessly
- Single API helper handles environment detection

**Actual Behavior**:
- Server-side loaders use relative URLs (invalid in Node.js)
- `fetch('/api/auth/me')` fails with parse error
- Application cannot render any page
- Complete blocker - app is unusable

## Root Cause Analysis

**Architecture Issue**: Environment-agnostic fetch URLs don't work in React Router v7

### The Problem

**Bug 912 Solution** (relative URLs):
```typescript
// This works in browser (Vite proxy)
const response = await fetch('/api/auth/me', { headers });

// But fails server-side (Node.js)
// Error: Failed to parse URL from /api/auth/me
```

**Why It Fails**:
1. React Router v7 loaders run server-side (Node.js SSR)
2. Node.js `fetch()` requires absolute URLs (no base URL concept)
3. Vite proxy only exists in browser context (dev server middleware)
4. Server-side code has no access to Vite proxy

**Environment Context**:
```
Browser Request Flow:
  Browser → fetch('/api/tweets') → Vite Proxy → http://localhost:3000/api/tweets ✅

Server-Side Loader Flow:
  Node.js → fetch('/api/tweets') → Error: Failed to parse URL ❌
```

### Root Cause

**Location**: All loaders and actions using relative URLs
**Current Pattern**: `fetch('/api/...')` everywhere
**Problem**: No environment detection or base URL handling

**Why This Matters**:
- React Router v7 uses SSR by default (all loaders run server-side)
- Server-side code needs absolute URLs for backend calls
- Client-side code benefits from Vite proxy (no CORS, simpler config)
- Need environment-aware solution that works in both contexts

## Impact Assessment

**Affected Users**: ALL users (complete application failure)

**Affected Features**: EVERYTHING
- Authentication (signin/signup/me) - app won't load
- Tweets (fetch/create/delete) - pages fail to render
- Likes (create/delete) - pages fail to render
- Profiles (fetch/update) - pages fail to render

**Severity Justification**: CRITICAL/BLOCKER because:
- Application is completely unusable
- All pages fail to load (server-side rendering fails)
- No workaround available
- Affects 100% of users
- Introduced by Bug 912 fix (regression)

**Workaround Available**: No - application cannot start

## Regression Test Requirements

1. **Server-Side Loader Test**: Verify loaders can fetch from backend API
2. **Client-Side Fetch Test**: Verify client code uses Vite proxy
3. **Environment Detection Test**: Verify correct URL used in each context
4. **Production Build Test**: Verify environment variables work

**Test Success Criteria**:
- ✅ Server-side loaders use absolute URLs
- ✅ Client-side code uses relative URLs (Vite proxy)
- ✅ All pages load successfully
- ✅ No fetch URL parse errors
- ✅ Production build works with env vars

## Proposed Solution

**Recommended Approach**: Create environment-aware API helper function

### Solution: API Base URL Helper

**File**: `app/utils/api.ts` (NEW)

**Implementation**:
```typescript
/**
 * API Base URL Helper
 * Feature: 913-server-side-loader-fetch-failure
 *
 * Provides environment-aware API base URL for fetch calls
 */

/**
 * Get the API base URL based on execution context
 *
 * Server-side (Node.js SSR):
 *   - Development: http://localhost:3000
 *   - Production: process.env.API_BASE_URL or fallback
 *
 * Client-side (Browser):
 *   - Always uses relative URLs (Vite proxy handles routing)
 *
 * @returns API base URL string (empty for client-side)
 */
export function getApiBaseUrl(): string {
  // Client-side: Use relative URLs (Vite proxy handles it)
  if (typeof window !== 'undefined') {
    return '';
  }

  // Server-side: Use absolute URL to backend
  // Production: Use environment variable
  // Development: Use localhost:3000
  return process.env.API_BASE_URL || 'http://localhost:3000';
}

/**
 * Create full API URL for fetch calls
 *
 * @param path - API path (e.g., '/api/auth/me')
 * @returns Full URL for fetch
 *
 * @example
 * ```typescript
 * // Server-side: returns 'http://localhost:3000/api/auth/me'
 * // Client-side: returns '/api/auth/me'
 * const url = getApiUrl('/api/auth/me');
 * const response = await fetch(url, { headers });
 * ```
 */
export function getApiUrl(path: string): string {
  const base = getApiBaseUrl();
  return `${base}${path}`;
}
```

### Usage Pattern

**Before** (Bug 912 - broken server-side):
```typescript
// app/root.tsx loader
const response = await fetch('/api/auth/me', { headers });
// ❌ Fails server-side: "Failed to parse URL"
```

**After** (Bug 913 - works everywhere):
```typescript
import { getApiUrl } from './utils/api';

// app/root.tsx loader
const response = await fetch(getApiUrl('/api/auth/me'), { headers });
// ✅ Server-side: fetch('http://localhost:3000/api/auth/me')
// ✅ Client-side: fetch('/api/auth/me') → Vite proxy
```

### Files to Update

**New File**:
- app/utils/api.ts (API helper utilities)

**Modified Files** (all loaders/actions):
- app/root.tsx
- app/actions/likes.ts
- app/actions/tweets.ts
- app/api/tweets.ts
- app/pages/Feed.tsx
- app/pages/Profile.tsx
- app/pages/ProfileEdit.tsx
- app/pages/TweetDetail.tsx
- app/pages/Signin.tsx
- app/pages/Signup.tsx
- app/pages/Signout.tsx

**Change Pattern**:
```typescript
// Before
const response = await fetch('/api/tweets', { ... });

// After
import { getApiUrl } from '../utils/api';
const response = await fetch(getApiUrl('/api/tweets'), { ... });
```

### Production Configuration

**Environment Variable**: `API_BASE_URL`

**Deployment Examples**:

**Vercel** (vercel.json or dashboard):
```json
{
  "env": {
    "API_BASE_URL": "https://api.example.com"
  }
}
```

**Docker** (docker-compose.yml):
```yaml
services:
  app:
    environment:
      - API_BASE_URL=http://backend:3000
```

**Traditional Server** (.env):
```bash
API_BASE_URL=https://api.example.com
```

**How It Works**:
1. Development: Server-side uses `http://localhost:3000`, client uses Vite proxy
2. Production: Server-side uses `process.env.API_BASE_URL`, client uses reverse proxy
3. Vite proxy configuration (Bug 912) remains unchanged
4. Single helper function handles all environment detection

**Benefits**:
- ✅ Works in server-side loaders (absolute URLs)
- ✅ Works in client-side code (relative URLs + Vite proxy)
- ✅ Production-ready with environment variables
- ✅ No code changes needed between dev/prod
- ✅ Maintains Bug 912 Vite proxy benefits
- ✅ Single source of truth for API URLs

**Risks**:
- Requires updating all fetch calls (12 files)
- Must remember to use helper for new API calls
- Environment variable required in production

**Alternative Approaches**:

1. **Global Fetch Wrapper**: Override global fetch (too invasive)
2. **Runtime Detection**: Check `typeof window` in each fetch (repetitive)
3. **Revert Bug 912**: Go back to hardcoded URLs (loses architectural benefits)
4. **Separate Client/Server Code**: Duplicate logic (violates DRY)

**Chosen Approach**: Environment-aware helper function (clean, maintainable, scalable)

---

## Tech Stack Compliance

**Tech Stack File**: /memory/tech-stack.md
**Validation Status**: Compliant

- ✅ Uses React Router v7 SSR patterns correctly
- ✅ No new dependencies required
- ✅ Pure function approach (functional programming)
- ✅ TypeScript strict mode compliant
- ✅ Environment variable pattern (standard practice)

---

## Production Deployment Notes

**Required Setup**:

1. **Set API_BASE_URL environment variable** in production
2. **Keep Vite proxy configuration** from Bug 912 (dev only)
3. **Configure reverse proxy** for client-side /api/* routing

**Deployment Checklist**:
- [ ] Set API_BASE_URL in production environment
- [ ] Test server-side rendering with production API
- [ ] Verify client-side requests route correctly
- [ ] Ensure reverse proxy handles /api/* paths
- [ ] Test authentication flow end-to-end

---

## Relationship to Bug 912

**Bug 912**: Added Vite proxy, changed all URLs to relative paths
**Bug 913**: Relative paths break server-side loaders (this bug)

**Integration**:
- Bug 912 solution (Vite proxy) is CORRECT for client-side
- Bug 913 solution (API helper) adds server-side support
- Both solutions work together for complete fix
- Bug 912 benefits retained (no CORS, clean URLs)

---

## Metadata

**Workflow**: Bugfix (critical regression fix)
**Created By**: SpecLab Plugin v1.0.0
**Smart Integration**: SpecSwarm + SpecTest detected
**Related Bug**: Bug 912 (introduced this regression)
**Severity**: Blocker - Application Unusable
