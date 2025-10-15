# Tasks: Bug 903 - Backend Server Not Running - ECONNREFUSED

**Workflow**: Bugfix (Regression-Test-First)
**Status**: Active
**Created**: 2025-10-13

---

## Execution Strategy

**Mode**: Sequential (environment configuration fix)
**Smart Integration**: SpecTest detected (hooks and metrics enabled)

---

## Phase 1: Regression Test Creation

### T001: Write Regression Test
**Description**: Create automated test to verify backend server starts with loaded environment variables
**File**: `tests/integration/server-startup.test.ts`
**Validation**: Test checks for dotenv package, dotenv import, and successful server startup
**Parallel**: No (foundational)

**Implementation**:
- Create test file at `tests/integration/server-startup.test.ts`
- Write Vitest test that spawns server process
- Verify dotenv package exists in package.json
- Verify dotenv imported in src/server/index.ts
- Test server health check endpoint

### T002: Verify Test Fails
**Description**: Run regression test and confirm it fails (proves bug exists)
**Command**: `npm test -- server-startup.test.ts`
**Expected**: Test fails because dotenv not installed or not configured
**Validation**: Test failure proves environment variables aren't being loaded
**Parallel**: No (depends on T001)

---

## Phase 2: Bug Fix Implementation

### T003: Install dotenv package
**Description**: Add dotenv package to load .env file
**Command**: `npm install dotenv`
**Changes**: Updates package.json with dotenv dependency
**Tech Stack Validation**: Compliant (standard Node.js package)
**Parallel**: No (prerequisite for T004)

### T004: Configure dotenv in server entry point
**Description**: Import and configure dotenv at top of src/server/index.ts
**Files**: Modify `src/server/index.ts`
**Changes**: Add `import 'dotenv/config';` as first import
**Tech Stack Validation**: Compliant (Node.js best practice)
**Parallel**: No (core fix, depends on T003)

**Implementation**:
```typescript
// Add as FIRST line in src/server/index.ts
import 'dotenv/config';

// ... rest of existing imports
```

### T005: Verify Test Passes
**Description**: Run regression test and confirm it passes (proves bug fixed)
**Command**: `npm test -- server-startup.test.ts`
**Expected**: All assertions pass, server starts successfully
**Validation**: Test success proves server can load env vars and start
**Parallel**: No (depends on T003-T004)

---

## Phase 3: Functional Validation

### T006: Manually start backend server
**Description**: Verify `npm run dev:server` works correctly
**Command**: `npm run dev:server`
**Expected**: Server starts on port 3000 with success message
**Validation**: Server runs without crashes and responds to requests
**Parallel**: No (manual verification)

### T007: Test frontend-backend integration
**Description**: Verify frontend can communicate with backend
**Steps**:
  1. Run `npm run dev:server` in one terminal
  2. Run `npm run dev` in another terminal
  3. Navigate to http://localhost:5173/signup
  4. Fill out signup form and submit
**Expected**: No ECONNREFUSED error, signup attempt reaches backend
**Validation**: Frontend successfully communicates with backend API
**Parallel**: No (end-to-end verification)

### T008: Run Full Test Suite
**Description**: Verify no regressions in other tests
**Command**: `npm test`
**Expected**: All tests pass
**Validation**: No existing functionality broken
**Parallel**: No (final validation)

---

## Summary

**Total Tasks**: 8
**Estimated Time**: 20-30 minutes
**Parallel Opportunities**: None (sequential by nature - env config fix)

**Success Criteria**:
- ✅ Regression test created
- ✅ Test failed before fix (proved bug)
- ✅ dotenv package installed
- ✅ dotenv configured in server entry point
- ✅ Test passed after fix (proved solution)
- ✅ Backend server starts successfully
- ✅ Frontend can communicate with backend
- ✅ No new regressions
- ✅ Tech stack compliant

---

## Metadata

**Workflow**: Bugfix (regression-test-first)
**Created By**: SpecLab Plugin v1.0.0
**Smart Integration**: SpecTest (hooks, metrics)
