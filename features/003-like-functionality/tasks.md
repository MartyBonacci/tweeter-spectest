# Implementation Tasks: Tweet Like Functionality

**Feature ID:** 003-like-functionality
**Created:** 2025-10-12
**Status:** ready-for-implementation

---

## Task Summary

**Total Tasks:** 24
**User Stories:** 3
**Estimated Time:** 8-12 hours (sequential), 5-8 hours (parallel)
**Parallel Tasks:** 15 (63%)
**Sequential Tasks:** 9 (37%)

**External Dependencies:**
- Feature 001 (User Authentication System) - MUST be complete
- Feature 002 (Tweet Posting and Feed System) - MUST be complete

---

## User Story Mapping

### US1: Like a Tweet
**Story:** As an authenticated Tweeter user, I want to like a tweet I appreciate, so that I can show support for the content and its author.

**Tasks:** T03, T04, T05, T06, T07, T11, T12, T13, T14, T15, T21

### US2: Unlike a Tweet
**Story:** As an authenticated Tweeter user who has liked a tweet, I want to unlike a tweet, so that I can change my mind or correct accidental likes.

**Tasks:** T08, T16, T22

### US3: View Like Counts
**Story:** As any Tweeter user (authenticated or not), I want to see how many likes each tweet has, so that I can gauge content popularity and quality.

**Tasks:** T09, T10, T17, T18, T19, T20, T23

---

## Phase 1: Foundational Setup (BLOCKS All User Stories)

**Purpose:** Create database schema and core infrastructure required by all features.
**Blocking:** All subsequent tasks depend on this phase.
**Estimated Time:** 1-2 hours (sequential)

### T01: Create likes table migration
**Type:** sequential
**Priority:** critical
**Blocks:** All subsequent tasks
**Estimated Time:** 30 minutes

**Description:**
Create database migration script `003_create_likes_table.sql` with:
- likes table (id, tweet_id, profile_id, created_at)
- UNIQUE constraint on (tweet_id, profile_id)
- Foreign keys with CASCADE DELETE to tweets and profiles
- Three indexes: composite unique, tweet_id, profile_id

**Acceptance Criteria:**
- [X] Migration file creates likes table with all columns
- [X] UNIQUE(tweet_id, profile_id) constraint enforced
- [X] Foreign keys reference tweets(id) and profiles(id) with ON DELETE CASCADE
- [X] Composite unique index idx_likes_tweet_profile created
- [X] Index idx_likes_tweet_id created
- [X] Index idx_likes_profile_id created
- [X] Migration runs successfully against PostgreSQL 17
- [X] Migration is idempotent (safe to run multiple times)

**Files to Create:**
- `migrations/003_create_likes_table.sql`

**Technical Notes:**
- Use uuid_generate_v7() for id default
- created_at default: NOW()
- snake_case column names

---

### T02: Define TypeScript types and Zod schemas
**Type:** parallel (can start after T01)
**Priority:** high
**Blocks:** T03, T04, T05, T06, T07, T08
**Estimated Time:** 30 minutes

**Description:**
Define TypeScript interfaces and Zod validation schemas for like data structures in shared types file.

**Acceptance Criteria:**
- [X] `Like` interface defined (id, tweetId, profileId, createdAt)
- [X] `TweetWithLikes` interface defined (extends Tweet with likeCount, isLikedByUser)
- [X] `CreateLikeRequest` Zod schema validates tweetId (UUID format)
- [X] `CreateLikeResponse` interface defined
- [X] `DeleteLikeRequest` Zod schema validates tweetId (UUID format)
- [X] `LikeRow` interface for database results (snake_case)
- [X] Case mapping helper functions (mapLikeRowToLike)
- [X] All types exported from types file

**Files to Create/Modify:**
- `app/types/like.ts` (new)
- `app/types/index.ts` (export like types)

**Technical Notes:**
- Use TypeScript strict mode
- Application layer uses camelCase
- Database layer uses snake_case
- Zod schemas at all boundaries

---

## Phase 2: Backend - Like CRUD Operations (US1, US2)

**Purpose:** Implement server-side like creation and deletion logic.
**Depends On:** Phase 1 (T01, T02)
**Estimated Time:** 2-3 hours (mostly parallel)

### T03: Implement createLike pure function
**Type:** parallel
**Priority:** high
**Blocks:** T06, T11
**Estimated Time:** 30 minutes
**User Story:** US1

**Description:**
Create pure async function that inserts like record into database with uniqueness handling.

**Acceptance Criteria:**
- [X] Function signature: `async function createLike(tweetId: string, profileId: string): Promise<Like>`
- [X] Inserts record into likes table with uuid_generate_v7() id
- [X] Uses parameterized query (SQL injection prevention)
- [X] Handles UNIQUE constraint violation gracefully (returns null or throws specific error)
- [X] Returns Like object with camelCase properties
- [X] Function is pure (no side effects beyond database write)
- [X] Created_at timestamp set automatically by database

**Files to Create:**
- `app/models/like.server.ts`

**Technical Notes:**
- Use postgres npm package
- Map snake_case results to camelCase
- Catch unique constraint error (PostgreSQL error code 23505)

---

### T04: Implement deleteLike pure function
**Type:** parallel
**Priority:** high
**Blocks:** T07, T16
**Estimated Time:** 20 minutes
**User Story:** US2

**Description:**
Create pure async function that deletes like record by composite key (tweetId, profileId).

**Acceptance Criteria:**
- [X] Function signature: `async function deleteLike(tweetId: string, profileId: string): Promise<boolean>`
- [X] Deletes like WHERE tweet_id = $1 AND profile_id = $2
- [X] Uses parameterized query
- [X] Returns true if record deleted, false if not found
- [X] Function is pure (no side effects beyond database delete)

**Files to Modify:**
- `app/models/like.server.ts`

**Technical Notes:**
- Check affected row count to determine success
- No error throwing if record not found (idempotent)

---

### T05: Implement countLikes pure function
**Type:** parallel
**Priority:** medium
**Blocks:** T09
**Estimated Time:** 15 minutes
**User Story:** US3

**Description:**
Create pure async function that counts total likes for a tweet.

**Acceptance Criteria:**
- [X] Function signature: `async function countLikes(tweetId: string): Promise<number>`
- [X] Uses COUNT(*) aggregation on likes table
- [X] Filters by tweet_id
- [X] Returns integer count (0 if no likes)
- [X] Function is pure

**Files to Modify:**
- `app/models/like.server.ts`

**Technical Notes:**
- Leverages idx_likes_tweet_id index
- Returns 0 for non-existent tweets (not error)

---

### T06: Implement POST /api/likes endpoint
**Type:** sequential (depends on T03)
**Priority:** high
**Blocks:** T11
**Estimated Time:** 45 minutes
**User Story:** US1

**Description:**
Create API endpoint for creating likes with authentication and validation.

**Acceptance Criteria:**
- [X] Route: POST /api/likes
- [X] Validates request body with CreateLikeRequest Zod schema
- [X] Extracts profileId from JWT session (authentication middleware)
- [X] Returns 401 if not authenticated
- [X] Calls createLike(tweetId, profileId)
- [X] Returns 201 with like object on success
- [X] Returns 409 if already liked (unique constraint)
- [X] Returns 404 if tweet doesn't exist (foreign key violation)
- [X] Returns 400 for validation errors

**Files to Create/Modify:**
- `app/routes/api/likes.ts` (new)
- `app/routes.ts` (register route)

**Technical Notes:**
- Use authentication middleware from Feature 001
- Handle unique constraint error gracefully
- Return consistent error format

---

### T07: Implement DELETE /api/likes endpoint
**Type:** sequential (depends on T04)
**Priority:** high
**Blocks:** T16
**Estimated Time:** 30 minutes
**User Story:** US2

**Description:**
Create API endpoint for deleting likes with authentication.

**Acceptance Criteria:**
- [X] Route: DELETE /api/likes
- [X] Validates request body with DeleteLikeRequest Zod schema (tweetId)
- [X] Extracts profileId from JWT session
- [X] Returns 401 if not authenticated
- [X] Calls deleteLike(tweetId, profileId)
- [X] Returns 200 with { success: true } on success
- [X] Returns 404 if like not found
- [X] Returns 400 for validation errors

**Files to Modify:**
- `app/routes/api/likes.ts`

**Technical Notes:**
- Uses composite key (tweetId + profileId from session) to find like
- No like ID needed from client

---

### T08: Write integration tests for like endpoints
**Type:** parallel (depends on T06, T07)
**Priority:** medium
**Blocks:** None
**Estimated Time:** 1 hour
**User Story:** US1, US2

**Description:**
Write comprehensive integration tests for POST and DELETE /api/likes endpoints.

**Acceptance Criteria:**
- [ ] Test POST /api/likes with valid tweetId (authenticated) - 201 success
- [ ] Test POST /api/likes duplicate attempt - 409 conflict
- [ ] Test POST /api/likes without authentication - 401 error
- [ ] Test POST /api/likes with non-existent tweetId - 404 error
- [ ] Test POST /api/likes with invalid tweetId format - 400 error
- [ ] Test DELETE /api/likes with valid like - 200 success
- [ ] Test DELETE /api/likes with non-existent like - 404 error
- [ ] Test DELETE /api/likes without authentication - 401 error
- [ ] All tests pass

**Files to Create:**
- `app/routes/api/__tests__/likes.test.ts`

**Technical Notes:**
- Use test database
- Create test fixtures (users, tweets)
- Clean up after each test

---

## Phase 3: Backend - Modified Loaders (US3)

**Purpose:** Extend existing tweet loaders to include like counts and user status.
**Depends On:** Phase 1
**Estimated Time:** 1-2 hours (parallel)

### T09: Modify feed loader to include like data
**Type:** parallel (depends on T02, T05)
**Priority:** high
**Blocks:** T17
**Estimated Time:** 45 minutes
**User Story:** US3

**Description:**
Update GET /api/tweets loader to LEFT JOIN likes table and compute like counts and user status.

**Acceptance Criteria:**
- [X] Loader query LEFT JOINs likes table on tweets.id = likes.tweet_id
- [X] Query uses COUNT(likes.id) AS like_count with GROUP BY
- [X] Query includes EXISTS subquery for current user's like status (isLikedByUser)
- [X] isLikedByUser = false for unauthenticated users
- [X] Response includes likeCount and isLikedByUser for each tweet
- [X] Performance: Uses idx_likes_tweet_id index
- [X] Backwards compatible (existing tests still pass)

**Files to Modify:**
- `app/routes/api/tweets.ts` (feed loader)

**Technical Notes:**
- Single query (no N+1 problem)
- Handle null profileId (unauthenticated)
- Map results to TweetWithLikes interface

---

### T10: Modify tweet detail loader to include like data
**Type:** parallel (depends on T02, T05)
**Priority:** high
**Blocks:** T18
**Estimated Time:** 30 minutes
**User Story:** US3

**Description:**
Update GET /api/tweets/:id loader to include like count and user status for single tweet.

**Acceptance Criteria:**
- [X] Loader query LEFT JOINs likes table
- [X] Query uses COUNT(likes.id) AS like_count
- [X] Query includes EXISTS subquery for current user's like status
- [X] isLikedByUser = false for unauthenticated users
- [X] Response includes likeCount and isLikedByUser
- [X] Performance: Uses idx_likes_tweet_id index
- [X] Backwards compatible

**Files to Modify:**
- `app/routes/api/tweets.ts` (detail loader)

**Technical Notes:**
- Same pattern as feed loader
- Single query for efficiency

---

## Phase 4: Frontend Components (US1, US2, US3)

**Purpose:** Create UI components for like interactions.
**Depends On:** Phase 2, Phase 3
**Estimated Time:** 2-3 hours (mostly parallel)

### T11: Implement LikeButton component
**Type:** parallel (depends on T02, T06)
**Priority:** high
**Blocks:** T12, T21
**Estimated Time:** 1 hour
**User Story:** US1

**Description:**
Create functional React component for like button with optimistic UI updates.

**Acceptance Criteria:**
- [ ] Functional component with props: tweetId, likeCount, isLikedByUser, onToggle
- [ ] useState hook for isSubmitting state
- [ ] Renders filled heart icon (❤️) if isLikedByUser, outline heart (🤍) if not
- [ ] Displays like count next to icon
- [ ] onClick calls onToggle(tweetId) and sets isSubmitting=true
- [ ] Disabled during submission (prevents race conditions)
- [ ] Optimistic UI: visual state changes immediately before server response
- [ ] Accessible: semantic button, ARIA labels, keyboard support
- [ ] Styled with Tailwind (hover effects, smooth transitions)

**Files to Create:**
- `app/components/LikeButton.tsx`

**Technical Notes:**
- Use Form component from React Router v7 for actions
- Handle error states (rollback if server fails)
- Color: red for liked, gray for unliked

---

### T12: Write unit tests for LikeButton
**Type:** parallel (depends on T11)
**Priority:** medium
**Blocks:** None
**Estimated Time:** 30 minutes
**User Story:** US1

**Description:**
Write component tests for LikeButton visual states and interactions.

**Acceptance Criteria:**
- [ ] Test renders filled icon when isLikedByUser=true
- [ ] Test renders outline icon when isLikedByUser=false
- [ ] Test displays like count correctly (0, 1, 100+)
- [ ] Test onClick calls onToggle with correct tweetId
- [ ] Test button disabled during submission
- [ ] Test keyboard navigation (tab, enter)
- [ ] Test ARIA labels present
- [ ] All tests pass

**Files to Create:**
- `app/components/__tests__/LikeButton.test.tsx`

**Technical Notes:**
- Use React Testing Library
- Mock onToggle handler

---

### T13: Modify TweetCard to integrate LikeButton
**Type:** sequential (depends on T11)
**Priority:** high
**Blocks:** T21
**Estimated Time:** 30 minutes
**User Story:** US1

**Description:**
Update TweetCard component to render LikeButton with tweet's like data.

**Acceptance Criteria:**
- [ ] TweetCard accepts extended Tweet type (with likeCount, isLikedByUser)
- [ ] Renders LikeButton component with tweet's tweetId, likeCount, isLikedByUser
- [ ] Passes onToggle handler from parent (or uses inline action)
- [ ] Like button positioned appropriately in card layout (below content)
- [ ] Styling consistent with existing card design
- [ ] Backwards compatible with existing TweetCard usage

**Files to Modify:**
- `app/components/TweetCard.tsx`

**Technical Notes:**
- Use Flowbite card layout
- Align with existing action buttons (if any)

---

### T14: Implement like action in feed route
**Type:** parallel (depends on T06)
**Priority:** high
**Blocks:** T21
**Estimated Time:** 30 minutes
**User Story:** US1

**Description:**
Create action handler in feed route for POST /api/likes with revalidation.

**Acceptance Criteria:**
- [ ] Action extracts tweetId from FormData
- [ ] Action calls POST /api/likes endpoint
- [ ] Action handles 401 (redirect to signin)
- [ ] Action handles 409 (already liked - treat as success or show message)
- [ ] Action handles 404 (tweet not found - show error)
- [ ] Action revalidates loader on success (updates like counts)
- [ ] Action returns error messages for display
- [ ] Optimistic UI pattern: visual update before action completes

**Files to Modify:**
- `app/routes/feed.tsx` (or equivalent)

**Technical Notes:**
- Use React Router v7 action pattern
- Return json({ error }) for failures

---

### T15: Write integration tests for feed like action
**Type:** parallel (depends on T14)
**Priority:** medium
**Blocks:** None
**Estimated Time:** 30 minutes
**User Story:** US1

**Description:**
Test feed page like action with various scenarios.

**Acceptance Criteria:**
- [ ] Test like action with authenticated user - success
- [ ] Test like action increments count in UI
- [ ] Test like action persists after page reload
- [ ] Test like action with unauthenticated user - redirects
- [ ] Test like action with invalid tweetId - shows error
- [ ] All tests pass

**Files to Create:**
- `app/routes/__tests__/feed.test.tsx`

**Technical Notes:**
- Use test renderer
- Mock API responses

---

### T16: Implement unlike action in feed route
**Type:** sequential (depends on T07)
**Priority:** high
**Blocks:** T22
**Estimated Time:** 20 minutes
**User Story:** US2

**Description:**
Create action handler in feed route for DELETE /api/likes with revalidation.

**Acceptance Criteria:**
- [ ] Action extracts tweetId from FormData
- [ ] Action calls DELETE /api/likes endpoint
- [ ] Action handles 404 (not liked - treat as success or show message)
- [ ] Action revalidates loader on success
- [ ] Action returns error messages for display
- [ ] Optimistic UI pattern: visual update before action completes

**Files to Modify:**
- `app/routes/feed.tsx`

**Technical Notes:**
- Same action can handle both like and unlike (check intent)
- Or separate unlike action

---

### T17: Update feed page to display like counts
**Type:** sequential (depends on T09, T13)
**Priority:** high
**Blocks:** T21
**Estimated Time:** 15 minutes
**User Story:** US3

**Description:**
Ensure feed page displays like counts from modified loader.

**Acceptance Criteria:**
- [ ] Feed loader data includes likeCount and isLikedByUser
- [ ] TweetCard receives and displays like data
- [ ] Like counts visible on all tweets in feed
- [ ] Zero likes shown as "0" (not hidden)
- [ ] Feed renders without errors

**Files to Modify:**
- `app/routes/feed.tsx`

**Technical Notes:**
- Verify loader data mapping
- Test with unauthenticated users

---

### T18: Update tweet detail page to display like count
**Type:** sequential (depends on T10, T13)
**Priority:** high
**Blocks:** T23
**Estimated Time:** 15 minutes
**User Story:** US3

**Description:**
Ensure tweet detail page displays like count from modified loader.

**Acceptance Criteria:**
- [ ] Detail loader data includes likeCount and isLikedByUser
- [ ] TweetCard receives and displays like data
- [ ] Like count visible on detail page
- [ ] Detail page renders without errors

**Files to Modify:**
- `app/routes/tweets.$id.tsx`

**Technical Notes:**
- Same pattern as feed page
- Test with authenticated and unauthenticated users

---

### T19: Implement like action in tweet detail route
**Type:** parallel (depends on T06)
**Priority:** medium
**Blocks:** T23
**Estimated Time:** 20 minutes
**User Story:** US1, US3

**Description:**
Create action handler in tweet detail route for liking (same as feed).

**Acceptance Criteria:**
- [ ] Action extracts tweetId from FormData
- [ ] Action calls POST /api/likes endpoint
- [ ] Action revalidates loader on success
- [ ] Action handles errors appropriately
- [ ] Same behavior as feed like action

**Files to Modify:**
- `app/routes/tweets.$id.tsx`

**Technical Notes:**
- Consider extracting shared action logic to utility

---

### T20: Implement unlike action in tweet detail route
**Type:** parallel (depends on T07)
**Priority:** medium
**Blocks:** T23
**Estimated Time:** 15 minutes
**User Story:** US2, US3

**Description:**
Create action handler in tweet detail route for unliking (same as feed).

**Acceptance Criteria:**
- [ ] Action extracts tweetId from FormData
- [ ] Action calls DELETE /api/likes endpoint
- [ ] Action revalidates loader on success
- [ ] Same behavior as feed unlike action

**Files to Modify:**
- `app/routes/tweets.$id.tsx`

**Technical Notes:**
- Consider extracting shared action logic

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose:** Finalize feature with comprehensive testing and refinements.
**Depends On:** Phase 4
**Estimated Time:** 1-2 hours (parallel)

### T21: End-to-end test for like flow
**Type:** parallel (depends on T14, T17)
**Priority:** high
**Blocks:** None
**Estimated Time:** 30 minutes
**User Story:** US1

**Description:**
Write E2E test for complete like flow from user perspective.

**Acceptance Criteria:**
- [ ] Test: User signs in → views feed → clicks like button → count increments → reloads page → like persists
- [ ] Test: Unauthenticated user cannot like (button disabled or redirects)
- [ ] Test: Rapid clicks don't create duplicate likes
- [ ] Test: Like count updates immediately (optimistic UI)
- [ ] Test passes consistently

**Files to Create:**
- `e2e/like-flow.spec.ts` (if using Playwright)

**Technical Notes:**
- Use Playwright or Cypress
- Create test fixtures (seed data)

---

### T22: End-to-end test for unlike flow
**Type:** parallel (depends on T16)
**Priority:** high
**Blocks:** None
**Estimated Time:** 20 minutes
**User Story:** US2

**Description:**
Write E2E test for complete unlike flow.

**Acceptance Criteria:**
- [ ] Test: User signs in → views tweet they've liked → clicks filled like button → count decrements → reloads → unlike persists
- [ ] Test: User can like again after unliking
- [ ] Test passes consistently

**Files to Create:**
- `e2e/unlike-flow.spec.ts`

**Technical Notes:**
- Pre-seed liked tweet
- Verify state transitions

---

### T23: End-to-end test for viewing like counts
**Type:** parallel (depends on T18, T19, T20)
**Priority:** medium
**Blocks:** None
**Estimated Time:** 15 minutes
**User Story:** US3

**Description:**
Write E2E test for viewing like counts (authenticated and unauthenticated).

**Acceptance Criteria:**
- [ ] Test: Unauthenticated user views feed → sees like counts on all tweets
- [ ] Test: Unauthenticated user views tweet detail → sees like count
- [ ] Test: Authenticated user sees own like status (filled vs outline)
- [ ] Test passes consistently

**Files to Create:**
- `e2e/view-likes.spec.ts`

**Technical Notes:**
- Test both authenticated and unauthenticated scenarios

---

### T24: Update feature documentation
**Type:** parallel (no blockers)
**Priority:** low
**Blocks:** None
**Estimated Time:** 15 minutes
**User Story:** All

**Description:**
Update README and feature docs to reflect like functionality implementation.

**Acceptance Criteria:**
- [ ] README.md updated with like feature description
- [ ] API documentation includes POST/DELETE /api/likes endpoints
- [ ] Component documentation includes LikeButton
- [ ] Migration documented in database schema docs

**Files to Modify:**
- `README.md`
- `features/003-like-functionality/IMPLEMENTATION.md` (optional)

**Technical Notes:**
- Document API contract
- Include example requests/responses

---

## Dependency Graph

```
Phase 1 (Foundational - BLOCKS ALL):
  T01 [migration] ────┬─────────────────┐
                      │                 │
  T02 [types/schemas] │                 │
                      ↓                 ↓
Phase 2 (Backend):    │                 │
  T03 [createLike] ───┼───> T06 [POST] ───> T11 [LikeButton]
  T04 [deleteLike] ───┼───> T07 [DELETE]
  T05 [countLikes] ───┤
                      │
  T06 + T07 ─────────> T08 [integration tests]
                      │
Phase 3 (Loaders):    │
  T09 [feed loader] ──┼─────> T17 [feed display]
  T10 [detail loader] ─┼─────> T18 [detail display]
                      │
Phase 4 (Frontend):   │
  T11 [LikeButton] ───┼─────> T12 [button tests]
                      └─────> T13 [modify TweetCard]
  T14 [like action] ──────> T15 [action tests]
  T16 [unlike action]
  T17 [feed display]
  T18 [detail display]
  T19 [detail like action]
  T20 [detail unlike action]

Phase 5 (E2E):
  T21 [E2E like]
  T22 [E2E unlike]
  T23 [E2E view counts]
  T24 [docs]
```

---

## Parallel Execution Strategy

**Wave 1:** T01 (foundational, must complete first)

**Wave 2:** T02, T03, T04, T05 (all parallel after T01)

**Wave 3:** T06, T07, T09, T10 (after respective dependencies)

**Wave 4:** T08, T11, T14, T16, T19, T20 (all parallel after Wave 3)

**Wave 5:** T12, T13, T15, T17, T18 (after respective dependencies)

**Wave 6:** T21, T22, T23, T24 (all parallel, final polish)

**Time Savings:** ~33% reduction via parallelization (12h → 8h estimated)

---

## Testing Strategy

**Unit Tests:** T12 (LikeButton component)

**Integration Tests:** T08 (API endpoints), T15 (feed action)

**End-to-End Tests:** T21 (like flow), T22 (unlike flow), T23 (view counts)

**Coverage Goals:**
- 100% of like/unlike business logic
- 100% of API endpoints
- 100% of user-facing interactions

---

## MVP Scope

**Minimum for deployment:**
- Phase 1: T01, T02 ✅ (database + types)
- Phase 2: T03, T04, T06, T07 ✅ (CRUD operations)
- Phase 3: T09, T10 ✅ (loader extensions)
- Phase 4: T11, T13, T14, T16, T17, T18 ✅ (UI integration)

**Post-MVP enhancements:**
- T08, T12, T15 (additional tests)
- T21, T22, T23 (E2E tests)
- T24 (documentation)

---

## Success Criteria

- [ ] All 24 tasks completed
- [ ] All unit, integration, and E2E tests passing
- [ ] Users can like/unlike tweets in under 1 second
- [ ] Like counts update immediately (optimistic UI)
- [ ] 100% of duplicate like attempts rejected
- [ ] Like state persists across page reloads
- [ ] Unauthenticated users can view counts but not like
- [ ] All acceptance criteria from spec.md met

---

## Change Log

| Date       | Change                          | Author      |
|------------|---------------------------------|-------------|
| 2025-10-12 | Initial task breakdown created  | Claude Code |
