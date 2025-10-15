# Regression Test: Bug 902

**Purpose**: Prove bug exists, validate fix, prevent future regressions

**Test Type**: React Router v7 Links Export Test
**Created**: 2025-10-13

---

## Test Objective

Write a test that:
1. ✅ **Fails before fix** (proves `links` export is missing from app/root.tsx)
2. ✅ **Passes after fix** (proves `links` export added correctly)
3. ✅ **Prevents regression** (catches if links export is removed)

---

## Test Specification

### Test Setup

**Prerequisites**:
- Node.js installed (>= 18.0.0)
- Project dependencies installed (`npm install`)
- Working directory at project root

**No additional setup needed** - this is a module export validation test

### Test Execution

**Test Actions**:
1. Import the root module (`app/root.tsx`)
2. Check if `links` export exists
3. If exists, verify it's a function
4. Call the function and verify it returns an array
5. Verify the array contains a stylesheet link descriptor
6. Verify the link descriptor references globals.css

### Test Assertions

**Export Validation**:
- ✅ Assertion 1: `app/root.tsx` exports a `links` named export
- ✅ Assertion 2: `links` export is a function

**Return Value Validation**:
- ✅ Assertion 3: `links()` returns an array
- ✅ Assertion 4: Array contains at least one link descriptor
- ✅ Assertion 5: At least one link descriptor has `rel: 'stylesheet'`
- ✅ Assertion 6: Stylesheet link href references globals.css (matches pattern)

**Functional Validation (optional)**:
- ✅ Assertion 7: Dev server renders pages with CSS loaded

### Test Teardown

**Cleanup**: None needed (read-only test)

---

## Test Implementation

### Test File Location

**File**: `tests/config/root-links.test.ts`
**Test Name**: `test_bug_902_root_links_export`

### Test Validation Criteria

**Before Fix**:
- ❌ Test MUST fail (links export doesn't exist)
- Error: "links is not exported from app/root.tsx"

**After Fix**:
- ✅ Test MUST pass (links export exists and returns correct structure)
- ✅ All assertions pass
- ✅ Application renders with styles

---

## Manual Verification

**Quick Manual Test**:
```bash
# Before fix - should have no styles
npm run dev
# Visit http://localhost:5173/
# Expected: Page renders but has no Tailwind CSS styling

# After fix - should have full styling
npm run dev
# Visit http://localhost:5173/
# Expected: Page renders with full Tailwind CSS styling
```

---

## Edge Cases to Test

1. **links export missing**: Should fail (current state)
2. **links exists but returns empty array**: Should fail (no stylesheets)
3. **links exists but wrong return type**: Should fail (must return array)
4. **links returns array but no stylesheet link**: Should fail
5. **links returns stylesheet but wrong href**: Should fail

---

## Automated Test Code Structure

```typescript
import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';

describe('Bug 902: Root Links Export Validation', () => {
  const projectRoot = process.cwd();
  const rootPath = join(projectRoot, 'app/root.tsx');

  it('app/root.tsx should exist', () => {
    expect(existsSync(rootPath)).toBe(true);
  });

  it('app/root.tsx should export links function', async () => {
    // Dynamic import to check exports
    const rootModule = await import('../app/root.tsx');

    expect(rootModule.links).toBeDefined();
    expect(typeof rootModule.links).toBe('function');
  });

  it('links function should return array of link descriptors', async () => {
    const rootModule = await import('../app/root.tsx');

    const linkDescriptors = rootModule.links();

    expect(Array.isArray(linkDescriptors)).toBe(true);
    expect(linkDescriptors.length).toBeGreaterThan(0);
  });

  it('links should include stylesheet for globals.css', async () => {
    const rootModule = await import('../app/root.tsx');

    const linkDescriptors = rootModule.links();

    // Find stylesheet link
    const stylesheetLink = linkDescriptors.find(
      (link) => link.rel === 'stylesheet'
    );

    expect(stylesheetLink).toBeDefined();
    expect(stylesheetLink.href).toBeDefined();

    // Href should reference globals.css (may be URL or path)
    expect(
      stylesheetLink.href.includes('globals.css') ||
      stylesheetLink.href.includes('globals')
    ).toBe(true);
  });
});
```

---

## Metadata

**Workflow**: Bugfix (regression-test-first)
**Created By**: SpecLab Plugin v1.0.0
