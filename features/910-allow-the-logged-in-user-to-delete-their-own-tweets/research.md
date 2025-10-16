# Research: Tweet Deletion Feature

**Feature ID:** 910-allow-the-logged-in-user-to-delete-their-own-tweets
**Date:** 2025-10-15
**Status:** Complete

---

## Technical Decisions

### Decision 1: Hard Delete vs Soft Delete

**Chosen:** Hard Delete (permanent removal from database)

**Rationale:**
- MVP simplicity: No additional `deleted_at` column or complex query logic
- User expectation: When users delete content, they expect it gone
- Compliance: Easier to satisfy "right to be forgotten" requests
- Performance: No bloat from soft-deleted records in queries
- Security: Permanently removes potentially sensitive content

**Alternatives Considered:**
1. **Soft Delete** (mark as deleted, hide from UI)
   - Pros: Allows undo, audit trail, data recovery
   - Cons: Complexity, query overhead, storage bloat, privacy concerns
   - Rejected for MVP, can add later if audit requirements emerge

2. **Archive to separate table** (move to `deleted_tweets` table)
   - Pros: Audit trail without query overhead
   - Cons: Complex migration, two sources of truth
   - Rejected: Over-engineering for current needs

**Implementation:**
- `DELETE FROM tweets WHERE id = $1`
- Cascade deletion via FK constraint removes associated likes
- No migration needed (uses existing schema)

---

### Decision 2: Optimistic UI Update Strategy

**Chosen:** React Router `useFetcher` with manual optimistic updates

**Rationale:**
- Instant feedback: Tweet disappears immediately on confirmation
- React Router pattern: Aligns with existing like/unlike implementation
- Error recovery: Can revert optimistic update if deletion fails
- Modern React: No useEffect, no client state management

**Alternatives Considered:**
1. **Wait for API response** (non-optimistic)
   - Pros: Simple, no revert logic
   - Cons: Poor UX (delay before UI updates)
   - Rejected: Users expect instant feedback for destructive actions

2. **Redux/client state** for optimistic updates
   - Pros: Well-established pattern
   - Cons: Violates Principle 5 (prohibited tech), unnecessary complexity
   - Rejected: Constitution violation

**Implementation:**
```typescript
const fetcher = useFetcher();
const [optimisticDeleted, setOptimisticDeleted] = useState(false);

const handleDelete = () => {
  setOptimisticDeleted(true); // Immediate UI update
  fetcher.submit(null, {
    method: 'DELETE',
    action: `/api/tweets/${tweetId}`
  });
};

// Revert on error
useEffect(() => {
  if (fetcher.state === 'idle' && fetcher.data?.error) {
    setOptimisticDeleted(false);
  }
}, [fetcher.state, fetcher.data]);
```

---

### Decision 3: Confirmation Modal Implementation

**Chosen:** Flowbite Modal component with React state

**Rationale:**
- Consistency: Matches existing UI patterns (Flowbite throughout app)
- Accessibility: Built-in ARIA attributes, keyboard support
- Customizable: Can brand with Tailwind classes
- Proven: Existing library, well-tested

**Alternatives Considered:**
1. **Native `<dialog>` element**
   - Pros: Native HTML, no dependencies
   - Cons: Limited browser support (IE, older mobile), requires polyfill
   - Rejected: Consistency with existing UI more important

2. **Headless UI Modal**
   - Pros: Unstyled, flexible
   - Cons: Not in current tech stack, requires approval
   - Rejected: Flowbite already approved and in use

**Implementation:**
- Component: `app/components/DeleteConfirmationModal.tsx`
- Props: `{ isOpen, tweetContent, onConfirm, onCancel, isDeleting }`
- Features: ESC key, click outside, loading state

---

### Decision 4: Delete Button Visibility Logic

**Chosen:** Conditional rendering based on `currentUserId === tweet.author.id`

**Rationale:**
- Simple: Single comparison, no complex permission system
- Secure: Authorization enforced at API layer (defense in depth)
- Transparent: User immediately knows which tweets they can delete
- Performant: No additional API calls to check permissions

**Alternatives Considered:**
1. **Server-side permission check** (API call per tweet)
   - Pros: Centralized authorization logic
   - Cons: Performance overhead, unnecessary API calls
   - Rejected: Authorization already at API layer, client check is optimization

2. **Hide button entirely** (no visual indicator)
   - Pros: Cleaner UI
   - Cons: Inconsistent (like button always shows)
   - Rejected: Visual consistency important

**Implementation:**
```typescript
// In TweetCard component
{currentUserId && currentUserId === tweet.author.id && (
  <DeleteButton tweetId={tweet.id} tweetContent={tweet.content} />
)}
```

---

### Decision 5: Error Handling Strategy

**Chosen:** Toast notifications for errors, revert optimistic update

**Rationale:**
- Non-blocking: User can continue browsing while toast displays
- Clear messaging: Specific error text explains what went wrong
- Recoverable: Retry option in error toast
- Familiar: Consistent with modern web app patterns

**Alternatives Considered:**
1. **Inline error messages** (below tweet)
   - Pros: Error context close to action
   - Cons: Clutters UI, tweet already removed from view
   - Rejected: Toast more appropriate for post-action feedback

2. **Modal error dialog** (blocking)
   - Pros: Forces user acknowledgment
   - Cons: Disruptive UX, blocks interaction
   - Rejected: Too heavy-handed for recoverable errors

**Error Categories:**
- `404`: "Tweet not found" (already deleted or never existed)
- `403`: "Not authorized to delete this tweet"
- `401`: "Please sign in to continue"
- Network: "Connection error. Please try again."
- `500`: "Something went wrong. Please try again later."

**Implementation:**
- Use Flowbite Toast component
- Error toasts persist until dismissed (with close button)
- Success toasts auto-dismiss after 3 seconds

---

### Decision 6: Cascade Deletion Strategy

**Chosen:** Database CASCADE constraint on likes.tweet_id foreign key

**Rationale:**
- Atomic: Tweet and likes deleted in single transaction
- Efficient: Database handles cascade, no N+1 queries
- Safe: Referential integrity guaranteed by database
- Existing: Constraint already in place, no changes needed

**Alternatives Considered:**
1. **Application-level cascade** (manual deletion)
   ```typescript
   await deleteLikesByTweetId(db, tweetId);
   await deleteTweet(db, tweetId);
   ```
   - Pros: More control, explicit logic
   - Cons: Two queries, transaction complexity, potential for orphaned likes
   - Rejected: Database constraint more reliable

2. **No cascade** (leave orphaned likes)
   - Pros: Simplest implementation
   - Cons: Data inconsistency, violates referential integrity
   - Rejected: Unacceptable

**Current Schema:**
```sql
CREATE TABLE likes (
  id UUID PRIMARY KEY,
  tweet_id UUID REFERENCES tweets(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  -- ...
);
```

No changes needed - cascade already configured.

---

### Decision 7: Keyboard Shortcuts (P1 - Should Have)

**Chosen:** Delete key to open modal, Enter to confirm, Escape to cancel

**Rationale:**
- Power user feature: Faster deletion workflow
- Accessibility: Keyboard-only navigation support
- Familiar: Common shortcuts (Delete, Enter, Esc)
- Low risk: Non-critical P1 feature, can defer if time-constrained

**Alternatives Considered:**
1. **No keyboard shortcuts** (mouse-only)
   - Pros: Simpler implementation
   - Cons: Accessibility gap, poor power user experience
   - Rejected: Accessibility important, shortcuts are easy to add

2. **Custom shortcuts** (e.g., Ctrl+D)
   - Pros: More unique, avoids conflicts
   - Cons: Harder to discover, less intuitive
   - Rejected: Standard shortcuts more user-friendly

**Implementation (P1):**
- Delete key on focused tweet: Opens modal
- Enter in modal: Confirms deletion
- Escape in modal: Cancels (already standard Flowbite behavior)

---

## Technology Validation

### Tech Stack Compliance: ✅ 100% APPROVED

All technologies used in this feature are pre-approved in `/memory/tech-stack.md`:

| Technology | Purpose | Status |
|------------|---------|--------|
| TypeScript 5.x | Type safety | ✅ Core technology |
| React Router v7 | useFetcher for optimistic updates | ✅ Core framework |
| Zod | API request/response validation | ✅ Standard library |
| Express | DELETE endpoint | ✅ Core backend |
| postgres package | Database operations | ✅ Standard library |
| JWT (httpOnly cookies) | Authentication | ✅ Security standard |
| Tailwind CSS | Styling | ✅ UI library |
| Flowbite | Modal component | ✅ UI library |

**New Technologies:** None
**Prohibited Technologies Avoided:** None used
**Version Updates:** No version changes needed

---

## Best Practices Research

### React Router useFetcher Best Practices

**Pattern: Optimistic UI with useFetcher**

```typescript
function DeleteButton({ tweetId }: { tweetId: string }) {
  const fetcher = useFetcher();
  const [isOptimisticallyDeleted, setIsOptimisticallyDeleted] = useState(false);

  // Optimistic update
  const handleDelete = () => {
    setIsOptimisticallyDeleted(true);
    fetcher.submit(null, {
      method: 'DELETE',
      action: `/api/tweets/${tweetId}`
    });
  };

  // Revert on error
  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data?.error) {
      setIsOptimisticallyDeleted(false);
      showErrorToast(fetcher.data.error);
    }
  }, [fetcher.state, fetcher.data]);

  if (isOptimisticallyDeleted) return null;

  return <button onClick={handleDelete}>Delete</button>;
}
```

**Source:** React Router v7 documentation, useFetcher examples

---

### PostgreSQL DELETE Best Practices

**Pattern: Parameterized DELETE with ownership check**

```typescript
export async function deleteTweet(
  db: Sql,
  tweetId: string,
  userId: string
): Promise<boolean> {
  // Single query: check ownership AND delete atomically
  const result = await db`
    DELETE FROM tweets
    WHERE id = ${tweetId}
      AND profile_id = ${userId}
    RETURNING id
  `;

  return result.length > 0; // true if deleted, false if not found/not owned
}
```

**Rationale:**
- Single query: Efficient, atomic
- Ownership check in WHERE: No 403 vs 404 timing leak
- RETURNING clause: Confirms deletion occurred
- No separate SELECT: Prevents TOCTOU race condition

**Source:** PostgreSQL documentation, security best practices

---

### Modal Accessibility Best Practices

**Requirements:**
1. Focus trap: Focus stays within modal while open
2. ESC key: Closes modal
3. Click outside: Closes modal (optional, configurable)
4. ARIA attributes: `role="dialog"`, `aria-labelledby`, `aria-describedby`
5. Initial focus: Focus on primary action button or cancel
6. Return focus: Restore focus to trigger element on close

**Flowbite Modal provides:**
- ✅ Focus trap (built-in)
- ✅ ESC key handling
- ✅ Click outside (configurable)
- ✅ ARIA attributes
- ⚠️ Focus management (manual implementation needed)

**Implementation:**
```typescript
const modalRef = useRef<HTMLDivElement>(null);
const triggerRef = useRef<HTMLButtonElement>(null);

useEffect(() => {
  if (isOpen) {
    // Focus first button in modal
    modalRef.current?.querySelector('button')?.focus();
  } else {
    // Return focus to trigger
    triggerRef.current?.focus();
  }
}, [isOpen]);
```

**Source:** WAI-ARIA Authoring Practices, Flowbite documentation

---

## Open Questions Resolution

All open questions from spec.md have been resolved:

1. **Soft Delete vs Hard Delete** → Hard Delete (Decision 1)
2. **Cascade Deletion Scope** → Database CASCADE on likes (Decision 6)
3. **Rate Limiting** → No rate limiting for MVP (legitimate use case)

---

## Implementation Risks

### Risk 1: Accidental Deletion

**Severity:** Medium
**Likelihood:** Low (confirmation modal mitigates)
**Mitigation:**
- Confirmation modal ALWAYS required (no "Don't ask again" checkbox)
- Modal shows tweet content for context
- Two-step process (click delete → click confirm)
- Future P2: Undo functionality (5-second window)

### Risk 2: Race Condition (Multiple Delete Clicks)

**Severity:** Low
**Likelihood:** Low
**Mitigation:**
- Disable delete button while `fetcher.state === 'submitting'`
- Optimistic UI removes tweet immediately (no second click possible)
- API endpoint is idempotent (404 on second delete, no error)

### Risk 3: Network Failure During Delete

**Severity:** Low
**Likelihood:** Medium
**Mitigation:**
- Optimistic update reverts on error
- Error toast with retry button
- Tweet reappears in feed
- User can retry deletion manually

---

## Performance Considerations

### Database Query Performance

**DELETE operation:**
- Indexed primary key lookup: O(log n)
- CASCADE deletion: Handled by database efficiently
- Transaction: Atomic, no multi-query overhead

**Expected:** < 50ms for tweet + associated likes

### Frontend Performance

**Optimistic update:**
- State change: Immediate (< 1ms)
- Re-render: Single component (TweetCard)
- No cascade re-renders: Proper React.memo usage

**Expected:** < 16ms (single frame) for UI update

### Modal Rendering

**Strategy:** Lazy load modal component
```typescript
const DeleteConfirmationModal = lazy(() =>
  import('./DeleteConfirmationModal')
);
```

**Rationale:**
- Modal only needed when delete button clicked
- Reduces initial bundle size
- Suspense fallback: Loading spinner (rarely seen due to fast load)

---

## Summary

All technical decisions made, researched, and documented. Feature ready for Phase 1 (Design & Contracts).

**Key Takeaways:**
- 100% tech stack compliant (no new dependencies)
- Hard delete chosen for simplicity and user expectations
- Optimistic UI via React Router useFetcher pattern
- Flowbite modal for consistency and accessibility
- Database CASCADE handles like deletion automatically
- Comprehensive error handling with toast notifications

**Next Phase:** Generate data-model.md, contracts/, and quickstart.md
