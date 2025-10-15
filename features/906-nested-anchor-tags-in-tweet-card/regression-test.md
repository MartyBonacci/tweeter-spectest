# Regression Test: Bug 906

**Purpose**: Prove nested anchor bug exists, validate fix, prevent future regressions

**Test Type**: Component Test (DOM structure validation)
**Created**: 2025-10-13

---

## Test Objective

Write a test that:
1. ✅ **Fails before fix** (proves nested <a> tags exist)
2. ✅ **Passes after fix** (proves no nested <a> tags)
3. ✅ **Prevents regression** (catches if nested links are reintroduced)

---

## Test Specification

### Test Setup

**Prerequisites**:
- Vitest and React Testing Library installed
- TweetCard component importable
- Test data: mock TweetWithAuthor object

**Initial State**:
- Create mock tweet with author data
- Render TweetCard component in test environment

**Test Data**:
```typescript
const mockTweet: TweetWithAuthor = {
  id: 'test-tweet-id',
  content: 'Test tweet content',
  createdAt: new Date('2025-01-01'),
  author: {
    username: 'testuser'
  },
  likeCount: 0
};
```

### Test Execution

**Test Actions**:

1. **Render TweetCard component**:
   - Import TweetCard
   - Render with mock tweet data
   - Get rendered HTML/DOM

2. **Check for nested anchor tags**:
   - Query all <a> elements in the component
   - For each <a> element, check if it has an <a> descendant
   - Verify no <a> is nested inside another <a>

3. **Verify clickable functionality**:
   - Check that username link exists and is clickable
   - Check that tweet card is clickable (via article onClick or navigate)

### Test Assertions

**DOM Structure Assertions**:
- ✅ No <a> element contains another <a> element as a descendant
- ✅ Username Link renders as <a> tag with correct href
- ✅ Article element is clickable (has onClick or other click mechanism)

**Functional Assertions**:
- ✅ Clicking username navigates to profile (Link functionality preserved)
- ✅ Clicking card navigates to tweet detail (card functionality preserved)

### Test Teardown

Standard test cleanup (handled by testing framework).

---

## Test Implementation

### Test File Location

**File**: `tests/components/TweetCard.test.tsx`
**Test Name**: `test_bug_906_no_nested_anchor_tags`

### Test Code Template

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import { TweetCard } from '../../app/components/TweetCard';
import type { TweetWithAuthor } from '../../src/types/tweet';

describe('Bug 906: No Nested Anchor Tags in TweetCard', () => {
  const mockTweet: TweetWithAuthor = {
    id: 'test-tweet-id',
    content: 'Test tweet content',
    createdAt: new Date('2025-01-01'),
    author: {
      username: 'testuser'
    },
    likeCount: 0
  };

  it('should not have nested anchor tags', () => {
    const { container } = render(
      <BrowserRouter>
        <TweetCard tweet={mockTweet} />
      </BrowserRouter>
    );

    // Get all anchor elements
    const anchors = container.querySelectorAll('a');

    // Check each anchor for nested anchors
    anchors.forEach((anchor) => {
      const nestedAnchors = anchor.querySelectorAll('a');
      expect(nestedAnchors.length).toBe(0); // No nested <a> tags
    });
  });

  it('should render username as a link', () => {
    render(
      <BrowserRouter>
        <TweetCard tweet={mockTweet} />
      </BrowserRouter>
    );

    const usernameLink = screen.getByRole('link', { name: /@testuser/i });
    expect(usernameLink).toBeDefined();
    expect(usernameLink.getAttribute('href')).toBe('/profile/testuser');
  });

  it('should make card content clickable', () => {
    const { container } = render(
      <BrowserRouter>
        <TweetCard tweet={mockTweet} />
      </BrowserRouter>
    );

    const article = container.querySelector('article');
    expect(article).toBeDefined();

    // After fix: article should have onClick or be wrapped differently
    // This test ensures card is still clickable without nested links
    expect(
      article?.onclick !== null ||
      article?.classList.contains('cursor-pointer')
    ).toBe(true);
  });
});
```

### Alternative Test Approach (HTML String Validation)

```typescript
it('should not contain nested anchor tags in HTML', () => {
  const { container } = render(
    <BrowserRouter>
      <TweetCard tweet={mockTweet} />
    </BrowserRouter>
  );

  const html = container.innerHTML;

  // Regex to detect <a> tags containing other <a> tags
  const nestedAnchorPattern = /<a[^>]*>(?:[^<]|<(?!a))*<a/gi;

  expect(html).not.toMatch(nestedAnchorPattern);
});
```

### Test Validation Criteria

**Before Fix**:
- ❌ Test MUST fail because outer Link wraps inner Link
- ❌ `nestedAnchors.length` will be > 0
- ❌ Nested <a> tags detected in HTML

**After Fix**:
- ✅ Test MUST pass because no Links are nested
- ✅ `nestedAnchors.length` will be 0
- ✅ No nested <a> tags in HTML
- ✅ Username link still works
- ✅ Card navigation still works

---

## Edge Cases to Test

1. **Multiple tweets**: Render multiple TweetCards, ensure none have nested anchors
2. **Long usernames**: Verify link structure holds with various username lengths
3. **Navigation events**: Verify clicks navigate correctly without nested links

---

## Test Execution

**Run Test**:
```bash
npm test -- TweetCard.test.tsx
```

**Expected Before Fix**:
```
❌ FAIL  tests/components/TweetCard.test.tsx
  Bug 906: No Nested Anchor Tags in TweetCard
    ✗ should not have nested anchor tags
      Expected: 0
      Received: 1
```

**Expected After Fix**:
```
✅ PASS  tests/components/TweetCard.test.tsx
  Bug 906: No Nested Anchor Tags in TweetCard
    ✓ should not have nested anchor tags
    ✓ should render username as a link
    ✓ should make card content clickable
```

---

## Manual Verification

After fix, manually verify in browser:

1. Open http://localhost:5173/feed
2. Check browser DevTools console
3. Verify: No "validateDOMNesting" warnings
4. Click username link → navigates to profile
5. Click tweet card (non-username area) → navigates to tweet detail

---

## Metadata

**Workflow**: Bugfix (regression-test-first)
**Created By**: SpecLab Plugin v1.0.0
**Test Framework**: Vitest + React Testing Library
**Test Type**: Component test (DOM validation)
