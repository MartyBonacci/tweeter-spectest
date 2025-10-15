# Implementation Tasks: User Profile Tweets Feed

<!-- Tech Stack Validation: PASSED -->
<!-- Validated against: /memory/tech-stack.md v1.0.0 -->
<!-- No prohibited technologies found -->
<!-- 0 unapproved technologies require runtime validation -->

**Feature ID:** 909-user-profile-tweets-feed
**Created:** 2025-10-15
**Total Tasks:** 30
**Estimated Effort:** 3-4 hours

---

## Task Organization

This task list is organized by user story to enable independent implementation and testing:

- **Phase 1:** Setup & Verification (3 tasks)
- **Phase 2:** User Story 1 - Primary Tweet List Display (12 tasks)
- **Phase 3:** User Story 2 - Empty State Experience (4 tasks)
- **Phase 4:** User Story 3 - Own Profile Experience (3 tasks)
- **Phase 5:** Integration & Polish (5 tasks)
- **Phase 6:** Testing & Validation (3 tasks)

**Parallel Execution:**
- Tasks marked `[P]` can run in parallel with other `[P]` tasks in the same phase
- Tasks without `[P]` must complete before next task starts
- Different files = parallelizable, same file = sequential

---

## Dependency Graph

```
Setup (Phase 1)
  ↓
User Story 1: Tweet List Display (Phase 2) ← Primary MVP
  ↓
User Story 2: Empty State (Phase 3) ← Independent from US1
  ↓
User Story 3: Own Profile (Phase 4) ← Builds on US1
  ↓
Integration & Polish (Phase 5)
  ↓
Testing & Validation (Phase 6)
```

**MVP Scope:** Phase 1 + Phase 2 (User Story 1) = Minimal working feature

---

## Phase 1: Setup & Verification

**Goal:** Verify all prerequisites exist and development environment is ready

**Story:** N/A (Foundation)

---

### T001: Verify Profile Route Exists
**File:** `app/routes.ts` (or `app/routes/profile.tsx`)
**Type:** Verification
**Parallel:** [P]

**Task:**
1. Locate the existing `/profile/:username` route configuration
2. Confirm it has a loader function defined
3. Verify the Profile component is imported and assigned
4. Document the current loader function location for Phase 2 extension

**Acceptance Criteria:**
- Route exists in `app/routes.ts`
- Loader function is defined and working
- Profile component renders successfully

---

### T002: Verify TweetCard Component Exists
**File:** `app/components/TweetCard.tsx` (or similar)
**Type:** Verification
**Parallel:** [P]

**Task:**
1. Locate the TweetCard component file
2. Verify it accepts `TweetWithAuthorAndLikes` type as props
3. Confirm it handles like/unlike interactions
4. Confirm it handles delete functionality (for authorized users)
5. Document the component's props interface for Phase 2 usage

**Acceptance Criteria:**
- TweetCard component exists
- Accepts tweet data with author and like information
- Like and delete functionality working
- Component is exported and importable

---

### T003: Verify API Endpoint Exists
**File:** `server/routes/tweets.ts` (or similar API route file)
**Type:** Verification
**Parallel:** [P]

**Task:**
1. Locate the `GET /api/tweets/user/:username` endpoint
2. Verify it returns `TweetWithAuthorAndLikes[]` format
3. Test endpoint with sample username (via Postman or browser)
4. Confirm authentication is required (JWT cookie)
5. Verify response includes: id, content, createdAt, author, likeCount, isLikedByUser

**Acceptance Criteria:**
- Endpoint exists and responds correctly
- Returns tweets in correct format
- Authentication middleware active
- Response matches expected TypeScript interface

---

## Phase 2: User Story 1 - Primary Tweet List Display

**Goal:** As an authenticated user, I want to see all tweets a user has posted on their profile page

**Story:** US-1 (Primary User Story - P0)

**Acceptance Criteria:**
- ✅ When viewing any user profile, I see a list of tweets they've authored
- ✅ Tweets are displayed in reverse chronological order (newest first)
- ✅ Each tweet uses the same card format as the main feed
- ✅ Tweet cards include all standard information (content, timestamp, like count, author)

**Independent Test:** Navigate to profile → tweets load and display in correct order

---

### T004: Create Zod Schema for API Response
**File:** `app/api/tweets.ts` (or new `app/schemas/tweet.ts`)
**Type:** Schema Definition
**Parallel:** [P]

**Task:**
1. Create or open the API utilities file for tweet operations
2. Import Zod: `import { z } from 'zod'`
3. Define `tweetWithAuthorAndLikesSchema`:
   ```typescript
   const tweetWithAuthorAndLikesSchema = z.object({
     id: z.string().uuid(),
     content: z.string(),
     createdAt: z.coerce.date(),
     author: z.object({
       id: z.string().uuid(),
       username: z.string(),
       avatarUrl: z.string().url().nullable().optional(),
     }),
     likeCount: z.number().int().min(0),
     isLikedByUser: z.boolean(),
   });
   ```
4. Define array schema: `const getUserTweetsResponseSchema = z.array(tweetWithAuthorAndLikesSchema)`
5. Export both schemas

**Acceptance Criteria:**
- Zod schemas defined and exported
- Schema matches API response format from T003
- No TypeScript errors

---

### T005: Create TypeScript Interface for Loader Data
**File:** `app/types/tweet.ts` (or similar types file)
**Type:** Type Definition
**Parallel:** [P]

**Task:**
1. Create or open the types file for tweet-related interfaces
2. Define `TweetWithAuthorAndLikes` interface:
   ```typescript
   export interface TweetWithAuthorAndLikes {
     id: string;
     content: string;
     createdAt: Date;
     author: {
       id: string;
       username: string;
       avatarUrl: string | null;
     };
     likeCount: number;
     isLikedByUser: boolean;
   }
   ```
3. Extend or create `ProfileLoaderData` interface:
   ```typescript
   export interface ProfileLoaderData {
     profile: Profile;
     tweets: TweetWithAuthorAndLikes[];
   }
   ```
4. Export both interfaces

**Acceptance Criteria:**
- Interfaces defined and exported
- Type aligns with Zod schema from T004
- No TypeScript errors

---

### T006: Implement fetchTweetsByUsername Function
**File:** `app/api/tweets.ts`
**Type:** API Utility Function
**Depends On:** T004 (needs Zod schema)

**Task:**
1. Open `app/api/tweets.ts` (create if doesn't exist)
2. Import Zod schema from T004
3. Import `TweetWithAuthorAndLikes` type from T005
4. Implement function:
   ```typescript
   export async function fetchTweetsByUsername(
     username: string,
     currentUserId: string
   ): Promise<TweetWithAuthorAndLikes[]> {
     const response = await fetch(`/api/tweets/user/${username}`, {
       credentials: 'include', // Include JWT cookie
     });

     if (!response.ok) {
       throw new Error(`Failed to fetch tweets: ${response.statusText}`);
     }

     const data = await response.json();

     // Validate response with Zod
     return getUserTweetsResponseSchema.parse(data);
   }
   ```
5. Export the function

**Acceptance Criteria:**
- Function fetches from correct endpoint
- Includes authentication credentials
- Validates response with Zod schema
- Returns correctly typed data
- Throws error on failure

---

### T007: Write Unit Tests for fetchTweetsByUsername
**File:** `app/api/tweets.test.ts`
**Type:** Unit Test
**Depends On:** T006 (needs function to test)
**Parallel:** [P]

**Task:**
1. Create test file `app/api/tweets.test.ts`
2. Import `fetchTweetsByUsername` and Zod schema
3. Write tests:
   - ✅ Successfully fetches tweets for valid username
   - ✅ Returns empty array for user with no tweets
   - ✅ Throws error for 404 response
   - ✅ Throws error for 500 response
   - ✅ Validates response format with Zod
4. Use mock fetch or MSW for API mocking
5. Run tests: `npm test -- tweets.test.ts`

**Acceptance Criteria:**
- All test cases pass
- Code coverage > 90% for fetchTweetsByUsername
- Tests use proper mocking (not real API calls)

---

### T008: Extend Profile Loader to Fetch Tweets
**File:** `app/routes/Profile.tsx` (or wherever profileLoader is defined)
**Type:** Loader Extension
**Depends On:** T006 (needs fetchTweetsByUsername function)

**Task:**
1. Locate the existing `profileLoader` function (from T001)
2. Import `fetchTweetsByUsername` from `app/api/tweets`
3. Import `requireUserId` utility (existing auth helper)
4. Extend loader to fetch tweets:
   ```typescript
   export async function profileLoader({ params, request }: LoaderFunctionArgs) {
     const { username } = params;
     const currentUserId = await requireUserId(request);

     // Existing: fetch profile
     const profile = await fetchProfileByUsername(username);

     if (!profile) {
       throw new Response('Profile not found', { status: 404 });
     }

     // NEW: fetch user's tweets
     const tweets = await fetchTweetsByUsername(username, currentUserId);

     return { profile, tweets };
   }
   ```
5. Update loader return type annotation if needed

**Acceptance Criteria:**
- Loader fetches both profile and tweets
- Tweets fetch uses current user ID for isLikedByUser
- Error handling preserves existing behavior
- TypeScript types correct
- No breaking changes to existing functionality

---

### T009: Write Unit Tests for Extended Loader
**File:** `app/routes/Profile.test.tsx`
**Type:** Unit Test
**Depends On:** T008 (needs extended loader)
**Parallel:** [P]

**Task:**
1. Create or open `app/routes/Profile.test.tsx`
2. Import `profileLoader` and related types
3. Write tests for loader:
   - ✅ Returns profile and tweets for valid username
   - ✅ Returns empty tweets array for user with no tweets
   - ✅ Throws 404 for non-existent username
   - ✅ Calls fetchTweetsByUsername with correct parameters
   - ✅ Passes currentUserId to tweet fetch
4. Mock `fetchProfileByUsername` and `fetchTweetsByUsername`
5. Run tests: `npm test -- Profile.test.tsx`

**Acceptance Criteria:**
- All test cases pass
- Loader behavior verified
- Mocks used correctly
- No flaky tests

---

### T010: Update Profile Component - Add Imports and Extract Data
**File:** `app/routes/Profile.tsx` (or `app/components/Profile.tsx`)
**Type:** Component Update
**Depends On:** T008 (needs extended loader data)

**Task:**
1. Open the Profile component file
2. Add imports:
   ```typescript
   import { useLoaderData, useNavigation } from 'react-router';
   import { TweetCard } from '~/components/TweetCard';
   import type { TweetWithAuthorAndLikes } from '~/types/tweet';
   ```
3. Extract tweets from loader data:
   ```typescript
   export function Profile() {
     const { profile, tweets } = useLoaderData<typeof profileLoader>();
     const navigation = useNavigation();

     const isLoading = navigation.state === 'loading';

     // Existing ProfileHeader rendering...
   }
   ```
4. Leave existing ProfileHeader rendering intact

**Acceptance Criteria:**
- Imports added successfully
- Tweets data extracted from loader
- Loading state tracked with useNavigation
- No TypeScript errors
- Existing functionality not broken

---

### T011: Add Tweets Section with Loading State
**File:** `app/routes/Profile.tsx`
**Type:** Component Update
**Depends On:** T010 (needs setup from previous task)

**Task:**
1. After existing ProfileHeader, add tweets section:
   ```tsx
   <section className="mt-8" aria-labelledby="user-tweets-heading">
     <h2 id="user-tweets-heading" className="sr-only">
       {profile.username}'s tweets
     </h2>

     {isLoading ? (
       <div className="flex justify-center py-12">
         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
       </div>
     ) : (
       {/* Placeholder for tweet list - will add in T012 */}
       <div>Tweet list placeholder</div>
     )}
   </section>
   ```
2. Ensure sr-only class exists (Tailwind utility for screen reader only)
3. Test loading state by throttling network in DevTools

**Acceptance Criteria:**
- Section added with proper semantic HTML
- Accessibility heading present (sr-only)
- Loading spinner displays during navigation
- Section appears below ProfileHeader
- No layout issues

---

### T012: Add Tweet List Rendering
**File:** `app/routes/Profile.tsx`
**Type:** Component Update
**Depends On:** T011 (needs section structure)

**Task:**
1. Replace the placeholder div from T011 with tweet list:
   ```tsx
   {isLoading ? (
     <LoadingSpinner />
   ) : (
     <div className="space-y-4">
       {tweets.map((tweet) => (
         <TweetCard key={tweet.id} tweet={tweet} />
       ))}
     </div>
   )}
   ```
2. Verify TweetCard accepts the tweet prop correctly
3. Test with profile that has multiple tweets
4. Verify tweets render in correct order (newest first)

**Acceptance Criteria:**
- Tweets render using TweetCard component
- Each tweet has unique key (tweet.id)
- Tweets display in reverse chronological order
- Tailwind space-y-4 provides consistent spacing
- Like and delete buttons work (via TweetCard)
- No console errors or warnings

---

### T013: Test User Story 1 Integration
**File:** Manual testing in browser
**Type:** Integration Test
**Depends On:** T012 (needs complete tweet list)

**Task:**
1. Start dev server: `npm run dev`
2. Navigate to a profile with tweets
3. Verify:
   - ✅ Tweets load and display
   - ✅ Newest tweet appears first
   - ✅ Each tweet shows: content, timestamp, author info, like count
   - ✅ TweetCard format matches main feed
   - ✅ Like button works
   - ✅ Delete button appears only for own tweets
4. Test with different profiles (with many tweets, few tweets)
5. Check browser console for errors

**Acceptance Criteria:**
- All verification items pass
- No console errors
- Loading state displays briefly
- Tweets render correctly
- User Story 1 acceptance criteria met

---

### T014: Write Component Tests for Tweet List
**File:** `app/routes/Profile.test.tsx`
**Type:** Component Test
**Depends On:** T012 (needs complete tweet list)
**Parallel:** [P]

**Task:**
1. Add component tests to `app/routes/Profile.test.tsx`
2. Import `render`, `screen` from `@testing-library/react`
3. Write tests:
   - ✅ Renders loading state when navigation.state === 'loading'
   - ✅ Renders TweetCard for each tweet in array
   - ✅ Uses correct key for each TweetCard (tweet.id)
   - ✅ Tweets render in order (first tweet in array appears first in DOM)
   - ✅ Accessibility heading present (sr-only)
4. Use React Router test utilities for loader data mocking
5. Run tests: `npm test -- Profile.test.tsx`

**Acceptance Criteria:**
- All test cases pass
- Loading state tested
- Tweet rendering tested
- Accessibility features tested
- No flaky tests

---

### T015: Checkpoint - User Story 1 Complete
**Type:** Milestone Verification

**Task:**
1. Verify all User Story 1 acceptance criteria met:
   - ✅ Tweets display on any user profile
   - ✅ Reverse chronological order (newest first)
   - ✅ Same card format as main feed
   - ✅ All standard information present
2. Run all tests: `npm test`
3. Check TypeScript: `npm run typecheck`
4. Manual browser testing complete (T013)

**Acceptance Criteria:**
- All US-1 acceptance criteria verified
- All automated tests passing
- No TypeScript errors
- Ready to proceed to User Story 2

---

## Phase 3: User Story 2 - Empty State Experience

**Goal:** As a user viewing a profile with no tweets, I want to see a clear message

**Story:** US-2 (Secondary - P0)

**Acceptance Criteria:**
- ✅ Empty state message is friendly and clear: "No tweets yet"
- ✅ Empty state appears after loading completes (not during loading)
- ✅ Empty state uses consistent styling with the rest of the application

**Independent Test:** Navigate to profile with no tweets → empty state displays

---

### T016: Add Empty State Conditional Rendering
**File:** `app/routes/Profile.tsx`
**Type:** Component Update
**Depends On:** T012 (needs existing tweet list structure)

**Task:**
1. Update tweets section to handle empty state:
   ```tsx
   {isLoading ? (
     <LoadingSpinner />
   ) : tweets.length === 0 ? (
     <div className="text-center py-12 text-gray-500">
       <p className="text-lg">No tweets yet</p>
     </div>
   ) : (
     <div className="space-y-4">
       {tweets.map((tweet) => (
         <TweetCard key={tweet.id} tweet={tweet} />
       ))}
     </div>
   )}
   ```
2. Ensure empty state only shows when:
   - NOT loading (isLoading === false)
   - AND tweets array is empty (tweets.length === 0)

**Acceptance Criteria:**
- Empty state renders when no tweets
- Message is centered and styled with muted text (text-gray-500)
- Empty state does NOT show during loading
- Message is friendly and clear
- No layout issues

---

### T017: Test Empty State with Manual Browser Testing
**File:** Manual testing in browser
**Type:** Integration Test
**Depends On:** T016 (needs empty state)

**Task:**
1. Find or create a test user with zero tweets
2. Navigate to that user's profile
3. Verify:
   - ✅ Loading spinner shows briefly
   - ✅ "No tweets yet" message appears after loading
   - ✅ Message is centered
   - ✅ Text color is muted (gray)
   - ✅ No flash of empty state during loading
4. Test on different screen sizes (mobile, tablet, desktop)

**Acceptance Criteria:**
- All verification items pass
- Empty state displays correctly
- No console errors
- User Story 2 acceptance criteria met

---

### T018: Write Component Tests for Empty State
**File:** `app/routes/Profile.test.tsx`
**Type:** Component Test
**Depends On:** T016 (needs empty state)
**Parallel:** [P]

**Task:**
1. Add empty state tests to `app/routes/Profile.test.tsx`
2. Write tests:
   - ✅ Renders "No tweets yet" when tweets array is empty
   - ✅ Does NOT render empty state during loading (shows spinner instead)
   - ✅ Empty state has correct styling (centered, muted text)
   - ✅ Empty state announced to screen readers (implicit via text content)
3. Mock loader data with empty tweets array
4. Run tests: `npm test -- Profile.test.tsx`

**Acceptance Criteria:**
- All test cases pass
- Empty state rendering verified
- Loading vs empty state distinction tested
- Styling verified

---

### T019: Checkpoint - User Story 2 Complete
**Type:** Milestone Verification

**Task:**
1. Verify all User Story 2 acceptance criteria met:
   - ✅ Empty state message is friendly and clear
   - ✅ Appears after loading completes
   - ✅ Uses consistent styling
2. Run tests for empty state
3. Manual browser testing complete (T017)

**Acceptance Criteria:**
- All US-2 acceptance criteria verified
- Empty state tests passing
- No regressions in User Story 1
- Ready to proceed to User Story 3

---

## Phase 4: User Story 3 - Own Profile Experience

**Goal:** As a user viewing my own profile, I want to see my tweet history

**Story:** US-3 (Secondary - P0)

**Acceptance Criteria:**
- ✅ My own tweets appear on my profile
- ✅ Tweets I can delete show delete functionality (same as feed)
- ✅ New tweets I post appear at the top after posting

**Independent Test:** View own profile → see tweets → delete one → verify removal

---

### T020: Test Own Profile Tweet Display
**File:** Manual testing in browser
**Type:** Integration Test
**Depends On:** T012 (needs tweet list), T016 (needs empty state if no tweets)

**Task:**
1. Sign in as a test user
2. Navigate to your own profile (/profile/your-username)
3. Verify:
   - ✅ Your tweets display correctly
   - ✅ Delete button appears on each of your tweets
   - ✅ Delete button does NOT appear on other users' tweets (sanity check)
4. Click delete on one tweet
5. Verify tweet is removed from list immediately

**Acceptance Criteria:**
- Own tweets display correctly
- Delete functionality works (via TweetCard)
- Tweet removal reflected in UI
- No console errors

---

### T021: Test New Tweet Appears at Top
**File:** Manual testing in browser
**Type:** Integration Test
**Depends On:** T020 (needs own profile working)

**Task:**
1. Navigate to your own profile
2. Go to a page with tweet composer (e.g., /feed)
3. Post a new tweet
4. Navigate back to your profile
5. Verify:
   - ✅ New tweet appears at the top of the list
   - ✅ Newest-first ordering maintained
   - ✅ Like count is 0 (no self-like)
6. Test posting multiple tweets to ensure ordering

**Acceptance Criteria:**
- New tweets appear at top
- Reverse chronological order maintained
- No need for page refresh (loader refetches on navigation)

**Note:** This task tests existing behavior (loader refetches on navigation). No code changes needed unless issues found.

---

### T022: Checkpoint - User Story 3 Complete
**Type:** Milestone Verification

**Task:**
1. Verify all User Story 3 acceptance criteria met:
   - ✅ Own tweets appear on own profile
   - ✅ Delete functionality works
   - ✅ New tweets appear at top after posting
2. Manual browser testing complete (T020, T021)

**Acceptance Criteria:**
- All US-3 acceptance criteria verified
- Own profile experience works correctly
- No regressions in User Stories 1 or 2
- Ready for integration & polish

---

## Phase 5: Integration & Polish

**Goal:** Ensure feature integrates seamlessly with existing app and meets quality standards

---

### T023: Add TypeScript Type Guards (if needed)
**File:** `app/types/tweet.ts`
**Type:** Type Safety Enhancement
**Parallel:** [P]

**Task:**
1. Review TweetCard component expectations
2. If TweetCard needs type guards, add to `app/types/tweet.ts`:
   ```typescript
   export function isTweetWithAuthorAndLikes(data: unknown): data is TweetWithAuthorAndLikes {
     return (
       typeof data === 'object' &&
       data !== null &&
       'id' in data &&
       'content' in data &&
       'author' in data &&
       'likeCount' in data &&
       'isLikedByUser' in data
     );
   }
   ```
3. Otherwise, skip this task (mark as N/A)

**Acceptance Criteria:**
- Type guard added if needed
- TypeScript compiler happy
- Or task marked N/A if not needed

---

### T024: Add JSDoc Comments to fetchTweetsByUsername
**File:** `app/api/tweets.ts`
**Type:** Documentation
**Parallel:** [P]

**Task:**
1. Add JSDoc comment to `fetchTweetsByUsername`:
   ```typescript
   /**
    * Fetch all tweets authored by a specific user
    *
    * @param username - Username of the profile user
    * @param currentUserId - ID of the authenticated user (for isLikedByUser calculation)
    * @returns Promise resolving to array of tweets with author and like data
    * @throws Error if fetch fails or response is invalid
    *
    * @example
    * ```typescript
    * const tweets = await fetchTweetsByUsername('johndoe', currentUserId);
    * console.log(tweets.length); // Number of tweets by johndoe
    * ```
    */
   ```
2. Add inline comments for Zod validation if not obvious

**Acceptance Criteria:**
- JSDoc comment added
- Parameters documented
- Return type documented
- Example usage included

---

### T025: Add Inline Comments for Profile Component
**File:** `app/routes/Profile.tsx`
**Type:** Documentation
**Parallel:** [P]

**Task:**
1. Add comments explaining the three-state rendering logic:
   ```tsx
   {/* Three-state rendering: loading → empty → content */}
   {isLoading ? (
     {/* Loading state: show spinner during data fetch */}
     <LoadingSpinner />
   ) : tweets.length === 0 ? (
     {/* Empty state: friendly message when user has no tweets */}
     <EmptyState />
   ) : (
     {/* Content state: render tweet list with TweetCard */}
     <TweetsList />
   )}
   ```
2. Add comment explaining useMemo if used for optimizations
3. Keep comments concise (explain "why", not "what")

**Acceptance Criteria:**
- Key logic explained with comments
- Comments are helpful (not redundant)
- Code readability improved

---

### T026: Run Full TypeScript Check
**File:** All TypeScript files
**Type:** Type Safety Validation

**Task:**
1. Run TypeScript compiler: `npm run typecheck`
2. Fix any new TypeScript errors introduced by this feature
3. Verify no regressions in existing files
4. If errors in existing files (unrelated to this feature), document them but don't fix

**Acceptance Criteria:**
- No new TypeScript errors introduced
- All feature code type-safe
- TypeScript compiler exit code 0 (or same errors as before feature)

---

### T027: Accessibility Review
**File:** `app/routes/Profile.tsx`
**Type:** Accessibility Validation
**Parallel:** [P]

**Task:**
1. Verify semantic HTML:
   - `<section>` for tweets section ✓
   - `<h2>` for heading (sr-only) ✓
   - aria-labelledby connects heading to section ✓
2. Test with keyboard navigation:
   - Tab through page
   - Verify all interactive elements (like, delete buttons) are keyboard accessible
3. Test with screen reader (NVDA, VoiceOver, or JAWS):
   - Verify tweets section announced correctly
   - Verify loading state announced
   - Verify empty state announced
4. Check color contrast (Chrome DevTools Accessibility pane):
   - Empty state text (text-gray-500) meets WCAG AA (4.5:1)

**Acceptance Criteria:**
- Semantic HTML correct
- Keyboard navigation works
- Screen reader announces correctly
- Color contrast meets WCAG AA

---

## Phase 6: Testing & Validation

**Goal:** Ensure all tests pass and feature meets success criteria

---

### T028: Run Full Test Suite
**File:** All test files
**Type:** Test Validation

**Task:**
1. Run all tests: `npm test -- --run`
2. Verify all tests pass (including existing tests)
3. Check test coverage: `npm test -- --coverage`
4. Verify new code has > 90% coverage
5. Fix any failing tests
6. If pre-existing tests fail (unrelated to feature), document but don't fix

**Acceptance Criteria:**
- All new tests pass
- No regressions in existing tests
- Code coverage > 90% for new code
- Test suite exit code 0 (or same failures as before feature)

---

### T029: Performance Validation
**File:** Manual testing with Chrome DevTools
**Type:** Performance Check

**Task:**
1. Open Chrome DevTools → Performance tab
2. Navigate to profile with 100+ tweets
3. Record performance profile
4. Analyze:
   - Page load time < 2 seconds
   - Loader execution time < 500ms
   - Time to Interactive < 3 seconds
5. If performance targets not met, investigate:
   - Database query timing (check backend logs)
   - Network waterfall (ensure single loader request)
   - Component rendering (check for unnecessary re-renders)
6. Document findings in performance notes

**Acceptance Criteria:**
- Page load < 2s for 100 tweets
- Loader < 500ms
- Time to Interactive < 3s
- Or documented plan for optimization if targets not met

---

### T030: Final Acceptance Testing
**File:** Manual testing checklist
**Type:** User Acceptance Test

**Task:**
1. Complete comprehensive user testing:
   - ✅ Navigate to profile with tweets → tweets display
   - ✅ Tweets in reverse chronological order
   - ✅ TweetCard format matches feed
   - ✅ Like button works
   - ✅ Delete button works (own tweets only)
   - ✅ Navigate to profile with no tweets → empty state displays
   - ✅ Loading state shows during fetch
   - ✅ Own profile shows own tweets
   - ✅ Post new tweet → appears at top of profile
2. Test edge cases:
   - User with 1 tweet
   - User with 100+ tweets
   - Profile page refresh
   - Back button navigation
3. Cross-browser testing:
   - Chrome ✓
   - Firefox ✓
   - Safari (if available)
4. Document any issues found

**Acceptance Criteria:**
- All manual tests pass
- All user stories meet acceptance criteria
- Edge cases handled correctly
- No console errors
- Feature ready for code review

---

## Parallel Execution Examples

### Phase 1 (Setup) - All Parallel
```bash
# All verification tasks can run simultaneously
T001 & T002 & T003
# Wait for all to complete
```

### Phase 2 (User Story 1) - Mixed
```bash
# Schema and types in parallel
T004 & T005

# Wait, then implement function
T006

# Unit tests while working on loader
T007 & T008

# Component updates (sequential - same file)
T009 → T010 → T011 → T012

# Final testing in parallel
T013 & T014
```

### Phase 3 (User Story 2) - Mixed
```bash
T016 → T017 & T018
```

### Phase 5 (Integration & Polish) - Mostly Parallel
```bash
T023 & T024 & T025 & T027
# Wait for all, then run T026
```

---

## Success Criteria

**Feature complete when:**
- [ ] All 30 tasks completed
- [ ] All user stories meet acceptance criteria
- [ ] All automated tests passing
- [ ] No TypeScript errors introduced
- [ ] Accessibility requirements met (WCAG AA)
- [ ] Performance targets met (< 2s page load)
- [ ] Code reviewed and approved
- [ ] Feature deployed to production

---

## MVP Definition

**Minimum Viable Product = Phase 1 + Phase 2**

This delivers User Story 1 (primary user story):
- ✅ Tweets display on profile pages
- ✅ Reverse chronological order
- ✅ TweetCard format
- ✅ Like/delete functionality

**Can ship without:**
- Phase 3 (empty state) - nice to have
- Phase 4 (own profile enhancements) - builds on US1
- Phase 5 (polish) - can iterate
- Phase 6 (additional testing) - required before production

**Recommended:** Complete all phases for production-ready feature

---

## Implementation Tips

1. **Start with setup:** Complete Phase 1 first to verify all prerequisites
2. **Test incrementally:** Don't wait until Phase 6 to run tests
3. **Use TypeScript compiler:** Run `npm run typecheck` frequently
4. **Check TweetCard props:** Ensure data format matches expectations
5. **Monitor performance:** Log query times during development
6. **Accessibility first:** Test with keyboard and screen reader as you build

---

## Notes

- **No database changes required:** All tables, columns, and indexes exist
- **Component reuse:** TweetCard used as-is (no modifications)
- **Loader pattern:** Follows React Router v7 best practices
- **Constitution compliant:** All 5 principles followed
- **Tech stack approved:** 100% approved technologies (no conflicts)

---

## Next Steps After Task Completion

1. **Self-review:** Check all acceptance criteria met
2. **Create PR:** Use descriptive title "feat: add user profile tweets feed"
3. **Request review:** Tag maintainer for code review
4. **Address feedback:** Iterate based on review comments
5. **Merge:** Deploy to production after approval
6. **Monitor:** Watch for performance issues or user feedback

---

**Ready to implement!** Run `/specswarm:implement` to execute tasks automatically, or implement manually using this task list as a guide.
