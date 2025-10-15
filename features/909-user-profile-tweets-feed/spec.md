# Feature Specification: User Profile Tweets Feed

**Feature ID:** 909-user-profile-tweets-feed
**Created:** 2025-10-15
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
- **Principle 1:** All data fetching and filtering logic will use pure functions
- **Principle 2:** Tweet query results and empty states will be validated with TypeScript interfaces and Zod schemas
- **Principle 3:** Profile route will use loader function for data fetching, no file-based routing
- **Principle 4:** Tweet access will respect authentication and authorization (users can view public profiles, but authentication is required for interactions)
- **Principle 5:** Will use React Router v7 loaders, modern React hooks, and functional components

---

## Summary

**What:** Display all tweets authored by a specific user on their profile page

**Why:** Users need to see what content a person has posted to understand their activity and interests

**Who:** All authenticated users viewing any profile (their own or others)

---

## User Stories

### Primary User Story
```
As an authenticated user
I want to see all tweets a user has posted on their profile page
So that I can review their content and activity history
```

**Acceptance Criteria:**
- [x] When viewing any user profile, I see a list of tweets they've authored
- [x] Tweets are displayed in reverse chronological order (newest first)
- [x] Each tweet uses the same card format as the main feed
- [x] If the user has no tweets, I see "No tweets yet" message
- [x] The page shows a loading state while fetching tweets
- [x] Tweet cards include all standard information (content, timestamp, like count, author)

### Secondary User Stories

#### Empty State Experience
```
As a user viewing a profile with no tweets
I want to see a clear message
So that I know the profile exists but has no content yet
```

**Acceptance Criteria:**
- [x] Empty state message is friendly and clear: "No tweets yet"
- [x] Empty state appears after loading completes (not during loading)
- [x] Empty state uses consistent styling with the rest of the application

#### Own Profile Experience
```
As a user viewing my own profile
I want to see my tweet history
So that I can review what I've posted
```

**Acceptance Criteria:**
- [x] My own tweets appear on my profile
- [x] Tweets I can delete show delete functionality (same as feed)
- [x] New tweets I post appear at the top after posting

---

## Functional Requirements

### Must Have (P0)

1. **Tweet List Display**
   - Display all tweets authored by the profile user
   - Show tweets in reverse chronological order (newest to oldest)
   - Use existing TweetCard component for consistent rendering
   - Include all tweet data: content, timestamp, author, like count, like status

2. **Empty State Handling**
   - Display "No tweets yet" when user has zero tweets
   - Show empty state only after data loads (not during loading)
   - Use clear, centered, muted text styling

3. **Loading State**
   - Show loading indicator while fetching tweet data
   - Prevent flash of empty state during loading
   - Use consistent loading pattern with rest of application

4. **Data Fetching**
   - Fetch tweets for the specific user via profile username
   - Query returns all tweets by that user
   - Include like count and current user's like status for each tweet

5. **Authorization**
   - Respect existing authentication requirements (authenticated users only)
   - Allow users to view any profile's tweets (public within authenticated context)
   - Maintain existing authorization for tweet actions (delete, like)

### Should Have (P1)

1. **Performance Optimization**
   - Reuse existing database queries where possible
   - Avoid N+1 query problems
   - Use appropriate database indexes

2. **Error Handling**
   - Show user-friendly error message if profile not found
   - Handle network errors gracefully
   - Provide retry mechanism for failed loads

### Could Have (P2)

1. **Pagination**
   - Load tweets in batches if user has many tweets
   - Implement infinite scroll or "Load More" button
   - Improve performance for prolific users

2. **Tweet Count Display**
   - Show total tweet count on profile header
   - Update count when user posts new tweet

### Won't Have (Out of Scope)

1. **Filtering tweets by date or keyword** - This is a future enhancement
2. **Pinned tweets** - This would require database schema changes
3. **Retweet functionality** - Not in current data model
4. **Draft tweets** - Tweets are immediately published only

---

## Technical Requirements

### Type Safety Requirements
- [x] TypeScript interfaces defined for all data structures
- [x] Zod schemas created for:
  - [x] API response validation (tweets array with author and like data)
  - [x] Profile parameter validation (username)

### Security Requirements
- [x] Authentication method: JWT (existing)
- [x] Authorization rules: Authenticated users can view any profile's tweets
- [x] Input sanitization: Username parameter validated
- [x] Data protection: No sensitive data exposed in tweet queries

### Data Requirements
- [x] No database schema changes required (uses existing tweets table)
- [x] Migration strategy: N/A (no schema changes)
- [x] Data validation rules: Validate username parameter exists
- [x] snake_case ↔ camelCase mapping: Use existing postgres package mapping

### Routing Requirements
- [x] Profile route already exists in `app/routes.ts` (`/profile/:username`)
- [x] Extend existing loader function to include user tweets
- [x] No new routes needed
- [x] No file-based routes created

---

## User Interface

### Pages/Views

1. **Profile Page** (`/profile/:username`)
   - Purpose: Display user profile information and their tweet history
   - Components: ProfileHeader (existing), TweetCard (existing, multiple instances), EmptyState (new/styled div), LoadingSpinner (existing pattern)
   - Data: User profile data + array of user's tweets (via loader)

### Components

1. **TweetCard** (existing functional component - reused)
   - Props: Tweet data with author and like information
   - State: Like button state (managed within card)
   - Behavior: Display tweet, handle like/unlike, handle delete (if authorized)

2. **Profile Tweets Section** (new section in Profile component)
   - Props: tweets array, loading state
   - State: None (data from loader)
   - Behavior: Render list of TweetCards or empty state

### User Flows

```
Primary Flow: Viewing User Tweets
1. User navigates to /profile/:username
2. Loader fetches profile data and user's tweets
3. Page displays loading state
4. Profile renders with user info at top
5. Below profile info, tweets render in reverse chronological order
6. Each tweet shows in TweetCard format
7. User can interact with tweets (like, delete if authorized)

Empty State Flow:
1. User navigates to profile of user with no tweets
2. Loader returns empty tweets array
3. Page displays "No tweets yet" message
4. Message appears centered in tweets section

Own Profile Flow:
1. User navigates to their own profile (/profile/:username where username matches their own)
2. Sees their complete tweet history
3. Can delete their own tweets via TweetCard delete button
4. After posting new tweet (from composer elsewhere), new tweet appears at top
```

---

## API Specification

### Endpoints

#### `GET /api/tweets/user/:username`

**Purpose:** Fetch all tweets authored by a specific user

**Authentication:** Required (JWT)

**Request:**
- Path parameter: `username` (string)
- No request body

**Response:**
```typescript
// TypeScript type
interface TweetWithAuthorAndLikes {
  id: string;
  content: string;
  createdAt: Date;
  author: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  likeCount: number;
  isLikedByUser: boolean;
}

// Response type
type GetUserTweetsResponse = TweetWithAuthorAndLikes[];

// Zod schema
const tweetWithAuthorAndLikesSchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
  createdAt: z.coerce.date(),
  author: z.object({
    id: z.string().uuid(),
    username: z.string(),
    avatarUrl: z.string().url().optional(),
  }),
  likeCount: z.number().int().min(0),
  isLikedByUser: z.boolean(),
});

const getUserTweetsResponseSchema = z.array(tweetWithAuthorAndLikesSchema);
```

**Error Responses:**
- `401`: User not authenticated
- `404`: Profile user not found
- `500`: Server error fetching tweets

**Notes:**
- Endpoint already exists in API (from CLAUDE.md: `GET /api/tweets/user/:username`)
- Response includes author data even though all tweets are by same user (maintains consistency with feed)
- `isLikedByUser` calculated for the authenticated user making request

---

## Data Model

### Database Schema

**No schema changes required.** This feature uses existing tables:

#### Existing Table: tweets
```sql
-- Already exists
id UUID PRIMARY KEY
profile_id UUID REFERENCES profiles(id)
content VARCHAR(140)
created_at TIMESTAMPTZ
```

#### Existing Table: likes
```sql
-- Already exists
id UUID PRIMARY KEY
tweet_id UUID REFERENCES tweets(id)
profile_id UUID REFERENCES profiles(id)
created_at TIMESTAMPTZ
UNIQUE(tweet_id, profile_id)
```

#### Existing Table: profiles
```sql
-- Already exists
id UUID PRIMARY KEY
username VARCHAR UNIQUE
email VARCHAR UNIQUE
password_hash VARCHAR
bio VARCHAR(160)
avatar_url VARCHAR
created_at TIMESTAMPTZ
```

**Query Pattern:**
```sql
-- Fetch user tweets with like data for current user
SELECT
  t.id,
  t.content,
  t.created_at,
  p.id as author_id,
  p.username,
  p.avatar_url,
  COUNT(l.id) as like_count,
  EXISTS(SELECT 1 FROM likes WHERE tweet_id = t.id AND profile_id = :current_user_id) as is_liked_by_user
FROM tweets t
JOIN profiles p ON t.profile_id = p.id
LEFT JOIN likes l ON t.id = l.tweet_id
WHERE p.username = :username
GROUP BY t.id, p.id
ORDER BY t.created_at DESC
```

**Indexes:**
- Existing index on `tweets.profile_id` (for efficient filtering by user)
- Existing index on `profiles.username` (for username lookup)
- Existing index on `likes.tweet_id` (for counting likes)

### TypeScript Interfaces

```typescript
// Application layer (camelCase)
interface Tweet {
  id: string;
  profileId: string;
  content: string;
  createdAt: Date;
}

interface Profile {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  bio?: string;
  avatarUrl?: string;
  createdAt: Date;
}

interface TweetWithAuthorAndLikes {
  id: string;
  content: string;
  createdAt: Date;
  author: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  likeCount: number;
  isLikedByUser: boolean;
}
```

---

## Security Analysis

### Threat Model

1. **Unauthorized Profile Access**
   - **Description:** Unauthenticated users attempting to view profiles
   - **Mitigation:** Existing authentication middleware protects all routes; JWT validation required

2. **Username Injection**
   - **Description:** Malicious username parameters to trigger SQL injection
   - **Mitigation:** Parameterized queries via postgres package; username validated against existing profile

3. **Data Leakage**
   - **Description:** Exposing private user data in tweet queries
   - **Mitigation:** Only public profile fields (username, avatar) returned; no email or password data

### Input Validation
- [x] Username parameter validated with Zod before processing
- [x] SQL injection prevented via parameterized queries (postgres package)
- [x] XSS prevented via React's built-in escaping

### Authentication & Authorization
- [x] JWT tokens in httpOnly cookies (existing)
- [x] Profile route protected by authentication middleware
- [x] Tweet actions (like, delete) use existing authorization checks

---

## Testing Requirements

### Unit Tests

- [x] Test tweet fetching function with valid username
- [x] Test tweet fetching function with non-existent username
- [x] Test empty array returned for user with no tweets
- [x] Test tweet ordering (newest first)
- [x] Test like count calculation
- [x] Test isLikedByUser flag for different users

### Integration Tests

- [x] Test GET /api/tweets/user/:username endpoint
- [x] Test authentication requirement
- [x] Test response format matches schema
- [x] Test with user who has tweets
- [x] Test with user who has no tweets
- [x] Test like data accuracy

### Component Tests

- [x] Test Profile component renders loading state
- [x] Test Profile component renders tweets list
- [x] Test Profile component renders empty state
- [x] Test TweetCard renders correctly in profile context
- [x] Test tweet ordering in UI

---

## Performance Considerations

- [x] Database query uses existing indexes (profile_id, username)
- [x] Single query fetches all tweet data (no N+1 problem)
- [x] Loader pattern prevents waterfall requests
- [x] TweetCard component already optimized (reused)
- [x] Consider pagination for P2 if users have hundreds of tweets

---

## Accessibility

- [x] Semantic HTML: Use `<article>` for tweets, `<section>` for tweets list
- [x] ARIA labels: "User's tweets" heading for tweets section
- [x] Keyboard navigation: All tweet interactions keyboard accessible (existing TweetCard)
- [x] Color contrast: Follows existing design system (WCAG compliant)
- [x] Screen reader: "No tweets yet" announced properly, loading state announced

---

## Dependencies

**Prerequisites:**
- [x] Existing profile route (`/profile/:username`)
- [x] Existing TweetCard component
- [x] Existing API endpoint (`GET /api/tweets/user/:username`)
- [x] Existing authentication system

**External Services:**
- [x] PostgreSQL database (Neon)
- [x] Cloudinary (for avatar images, already integrated)

**Blocking Issues:**
- None - all prerequisites exist

---

## Open Questions

None - all requirements are clear from feature description and existing codebase patterns.

---

## Success Metrics

**How we'll measure success:**
- [x] Users can view any profile and see that user's tweets in under 2 seconds
- [x] Empty state displays correctly for users with no tweets
- [x] Existing TweetCard component reused (no code duplication)
- [x] Zero security vulnerabilities introduced
- [x] All acceptance criteria met
- [x] 95%+ test coverage for new loader logic

---

## Appendix

### References
- CLAUDE.md: Project architecture and existing API endpoints
- Existing `/profile/:username` route implementation
- Existing TweetCard component
- Existing `GET /api/tweets/user/:username` API endpoint

### Change Log
| Date | Change | Author |
|------|--------|--------|
| 2025-10-15 | Initial specification | Claude & SpecSwarm |
