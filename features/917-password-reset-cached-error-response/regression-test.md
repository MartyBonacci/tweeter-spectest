# Regression Test: Bug 917

**Purpose**: Prove browser caching causes stale "already used" errors, validate cache-busting fix, prevent future regressions

**Test Type**: Regression Test (Frontend Integration)
**Created**: 2025-10-16

---

## Test Objective

Write a test that:
1. ✅ **Fails before fix** (proves cached responses served instead of fresh API calls)
2. ✅ **Passes after fix** (proves cache-busting headers force fresh verification)
3. ✅ **Prevents regression** (catches if cache headers removed in future)

---

## Test Specification

### Test Setup

**Prerequisites**:
- Test environment with mocked fetch API
- Ability to inspect fetch request headers
- React Router test utilities

**Initial State**:
1. Mock `fetch` to track request headers
2. Create test token: `test-token-12345-67890`
3. Mock API responses:
   - First call: Returns "already used" error (simulates cache)
   - Second call: Returns valid token (fresh API response)

### Test Execution

**Scenario**: Verify cache-busting headers prevent stale responses

1. Load ResetPassword page with token
2. Inspect fetch request headers
3. Verify `Cache-Control`, `Pragma`, and `cache` options present
4. Mock multiple requests to same endpoint
5. Verify each request hits API (not cache)

### Test Assertions

**Before Fix** (Test MUST fail):
- ❌ Assertion 1: Fetch request missing `Cache-Control: no-store` header
- ❌ Assertion 2: Fetch request missing `cache: 'no-store'` option
- ❌ Assertion 3: Browser may serve cached response for subsequent requests

**After Fix** (Test MUST pass):
- ✅ Assertion 1: Fetch includes `Cache-Control: no-cache, no-store, must-revalidate`
- ✅ Assertion 2: Fetch includes `Pragma: no-cache`
- ✅ Assertion 3: Fetch includes `cache: 'no-store'` option
- ✅ Assertion 4: Each request creates new fetch (no cached responses)

### Test Teardown

**Cleanup**:
- Restore original fetch
- Clear mocked responses

---

## Test Implementation

### Test File Location

**File**: `app/__tests__/pages/ResetPassword-cache-headers.test.tsx`

**Function/Test Name**: `test_bug_917_loader_includes_cache_busting_headers`

### Test Code Structure

```typescript
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { render, waitFor } from '@testing-library/react';

describe('Bug 917: Password Reset Cache Headers', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Spy on fetch to inspect headers
    fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ valid: true, email: 'test@example.com' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  test('should include cache-busting headers in token verification', async () => {
    // Create router with ResetPassword route
    const router = createMemoryRouter(
      [
        {
          path: '/reset-password/:token',
          lazy: async () => {
            const module = await import('../../pages/ResetPassword');
            return {
              Component: module.default,
              loader: module.loader,
            };
          },
        },
      ],
      {
        initialEntries: ['/reset-password/test-token-12345'],
      }
    );

    // Render component (triggers loader)
    render(<RouterProvider router={router} />);

    // Wait for fetch to be called
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });

    // ASSERTION 1: Verify fetch was called with correct URL
    const fetchCall = fetchSpy.mock.calls[0];
    expect(fetchCall[0]).toContain('/api/auth/verify-reset-token/test-token-12345');

    // ASSERTION 2: Verify Cache-Control header present
    const fetchOptions = fetchCall[1] as RequestInit;
    const headers = fetchOptions.headers as Record<string, string>;
    expect(headers['Cache-Control']).toBe('no-cache, no-store, must-revalidate');

    // ASSERTION 3: Verify Pragma header present (HTTP/1.0 compatibility)
    expect(headers['Pragma']).toBe('no-cache');

    // ASSERTION 4: Verify cache option set to 'no-store'
    expect(fetchOptions.cache).toBe('no-store');
  });

  test('should make fresh API call on each render (no caching)', async () => {
    // Mock fetch to return different responses
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ valid: false, error: 'Token used', used: true }), {
        status: 410,
      })
    ).mockResolvedValueOnce(
      new Response(JSON.stringify({ valid: true, email: 'test@example.com' }), {
        status: 200,
      })
    );

    // Create router
    const router = createMemoryRouter(
      [
        {
          path: '/reset-password/:token',
          lazy: async () => {
            const module = await import('../../pages/ResetPassword');
            return {
              Component: module.default,
              loader: module.loader,
            };
          },
        },
      ],
      {
        initialEntries: ['/reset-password/test-token-12345'],
      }
    );

    // First render
    const { unmount } = render(<RouterProvider router={router} />);
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));

    // Unmount and re-render (simulates navigation back)
    unmount();

    const router2 = createMemoryRouter(
      [
        {
          path: '/reset-password/:token',
          lazy: async () => {
            const module = await import('../../pages/ResetPassword');
            return {
              Component: module.default,
              loader: module.loader,
            };
          },
        },
      ],
      {
        initialEntries: ['/reset-password/test-token-12345'],
      }
    );

    render(<RouterProvider router={router2} />);

    // ASSERTION: Second render should trigger new fetch (not use cache)
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));
  });
});
```

### Test Validation Criteria

**Before Fix**:
- ❌ Test MUST fail at cache header assertions
- ❌ Fetch request missing `Cache-Control` header
- ❌ `cache` option not set to `'no-store'`

**After Fix**:
- ✅ Test MUST pass (all cache headers present)
- ✅ All existing tests still pass (no regressions)
- ✅ Fresh API call on every loader execution

---

## Edge Cases to Test

**Additional scenarios to validate**:

1. **Multiple tokens**: User tries different reset links (should not cache across tokens)
2. **Network errors**: Cache headers don't interfere with error handling
3. **Server cache headers**: Client headers override any server caching
4. **Different browsers**: Cache behavior consistent across browsers

### Edge Case Test Structure

```typescript
test('should not cache across different tokens', async () => {
  // Load token1, then token2
  // Verify separate fetch calls made
  // Assert no cross-token caching
});

test('should handle network errors with cache headers', async () => {
  // Mock fetch to throw network error
  // Verify error handled correctly
  // Assert cache headers present even in error case
});
```

---

## Manual Testing Instructions

**How to verify fix manually:**

1. **Test without clearing cache**:
   ```bash
   # Start dev server
   npm run dev:server
   npm run dev

   # Request password reset
   # Click reset link
   # Open DevTools Network tab
   # Verify request shows "Disable cache" in Network panel
   ```

2. **Inspect request headers**:
   ```
   Request Headers:
   ✓ Cache-Control: no-cache, no-store, must-revalidate
   ✓ Pragma: no-cache
   ```

3. **Test repeat requests**:
   - Request reset again for same email
   - Click NEW reset link
   - Verify no "already used" error
   - Check Network tab: new request made (not cached)

---

## Metadata

**Workflow**: Bugfix (regression-test-first)
**Created By**: SpecLab Plugin v1.0.0 + Claude Code
**Root Cause**: Missing cache-busting headers in loader fetch
**Fix**: Added `Cache-Control`, `Pragma`, and `cache: 'no-store'` to fetch options
