# Feature Specification: Tweet Like Functionality

**Feature ID:** 003-like-functionality
**Created:** 2025-10-12
**Status:** draft
**Priority:** high

---

## Constitution Alignment

This specification MUST comply with project constitution (`/memory/constitution.md`).

**Affected Principles:**
- [x] Principle 1: Functional Programming Over OOP
- [x] Principle 2: Type Safety (TypeScript + Zod)
- [x] Principle 3: Programmatic Routing
- [x] Principle 4: Security-First Architecture
- [x] Principle 5: Modern React Patterns

**Compliance Statement:**
This engagement feature enables users to express appreciation for tweets and enhances the social dynamics of the platform. Like/unlike logic will be implemented as pure functions with no side effects (Principle 1). All like data and constraints will have strict type definitions and runtime validation (Principle 2). No new routes required; like functionality integrates into existing feed and detail pages (Principle 3). Like actions require authentication and enforce one-like-per-user constraints (Principle 4). Like button UI will use functional components with optimistic updates for immediate feedback (Principle 5).

---

## Summary

**What:** A like system enabling authenticated users to express appreciation for tweets, with each user able to like a tweet only once.

**Why:** Users need to engage with content through lightweight appreciation signals, and content creators need feedback on tweet popularity.

**Who:** Authenticated Tweeter users (for liking/unliking) and all users (for viewing like counts).

---

## User Stories

### Primary User Story: Like a Tweet
```
As an authenticated Tweeter user
I want to like a tweet I appreciate
So that I can show support for the content and its author
```

**Acceptance Criteria:**
- [ ] User sees like button on each tweet (feed and detail pages)
- [ ] User can click like button to like a tweet they haven't liked
- [ ] Like count increases immediately when user likes a tweet
- [ ] Like button changes visual state to indicate user has liked (filled/highlighted)
- [ ] User cannot like the same tweet more than once
- [ ] Like persists across page reloads and sessions

### Primary User Story: Unlike a Tweet
```
As an authenticated Tweeter user who has liked a tweet
I want to unlike a tweet
So that I can change my mind or correct accidental likes
```

**Acceptance Criteria:**
- [ ] User sees visual indicator that they've already liked a tweet
- [ ] User can click like button again to unlike a tweet
- [ ] Like count decreases immediately when user unlikes
- [ ] Like button returns to neutral state (unfilled/unhighlighted)
- [ ] Unlike action removes user's like from database
- [ ] User can like the tweet again after unliking

### Secondary User Story: View Like Counts
```
As any Tweeter user (authenticated or not)
I want to see how many likes each tweet has
So that I can gauge content popularity and quality
```

**Acceptance Criteria:**
- [ ] Like count displayed on each tweet in feed
- [ ] Like count displayed on tweet detail page
- [ ] Count shows total number of users who liked the tweet
- [ ] Count updates in real-time when user likes/unlikes
- [ ] Zero likes shown as "0" (not hidden)

---

## Functional Requirements

### Must Have (P0)

1. **Like Creation**
   - Authenticated users can like any tweet
   - Each user can like a tweet only once (uniqueness enforced)
   - Like action immediately records user-tweet association
   - Unauthenticated users see like counts but cannot like
   - Success: Like saved to database, count incremented

2. **Like Removal (Unlike)**
   - Users can unlike tweets they've previously liked
   - Unlike action removes user-tweet association
   - Unlike decrements like count
   - Success: Like removed from database, count decremented

3. **Like Count Display**
   - Each tweet displays total like count
   - Count visible on feed entries and detail pages
   - Count reflects current state (all likes from all users)
   - Zero likes displayed as "0" (not hidden or "—")
   - Success: Accurate count shown on all tweet displays

4. **Like State Indicator**
   - User sees whether they've liked a tweet (visual distinction)
   - Liked state persists across page loads
   - Different visual treatment for liked vs unliked (e.g., filled vs outline icon)
   - Success: User always knows their like status for any tweet

5. **Real-Time Updates**
   - Like count updates immediately after user action (no page refresh)
   - Like button state updates immediately (liked ↔ unliked)
   - Changes visible instantly without loading states (optimistic UI)
   - Success: Instant feedback on user actions

6. **One Like Per User Constraint**
   - Database enforces uniqueness on (tweet_id, profile_id) combination
   - Duplicate like attempts rejected at database level
   - Client prevents duplicate like submissions
   - Success: No user can like same tweet twice

7. **Authentication Requirements**
   - Liking/unliking requires authentication
   - Unauthenticated users redirected to signin when attempting to like
   - Viewing like counts does not require authentication
   - Success: Protected engagement actions, public consumption

### Should Have (P1)

1. **Like Button Accessibility**
   - Clear visual feedback on hover
   - Keyboard accessible (tab navigation, enter to toggle)
   - Screen reader announces like/unlike actions

2. **Error Handling**
   - Clear error message if like action fails
   - Automatic retry for network failures
   - Rollback UI if server rejects action

### Could Have (P2)

1. **Like Animation**
   - Smooth transition when toggling like state
   - Brief animation on like button click
   - Visual celebration for first like on tweet

2. **Like Notifications**
   - Notify tweet author when their tweet receives likes
   - Aggregate notifications (not one per like)

### Won't Have (Out of Scope)

1. List of users who liked a tweet
2. Liking other content (profiles, comments)
3. Different reaction types (love, laugh, etc.)
4. Like activity feed (history of likes)
5. Like analytics (most liked tweets, trending)
6. Limiting who can like your tweets
7. Unlisting likes from public view

---

## Technical Requirements

### Type Safety Requirements
- [x] TypeScript interfaces defined for Like data structure
- [x] Zod schemas created for:
  - [x] Like creation request validation (tweetId)
  - [x] Like deletion request validation (likeId or tweetId)
  - [x] Like response validation (id, tweetId, profileId, createdAt)

### Security Requirements
- [x] Authentication method: Session-based (JWT cookies from feature 001)
- [x] Authorization rules: Only authenticated users can like/unlike, all users can view counts
- [x] Input sanitization: Tweet IDs validated before database queries
- [x] Data protection: User can only unlike their own likes, not others'

### Data Requirements
- [x] Database schema changes documented: likes table created
- [x] Migration strategy defined: Migration creates likes table with unique constraint
- [x] Data validation rules specified: unique (tweet_id, profile_id), foreign keys enforced
- [x] snake_case ↔ camelCase mapping identified: tweet_id ↔ tweetId, profile_id ↔ profileId

### Routing Requirements
- [x] Routes: No new routes required (integrates into existing /feed and /tweets/:id pages)
- [x] Loader functions: Modified to include like counts and user's like status
- [x] Action functions: Like action, unlike action
- [x] No file-based routes created: All integrated into existing route configuration

---

## User Interface

### Pages/Views

1. **Feed Page (Modified)** (`/feed`)
   - Purpose: Display tweets with like counts and interactive like buttons
   - Components: TweetCard (modified to include LikeButton and like count)
   - Data: Tweets with like counts and current user's like status per tweet

2. **Tweet Detail Page (Modified)** (`/tweets/:id`)
   - Purpose: Display single tweet with like count and interactive like button
   - Components: TweetCard (same as feed, includes LikeButton)
   - Data: Single tweet with like count and current user's like status

### Components

1. **LikeButton** (functional component)
   - Props:
     - `tweetId: string`
     - `likeCount: number`
     - `isLikedByUser: boolean`
     - `onToggle: (tweetId: string) => void`
   - State:
     - `isSubmitting: boolean` (prevents double-clicks)
   - Behavior:
     - Shows filled icon if `isLikedByUser` is true, outline if false
     - Displays like count next to icon
     - On click: calls `onToggle` with tweetId
     - Optimistic update: immediately toggles visual state before server response
     - Disables during submission to prevent race conditions

2. **TweetCard (Modified)** (functional component)
   - Props: `tweet: Tweet` (with likeCount and isLikedByUser added)
   - State: Managed by parent (feed or detail page)
   - Behavior:
     - Renders LikeButton component with tweet's like data
     - Passes like toggle handler to button

### User Flows

#### Like a Tweet Flow
```
1. User views feed or tweet detail (must be authenticated)
2. User sees tweet with like button (outline icon, count displayed)
3. User clicks like button
4. Button immediately shows filled state, count increments (optimistic)
5. Action sends like request to server
6. If successful: State persists (no rollback)
7. If failed: Button reverts to outline, count decrements, error shown
8. User can reload page and see liked state persists
```

#### Unlike a Tweet Flow
```
1. User views tweet they've previously liked
2. User sees filled like button indicating their like
3. User clicks like button again
4. Button immediately shows outline state, count decrements (optimistic)
5. Action sends unlike request to server
6. If successful: State persists (no rollback)
7. If failed: Button reverts to filled, count increments, error shown
```

#### View Like Counts (Unauthenticated) Flow
```
1. Unauthenticated user views feed or tweet detail
2. User sees like counts on all tweets
3. User sees like button but it's disabled or redirects to signin
4. User cannot interact with like button without authentication
```

---

## API Specification

### Endpoints

#### `POST /api/likes`
**Purpose:** Create a new like (user likes a tweet)

**Authentication:** Required (must be authenticated)

**Request:**
```typescript
// TypeScript type
interface CreateLikeRequest {
  tweetId: string;  // UUID v7 of tweet to like
}

// Zod schema (conceptual)
// Validates tweetId format
```

**Response:**
```typescript
// TypeScript type (success)
interface CreateLikeResponse {
  like: {
    id: string;           // UUID v7 of like record
    tweetId: string;
    profileId: string;    // Current user's ID (from session)
    createdAt: string;    // ISO 8601 datetime
  }
}

// TypeScript type (error)
interface CreateLikeError {
  error: string;     // Error message
}
```

**Error Responses:**
- `400`: Validation error (invalid tweetId format)
- `401`: Authentication required (user not signed in)
- `404`: Tweet not found (tweetId doesn't exist)
- `409`: Conflict (user already liked this tweet - uniqueness constraint)
- `500`: Server error

#### `DELETE /api/likes/:id`
**Purpose:** Delete a like (user unlikes a tweet)

**Authentication:** Required (must be authenticated, can only delete own likes)

**Request:** None (like ID in URL path)

**Response:**
```typescript
// TypeScript type (success)
interface DeleteLikeResponse {
  success: boolean;
}

// TypeScript type (error)
interface DeleteLikeError {
  error: string;
}
```

**Error Responses:**
- `401`: Authentication required or not authorized (not user's like)
- `404`: Like not found (invalid ID or already deleted)
- `500`: Server error

**Alternative Design:** `DELETE /api/likes` with `{ tweetId }` in body
- Simplifies client logic (don't need to track like ID)
- Backend finds and deletes like by (tweetId, current user's profileId)

---

## Data Model

### Database Schema

#### Table: likes
```sql
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  tweet_id UUID NOT NULL REFERENCES tweets(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tweet_id, profile_id)
);
```

**Indexes:**
- [x] Unique composite index on `(tweet_id, profile_id)` (enforces one like per user per tweet)
- [x] Index on `tweet_id` for counting likes per tweet (aggregate queries)
- [x] Index on `profile_id` for finding user's likes (future features like "my likes")
- [x] Primary key index on `id` (automatic)

**Constraints:**
- [x] `tweet_id` FOREIGN KEY REFERENCES tweets(id) ON DELETE CASCADE (like deleted if tweet deleted)
- [x] `profile_id` FOREIGN KEY REFERENCES profiles(id) ON DELETE CASCADE (like deleted if user deleted)
- [x] UNIQUE(tweet_id, profile_id) (prevents duplicate likes)

**Relationships:**
- [x] `tweet_id` → `tweets.id` (many-to-one: many likes belong to one tweet)
- [x] `profile_id` → `profiles.id` (many-to-one: many likes belong to one user)

### TypeScript Interfaces
```typescript
// Application layer (camelCase)
interface Like {
  id: string;
  tweetId: string;
  profileId: string;
  createdAt: Date;
}

// Tweet with like data (for UI display)
interface TweetWithLikes {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
  };
  createdAt: Date;
  likeCount: number;          // Total likes from all users
  isLikedByUser: boolean;     // Current user's like status
}
```

---

## Security Analysis

### Threat Model

1. **Unauthorized Like Manipulation**
   - **Threat:** Attacker attempts to like tweets as another user
   - **Mitigation:** Profile ID captured from authenticated session (not client-provided), authorization checks enforce user can only create own likes

2. **Like Count Inflation**
   - **Threat:** Attacker attempts to like same tweet multiple times to inflate count
   - **Mitigation:** Database unique constraint on (tweet_id, profile_id) prevents duplicates, server rejects duplicate attempts with 409 error

3. **Malicious Unlike**
   - **Threat:** Attacker attempts to unlike other users' likes
   - **Mitigation:** Authorization check ensures user can only delete their own likes, foreign key constraints prevent orphaned records

4. **SQL Injection via Tweet ID**
   - **Threat:** Attacker manipulates tweetId parameter to execute SQL
   - **Mitigation:** Parameterized queries only, input validation ensures tweetId is valid UUID format

5. **Race Condition on Simultaneous Likes**
   - **Threat:** User rapidly clicks like button multiple times
   - **Mitigation:** Client-side debouncing/disabling, database unique constraint prevents duplicates, server returns 409 for duplicates

### Input Validation
- [x] All like actions validated with schema validation before processing
- [x] SQL injection prevented via parameterized queries
- [x] Tweet IDs validated as proper UUID format

### Authentication & Authorization
- [x] POST /api/likes requires valid session
- [x] DELETE /api/likes requires valid session and ownership verification
- [x] Like counts viewable publicly (GET endpoints remain public)
- [x] Profile ID captured from session (never from client input)

---

## Testing Requirements

### Unit Tests
- [x] Like uniqueness constraint tested (database level)
- [x] Like count aggregation function tested (various scenarios)
- [x] User like status determination tested (user has liked vs hasn't liked)
- [x] Validation schemas tested (valid/invalid tweetId formats)

### Integration Tests
- [x] POST /api/likes with valid tweetId (authenticated user, success case)
- [x] POST /api/likes with duplicate like attempt (409 conflict)
- [x] POST /api/likes without authentication (401 error)
- [x] POST /api/likes with non-existent tweetId (404 error)
- [x] DELETE /api/likes with valid like ID (success case)
- [x] DELETE /api/likes with another user's like ID (401 unauthorized)
- [x] GET /api/tweets includes accurate like counts and user status

### End-to-End Tests
- [x] Complete like flow (click button → immediate UI update → like persists)
- [x] Complete unlike flow (click filled button → immediate UI update → unlike persists)
- [x] Like count displays correctly on feed and detail pages
- [x] Liked state persists across page reloads
- [x] Unauthenticated user cannot like (redirected or disabled)
- [x] Duplicate like attempts handled gracefully (no duplicate records created)
- [x] Optimistic UI rollback on error

---

## Performance Considerations

- [x] Database index on `(tweet_id, profile_id)` optimizes duplicate detection
- [x] Database index on `tweet_id` optimizes like count aggregation
- [x] Like count computed via single aggregate query (COUNT) per tweet
- [x] User's like status determined via single query (EXISTS check or LEFT JOIN)
- [x] Optimistic UI updates minimize perceived latency
- [x] Cascade delete prevents orphaned likes when tweets/profiles deleted

---

## Accessibility

- [x] Semantic HTML button element for like button
- [x] ARIA labels for like button ("Like tweet" / "Unlike tweet")
- [x] ARIA live region announces like count changes for screen readers
- [x] Keyboard navigation supported (tab to button, enter/space to toggle)
- [x] Color contrast meets WCAG AA standards (not relying on color alone)
- [x] Visual indicator beyond color (filled vs outline icon)

---

## Dependencies

**Prerequisites:**
- [x] Feature 001 (User Authentication System) - Required for authentication
- [x] Feature 002 (Tweet Posting and Feed System) - Required for tweets to like
- [x] profiles and tweets tables exist in database

**External Services:**
- [x] PostgreSQL database (Neon hosted)

**Blocking Issues:**
- None (authentication and tweets must be implemented first)

---

## Success Metrics

**How we'll measure success:**
- [ ] Users can like a tweet in under 1 second (including visual feedback)
- [ ] Like count updates appear instantly (< 100ms perceived latency via optimistic UI)
- [ ] 100% of duplicate like attempts rejected (database constraint enforcement)
- [ ] 0 instances of users liking tweets as other users (authorization enforcement)
- [ ] All acceptance criteria met for liking, unliking, and viewing counts
- [ ] Like state persists correctly across 100% of page reload scenarios

---

## Assumptions

1. **Public Like Counts:** All like counts are public and visible to all users (no privacy controls)
2. **No Like List:** Users cannot see who liked a tweet (only the count) in MVP
3. **Permanent Likes:** Like records never soft-deleted, only hard-deleted on unlike
4. **Optimistic UI:** Immediate visual feedback acceptable even if server request pending
5. **Cascade Delete:** Deleting a tweet or user account deletes associated likes (data integrity over preservation)
6. **No Rate Limiting:** No like frequency restrictions in MVP (can be added later if abuse detected)
7. **Binary State:** Each user either likes or doesn't like a tweet (no "super like" or reaction types)

---

## Appendix

### References
- Project Constitution: `/memory/constitution.md`
- Feature 001: User Authentication System (dependency)
- Feature 002: Tweet Posting and Feed System (dependency)
- README.md: Project overview and tech stack

### Change Log
| Date       | Change                     | Author        |
|------------|----------------------------|---------------|
| 2025-10-12 | Initial specification      | Claude Code   |
