# Implementation Plan: Tweet Like Functionality

**Feature ID:** 003-like-functionality
**Created:** 2025-10-12
**Status:** draft

---

## Tech Stack Compliance Report

### ✅ Approved Technologies (from tech-stack.md v1.0.0)

All technologies for this feature are APPROVED:
- TypeScript 5.x, React Router v7, Express, PostgreSQL 17
- postgres npm package, uuid (uuidv7), Zod
- Tailwind CSS, Flowbite
- JWT authentication (from Feature 001)

**Tech Stack Status:** ✅ COMPLIANT - Ready to proceed

**Tech Stack Changes:**
- Auto-added: 0 (all libraries already in stack)
- Conflicts: 0
- Prohibited: 0

---

## Constitution Compliance Check

- [x] **Principle 1 (Functional Programming):** Like/unlike logic as pure functions. LikeButton functional component. No classes.
- [x] **Principle 2 (Type Safety):** TypeScript strict mode. Zod schemas for like creation/deletion validation.
- [x] **Principle 3 (Programmatic Routing):** No new routes. Like functionality integrates into existing /feed and /tweets/:id loaders/actions.
- [x] **Principle 4 (Security-First):** Authentication required for like/unlike. Profile ID from session (never client input). Parameterized queries. Unique constraint prevents duplicates.
- [x] **Principle 5 (Modern React):** LikeButton functional component with hooks. Optimistic UI updates. No useEffect for data fetching (loaders handle it).

---

## Overview

**Goal:** Enable users to express appreciation for tweets through likes, with real-time feedback and persistent state.

**User Value:** Users can engage with content through lightweight appreciation signals. Content creators receive feedback on tweet popularity.

**Scope:**
- **Included:** Like/unlike actions (authenticated), like counts (public), user's like status indicator, optimistic UI updates, uniqueness enforcement
- **Excluded:** List of users who liked, reaction types beyond "like", like notifications, like analytics

---

## Technical Approach

### Data Model

**likes table:**
```sql
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  tweet_id UUID NOT NULL REFERENCES tweets(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tweet_id, profile_id)
);
CREATE UNIQUE INDEX idx_likes_tweet_profile ON likes(tweet_id, profile_id);
CREATE INDEX idx_likes_tweet_id ON likes(tweet_id);
CREATE INDEX idx_likes_profile_id ON likes(profile_id);
```

**Key Constraints:**
- UNIQUE(tweet_id, profile_id) - One like per user per tweet
- CASCADE DELETE - Likes deleted when tweets or users deleted
- Foreign keys ensure referential integrity

### API Endpoints

1. **POST /api/likes** - Create like (auth required)
   - Request: `{ tweetId: string }`
   - Response: `{ like: { id, tweetId, profileId, createdAt } }`
   - Errors: 400 (invalid), 401 (auth), 404 (tweet not found), 409 (already liked)

2. **DELETE /api/likes** - Delete like (auth required)
   - Request: `{ tweetId: string }` (finds like by tweetId + profileId from session)
   - Response: `{ success: true }`
   - Errors: 401 (auth), 404 (not liked)

### Modified Components

1. **LikeButton** (new functional component)
   - Props: tweetId, likeCount, isLikedByUser, onToggle
   - State: isSubmitting (prevents double-clicks)
   - Behavior: Optimistic UI updates, toggles like/unlike

2. **TweetCard** (modified)
   - Integrates LikeButton with tweet data
   - Passes like count and user status to button

3. **Feed Loader** (modified)
   - LEFT JOIN with likes table to include like counts
   - EXISTS subquery to determine current user's like status

4. **Tweet Detail Loader** (modified)
   - Same pattern as feed loader (like count + user status)

### Pure Functions (Business Logic)

```typescript
// Like creation
async function createLike(
  tweetId: string,
  profileId: string
): Promise<Like> {
  // Insert like record, handle uniqueness constraint
}

// Like deletion
async function deleteLike(
  tweetId: string,
  profileId: string
): Promise<void> {
  // Delete like record by composite key
}

// Count likes for tweet
async function countLikes(tweetId: string): Promise<number> {
  // COUNT(*) aggregation
}

// Check if user liked tweet
async function checkUserLikedTweet(
  tweetId: string,
  profileId: string
): Promise<boolean> {
  // EXISTS query
}
```

---

## Implementation Phases

### Phase 1: Database & Backend (2-3 hours)

1. Create likes table migration (003_create_likes_table.sql)
2. Implement pure functions:
   - createLike (with uniqueness handling)
   - deleteLike (by composite key)
   - countLikes (aggregate)
   - checkUserLikedTweet (EXISTS)
3. Implement POST /api/likes endpoint:
   - Validate tweetId with Zod
   - Extract profileId from JWT session
   - Call createLike function
   - Return 409 on duplicate (unique constraint violation)
4. Implement DELETE /api/likes endpoint:
   - Validate tweetId with Zod
   - Extract profileId from JWT session
   - Call deleteLike function
   - Return 404 if not found
5. Write integration tests for endpoints

### Phase 2: Modified Loaders (1 hour)

1. Update GET /api/tweets loader (feed):
   - LEFT JOIN likes table for like counts (GROUP BY)
   - EXISTS subquery for current user's like status
   - Handle unauthenticated users (isLikedByUser = false)
2. Update GET /api/tweets/:id loader (detail):
   - Same pattern as feed loader
3. Test loader responses include likeCount and isLikedByUser

### Phase 3: Frontend Components (2-3 hours)

1. Implement LikeButton component:
   - Functional component with useState for isSubmitting
   - Props: tweetId, likeCount, isLikedByUser, onToggle
   - Render filled icon if liked, outline if not
   - Display like count next to icon
   - Optimistic update on click (immediate UI change)
   - Disable during submission (prevent race conditions)
2. Modify TweetCard component:
   - Accept extended Tweet type (with likeCount, isLikedByUser)
   - Render LikeButton with tweet's like data
   - Pass toggle handler from parent
3. Implement like/unlike actions in routes:
   - Like action: Call POST /api/likes, revalidate loader
   - Unlike action: Call DELETE /api/likes, revalidate loader
   - Handle errors gracefully (show message, rollback if needed)
4. Add Tailwind styling:
   - Outline heart icon (unliked state)
   - Filled red heart icon (liked state)
   - Hover effects, smooth transitions
5. Write component tests (visual states, click behavior)

### Phase 4: Integration & Testing (1-2 hours)

1. Test complete like flow:
   - User clicks like button → immediate UI update → persists after reload
2. Test complete unlike flow:
   - User clicks filled button → immediate UI update → persists after reload
3. Test uniqueness enforcement:
   - Rapid clicks don't create duplicate likes
   - Database constraint prevents duplicates
4. Test authentication requirements:
   - Unauthenticated users see counts but cannot like
   - Redirect to signin if attempting to like while logged out
5. Test error handling:
   - Network failure → rollback UI, show error
   - 409 conflict → handle gracefully (already liked)
6. End-to-end testing with Playwright (optional)

---

## Dependencies

- **Feature 001 (User Authentication System)** - REQUIRED (JWT auth, profiles table, session management)
- **Feature 002 (Tweet Posting and Feed System)** - REQUIRED (tweets table, feed pages to integrate like buttons)

---

## Success Criteria

- [ ] Users can like a tweet in under 1 second (instant feedback)
- [ ] Like count updates immediately via optimistic UI
- [ ] 100% of duplicate like attempts rejected (uniqueness enforced)
- [ ] 0 instances of unauthorized like manipulation
- [ ] Like state persists correctly across page reloads
- [ ] Unauthenticated users can view counts but not like

---

## Security Considerations

1. **Authorization:**
   - Profile ID always from JWT session (never from client input)
   - Users can only create/delete their own likes
   - Authentication middleware protects POST/DELETE endpoints

2. **Input Validation:**
   - Tweet ID validated as UUID before database queries
   - Zod schemas validate all like requests
   - Parameterized queries prevent SQL injection

3. **Race Conditions:**
   - Client-side: isSubmitting state prevents double-clicks
   - Database: Unique constraint prevents duplicate likes
   - Server: 409 error for duplicate attempts (idempotent)

4. **Data Integrity:**
   - Foreign key constraints ensure valid tweet_id and profile_id
   - CASCADE DELETE removes orphaned likes automatically
   - Unique constraint enforced at database level (not just app logic)

---

## Performance Considerations

- Composite unique index on (tweet_id, profile_id) optimizes duplicate detection
- Index on tweet_id optimizes like count aggregation (COUNT queries)
- LEFT JOIN pattern in loaders computes counts + user status in single query
- Optimistic UI eliminates perceived latency (instant feedback)
- Database handles cascade deletes efficiently via indexes

---

## Open Questions

None - all design decisions resolved in spec.md

---

## Change Log

| Date       | Change                    | Author      |
|------------|---------------------------|-------------|
| 2025-10-12 | Initial implementation plan | Claude Code |
