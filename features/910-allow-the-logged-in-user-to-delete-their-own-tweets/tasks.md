# Implementation Tasks: Tweet Deletion

<!-- Tech Stack Validation: PASSED -->
<!-- Validated against: /memory/tech-stack.md v1.0.0 -->
<!-- No prohibited technologies found -->
<!-- 0 unapproved technologies (100% pre-approved stack) -->

**Feature ID:** 910-allow-the-logged-in-user-to-delete-their-own-tweets
**Created:** 2025-10-15
**Total Tasks:** 30
**Estimated Effort:** 3-4 hours

---

## Task Organization

Tasks are organized by user story to enable independent implementation and testing:

- **Phase 1:** Setup & Verification (3 tasks) - Verify prerequisites
- **Phase 2:** User Story 1 - Delete Own Tweets (15 tasks) - Core functionality
- **Phase 3:** User Story 2 - Error Handling (4 tasks) - Robust error management
- **Phase 4:** User Story 3 - Confirmation Safety (3 tasks) - UX polish
- **Phase 5:** Integration & Polish (3 tasks) - Cross-page integration
- **Phase 6:** Testing & Validation (2 tasks) - E2E and accessibility

**MVP Scope:** Phase 1 + Phase 2 (18 tasks, ~2 hours)

---

## Phase 1: Setup & Verification

**Goal:** Verify all prerequisites exist and development environment is ready

### T001: Verify TweetCard component exists
**File:** `app/components/TweetCard.tsx`
**Type:** Verification
**Parallel:** [P]

**Task:**
1. Locate the existing TweetCard component
2. Confirm it accepts `TweetWithAuthorAndLikes` type for tweet prop
3. Verify it renders tweet content, author, timestamp, and like button
4. Document current props interface for reference

**Success Criteria:**
- TweetCard component found
- Props interface documented
- Component renders all required elements

### T002: Verify authentication system exists
**File:** `src/middleware/auth.ts` or `src/routes/tweets.ts`
**Type:** Verification
**Parallel:** [P]

**Task:**
1. Locate `authenticate` middleware function
2. Verify it extracts userId from JWT token
3. Confirm req.user.userId is populated after authentication
4. Document middleware usage pattern for DELETE endpoint

**Success Criteria:**
- Authenticate middleware function found
- JWT extraction confirmed
- Usage pattern documented

### T003: Verify database connection and existing tweet functions
**File:** `src/db/tweets.ts`
**Type:** Verification
**Parallel:** [P]

**Task:**
1. Locate existing tweet database functions (getAllTweets, createTweet, etc.)
2. Verify postgres package connection pattern
3. Confirm parameterized query usage (template literals)
4. Document function signature patterns for consistency

**Success Criteria:**
- Existing tweet functions confirmed
- Database connection pattern documented
- Parameterized query pattern verified

---

## Phase 2: User Story 1 - Delete Own Tweets

**User Story:**
```
As an authenticated user
I want to delete my own tweets
So that I can remove content I no longer want to be visible
```

**Goal:** Implement core delete functionality with database, API, and UI

**Independent Test Criteria:**
- User can click delete button on own tweets
- Confirmation modal appears before deletion
- Tweet is removed from database permanently
- Tweet disappears from UI immediately (optimistic update)
- Unauthorized attempts are rejected

### T004: Add deleteTweet database function
**File:** `src/db/tweets.ts`
**Type:** Implementation
**Parallel:** No (modifies existing file)
**Story:** US-1

**Task:**
1. Add `deleteTweet` function with signature:
   ```typescript
   export async function deleteTweet(
     db: Sql,
     tweetId: string,
     userId: string
   ): Promise<boolean>
   ```
2. Implement single query: `DELETE FROM tweets WHERE id = ${tweetId} AND profile_id = ${userId} RETURNING id`
3. Return true if result.length > 0 (deleted), false otherwise (not found or not owned)
4. Add JSDoc comments explaining ownership check and return value

**Success Criteria:**
- Function compiles without TypeScript errors
- Single parameterized query (no SQL injection risk)
- Returns boolean indicating success
- JSDoc documentation complete

### T005: Add Zod schema for DELETE request validation
**File:** `src/schemas/tweet.ts`
**Type:** Implementation
**Parallel:** [P] (different file from T004)
**Story:** US-1

**Task:**
1. Add `deleteTweetParamsSchema`:
   ```typescript
   export const deleteTweetParamsSchema = z.object({
     id: z.string().uuid('Invalid tweet ID format'),
   });
   ```
2. Export type: `export type DeleteTweetParams = z.infer<typeof deleteTweetParamsSchema>;`
3. Add error schema:
   ```typescript
   export const deleteTweetErrorSchema = z.object({
     error: z.string().min(1),
     details: z.string().optional(),
   });
   ```

**Success Criteria:**
- Schema validates UUID format correctly
- Invalid UUIDs rejected with clear error message
- TypeScript types inferred from schemas

### T006: Implement DELETE /api/tweets/:id endpoint
**File:** `src/routes/tweets.ts`
**Type:** Implementation
**Parallel:** No (depends on T004, T005)
**Story:** US-1

**Task:**
1. Add DELETE route handler:
   ```typescript
   router.delete('/:id', authenticate, async (req, res) => {
     // Implementation
   });
   ```
2. Validate authentication (req.user.userId exists)
3. Validate tweet ID with `deleteTweetParamsSchema.safeParse()`
4. Call `deleteTweet(db, tweetId, userId)`
5. Return 204 No Content if deleted, 404 if not found/not owned
6. Handle errors with appropriate status codes (400, 401, 500)

**Success Criteria:**
- Endpoint returns 204 on successful deletion
- Returns 404 for not found/not owned (no timing leak)
- Returns 400 for invalid UUID format
- Returns 401 if not authenticated
- No TypeScript errors

### T007: Write unit tests for deleteTweet function
**File:** `tests/db/tweets.test.ts`
**Type:** Testing
**Parallel:** [P] (different file, can run concurrently)
**Story:** US-1

**Task:**
1. Test case: User deletes own tweet → returns true, tweet removed
2. Test case: User tries to delete another user's tweet → returns false
3. Test case: User tries to delete non-existent tweet → returns false
4. Test case: Likes are cascade deleted when tweet deleted
5. Verify all test cases pass

**Success Criteria:**
- All 4 test cases pass
- Test coverage includes success, not owned, not found, cascade deletion
- Tests use test database (not production)

### T008: Write integration tests for DELETE endpoint
**File:** `tests/integration/tweets.test.ts`
**Type:** Testing
**Parallel:** [P] (different file from T007)
**Story:** US-1

**Task:**
1. Test: DELETE with auth + own tweet → 204
2. Test: DELETE with auth + other user tweet → 404
3. Test: DELETE without auth → 401
4. Test: DELETE with invalid UUID → 400
5. Test: DELETE non-existent tweet → 404
6. Verify all tests pass

**Success Criteria:**
- All 5 test cases pass
- Tests verify status codes and response bodies
- Tests clean up test data after execution

### T009: Create DeleteConfirmationModal component
**File:** `app/components/DeleteConfirmationModal.tsx`
**Type:** Implementation
**Parallel:** [P] (new file, independent)
**Story:** US-1

**Task:**
1. Create functional component with props:
   ```typescript
   interface DeleteConfirmationModalProps {
     isOpen: boolean;
     tweetContent: string;
     onConfirm: () => void;
     onCancel: () => void;
     isDeleting: boolean;
   }
   ```
2. Use Flowbite Modal component
3. Display tweet content preview in gray box
4. Add "Delete Tweet" heading
5. Add warning text: "This action cannot be undone."
6. Add "Delete" button (red, destructive) and "Cancel" button
7. Disable buttons while `isDeleting === true`
8. Add loading spinner on Delete button when deleting

**Success Criteria:**
- Component renders modal when `isOpen === true`
- Tweet content displayed correctly
- Buttons trigger onConfirm/onCancel callbacks
- Loading state shown correctly
- ESC key closes modal (Flowbite default behavior)

### T010: Create DeleteButton component
**File:** `app/components/DeleteButton.tsx`
**Type:** Implementation
**Parallel:** [P] (new file, can be done concurrently with T009)
**Story:** US-1

**Task:**
1. Create functional component with props:
   ```typescript
   interface DeleteButtonProps {
     tweetId: string;
     tweetContent: string;
     onDeleteSuccess?: () => void;
   }
   ```
2. Use `useFetcher()` for DELETE request
3. Use `useState` for `isModalOpen`
4. Render trash icon button (red color, accessible label)
5. On click: Open modal (`setIsModalOpen(true)`)
6. On confirm: Submit DELETE via fetcher.submit()
7. Handle success: Call onDeleteSuccess callback, close modal
8. Handle error: Show toast notification, keep modal open

**Success Criteria:**
- Button renders trash icon with red color
- Click opens DeleteConfirmationModal
- Confirm sends DELETE request via useFetcher
- Success/error handled appropriately
- No TypeScript errors

### T011: Modify TweetCard to add currentUserId prop
**File:** `app/components/TweetCard.tsx`
**Type:** Modification
**Parallel:** No (modifies existing component)
**Story:** US-1

**Task:**
1. Add optional prop to interface:
   ```typescript
   interface TweetCardProps {
     tweet: TweetWithAuthorAndLikes;
     currentUserId?: string; // NEW
   }
   ```
2. Extract `currentUserId` from props in component
3. No other changes yet (delete button added in T012)

**Success Criteria:**
- Prop added to interface
- Component compiles without errors
- Existing functionality unchanged

### T012: Add delete button to TweetCard
**File:** `app/components/TweetCard.tsx`
**Type:** Modification
**Parallel:** No (depends on T011, T009, T010)
**Story:** US-1

**Task:**
1. Import DeleteButton component
2. Add state: `const [isOptimisticallyDeleted, setIsOptimisticallyDeleted] = useState(false);`
3. Add conditional render for delete button:
   ```typescript
   {currentUserId && currentUserId === tweet.author.id && (
     <div onClick={(e) => e.stopPropagation()}>
       <DeleteButton
         tweetId={tweet.id}
         tweetContent={tweet.content}
         onDeleteSuccess={() => setIsOptimisticallyDeleted(true)}
       />
     </div>
   )}
   ```
4. Add early return if optimistically deleted:
   ```typescript
   if (isOptimisticallyDeleted) return null;
   ```
5. Ensure delete button appears in actions section (next to like button)

**Success Criteria:**
- Delete button appears only when `currentUserId === tweet.author.id`
- Click doesn't trigger card navigation (stopPropagation works)
- Card disappears when `isOptimisticallyDeleted === true`
- No TypeScript errors

### T013: Update Feed page loader to pass currentUserId
**File:** `app/pages/Feed.tsx`
**Type:** Modification
**Parallel:** No (modifies existing loader)
**Story:** US-1

**Task:**
1. In loader function, add call to `/api/auth/me` (may already exist)
2. Extract `currentUserId` from response: `const currentUserId = meData.user?.id || null;`
3. Return `currentUserId` in loader data: `return { tweets, currentUserId };`
4. Update loader return type if needed

**Success Criteria:**
- Loader returns currentUserId
- currentUserId is null if not authenticated
- No TypeScript errors
- Existing functionality unchanged

### T014: Update Feed page component to pass currentUserId to TweetCard
**File:** `app/pages/Feed.tsx`
**Type:** Modification
**Parallel:** No (depends on T013)
**Story:** US-1

**Task:**
1. Extract `currentUserId` from useLoaderData: `const { tweets, currentUserId } = useLoaderData<typeof loader>();`
2. Pass to each TweetCard:
   ```typescript
   {tweets.map((tweet) => (
     <TweetCard key={tweet.id} tweet={tweet} currentUserId={currentUserId} />
   ))}
   ```

**Success Criteria:**
- currentUserId passed to TweetCard
- Delete button appears on own tweets in feed
- No TypeScript errors

### T015: Write component tests for DeleteButton
**File:** `tests/components/DeleteButton.test.tsx`
**Type:** Testing
**Parallel:** [P] (new file, independent)
**Story:** US-1

**Task:**
1. Test: Button renders with trash icon
2. Test: Click opens modal
3. Test: Confirm triggers fetcher.submit()
4. Test: Success calls onDeleteSuccess callback
5. Test: Error shows toast notification
6. Verify all tests pass

**Success Criteria:**
- All test cases pass
- Tests verify button behavior, modal opening, fetcher usage
- No flaky tests

### T016: Write component tests for DeleteConfirmationModal
**File:** `tests/components/DeleteConfirmationModal.test.tsx`
**Type:** Testing
**Parallel:** [P] (different file from T015)
**Story:** US-1

**Task:**
1. Test: Modal renders when `isOpen === true`
2. Test: Tweet content displayed in preview
3. Test: Delete button triggers onConfirm
4. Test: Cancel button triggers onCancel
5. Test: Buttons disabled when `isDeleting === true`
6. Verify all tests pass

**Success Criteria:**
- All test cases pass
- Tests verify modal rendering, button callbacks, loading state
- No console errors during tests

### T017: Write component tests for TweetCard delete button
**File:** `tests/components/TweetCard.test.tsx`
**Type:** Testing
**Parallel:** [P] (may already exist, add new tests)
**Story:** US-1

**Task:**
1. Test: Delete button appears when `currentUserId === tweet.author.id`
2. Test: Delete button does NOT appear when currentUserId differs
3. Test: Delete button does NOT appear when currentUserId is undefined
4. Test: Card disappears when optimistically deleted
5. Verify all tests pass

**Success Criteria:**
- All test cases pass
- Tests verify conditional rendering of delete button
- Tests verify optimistic UI update

### T018: Manual testing for User Story 1
**Type:** Manual Testing
**Parallel:** No (requires all US-1 tasks complete)
**Story:** US-1

**Task:**
1. Start dev server and sign in as test user
2. Navigate to /feed
3. Verify delete button appears on own tweets only
4. Click delete on a tweet
5. Verify modal appears with tweet content
6. Click "Cancel" → modal closes, tweet still visible
7. Click delete again, click "Delete" → tweet disappears immediately
8. Refresh page → tweet still gone
9. Check database → tweet and likes deleted
10. Try deleting another user's tweet via API → verify 404 response

**Success Criteria:**
- Delete button visible only on own tweets
- Modal prevents accidental deletion
- Optimistic UI update works
- Database deletion confirmed
- Authorization enforced at API level

---

## Phase 3: User Story 2 - Error Handling

**User Story:**
```
As a user attempting to delete a tweet
I want clear error messages if deletion fails
So that I understand what went wrong and can take appropriate action
```

**Goal:** Robust error handling with clear user feedback

**Independent Test Criteria:**
- "Tweet not found" error for already-deleted tweets
- "Not authorized" error for unowned tweets
- Network error handling with retry option
- Optimistic update reverts on failure

### T019: Add toast notification utility
**File:** `app/utils/toast.ts` (new file if doesn't exist)
**Type:** Implementation
**Parallel:** [P] (new file, independent)
**Story:** US-2

**Task:**
1. Create toast utility functions using Flowbite Toast or react-hot-toast:
   ```typescript
   export const toast = {
     success: (message: string) => { /* ... */ },
     error: (message: string, options?: { persist?: boolean }) => { /* ... */ },
   };
   ```
2. Configure toast styling (Tailwind classes)
3. Export toast functions for use in components

**Success Criteria:**
- Toast functions work in browser
- Success toasts auto-dismiss after 3 seconds
- Error toasts persist until dismissed (closeable)
- Toast styling consistent with app theme

### T020: Add error handling to DeleteButton
**File:** `app/components/DeleteButton.tsx`
**Type:** Modification
**Parallel:** No (modifies T010)
**Story:** US-2

**Task:**
1. Import toast utility
2. Add useEffect to monitor fetcher.state and fetcher.data
3. On error (fetcher.data?.error exists):
   - Show error toast with message: `toast.error(fetcher.data.error, { persist: true })`
   - Keep modal open for retry option
4. On success (fetcher.state === 'idle' && no error):
   - Show success toast: `toast.success('Tweet deleted')`
   - Close modal
   - Call onDeleteSuccess callback

**Success Criteria:**
- Error toast appears when deletion fails
- Success toast appears when deletion succeeds
- Modal stays open on error (allows retry)
- No duplicate toasts

### T021: Add optimistic update revert logic to TweetCard
**File:** `app/components/DeleteButton.tsx`
**Type:** Modification
**Parallel:** No (modifies T020)
**Story:** US-2

**Task:**
1. In useEffect error handler, add revert logic
2. On error: Reset optimistic state in parent TweetCard via callback
3. Modify onDeleteSuccess prop to accept error parameter:
   ```typescript
   onDeleteSuccess?: (error?: string) => void;
   ```
4. Call `onDeleteSuccess(fetcher.data.error)` on error
5. In TweetCard: Reset `isOptimisticallyDeleted` to false if error parameter present

**Success Criteria:**
- Tweet reappears in UI if deletion fails
- Error toast displays failure reason
- User can retry deletion

### T022: Write error handling tests
**File:** `tests/components/DeleteButton.test.tsx`
**Type:** Testing
**Parallel:** [P] (adds to existing test file)
**Story:** US-2

**Task:**
1. Test: Network error shows error toast
2. Test: 404 error shows "Tweet not found" toast
3. Test: Optimistic update reverts on error
4. Test: Success shows success toast
5. Verify all tests pass

**Success Criteria:**
- All test cases pass
- Tests verify error scenarios and toast notifications
- Tests verify optimistic update revert

---

## Phase 4: User Story 3 - Confirmation Safety

**User Story:**
```
As a user who accidentally clicks delete
I want a confirmation modal before deletion
So that I don't lose content unintentionally
```

**Goal:** Enhance modal UX and accessibility

**Independent Test Criteria:**
- Modal displays tweet content being deleted
- Clear Delete/Cancel buttons
- ESC key and click-outside cancel deletion
- Modal is keyboard accessible

### T023: Enhance DeleteConfirmationModal accessibility
**File:** `app/components/DeleteConfirmationModal.tsx`
**Type:** Modification
**Parallel:** No (modifies T009)
**Story:** US-3

**Task:**
1. Add ARIA attributes:
   - `aria-labelledby` pointing to modal heading
   - `aria-describedby` pointing to warning text
2. Add focus management:
   - Focus "Delete" button when modal opens
   - Return focus to delete button when modal closes
3. Verify ESC key handling (Flowbite Modal default)
4. Verify click-outside handling (Flowbite Modal default)

**Success Criteria:**
- Screen reader announces modal opening
- Focus moves to Delete button on open
- Focus returns to trigger button on close
- ESC key closes modal without deleting
- Click outside closes modal without deleting

### T024: Add keyboard shortcuts
**File:** `app/components/DeleteConfirmationModal.tsx`
**Type:** Enhancement (P1 - Should Have)
**Parallel:** No (modifies T023)
**Story:** US-3

**Task:**
1. Add Enter key handler to confirm deletion:
   ```typescript
   const handleKeyDown = (e: KeyboardEvent) => {
     if (e.key === 'Enter' && !isDeleting) {
       onConfirm();
     }
   };
   ```
2. Attach handler to modal container
3. Ensure Enter only confirms, doesn't trigger other actions

**Success Criteria:**
- Enter key confirms deletion
- Enter key disabled during loading
- No conflicts with other keyboard shortcuts

### T025: Write accessibility tests
**File:** `tests/components/DeleteConfirmationModal.test.tsx`
**Type:** Testing
**Parallel:** [P] (adds to existing test file)
**Story:** US-3

**Task:**
1. Test: ARIA attributes present
2. Test: Focus moves to Delete button on open
3. Test: ESC key closes modal without calling onConfirm
4. Test: Enter key calls onConfirm
5. Verify all tests pass with @testing-library/user-event

**Success Criteria:**
- All test cases pass
- Tests verify ARIA attributes, focus management, keyboard handlers
- Tests use proper accessibility testing patterns

---

## Phase 5: Integration & Polish

**Goal:** Ensure delete functionality works across all pages and polish UX

### T026: Update Profile page to pass currentUserId
**File:** `app/pages/Profile.tsx`
**Type:** Modification
**Parallel:** [P] (independent from other integration tasks)

**Task:**
1. Verify Profile loader already has currentUserId (from Feature 909)
2. If not: Add /api/auth/me call to loader
3. Extract currentUserId from loader data
4. Pass to each TweetCard: `<TweetCard tweet={tweet} currentUserId={currentUserId} />`

**Success Criteria:**
- currentUserId passed to TweetCard components
- Delete button appears on own tweets in profile page
- No TypeScript errors

### T027: Update TweetDetail page to pass currentUserId
**File:** `app/pages/TweetDetail.tsx`
**Type:** Modification
**Parallel:** [P] (independent from other integration tasks)

**Task:**
1. Add currentUserId to loader (similar to Feed/Profile)
2. Pass currentUserId to TweetCard component
3. Test delete button appears when viewing own tweet detail

**Success Criteria:**
- currentUserId in loader
- Delete button appears on own tweet
- No TypeScript errors

### T028: Add loading state to DeleteButton
**File:** `app/components/DeleteButton.tsx`
**Type:** Enhancement
**Parallel:** No (modifies existing component)

**Task:**
1. Add loading spinner to trash icon when `fetcher.state === 'submitting'`
2. Disable button while submitting: `disabled={fetcher.state === 'submitting'}`
3. Change button appearance during loading (dimmed, cursor-not-allowed)

**Success Criteria:**
- Button disabled during delete
- Loading spinner visible during submission
- Button re-enables after success/error

---

## Phase 6: Testing & Validation

**Goal:** Comprehensive testing and quality assurance

### T029: End-to-end manual testing
**Type:** Manual Testing
**Parallel:** No (requires all phases complete)

**Task:**
1. Test delete on Feed page (3 scenarios: success, cancel, error)
2. Test delete on Profile page (3 scenarios: success, cancel, error)
3. Test delete on TweetDetail page (3 scenarios: success, cancel, error)
4. Test error scenarios:
   - Network offline → error toast, revert optimistic update
   - Delete already-deleted tweet → 404 error toast
   - Invalid UUID (via API) → 400 error
5. Test edge cases:
   - Multiple rapid clicks → button disabled, no duplicate requests
   - ESC key → modal closes without deleting
   - Click outside modal → modal closes without deleting
   - Enter key in modal → deletion confirmed
6. Verify database cleanup:
   - Tweet deleted
   - Associated likes cascade deleted
   - No orphaned records

**Success Criteria:**
- All scenarios work as expected
- No console errors
- No network request errors
- Database state correct

### T030: Accessibility and performance validation
**Type:** Manual Testing
**Parallel:** [P] (can be done concurrently with other testing)

**Task:**
1. Keyboard navigation test:
   - Tab to delete button
   - Enter to open modal
   - Tab through modal buttons
   - Enter to confirm
   - ESC to cancel
2. Screen reader test (NVDA or VoiceOver):
   - Verify delete button announced
   - Verify modal announced when opened
   - Verify button states announced (loading, disabled)
3. Performance test:
   - Measure DELETE operation time (should be < 500ms)
   - Verify optimistic UI update is instant (< 16ms, single frame)
   - Check for memory leaks (no growing memory over multiple deletes)

**Success Criteria:**
- All keyboard navigation works
- Screen reader announces all interactive elements
- Delete operation completes in < 500ms
- Optimistic update appears instant
- No memory leaks detected

---

## Task Dependencies

### Dependency Graph

```
T001, T002, T003 (Verification - parallel)
       ↓
T004 (deleteTweet function)
       ↓
T006 (DELETE endpoint) ← T005 (Zod schema, parallel)
       ↓
T007, T008 (Backend tests, parallel)
       ↓
T009 (Modal) || T010 (Button) || T011 (TweetCard prop) (parallel)
       ↓
T012 (Add delete button to TweetCard)
       ↓
T013 (Feed loader) → T014 (Feed component)
       ↓
T015, T016, T017 (Component tests, parallel)
       ↓
T018 (Manual testing US-1)
       ↓
T019 (Toast utility, parallel) → T020 (Error handling)
       ↓
T021 (Revert logic) → T022 (Error tests)
       ↓
T023 (Accessibility) → T024 (Keyboard shortcuts) → T025 (A11y tests)
       ↓
T026, T027, T028 (Integration tasks, parallel)
       ↓
T029, T030 (Final validation, parallel)
```

### Critical Path

```
T001-T003 → T004 → T006 → T009/T010/T011 → T012 → T013 → T014 → T018 → T020 → T021 → T023 → T029
```

**Critical path duration:** ~2.5 hours (MVP)

---

## Parallel Execution Opportunities

### Phase 1 (Setup)
- **Parallel:** T001, T002, T003 (all verification tasks)

### Phase 2 (User Story 1)
- **Parallel:** T005 (Zod schema) can start while T004 is in progress
- **Parallel:** T007, T008 (tests) after T006
- **Parallel:** T009, T010, T011 (components) all independent
- **Parallel:** T015, T016, T017 (component tests)

### Phase 3 (Error Handling)
- **Parallel:** T019 (toast utility) independent

### Phase 4 (Confirmation Safety)
- Sequential (depends on modal modifications)

### Phase 5 (Integration)
- **Parallel:** T026, T027 (different pages)

### Phase 6 (Validation)
- **Parallel:** T029, T030 (manual testing can split across different testers)

---

## Implementation Strategy

### MVP First (Phases 1-2)

**Scope:** Delete own tweets with confirmation modal
**Tasks:** T001-T018 (18 tasks)
**Time:** ~2 hours
**Deliverable:** Working delete functionality on Feed page

**Why MVP:**
- Core value: Users can delete tweets
- Testable: Can validate main user flow
- Deployable: Safe to ship (authorization enforced)

### Iteration 2 (Phase 3)

**Scope:** Error handling and retry
**Tasks:** T019-T022 (4 tasks)
**Time:** ~30 minutes
**Deliverable:** Robust error handling with user feedback

### Iteration 3 (Phases 4-5)

**Scope:** UX polish and cross-page integration
**Tasks:** T023-T028 (6 tasks)
**Time:** ~1 hour
**Deliverable:** Feature-complete across all pages

### Iteration 4 (Phase 6)

**Scope:** Validation and QA
**Tasks:** T029-T030 (2 tasks)
**Time:** ~30 minutes
**Deliverable:** Production-ready feature

---

## Quality Gates

### After Phase 2 (MVP)
- [ ] All unit tests passing (T007, T008)
- [ ] All component tests passing (T015, T016, T017)
- [ ] Manual testing complete (T018)
- [ ] No TypeScript errors
- [ ] Delete functionality works on Feed page

### After Phase 3 (Error Handling)
- [ ] Error tests passing (T022)
- [ ] Toast notifications working
- [ ] Optimistic update revert confirmed
- [ ] All error scenarios handled

### After Phase 5 (Integration)
- [ ] Delete works on all 3 pages (Feed, Profile, TweetDetail)
- [ ] Loading states visible
- [ ] No console errors

### After Phase 6 (Final)
- [ ] All manual test scenarios pass (T029)
- [ ] Accessibility validated (T030)
- [ ] Performance criteria met
- [ ] Ready for production deployment

---

## Notes

**Time Estimates:**
- Verification tasks (T001-T003): 5 min each = 15 min total
- Backend tasks (T004-T008): 60 min total
- Frontend components (T009-T012): 90 min total
- Integration (T013-T014): 20 min total
- Testing (T015-T018): 40 min total
- Error handling (T019-T022): 30 min total
- UX polish (T023-T025): 30 min total
- Integration (T026-T028): 30 min total
- Validation (T029-T030): 30 min total

**Total:** ~3.5 hours (matches plan estimate)

**Parallel Opportunities:**
- 15 tasks can run in parallel with others
- With 2 developers: ~2 hours total
- With 3 developers: ~1.5 hours total

**MVP Focus:**
- Prioritize Phases 1-2 for fastest value delivery
- Error handling (Phase 3) can ship separately if time-constrained
- UX polish (Phases 4-5) can be follow-up PR

**Constitution Compliance:**
- All tasks follow functional programming (pure functions, hooks)
- TypeScript strict mode enforced
- Zod validation at boundaries
- No new routes (React Router action via useFetcher)
- Security-first (authentication, authorization, parameterized queries)

---

**Ready for Implementation!** Start with T001-T003 verification tasks, then proceed sequentially through phases.
