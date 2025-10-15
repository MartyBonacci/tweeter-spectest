# Tasks: Bug 906 - Nested Anchor Tags in TweetCard Component

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
**Description**: Implement test to verify no nested anchor tags in TweetCard
**File**: tests/components/TweetCard.test.tsx
**Test Coverage**:
- Verify no <a> element contains another <a> element
- Verify username link exists and works
- Verify card is clickable without nested links

**Implementation**:
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import { TweetCard } from '../../app/components/TweetCard';

describe('Bug 906: No Nested Anchor Tags in TweetCard', () => {
  const mockTweet = {
    id: 'test-id',
    content: 'Test content',
    createdAt: new Date(),
    author: { username: 'testuser' },
    likeCount: 0
  };

  it('should not have nested anchor tags', () => {
    const { container } = render(
      <BrowserRouter>
        <TweetCard tweet={mockTweet} />
      </BrowserRouter>
    );

    const anchors = container.querySelectorAll('a');
    anchors.forEach((anchor) => {
      const nestedAnchors = anchor.querySelectorAll('a');
      expect(nestedAnchors.length).toBe(0);
    });
  });
});
```

**Validation**: Test file created with DOM structure validation
**Parallel**: No (foundational)

### T002: Verify Test Fails
**Description**: Run regression test and confirm it fails (proves bug exists)
**Command**: `npm test -- TweetCard.test.tsx`
**Expected**: Test fails because nested <a> tags exist in current implementation
**Validation**:
- ✅ Test fails with "Expected: 0, Received: 1" (nested anchor detected)
- ✅ Failure proves bug reproduction
- ❌ If test passes, bug specification is incorrect

**Parallel**: No (depends on T001)

---

## Phase 2: Bug Fix Implementation

### T003: Implement Fix in TweetCard.tsx
**Description**: Remove nested Link components, use onClick for card navigation
**Files**: app/components/TweetCard.tsx
**Changes**:
1. Import `useNavigate` hook from react-router
2. Remove outer `<Link>` wrapper (lines 12 and 39)
3. Add `useNavigate` hook and handleCardClick function
4. Add `onClick={handleCardClick}` to article element
5. Add `cursor-pointer` class to article
6. Keep username Link but add stopPropagation to prevent card click
7. Add aria-label to username link (accessibility)

**Implementation**:
```typescript
import { Link, useNavigate } from 'react-router';

export function TweetCard({ tweet }: { tweet: TweetWithAuthor }) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/tweets/${tweet.id}`);
  };

  const handleUsernameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Link handles navigation
  };

  return (
    <article
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="flex items-center justify-between mb-3">
        <Link
          to={`/profile/${tweet.author.username}`}
          className="font-semibold text-gray-900 hover:text-blue-600 hover:underline"
          onClick={handleUsernameClick}
          aria-label={`View ${tweet.author.username}'s profile`}
        >
          @{tweet.author.username}
        </Link>

        <time
          dateTime={tweet.createdAt.toISOString()}
          title={formatTimestampFull(tweet.createdAt)}
          className="text-sm text-gray-500"
        >
          {formatTimestamp(tweet.createdAt)}
        </time>
      </div>

      <p className="text-gray-800 text-base whitespace-pre-wrap break-words">
        {tweet.content}
      </p>
    </article>
  );
}
```

**Tech Stack Validation**: ✅ React Router v7 pattern (useNavigate hook)
**Parallel**: No (core fix)

### T004: Verify Test Passes
**Description**: Run regression test and confirm it passes (proves bug fixed)
**Command**: `npm test -- TweetCard.test.tsx`
**Expected**: Test passes, no nested anchor tags detected
**Validation**:
- ✅ Test passes
- ✅ `nestedAnchors.length === 0` for all anchors
- ✅ Test success proves bug fixed

**Parallel**: No (depends on T003)

---

## Phase 3: Manual Verification

### T005: Manual Browser Test
**Description**: Verify fix works in browser and no console warnings
**Steps**:
1. Navigate to http://localhost:5173/feed
2. Open browser DevTools console
3. Check for "validateDOMNesting" warnings
4. Click username link → should navigate to profile
5. Click tweet card (non-username area) → should navigate to tweet detail
6. Inspect DOM in Elements tab → verify no nested <a> tags

**Expected**:
- ✅ No React warnings in console
- ✅ Username link navigates to profile
- ✅ Card click navigates to tweet detail
- ✅ No nested <a> tags in DOM
- ✅ Hover effects still work

**Validation**: Manual confirmation that bug is fixed and functionality preserved
**Parallel**: No (depends on T003)

### T006: Verify No Regressions
**Description**: Run full test suite to ensure fix doesn't break anything
**Command**: `npm test`
**Expected**: All tests pass
**Validation**: No existing tests broken by changes
**Parallel**: No (final validation)

---

## Summary

**Total Tasks**: 6
**Estimated Time**: 20-40 minutes
**Parallel Opportunities**: None (regression-test-first is inherently sequential)

**Success Criteria**:
- ✅ Regression test created
- ✅ Test failed before fix (proved nested anchors exist)
- ✅ Fix implemented (removed outer Link, used onClick for card)
- ✅ Test passed after fix (proved no nested anchors)
- ✅ Manual verification confirms no console warnings
- ✅ No functionality regressions
- ✅ Tech stack compliant (React Router v7 useNavigate)

---

## Execution Notes

**Phase 1 - Regression Test** (T001-T002):
- Create DOM structure validation test
- Test MUST fail to prove nested anchors exist
- Verify test detects the bug correctly

**Phase 2 - Implementation** (T003-T004):
- Remove outer Link wrapper
- Use useNavigate for card click handling
- Keep username Link (not nested anymore)
- Re-run test to verify fix

**Phase 3 - Validation** (T005-T006):
- Manual browser testing
- Check console for warnings
- Verify all functionality preserved
- Run full test suite

---

## Metadata

**Workflow**: Bugfix (regression-test-first)
**Created By**: SpecLab Plugin v1.0.0
**Smart Integration**: SpecTest (parallel execution, hooks, metrics enabled)
**Tech Stack**: React Router v7, React Testing Library, Vitest
