# Regression Test: Bug 905

**Purpose**: Prove stylesheet link bug exists, validate fix, prevent future regressions

**Test Type**: Integration Test (SSR verification)
**Created**: 2025-10-13

---

## Test Objective

Write a test that:
1. ✅ **Fails before fix** (proves stylesheet link missing in SSR HTML)
2. ✅ **Passes after fix** (proves stylesheet link present in SSR HTML)
3. ✅ **Prevents regression** (catches if links export is removed)

---

## Test Specification

### Test Setup

**Prerequisites**:
- React Router dev server running (or build + serve for production test)
- Test can make HTTP requests to the server
- Test can parse HTML responses

**Initial State**:
- Server running on port 5173 (dev) or configured port
- Feed page accessible at /feed
- Root layout at app/root.tsx

### Test Execution

**Test Actions**:

1. **Verify links export exists**:
   - Import app/root.tsx
   - Check that `links` export is defined
   - Check that `links` is a function

2. **Verify links export returns stylesheet**:
   - Call the `links` function
   - Verify return value is an array
   - Verify array contains object with `rel: 'stylesheet'`
   - Verify href points to globals.css

3. **Verify SSR HTML includes stylesheet link**:
   - Make HTTP GET request to /feed (simulating full page load)
   - Parse HTML response
   - Check for `<link rel="stylesheet" href="...globals.css...">` in `<head>`

4. **Verify page styling works**:
   - Optional: Use headless browser to check computed styles
   - Verify Tailwind classes are applied

### Test Assertions

**Static Analysis Assertions**:
- ✅ `links` export exists in app/root.tsx
- ✅ `links` returns array of link descriptors
- ✅ Array includes stylesheet for globals.css

**Runtime Assertions** (SSR HTML):
- ✅ Server-rendered HTML includes `<link rel="stylesheet">` tag
- ✅ Stylesheet href points to globals.css
- ✅ Link tag is in `<head>` section

**Visual Assertions** (optional, requires browser):
- ✅ Page has non-default background color
- ✅ Typography styles are applied
- ✅ Layout spacing is correct

### Test Teardown

No cleanup needed (read-only test).

---

## Test Implementation

### Test File Location

**File**: `tests/root-layout.test.ts` (or `app/root.test.tsx`)
**Test Name**: `test_bug_905_stylesheet_link_in_ssr_html`

### Test Code Template

```typescript
import { describe, it, expect } from 'vitest';

describe('Bug 905: Stylesheet Links in Root Layout', () => {
  it('should export links function', async () => {
    // Dynamic import to avoid side effects
    const rootModule = await import('../app/root.tsx');

    expect(rootModule.links).toBeDefined();
    expect(typeof rootModule.links).toBe('function');
  });

  it('should include globals.css in links export', async () => {
    const rootModule = await import('../app/root.tsx');
    const links = rootModule.links();

    expect(Array.isArray(links)).toBe(true);

    const stylesheetLink = links.find(
      (link: any) => link.rel === 'stylesheet' && link.href.includes('globals.css')
    );

    expect(stylesheetLink).toBeDefined();
    expect(stylesheetLink.href).toContain('globals.css');
  });

  it('should include stylesheet link in SSR HTML', async () => {
    // Make request to dev server (simulating full page load)
    const response = await fetch('http://localhost:5173/feed');
    const html = await response.text();

    // Verify stylesheet link is in HTML
    expect(html).toContain('<link rel="stylesheet"');
    expect(html).toContain('globals.css');

    // Verify it's in the <head> section
    const headMatch = html.match(/<head>(.*?)<\/head>/s);
    expect(headMatch).toBeDefined();
    const headContent = headMatch![1];
    expect(headContent).toContain('globals.css');
  });
});
```

### Test Validation Criteria

**Before Fix**:
- ❌ `links` export does NOT exist → test fails
- ❌ SSR HTML does NOT contain stylesheet link → test fails
- If tests pass before fix, implementation is wrong

**After Fix**:
- ✅ `links` export exists → test passes
- ✅ SSR HTML contains stylesheet link → test passes
- ✅ All existing tests still pass (no regressions)

---

## Edge Cases to Test

1. **Multiple stylesheets**: If other stylesheets are added, links array should include all
2. **Production build**: Test should pass in both dev and production builds
3. **Error boundary**: ErrorBoundary component should also work without styles (it doesn't use Links)

---

## Alternative Testing Approaches

### Approach 1: E2E Test with Playwright

```typescript
import { test, expect } from '@playwright/test';

test('feed page has styles after refresh', async ({ page }) => {
  await page.goto('http://localhost:5173/feed');

  // Get background color (should be Tailwind's gray-50)
  const bgColor = await page.evaluate(() => {
    return window.getComputedStyle(document.body).backgroundColor;
  });

  // Should not be default (white)
  expect(bgColor).not.toBe('rgba(255, 255, 255, 1)');
  expect(bgColor).toBe('rgb(249, 250, 251)'); // Tailwind gray-50

  // Refresh page
  await page.reload();

  // Check styles still applied after refresh
  const bgColorAfterRefresh = await page.evaluate(() => {
    return window.getComputedStyle(document.body).backgroundColor;
  });

  expect(bgColorAfterRefresh).toBe('rgb(249, 250, 251)');
});
```

### Approach 2: Unit Test for Links Function

```typescript
it('links function returns stylesheet descriptor', () => {
  const links = rootModule.links();

  expect(links).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        rel: 'stylesheet',
        href: expect.stringContaining('globals.css')
      })
    ])
  );
});
```

---

## Test Execution

**Run Test**:
```bash
npm test -- root-layout.test.ts
```

**Expected Before Fix**:
```
❌ FAIL  tests/root-layout.test.ts
  Bug 905: Stylesheet Links in Root Layout
    ✗ should export links function
    ✗ should include globals.css in links export
    ✗ should include stylesheet link in SSR HTML
```

**Expected After Fix**:
```
✅ PASS  tests/root-layout.test.ts
  Bug 905: Stylesheet Links in Root Layout
    ✓ should export links function
    ✓ should include globals.css in links export
    ✓ should include stylesheet link in SSR HTML
```

---

## Metadata

**Workflow**: Bugfix (regression-test-first)
**Created By**: SpecLab Plugin v1.0.0
**Test Framework**: Vitest (unit/integration tests)
**Alternative**: Playwright (E2E browser tests)
