# Tasks: Bug 901 - React Router Vite Plugin Configuration Missing

**Workflow**: Bugfix (Regression-Test-First)
**Status**: Active
**Created**: 2025-10-13

---

## Execution Strategy

**Mode**: Sequential (configuration fix)
**Smart Integration**: SpecTest detected (hooks and metrics enabled)

---

## Phase 1: Regression Test Creation

### T001: Write Regression Test
**Description**: Create automated test to verify vite.config.ts exists and is valid
**File**: `tests/config/vite-config.test.ts`
**Validation**: Test checks for file existence and React Router plugin usage
**Parallel**: No (foundational)

**Implementation**:
- Create test directory if needed: `tests/config/`
- Write Vitest test with file system checks
- Verify imports and plugin configuration

### T002: Verify Test Fails
**Description**: Run regression test and confirm it fails (proves bug exists)
**Command**: `npm test -- vite-config.test.ts`
**Expected**: Test fails with "vite.config.ts not found"
**Validation**: Test failure proves config file is missing
**Parallel**: No (depends on T001)

---

## Phase 2: Bug Fix Implementation

### T003: Create vite.config.ts
**Description**: Create Vite configuration file with React Router plugin
**Files**: Create `vite.config.ts` at project root
**Changes**: Add Vite config with `reactRouter()` plugin
**Tech Stack Validation**: Compliant (React Router v7 approved)
**Parallel**: No (core fix)

**Implementation**:
```typescript
import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [reactRouter()],
});
```

### T004: Verify Test Passes
**Description**: Run regression test and confirm it passes (proves bug fixed)
**Command**: `npm test -- vite-config.test.ts`
**Expected**: All assertions pass
**Validation**: Test success proves config file is correct
**Parallel**: No (depends on T003)

---

## Phase 3: Functional Validation

### T005: Verify Dev Server Starts
**Description**: Confirm `npm run dev` works without errors
**Command**: `npm run dev` (then Ctrl+C after successful start)
**Expected**: Dev server starts on localhost without errors
**Validation**: Application can run in development mode
**Parallel**: No (final validation)

### T006: Run Full Test Suite
**Description**: Verify no regressions in other tests
**Command**: `npm test`
**Expected**: All tests pass
**Validation**: No existing functionality broken
**Parallel**: No (final validation)

---

## Summary

**Total Tasks**: 6
**Estimated Time**: 15-30 minutes
**Parallel Opportunities**: None (sequential by nature - config fix)

**Success Criteria**:
- ✅ Regression test created
- ✅ Test failed before fix (proved bug)
- ✅ vite.config.ts created with React Router plugin
- ✅ Test passed after fix (proved solution)
- ✅ Dev server starts successfully
- ✅ No new regressions
- ✅ Tech stack compliant

---

## Metadata

**Workflow**: Bugfix (regression-test-first)
**Created By**: SpecLab Plugin v1.0.0
**Smart Integration**: SpecTest (hooks, metrics)
