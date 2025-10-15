# Implementation Tasks: Tweet Posting and Feed System

**Feature ID:** 002-tweet-posting-and-feed-system
**Created:** 2025-10-12
**Status:** ready-for-implementation

<!-- Tech Stack Validation: PASSED -->
<!-- Validated against: /memory/tech-stack.md v1.0.0 -->
<!-- No prohibited technologies found -->
<!-- 0 unapproved technologies require runtime validation -->

---

## Overview

This document provides a complete task breakdown for implementing the Tweet Posting and Feed System feature. Tasks are organized by user story to enable independent implementation and testing.

**Total Tasks:** 28
**Estimated Time:**
- Sequential execution: ~10-12 hours
- Parallel execution: ~6-8 hours (40% time savings)

**User Stories:**
1. **US1**: Post a Tweet (P0 - Critical)
2. **US2**: View Tweet Feed (P0 - Critical)
3. **US3**: View Individual Tweet (P0 - Critical)

---

## Implementation Strategy

**Approach:** Incremental delivery with independent user stories

1. **Phase 1: Foundational** - Database schema and core tweet functions (BLOCKS all user stories)
2. **Phase 2: US1 - Post Tweet** - Complete tweet posting flow (MVP foundation)
3. **Phase 3: US2 - View Feed** - Public feed viewing
4. **Phase 4: US3 - View Detail** - Individual tweet pages
5. **Phase 5: Polish** - Cross-cutting concerns and optimization

**MVP Scope:** Complete Phases 1 and 2 (Tweet posting) for initial content creation capability

**Delivery Increments:**
- Increment 1: Users can post tweets (Phases 1-2)
- Increment 2: Add public feed viewing (Phase 3)
- Increment 3: Add individual tweet pages (Phase 4)
- Increment 4: Polish and production-ready (Phase 5)

---

## Phase 1: Foundational

**Goal:** Implement blocking prerequisites required by ALL user stories

**Duration:** 2-3 hours

**Dependencies:** Feature 001 (User Authentication System) complete

**Deliverables:**
- tweets table created in database
- Tweet type definitions and Zod schemas
- Core tweet database functions

**⚠️ BLOCKER:** No user story can begin until Phase 1 is complete

### Tasks

**T001**: [Foundational] Create tweets table migration
- **File:** `migrations/002_create_tweets_table.sql`
- **Description:** SQL migration to create tweets table with foreign key to profiles
- **Details:**
  - Table: tweets (id UUID v7 PK, profile_id UUID FK, content VARCHAR(140), created_at TIMESTAMPTZ)
  - Indexes: INDEX on created_at DESC (feed ordering), INDEX on profile_id (user tweets)
  - Constraints: FK to profiles(id), CHECK on content length (1-140 chars, non-whitespace-only)
  - CHECK: `CHECK(LENGTH(TRIM(content)) >= 1 AND LENGTH(content) <= 140)`
- **Verification:** Migration runs successfully, table exists with correct schema and indexes
- **Story:** Foundational (blocks all user stories)
- **Parallel:** No

**T002**: [Foundational] Create TypeScript type definitions for tweets
- **File:** `src/types/tweet.ts`
- **Description:** TypeScript interfaces for tweet data structures
- **Details:**
  - Interface: `Tweet` - basic tweet (id, profileId, content, createdAt)
  - Interface: `TweetWithAuthor` - tweet with author info (id, content, author: {id, username}, createdAt)
  - Type: `TweetRow` - database result (snake_case)
  - Helper: `mapTweetRowToTweet(row: TweetRow): Tweet`
  - Helper: `mapTweetWithAuthorRow(row: any): TweetWithAuthor`
- **Verification:** TypeScript compilation passes with strict mode
- **Story:** Foundational (blocks all user stories)
- **Parallel:** [P] (independent from T003)

**T003**: [Foundational] Define tweet validation Zod schemas
- **File:** `src/schemas/tweet.ts`
- **Description:** Shared Zod schemas for tweet validation
- **Details:**
  - Schema: `createTweetSchema` - content (string, min 1, max 140, trim, reject whitespace-only)
  - Schema: `tweetResponseSchema` - id (UUID), content, profileId, createdAt (datetime)
  - Schema: `tweetWithAuthorSchema` - includes author object (id, username)
  - Schema: `tweetsResponseSchema` - array of tweetWithAuthorSchema
  - Function: `isWhitespaceOnly(str: string): boolean` - helper for validation
- **Verification:** Unit test - validate valid tweets pass, invalid tweets throw with error messages
- **Story:** Foundational (blocks all user stories)
- **Parallel:** [P] (independent from T002)

**T004**: [Foundational] Implement tweet creation database function
- **File:** `src/db/tweets.ts`
- **Description:** Pure function to insert new tweet into tweets table
- **Details:**
  - Function: `createTweet(db: Sql, data: { id: string, profileId: string, content: string }): Promise<Tweet>`
  - Use parameterized query
  - Sanitize content before insertion (XSS prevention)
  - Return created tweet with camelCase mapping
  - Handle FK constraint violations (invalid profileId)
- **Verification:** Integration test - create tweet, verify exists in database
- **Story:** Foundational (blocks US1)
- **Parallel:** [P] (independent from T005, T006)

**T005**: [Foundational] Implement get all tweets database function
- **File:** `src/db/tweets.ts`
- **Description:** Pure function to retrieve all tweets with author info
- **Details:**
  - Function: `getAllTweets(db: Sql): Promise<TweetWithAuthor[]>`
  - JOIN with profiles table to get author username
  - ORDER BY created_at DESC (newest first)
  - Map snake_case to camelCase
  - Return empty array if no tweets
- **Verification:** Integration test - create tweets, getAllTweets returns correct order
- **Story:** Foundational (blocks US2)
- **Parallel:** [P] (independent from T004, T006)

**T006**: [Foundational] Implement get tweet by ID database function
- **File:** `src/db/tweets.ts`
- **Description:** Pure function to retrieve single tweet with author info
- **Details:**
  - Function: `getTweetById(db: Sql, id: string): Promise<TweetWithAuthor | null>`
  - JOIN with profiles table
  - Return null if tweet not found (not an error)
  - Map snake_case to camelCase
- **Verification:** Integration test - create tweet, getTweetById returns correct tweet, invalid ID returns null
- **Story:** Foundational (blocks US3)
- **Parallel:** [P] (independent from T004, T005)

---

## Checkpoint: Phase 1 Complete ✓

**Verification before proceeding to user stories:**
- [ ] tweets table exists in database with correct schema
- [ ] TypeScript types compile without errors
- [ ] Zod schemas validate correctly with passing unit tests
- [ ] All tweet database functions tested and working

**All user stories BLOCKED until this checkpoint passes.**

---

## Phase 2: US1 - Post a Tweet

**User Story:** As an authenticated user, I want to post a tweet with up to 140 characters, so that I can share my thoughts.

**Goal:** Implement complete tweet posting flow - backend API, frontend form, integration

**Duration:** 3-4 hours

**Dependencies:** Phase 1 complete, Feature 001 (authentication)

**Deliverables:**
- POST /api/tweets endpoint working
- TweetComposer component functional
- Tweet posting flow working end-to-end

**Test Criteria (US1 Complete):**
- [ ] User can type text into tweet composition field
- [ ] Character counter shows remaining characters (140 - length)
- [ ] Submit button disabled when content is empty or exceeds 140 chars
- [ ] Client-side validation prevents invalid submissions
- [ ] Server-side validation rejects invalid tweets
- [ ] Upon successful posting, tweet appears in database
- [ ] Clear error message shown if posting fails

### Tasks

**T007**: [US1] Implement POST /api/tweets endpoint
- **File:** `src/routes/tweets.ts`
- **Description:** Express endpoint for tweet creation
- **Details:**
  - Endpoint: POST /api/tweets
  - Middleware: authenticate (from Feature 001) - requires valid JWT
  - Validate request body with createTweetSchema (Zod)
  - Extract profileId from authenticated session (req.user.userId)
  - Sanitize content (HTML escape, trim whitespace)
  - Generate UUID v7 for tweet ID
  - Call createTweet function
  - Return tweetResponseSchema + 201 status
  - Error handling: 400 (validation), 401 (auth), 500 (server)
- **Verification:** Integration test - POST with valid content returns 201 and tweet, POST without auth returns 401
- **Story:** US1 (Post Tweet)
- **Parallel:** No (depends on T004)

**T008**: [US1] Mount /api/tweets routes to Express app
- **File:** `src/server/app.ts`
- **Description:** Add tweets routes to Express app
- **Details:**
  - Import tweet routes from src/routes/tweets.ts
  - Mount at /api/tweets path
  - Ensure authentication middleware is available
  - Error handling for route errors
- **Verification:** Server mounts routes, can receive POST requests
- **Story:** US1 (Post Tweet)
- **Parallel:** No (depends on T007)

**T009**: [US1] Create TweetComposer component
- **File:** `app/components/TweetComposer.tsx`
- **Description:** Functional component for tweet composition with character counter
- **Details:**
  - Props: None (uses React Router Form)
  - State: useState for content, remainingChars (computed: 140 - content.length), isSubmitting
  - Controlled textarea for content input
  - Real-time character counter displayed prominently
  - Client-side validation with createTweetSchema (Zod)
  - Submit button disabled if: empty, over 140 chars, whitespace-only, or isSubmitting
  - Visual feedback: character counter turns red when over limit
  - Use Tailwind CSS + Flowbite for styling
- **Verification:** Component test - renders textarea and counter, updates counter on input, disables button when invalid
- **Story:** US1 (Post Tweet)
- **Parallel:** [P] (can develop independently from backend)

**T010**: [US1] Create tweet posting action
- **File:** `app/actions/tweets.ts`
- **Description:** React Router action to handle tweet submission
- **Details:**
  - Function: `createTweetAction(formData: FormData): Promise<Response>`
  - Extract content from formData
  - Validate with createTweetSchema (server-side validation)
  - Call POST /api/tweets
  - On success: Redirect to /feed (will show new tweet)
  - On error: Return error object to form
  - Handle network errors gracefully
- **Verification:** Submit form → API called → tweet created → redirect to /feed
- **Story:** US1 (Post Tweet)
- **Parallel:** No (depends on T007, T009)

**T011**: [US1] Write integration tests for tweet posting
- **File:** `tests/integration/tweet-posting.test.ts`
- **Description:** Integration tests for complete tweet posting flow
- **Details:**
  - Test: POST /api/tweets with valid content (authenticated) → 201, tweet created
  - Test: POST /api/tweets with content over 140 chars → 400 validation error
  - Test: POST /api/tweets with empty content → 400 validation error
  - Test: POST /api/tweets with whitespace-only → 400 validation error
  - Test: POST /api/tweets without authentication → 401 error
  - Test: TweetComposer form submission → action called → tweet created
- **Verification:** All tests pass
- **Story:** US1 (Post Tweet)
- **Parallel:** [P] (can write alongside implementation)

---

## Checkpoint: US1 Complete ✓

**Verification (US1 acceptance criteria):**
- [ ] User can type text into tweet composition field
- [ ] Character counter shows remaining characters in real-time
- [ ] Submit button disabled when tweet exceeds 140 characters or is empty
- [ ] System validates tweet length before submission
- [ ] Upon successful posting, tweet saved to database
- [ ] Clear error message shown if posting fails

**MVP Launch Ready:** With US1 complete, users can create content (posting capability established)

---

## Phase 3: US2 - View Tweet Feed

**User Story:** As a user, I want to view a feed of all tweets sorted by newest first, so that I can see the latest content.

**Goal:** Implement public feed viewing - backend API, frontend list, integration

**Duration:** 2-3 hours

**Dependencies:** Phase 1 complete (Phase 2 recommended for testing with real tweets)

**Deliverables:**
- GET /api/tweets endpoint working
- TweetList and TweetCard components functional
- Feed page displaying all tweets

**Test Criteria (US2 Complete):**
- [ ] Feed displays all tweets in reverse chronological order (newest first)
- [ ] Each tweet shows: content, author username, timestamp
- [ ] Feed loads without requiring authentication
- [ ] Feed updates to show new tweets after posting
- [ ] Empty state shown when no tweets exist

### Tasks

**T012**: [US2] Implement GET /api/tweets endpoint
- **File:** `src/routes/tweets.ts`
- **Description:** Express endpoint to retrieve all tweets for feed
- **Details:**
  - Endpoint: GET /api/tweets
  - No authentication required (public endpoint)
  - Call getAllTweets function
  - Return tweetsResponseSchema (array of tweets with authors)
  - Order: newest first (handled by database query)
  - Error handling: 500 (server error)
- **Verification:** Integration test - GET returns all tweets in correct order (newest first)
- **Story:** US2 (View Feed)
- **Parallel:** No (depends on T005)

**T013**: [US2] Create TweetCard component
- **File:** `app/components/TweetCard.tsx`
- **Description:** Functional component to display single tweet
- **Details:**
  - Props: `tweet: TweetWithAuthor` (id, content, author, createdAt)
  - State: None (stateless presentation)
  - Displays: tweet content (escaped), author username (clickable link to /profile/:username), relative timestamp
  - Author username links to profile page (feature 004 integration point)
  - Tweet card clickable (links to /tweets/:id)
  - Use Tailwind CSS + Flowbite for styling (card layout)
- **Verification:** Component test - renders tweet content, author, timestamp correctly
- **Story:** US2 (View Feed)
- **Parallel:** [P] (independent from T014)

**T014**: [US2] Create TweetList component
- **File:** `app/components/TweetList.tsx`
- **Description:** Functional component to display list of tweets
- **Details:**
  - Props: `tweets: TweetWithAuthor[]`
  - State: None (stateless presentation)
  - Maps tweets array to TweetCard components
  - Shows empty state if tweets array is empty ("No tweets yet. Be the first to post!")
  - Maintains chronological order from props (no sorting in component)
  - Use Tailwind CSS for list styling
- **Verification:** Component test - renders multiple TweetCard components, shows empty state when no tweets
- **Story:** US2 (View Feed)
- **Parallel:** [P] (independent from T013)

**T015**: [US2] Create Feed page component
- **File:** `app/pages/Feed.tsx`
- **Description:** Feed page that displays tweet composer (if authenticated) and tweet list
- **Details:**
  - Loader: `feedLoader` - calls GET /api/tweets, returns tweets array
  - Component renders: TweetComposer (if user authenticated), TweetList
  - Check authentication status from root loader (Feature 001 integration)
  - Show TweetComposer only if authenticated, always show TweetList
- **Verification:** Page renders with tweet list, composer shown only when authenticated
- **Story:** US2 (View Feed)
- **Parallel:** No (depends on T012, T013, T014)

**T016**: [US2] Update /feed route in routes.ts
- **File:** `app/routes.ts`
- **Description:** Update existing /feed route to use new Feed page
- **Details:**
  - Import Feed page, feedLoader, createTweetAction
  - Update route: `{ path: '/feed', Component: lazy(() => import('./pages/Feed')), loader: feedLoader, action: createTweetAction }`
  - Feed route already exists from Feature 001 (placeholder), now fully functional
- **Verification:** Navigate to /feed → Feed page renders with tweets
- **Story:** US2 (View Feed)
- **Parallel:** No (depends on T015)

**T017**: [US2] Implement relative timestamp formatting
- **File:** `src/utils/formatTimestamp.ts`
- **Description:** Pure function to format timestamps as relative or absolute
- **Details:**
  - Function: `formatTimestamp(date: Date): string`
  - Recent tweets (< 1 day): Relative format ("2 minutes ago", "3 hours ago")
  - Older tweets (>= 1 day): Absolute format ("Jan 15, 2025" or similar)
  - Use date-fns or similar library (check tech-stack.md for approval)
  - Fallback to built-in Date methods if no library
- **Verification:** Unit test - various dates produce correct format strings
- **Story:** US2 (View Feed)
- **Parallel:** [P] (independent utility function)

**T018**: [US2] Integrate timestamp formatting in TweetCard
- **File:** `app/components/TweetCard.tsx`
- **Description:** Use formatTimestamp function to display tweet timestamps
- **Details:**
  - Import formatTimestamp utility
  - Call formatTimestamp(tweet.createdAt) for display
  - Add tooltip with exact timestamp on hover (title attribute)
- **Verification:** Tweets show relative timestamps, hover shows exact time
- **Story:** US2 (View Feed)
- **Parallel:** No (depends on T013, T017)

**T019**: [US2] Write integration tests for feed viewing
- **File:** `tests/integration/feed-viewing.test.ts`
- **Description:** Integration tests for complete feed viewing flow
- **Details:**
  - Test: GET /api/tweets returns all tweets in database
  - Test: GET /api/tweets returns tweets in chronological order (newest first)
  - Test: GET /api/tweets works without authentication (public access)
  - Test: Feed page loads with tweets displayed
  - Test: Empty state shown when no tweets exist
  - Test: New tweet appears in feed after posting (integration with US1)
- **Verification:** All tests pass
- **Story:** US2 (View Feed)
- **Parallel:** [P] (can write alongside implementation)

---

## Checkpoint: US2 Complete ✓

**Verification (US2 acceptance criteria):**
- [ ] Feed displays all tweets in reverse chronological order (newest first)
- [ ] Each tweet shows content, author username, and timestamp
- [ ] Feed loads without requiring authentication
- [ ] Feed updates to show new tweets after posting
- [ ] Empty state shown when no tweets exist

---

## Phase 4: US3 - View Individual Tweet

**User Story:** As a user, I want to view a single tweet on its own page, so that I can share a direct link to specific content.

**Goal:** Implement individual tweet detail pages - backend API, frontend page, routing

**Duration:** 1-2 hours

**Dependencies:** Phase 1 complete (Phase 3 recommended for UI consistency)

**Deliverables:**
- GET /api/tweets/:id endpoint working
- Tweet detail page functional
- URL routing for /tweets/:id

**Test Criteria (US3 Complete):**
- [ ] User can navigate to individual tweet page via link
- [ ] Tweet detail page shows content, author username, timestamp
- [ ] Page accessible via unique URL (shareable)
- [ ] 404 error shown for non-existent tweet IDs

### Tasks

**T020**: [US3] Implement GET /api/tweets/:id endpoint
- **File:** `src/routes/tweets.ts`
- **Description:** Express endpoint to retrieve single tweet by ID
- **Details:**
  - Endpoint: GET /api/tweets/:id
  - No authentication required (public endpoint)
  - Extract id from URL params
  - Validate id is valid UUID format
  - Call getTweetById function
  - If found: Return single tweet with author (tweetWithAuthorSchema)
  - If not found: Return 404 with error message
  - Error handling: 400 (invalid UUID), 404 (not found), 500 (server)
- **Verification:** Integration test - GET with valid ID returns tweet, GET with invalid ID returns 404
- **Story:** US3 (View Individual Tweet)
- **Parallel:** No (depends on T006)

**T021**: [US3] Create TweetDetail page component
- **File:** `app/pages/TweetDetail.tsx`
- **Description:** Tweet detail page displaying single tweet
- **Details:**
  - Loader: `tweetDetailLoader(params: { id: string })` - calls GET /api/tweets/:id, returns tweet
  - Handle 404: If tweet not found, throw 404 response (caught by error boundary)
  - Component renders: Single TweetCard with tweet data
  - Layout similar to feed but focused on single tweet
  - May include future features (like count, reply thread) as integration points
- **Verification:** Page renders single tweet, 404 error shown for invalid ID
- **Story:** US3 (View Individual Tweet)
- **Parallel:** No (depends on T020, reuses TweetCard from T013)

**T022**: [US3] Add /tweets/:id route to routes.ts
- **File:** `app/routes.ts`
- **Description:** Add tweet detail route to programmatic routing configuration
- **Details:**
  - Import TweetDetail page and tweetDetailLoader
  - Add route: `{ path: '/tweets/:id', Component: lazy(() => import('./pages/TweetDetail')), loader: tweetDetailLoader }`
  - Parameter :id will be passed to loader
- **Verification:** Navigate to /tweets/:id → Tweet detail page renders
- **Story:** US3 (View Individual Tweet)
- **Parallel:** No (depends on T021)

**T023**: [US3] Make TweetCard clickable to detail page
- **File:** `app/components/TweetCard.tsx`
- **Description:** Add click/navigation to tweet detail page
- **Details:**
  - Wrap TweetCard content in Link component (React Router)
  - Link to `/tweets/${tweet.id}`
  - Maintain existing styling (card appearance)
  - Hover state indicates clickability
  - Prevent author username link from triggering tweet link (stopPropagation)
- **Verification:** Clicking tweet card navigates to tweet detail page
- **Story:** US3 (View Individual Tweet)
- **Parallel:** No (depends on T013, T022)

**T024**: [US3] Write integration tests for tweet detail viewing
- **File:** `tests/integration/tweet-detail.test.ts`
- **Description:** Integration tests for tweet detail page
- **Details:**
  - Test: GET /api/tweets/:id with valid ID returns single tweet
  - Test: GET /api/tweets/:id with invalid UUID format returns 400
  - Test: GET /api/tweets/:id with non-existent ID returns 404
  - Test: Tweet detail page loads for valid tweet
  - Test: 404 page shown for invalid tweet ID
  - Test: Clicking tweet in feed navigates to detail page
- **Verification:** All tests pass
- **Story:** US3 (View Individual Tweet)
- **Parallel:** [P] (can write alongside implementation)

---

## Checkpoint: US3 Complete ✓

**Verification (US3 acceptance criteria):**
- [ ] User can navigate to individual tweet page via link/click
- [ ] Tweet detail page shows content, author username, and timestamp
- [ ] Page accessible via unique URL (shareable)
- [ ] 404 error shown for non-existent tweet IDs

---

## Phase 5: Polish & Cross-Cutting Concerns

**Goal:** Production-ready polish, accessibility, error handling, and styling

**Duration:** 2-3 hours

**Dependencies:** Phases 2, 3, 4 complete

**Deliverables:**
- Content sanitization implemented
- Accessibility improvements
- Error handling polish
- Consistent styling

### Tasks

**T025**: [Polish] Implement content sanitization function
- **File:** `src/utils/sanitizeContent.ts`
- **Description:** Pure function to sanitize tweet content (XSS prevention)
- **Details:**
  - Function: `sanitizeContent(content: string): string`
  - HTML escape special characters (< > & " ')
  - Preserve line breaks and whitespace (internal)
  - Trim leading/trailing whitespace
  - Use library (e.g., DOMPurify) or built-in escape function
- **Verification:** Unit test - malicious HTML tags escaped, line breaks preserved
- **Story:** Cross-cutting (security for US1)
- **Parallel:** [P] (independent utility function)

**T026**: [Polish] Apply content sanitization to tweet creation
- **File:** `src/routes/tweets.ts` (POST endpoint)
- **Description:** Sanitize tweet content before database insertion
- **Details:**
  - Import sanitizeContent utility
  - Call sanitizeContent(content) before createTweet
  - Sanitized content stored in database
  - Framework auto-escaping on display provides additional layer
- **Verification:** Integration test - tweet with HTML tags stored safely, displays escaped
- **Story:** Cross-cutting (security for US1)
- **Parallel:** No (depends on T007, T025)

**T027**: [Polish] Add accessibility attributes to components
- **File:** `app/components/TweetComposer.tsx`, `app/components/TweetCard.tsx`
- **Description:** Improve accessibility of tweet components
- **Details:**
  - TweetComposer: ARIA label for textarea ("Compose tweet"), aria-live for character counter
  - TweetCard: Semantic HTML (article element), ARIA labels for author link
  - Keyboard navigation: Ensure all interactive elements tabbable
  - Focus visible styles for keyboard users
  - Screen reader testing (VoiceOver, NVDA)
- **Verification:** Components usable with keyboard only, screen reader announces content correctly
- **Story:** Cross-cutting (accessibility for US1, US2, US3)
- **Parallel:** [P] (independent polishing task)

**T028**: [Polish] Write end-to-end tests
- **File:** `tests/e2e/tweet-flow.spec.ts`
- **Description:** End-to-end tests with Playwright for complete tweet flows
- **Details:**
  - Test: Complete post tweet flow (compose → submit → appears in feed → persists on reload)
  - Test: Character counter updates correctly as user types
  - Test: Submit button disabled/enabled based on content validity
  - Test: Feed displays tweets in correct order
  - Test: Click tweet in feed → navigate to detail page
  - Test: Share tweet detail URL → page loads correctly
  - Test: Unauthenticated user can view feed but cannot post
- **Verification:** All E2E tests pass
- **Story:** Cross-cutting (validates all user stories)
- **Parallel:** [P] (can write alongside other polish tasks)

---

## Final Checkpoint: Feature Complete ✓

**Verification (all acceptance criteria met):**

**US1 - Post Tweet:**
- [ ] User can type text into tweet composition field
- [ ] Character counter shows remaining characters
- [ ] Submit button disabled when tweet exceeds 140 characters or is empty
- [ ] System validates tweet length before submission
- [ ] Upon successful posting, tweet appears in feed immediately
- [ ] Clear error message shown if posting fails

**US2 - View Feed:**
- [ ] Feed displays all tweets in reverse chronological order
- [ ] Each tweet shows content, author username, and timestamp
- [ ] Feed loads without requiring authentication
- [ ] Feed updates to show new tweets after posting
- [ ] Empty state shown when no tweets exist

**US3 - View Individual Tweet:**
- [ ] User can navigate to individual tweet page via link
- [ ] Tweet detail page shows content, author username, timestamp
- [ ] Page accessible via unique URL (shareable)
- [ ] 404 error shown for non-existent tweet IDs

**Cross-Cutting:**
- [ ] All TypeScript compilation passes (strict mode)
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] Accessibility requirements met (WCAG AA)
- [ ] Content sanitization prevents XSS attacks
- [ ] Constitution principles verified (functional programming, Zod validation, programmatic routing, security-first)

---

## Dependency Graph

```
Feature 001 (Auth) [EXTERNAL DEPENDENCY]
  └─> Phase 1 (Foundational) [BLOCKS ALL USER STORIES]
       ├─> Phase 2 (US1 - Post Tweet) [MVP]
       ├─> Phase 3 (US2 - View Feed)
       └─> Phase 4 (US3 - View Detail)
            └─> Phase 5 (Polish)
```

**Critical Path:** Feature 001 → T001 → T004 → T007 → T010 (Tweet posting working)

**Parallel Opportunities:**
- Phase 1: T002, T003, T004, T005, T006 (all parallelizable after T001)
- Phase 2: T009 (frontend) can develop alongside T007-T008 (backend)
- Phase 3: T013, T014, T017 (all parallelizable)
- Phase 5: T025, T027, T028 (all parallelizable)

---

## Parallel Execution Examples

**Batch 1 (Phase 1 - Foundational):**
Run in parallel:
- T002 (TypeScript types)
- T003 (Zod schemas)
- T004 (createTweet function)
- T005 (getAllTweets function)
- T006 (getTweetById function)

**Batch 2 (Phase 2 - US1 Frontend):**
Run in parallel:
- T009 (TweetComposer component) - frontend
- T007-T008 (POST endpoint setup) - backend

**Batch 3 (Phase 3 - US2 Components):**
Run in parallel:
- T013 (TweetCard component)
- T014 (TweetList component)
- T017 (formatTimestamp utility)

**Batch 4 (Phase 5 - Polish):**
Run in parallel:
- T025 (sanitizeContent utility)
- T027 (Accessibility improvements)
- T028 (E2E tests)

---

## Estimated Time Breakdown

| Phase | Sequential | Parallel | Savings |
|-------|-----------|----------|---------|
| Phase 1: Foundational | 2-3h | 1-1.5h | 50% (5 tasks parallelizable) |
| Phase 2: US1 - Post Tweet | 3-4h | 2-3h | 33% (some frontend parallel) |
| Phase 3: US2 - View Feed | 2-3h | 1.5-2h | 33% (components parallel) |
| Phase 4: US3 - View Detail | 1-2h | 1-2h | 0% (mostly sequential) |
| Phase 5: Polish | 2-3h | 1-1.5h | 50% (3 tasks parallelizable) |
| **Total** | **10-15h** | **7-10h** | **33% average** |

---

## Notes

**MVP Scope:** Phases 1 and 2 (Post Tweet) = 5-7 hours sequential, 3-4.5 hours parallel

**External Dependency:** Feature 001 (User Authentication System) must be complete before starting this feature

**Testing Strategy:** Integration tests included for each user story, E2E tests validate complete flows

**File Organization:**
```
src/
├── db/
│   └── tweets.ts          # Tweet database functions
├── routes/
│   └── tweets.ts          # Tweet API endpoints
├── schemas/
│   └── tweet.ts           # Zod validation schemas
├── types/
│   └── tweet.ts           # TypeScript interfaces
└── utils/
    ├── sanitizeContent.ts # Content sanitization
    └── formatTimestamp.ts # Timestamp formatting

app/
├── pages/
│   ├── Feed.tsx           # Feed page (composer + list)
│   └── TweetDetail.tsx    # Tweet detail page
├── components/
│   ├── TweetComposer.tsx  # Tweet composition form
│   ├── TweetList.tsx      # List of tweets
│   └── TweetCard.tsx      # Single tweet display
├── actions/
│   └── tweets.ts          # React Router actions
└── routes.ts              # Programmatic routing

migrations/
└── 002_create_tweets_table.sql

tests/
├── unit/              # Pure function tests
├── integration/       # API endpoint tests
└── e2e/               # Playwright E2E tests
```

**Constitutional Compliance:**
- ✓ Principle 1: All tweet logic as pure functions (no classes)
- ✓ Principle 2: TypeScript strict mode, Zod validation for tweet content
- ✓ Principle 3: Programmatic routing in app/routes.ts (/feed, /tweets/:id)
- ✓ Principle 4: Content sanitization, authentication for posting, parameterized queries
- ✓ Principle 5: Functional components, loaders fetch tweets (not useEffect), actions handle posting
