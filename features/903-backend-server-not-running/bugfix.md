# Bug 903: Backend Server Not Running - ECONNREFUSED

**Status**: Active
**Created**: 2025-10-13
**Priority**: Critical
**Severity**: Critical

## Symptoms

When trying to signup at http://localhost:5173/signup, the frontend gets a connection refused error trying to reach the backend API.

- Frontend displays: "Signup error: TypeError: fetch failed connect ECONNREFUSED 127.0.0.1:3000"
- Backend server at localhost:3000 is not running
- Running `npm run dev:server` fails or doesn't start the server properly
- Environment variables from `.env` file are not being loaded

## Reproduction Steps

1. Run `npm run dev` (frontend starts on port 5173)
2. Navigate to http://localhost:5173/signup in browser
3. Fill out signup form and submit
4. Observe error: "ECONNREFUSED 127.0.0.1:3000"

**Expected Behavior**:
- Backend server should start on port 3000 when running `npm run dev:server`
- Frontend signup should successfully communicate with backend API
- Environment variables from `.env` should be loaded

**Actual Behavior**:
- Backend server doesn't start or crashes immediately
- Frontend cannot connect to backend API
- Environment validation fails because .env variables aren't loaded

## Root Cause Analysis

**Cause**: Missing `dotenv` package to load environment variables from `.env` file

- **Component affected**: Backend server startup (src/server/index.ts)
- **Code location**: src/config/env.ts:21 - reads `process.env` but nothing loads .env file
- **Logic error**: Node.js doesn't automatically load `.env` files - requires `dotenv` package or other loader
- **Conditions**: Always fails when starting backend server

**Technical Details**:
- The `.env` file exists with correct configuration
- The `src/config/env.ts` uses Zod to validate `process.env`
- However, `process.env` is empty because nothing loads the `.env` file
- Node.js and tsx don't automatically load `.env` files
- The `dotenv` package is the standard solution for loading `.env` files
- Without `dotenv`, environment validation fails and server crashes on startup

## Impact Assessment

**Affected Users**: All users (developers and end users)

**Affected Features**:
- Authentication: Cannot signup or signin
- All API endpoints: Backend not running
- Complete application: Frontend is useless without backend

**Severity Justification**: Critical - entire application is non-functional

**Workaround Available**: Manual environment variables (`PORT=3000 DATABASE_URL=... npm run dev:server`) - impractical

## Regression Test Requirements

The regression test should verify:

1. `dotenv` package is installed
2. `src/server/index.ts` imports and configures dotenv before other imports
3. Backend server can start successfully
4. Environment variables are loaded from `.env` file
5. Server listens on configured port (default 3000)

**Test Success Criteria**:
- ✅ Test fails before fix (proves dotenv missing or not configured)
- ✅ Test passes after fix (proves server starts with loaded env vars)
- ✅ Backend server responds to health check endpoint

## Proposed Solution

Install `dotenv` package and configure it to load `.env` file at server startup.

**Changes Required**:
1. **Install package**: `dotenv` (dependency, not devDependency)
2. **File to modify**: `src/server/index.ts`
   - Import dotenv at the very top
   - Call `dotenv.config()` before any other imports that use env vars

**Implementation**:

**Install dotenv**:
```bash
npm install dotenv
```

**src/server/index.ts** (add at top):
```typescript
import 'dotenv/config';
// ... rest of imports
```

**Alternative approach** (explicit config):
```typescript
import dotenv from 'dotenv';
dotenv.config();
// ... rest of imports
```

**Risks**: None - dotenv is a standard, stable package with 47M+ weekly downloads

**Why this approach**:
- `dotenv` is the industry standard for loading `.env` files in Node.js
- Simple, zero-configuration solution
- Works with tsx and all Node.js environments
- Doesn't interfere with production deployments (where env vars are set differently)

---

## Tech Stack Compliance

**Tech Stack File**: /memory/tech-stack.md
**Validation Status**: Compliant

- Uses standard npm package (dotenv)
- Follows Node.js best practices for environment configuration
- No prohibited technologies

---

## Metadata

**Workflow**: Bugfix (regression-test-first)
**Created By**: SpecLab Plugin v1.0.0
**Smart Integration**: SpecTest (parallel execution, hooks, metrics enabled)
