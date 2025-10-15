# Tasks: Bug 905 - Feed Page Loses Tailwind Styling on Refresh

**Workflow**: Bugfix (Regression-Test-First)
**Status**: Active
**Created**: 2025-10-13

---

## Execution Strategy

**Mode**: Sequential (regression-test-first requires ordered execution)
**Smart Integration**:
- ✅ SpecTest detected (hooks and metrics enabled)
- ✅ Tech stack enforcement available
- 📊 Metrics tracking enabled

---

## Phase 1: Regression Test Creation

### T001: Write Regression Test
**Description**: Implement test specified in regression-test.md to verify links export and SSR HTML
**File**: tests/root-layout.test.ts
**Test Coverage**:
- Verify `links` export exists in app/root.tsx
- Verify `links` returns stylesheet for globals.css
- Verify SSR HTML includes stylesheet link tag

**Implementation**:
```typescript
import { describe, it, expect } from 'vitest';

describe('Bug 905: Stylesheet Links in Root Layout', () => {
  it('should export links function', async () => {
    const rootModule = await import('../app/root.tsx');
    expect(rootModule.links).toBeDefined();
    expect(typeof rootModule.links).toBe('function');
  });

  it('should include globals.css in links export', async () => {
    const rootModule = await import('../app/root.tsx');
    const links = rootModule.links();

    const stylesheetLink = links.find(
      (link: any) => link.rel === 'stylesheet' && link.href.includes('globals.css')
    );

    expect(stylesheetLink).toBeDefined();
  });

  it('should include stylesheet link in SSR HTML', async () => {
    const response = await fetch('http://localhost:5173/feed');
    const html = await response.text();

    expect(html).toContain('<link rel="stylesheet"');
    expect(html).toContain('globals.css');
  });
});
```

**Validation**: Test file created with all three test cases
**Parallel**: No (foundational)

### T002: Verify Test Fails
**Description**: Run regression test and confirm it fails (proves bug exists)
**Command**: `npm test -- root-layout.test.ts`
**Expected**: Test fails because `links` export doesn't exist in app/root.tsx
**Validation**:
- ✅ Test fails with "links is not defined" or similar error
- ✅ Failure proves bug reproduction
- ❌ If test passes, bug specification is incorrect

**Parallel**: No (depends on T001)

---

## Phase 2: Bug Fix Implementation

### T003: Implement Fix in app/root.tsx
**Description**: Apply solution from bugfix.md - replace side-effect import with links export
**Files**: app/root.tsx
**Changes**:
1. Remove line 3: `import './globals.css';`
2. Import stylesheetUrl: `import stylesheetUrl from './globals.css?url';`
3. Add links export:
   ```typescript
   export const links: LinksFunction = () => [
     { rel: 'stylesheet', href: stylesheetUrl },
   ];
   ```

**Tech Stack Validation**: ✅ React Router v7 pattern (follows framework conventions)
**Parallel**: No (core fix)

### T004: Verify Test Passes
**Description**: Run regression test and confirm it passes (proves bug fixed)
**Command**: `npm test -- root-layout.test.ts`
**Expected**: All three test cases pass
**Validation**:
- ✅ Test passes
- ✅ Test success proves bug fixed
- ✅ Links export is present
- ✅ SSR HTML includes stylesheet link

**Parallel**: No (depends on T003)

---

## Phase 3: Manual Verification

### T005: Manual Browser Test
**Description**: Verify fix works in browser with actual page refresh
**Steps**:
1. Navigate to http://localhost:5173/feed
2. Verify page has Tailwind styling
3. Press F5 to refresh page
4. Verify page still has Tailwind styling after refresh
5. Check browser DevTools Network tab for globals.css load
6. Check browser DevTools Elements tab for `<link rel="stylesheet">` in `<head>`

**Expected**:
- ✅ Page styled correctly before refresh
- ✅ Page styled correctly after refresh
- ✅ Stylesheet link visible in HTML `<head>`
- ✅ globals.css loaded in Network tab

**Validation**: Manual confirmation that bug is fixed in real usage
**Parallel**: No (depends on T003)

### T006: Verify No Regressions
**Description**: Test other pages to ensure fix doesn't break anything
**Pages to test**:
- / (landing page)
- /signup
- /signin
- /feed

**Actions for each page**:
1. Navigate to page
2. Verify styling works
3. Refresh page (F5)
4. Verify styling still works

**Expected**: All pages work correctly with styling on both navigation and refresh
**Validation**: No visual regressions on any page
**Parallel**: No (final validation)

---

## Summary

**Total Tasks**: 6
**Estimated Time**: 30-60 minutes
**Parallel Opportunities**: None (regression-test-first is inherently sequential)

**Success Criteria**:
- ✅ Regression test created
- ✅ Test failed before fix (proved bug)
- ✅ Fix implemented (replaced side-effect import with links export)
- ✅ Test passed after fix (proved solution)
- ✅ Manual browser test confirms fix works
- ✅ No visual regressions on other pages
- ✅ Tech stack compliant (React Router v7 pattern)

---

## Execution Notes

**Phase 1 - Regression Test** (T001-T002):
- Create test first before any code changes
- Test MUST fail to prove bug exists
- If test passes before fix, stop and review test/bug spec

**Phase 2 - Implementation** (T003-T004):
- Apply fix only after regression test fails
- Re-run test to verify fix works
- Test MUST pass to prove solution is correct

**Phase 3 - Validation** (T005-T006):
- Manual verification in real browser
- Test all affected pages
- Ensure no new bugs introduced

---

## Metadata

**Workflow**: Bugfix (regression-test-first)
**Created By**: SpecLab Plugin v1.0.0
**Smart Integration**: SpecTest (parallel execution, hooks, metrics enabled)
**Tech Stack**: React Router v7, Tailwind CSS, Vitest
