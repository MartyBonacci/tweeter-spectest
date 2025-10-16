# Bug 912: React Router API Routing Architecture Violation

**Status**: Active
**Created**: 2025-10-15
**Priority**: High
**Severity**: Major (Architecture Issue)

## Symptoms

Current implementation violates React Router v7 framework mode best practices:

1. **Hardcoded localhost URLs throughout codebase**: All API calls use `http://localhost:3000/api/*`
2. **Won't work in production**: Hardcoded URLs break when deployed
3. **Violates React Router patterns**: Should use relative URLs with proper routing
4. **Delete API call fails**: Bug 911 fix used relative URL `/api/tweets/:id`, but React Router intercepts it with "No route matches" error

## Reproduction Steps

1. Look at any API call in the codebase (Feed.tsx, Profile.tsx, etc.)
2. Notice hardcoded `http://localhost:3000/api/*` URLs
3. Try using relative URL `/api/*` instead
4. React Router throws "No route matches URL /api/*"
5. Request never reaches Express backend server

**Expected Behavior**:
- Client code uses relative URLs `/api/*`
- Framework routes API requests to backend correctly
- Works in both development AND production without code changes
- Follows React Router v7 framework mode conventions

**Actual Behavior**:
- Hardcoded localhost URLs everywhere
- Production deployment requires changing all URLs
- Violates separation of concerns (client knows about server location)

## Root Cause Analysis

**Architecture Issue**: Missing development proxy configuration

**Location**: `vite.config.ts`
**Current State**: Minimal configuration with no proxy setup
```typescript
import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [reactRouter()],
});
```

**Root Cause**: Without a Vite proxy, requests to `/api/*` are interpreted as client-side routes by React Router. The Vite dev server doesn't know to forward these requests to the Express backend running on port 3000.

**Why This Matters**:
- React Router v7 framework mode expects SSR patterns
- API calls from loaders/actions should use relative URLs
- Vite proxy handles dev environment routing
- Production uses reverse proxy (nginx/CDN) for same routing

## Impact Assessment

**Affected Users**: All users (architecture affects entire application)

**Affected Features**: All features making API calls
- Authentication (signin/signup/me)
- Tweets (fetch/create/delete)
- Likes (create/delete)
- Profiles (fetch/update/avatar upload)

**Severity Justification**: High priority because:
- Violates React Router v7 best practices
- Makes production deployment difficult
- Currently works by accident (hardcoded URLs)
- Bug 911 fix exposed the architectural issue
- Technical debt that will cause future problems

**Workaround Available**: Yes (current hacky solution with hardcoded URLs)

## Regression Test Requirements

1. **Dev Environment Test**: Verify `/api/*` requests are proxied to Express backend
2. **API Call Test**: Test that relative URLs work for all API endpoints
3. **Production Build Test**: Verify build works without hardcoded URLs

**Test Success Criteria**:
- ✅ Vite proxy configured correctly
- ✅ All API calls use relative URLs
- ✅ No hardcoded localhost URLs remain
- ✅ Dev server routes API requests correctly
- ✅ Production build succeeds

## Proposed Solution

**Recommended Approach**: Configure Vite proxy for development environment

### Solution: Add Vite Proxy Configuration

**File**: `vite.config.ts`

**Change**: Add proxy configuration to forward `/api` requests to Express backend

```typescript
import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [reactRouter()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
```

**How It Works**:
1. Client makes request to `/api/tweets`
2. Vite dev server intercepts the request
3. Proxy forwards request to `http://localhost:3000/api/tweets`
4. Express backend handles the request
5. Response is returned to client through proxy

**Benefits**:
- ✅ Follows React Router v7 conventions
- ✅ Works in development without hardcoded URLs
- ✅ Production uses same relative URL pattern with reverse proxy
- ✅ Maintains separation of concerns
- ✅ Easy to configure different backends (staging, production)

### Cleanup: Remove Hardcoded URLs

**Files to Update**: All files with `http://localhost:3000/api/*`
- app/root.tsx
- app/actions/likes.ts
- app/actions/tweets.ts
- app/pages/Feed.tsx
- app/pages/Profile.tsx
- app/pages/ProfileEdit.tsx
- app/pages/TweetDetail.tsx
- app/components/DeleteButton.tsx (already fixed in Bug 911)

**Change Pattern**:
```typescript
// Before (hardcoded)
const response = await fetch('http://localhost:3000/api/tweets', { ... });

// After (relative URL)
const response = await fetch('/api/tweets', { ... });
```

**Production Configuration**:
In production, configure reverse proxy (nginx, Vercel, etc.) to route `/api/*` to backend:
```nginx
location /api {
    proxy_pass http://backend:3000;
}
```

**Risks**:
- Requires Express backend to be running on port 3000 during development
- Production deployment needs reverse proxy configuration (documented)
- Team needs to understand proxy pattern

**Alternative Approaches**:
1. **React Router Actions**: Use React Router action pattern for all API calls (complex migration)
2. **Environment Variables**: Use `import.meta.env.VITE_API_URL` (still requires build-time configuration)
3. **Separate Backend Deployment**: Keep hardcoded URLs but use environment detection (not recommended)

**Chosen Approach**: Vite proxy for development + documentation for production setup

---

## Tech Stack Compliance

**Tech Stack File**: /memory/tech-stack.md
**Validation Status**: Compliant

- ✅ Uses Vite (React Router v7 default build tool)
- ✅ Follows React Router v7 framework mode conventions
- ✅ No new dependencies required
- ✅ Standard proxy pattern used by all Vite projects

---

## Production Deployment Notes

**Production Setup Required**:

1. **Vercel/Netlify**: Configure API routes in platform settings
2. **Docker**: Use nginx reverse proxy in docker-compose
3. **Traditional Server**: Configure nginx/Apache reverse proxy

**Example Vercel Configuration** (`vercel.json`):
```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "http://backend-service:3000/api/:path*" }
  ]
}
```

**Example nginx Configuration**:
```nginx
server {
    listen 80;
    server_name example.com;

    location / {
        # Serve React app
        root /var/www/app/dist;
        try_files $uri /index.html;
    }

    location /api {
        # Proxy to Express backend
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Metadata

**Workflow**: Bugfix (architectural refactoring)
**Created By**: SpecLab Plugin v1.0.0
**Smart Integration**: SpecSwarm + SpecTest detected
**Related Bug**: Bug 911 (exposed this architectural issue)
