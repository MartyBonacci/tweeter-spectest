# Tasks: Bug 902 - Tailwind CSS Styles Not Loading

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
**Description**: Create automated test to verify app/root.tsx exports links function with stylesheet
**File**: `tests/config/root-links.test.ts`
**Validation**: Test checks for links export, function type, and stylesheet link descriptor
**Parallel**: No (foundational)

**Implementation**:
- Create test file at `tests/config/root-links.test.ts`
- Write Vitest test with module import checks
- Verify links export exists and is a function
- Verify links() returns array with stylesheet link descriptor
- Verify href references globals.css

### T002: Verify Test Fails
**Description**: Run regression test and confirm it fails (proves bug exists)
**Command**: `npm test -- root-links.test.ts`
**Expected**: Test fails with "links is not exported from app/root.tsx"
**Validation**: Test failure proves links export is missing
**Parallel**: No (depends on T001)

---

## Phase 2: Bug Fix Implementation

### T003: Add links export to app/root.tsx
**Description**: Add links function that loads globals.css stylesheet
**Files**: Modify `app/root.tsx`
**Changes**:
  - Import globals.css with ?url query parameter
  - Add links export function that returns stylesheet link descriptor
**Tech Stack Validation**: Compliant (React Router v7 approved pattern)
**Parallel**: No (core fix)

**Implementation**:
```typescript
// Add to app/root.tsx
import globalsCss from './globals.css?url';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: globalsCss },
];
```

### T004: Verify Test Passes
**Description**: Run regression test and confirm it passes (proves bug fixed)
**Command**: `npm test -- root-links.test.ts`
**Expected**: All assertions pass
**Validation**: Test success proves links export added correctly
**Parallel**: No (depends on T003)

---

## Phase 3: Functional Validation

### T005: Verify Styles Load in Browser
**Description**: Confirm styles render correctly in browser
**Command**: `npm run dev` (check http://localhost:5173/ in browser)
**Expected**: Page renders with full Tailwind CSS styling (not unstyled HTML)
**Validation**: Application has visual styling applied
**Parallel**: No (final validation)

### T006: Run Full Test Suite
**Description**: Verify no regressions in other tests
**Command**: `npm test`
**Expected**: All tests pass (existing + new regression test)
**Validation**: No existing functionality broken
**Parallel**: No (final validation)

---

## Summary

**Total Tasks**: 6
**Estimated Time**: 15-30 minutes
**Parallel Opportunities**: None (sequential by nature - configuration fix)

**Success Criteria**:
- ✅ Regression test created
- ✅ Test failed before fix (proved bug)
- ✅ links export added to app/root.tsx
- ✅ Test passed after fix (proved solution)
- ✅ Styles render correctly in browser
- ✅ No new regressions
- ✅ Tech stack compliant

---

## Metadata

**Workflow**: Bugfix (regression-test-first)
**Created By**: SpecLab Plugin v1.0.0
**Smart Integration**: SpecTest (hooks, metrics)
