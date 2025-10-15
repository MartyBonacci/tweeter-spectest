# Feature Specification: Tweet Posting and Feed System

**Feature ID:** 002-tweet-posting-and-feed-system
**Created:** 2025-10-12
**Status:** draft
**Priority:** critical

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
This core content feature implements the primary user-facing functionality of Tweeter and must adhere to all constitutional principles. Tweet creation and retrieval logic will use pure functions (Principle 1). All tweet data and character limits will have strict type definitions and runtime validation (Principle 2). Feed and tweet detail pages will be defined programmatically in the routing configuration (Principle 3). Tweet content will be validated and sanitized, with authentication required for posting (Principle 4). Feed UI will use functional components with data fetching through loaders (Principle 5).

---

## Summary

**What:** A tweet posting and feed viewing system enabling users to create short messages and view a chronological stream of all tweets.

**Why:** Users need to express themselves through short messages and discover content from other users, which is the core value proposition of the platform.

**Who:** Authenticated Tweeter users (for posting) and all users (for viewing the feed).

---

## User Stories

### Primary User Story: Post a Tweet
```
As an authenticated Tweeter user
I want to post a tweet with up to 140 characters
So that I can share my thoughts with other users
```

**Acceptance Criteria:**
- [ ] User can type text into a tweet composition field
- [ ] Character counter shows remaining characters (140 minus current length)
- [ ] Submit button disabled when tweet exceeds 140 characters or is empty
- [ ] System validates tweet length before submission
- [ ] Upon successful posting, tweet appears at top of feed immediately
- [ ] Clear error message shown if posting fails

### Primary User Story: View Tweet Feed
```
As a Tweeter user (authenticated or not)
I want to view a feed of all tweets sorted by newest first
So that I can see the latest content from all users
```

**Acceptance Criteria:**
- [ ] Feed displays all tweets in reverse chronological order (newest first)
- [ ] Each tweet shows: content, author username, and timestamp
- [ ] Feed loads without requiring authentication
- [ ] Feed updates to show new tweets after posting
- [ ] Empty state shown when no tweets exist

### Secondary User Story: View Individual Tweet
```
As a Tweeter user
I want to view a single tweet on its own page
So that I can share a direct link to specific content
```

**Acceptance Criteria:**
- [ ] User can navigate to individual tweet page via link/click
- [ ] Tweet detail page shows: content, author username, and timestamp
- [ ] Page accessible via unique URL (shareable)
- [ ] 404 error shown for non-existent tweet IDs

---

## Functional Requirements

### Must Have (P0)

1. **Tweet Composition**
   - Authenticated users can compose tweets
   - Text input field accepts up to 140 characters
   - Real-time character counter displays remaining characters
   - Submit button disabled when input is empty or exceeds limit
   - Client-side validation prevents over-length submissions
   - Success: Tweet saved to database and appears in feed

2. **Tweet Creation Validation**
   - Content validated on client (before submission) for UX
   - Content validated on server (security enforcement)
   - Minimum length: 1 character (no empty tweets)
   - Maximum length: 140 characters (strict enforcement)
   - Whitespace-only tweets rejected
   - Success: Valid tweets saved, invalid tweets rejected with clear errors

3. **Tweet Feed Display**
   - All tweets displayed in single chronological feed
   - Sorted by creation time (newest first)
   - Each tweet displays: content text, author username, relative timestamp
   - Feed accessible without authentication (public viewing)
   - Success: Users see complete, ordered list of tweets

4. **Tweet Detail Page**
   - Individual tweet accessible via unique URL
   - Displays same information as feed entry (content, author, timestamp)
   - URL format: `/tweets/:id` where :id is tweet UUID
   - 404 error for invalid or non-existent tweet IDs
   - Success: Users can link directly to specific tweets

5. **Author Attribution**
   - Each tweet associated with author's user profile
   - Author username displayed prominently with tweet
   - Username links to author's profile (future feature integration)
   - Success: Clear ownership of all content

6. **Authentication Requirements**
   - Posting tweets requires authentication
   - Unauthenticated users redirected to signin when attempting to post
   - Viewing feed and individual tweets does not require authentication
   - Success: Protected content creation, public content consumption

### Should Have (P1)

1. **Timestamp Display**
   - Relative timestamps for recent tweets ("2 minutes ago", "1 hour ago")
   - Absolute timestamps for older tweets (date format)
   - Hover tooltip shows exact timestamp

2. **Tweet Composition UX**
   - Auto-focus on tweet input field when page loads
   - Clear button to reset tweet composition
   - Visual feedback during submission (loading state)

### Could Have (P2)

1. **Pagination**
   - Load tweets in batches (e.g., 50 at a time)
   - "Load more" button for additional tweets
   - Improved performance for large tweet volumes

2. **Tweet Draft Autosave**
   - Save partial tweets to local storage
   - Restore draft on page reload
   - Clear draft after successful posting

### Won't Have (Out of Scope)

1. Tweet editing (immutable after posting)
2. Tweet deletion
3. Tweet replies/threading
4. Tweet likes (separate feature)
5. Media attachments (images, videos)
6. Hashtags or mentions
7. User-specific tweet feeds (separate feature)
8. Tweet search
9. Tweet analytics (view counts, engagement metrics)

---

## Technical Requirements

### Type Safety Requirements
- [x] TypeScript interfaces defined for Tweet data structure
- [x] Zod schemas created for:
  - [x] Tweet creation request validation (content length)
  - [x] Tweet response validation (id, content, author, timestamp)
  - [x] Form input validation (real-time character count)

### Security Requirements
- [x] Authentication method: Session-based (JWT cookies from feature 001)
- [x] Authorization rules: Only authenticated users can create tweets, all users can view tweets
- [x] Input sanitization: Tweet content sanitized before storage and display
- [x] Data protection: No sensitive data in tweets, user IDs associated via foreign key

### Data Requirements
- [x] Database schema changes documented: tweets table created
- [x] Migration strategy defined: Migration creates tweets table with foreign key to profiles
- [x] Data validation rules specified: content 1-140 characters, whitespace-only rejected
- [x] snake_case ↔ camelCase mapping identified: profile_id ↔ profileId, created_at ↔ createdAt

### Routing Requirements
- [x] Routes added to `app/routes.ts`: /feed, /tweets/:id
- [x] Loader functions defined: Load all tweets for feed, load single tweet by ID
- [x] Action functions defined: Create tweet action
- [x] No file-based routes created: All routes in centralized configuration

---

## User Interface

### Pages/Views

1. **Feed Page** (`/feed`)
   - Purpose: Display all tweets and provide tweet composition interface
   - Components: TweetComposer (if authenticated), TweetList, TweetCard components
   - Data: All tweets loaded via loader, sorted newest first

2. **Tweet Detail Page** (`/tweets/:id`)
   - Purpose: Display single tweet with shareable URL
   - Components: TweetCard (single tweet view)
   - Data: Single tweet loaded via loader using ID parameter

### Components

1. **TweetComposer** (functional component)
   - Props: None (uses form action)
   - State:
     - `content` (controlled input)
     - `remainingChars` (computed: 140 - content.length)
     - `isSubmitting` (loading state)
   - Behavior:
     - Real-time character count update
     - Disable submit when invalid (empty, over limit, submitting)
     - Submit via framework action
     - Clear input after successful submission

2. **TweetList** (functional component)
   - Props: `tweets: Tweet[]`
   - State: None (stateless presentation)
   - Behavior:
     - Maps tweet array to TweetCard components
     - Shows empty state if no tweets
     - Maintains chronological order from props

3. **TweetCard** (functional component)
   - Props: `tweet: Tweet` (id, content, author username, timestamp)
   - State: None (stateless presentation)
   - Behavior:
     - Displays tweet content (escaped HTML)
     - Shows author username (clickable link to profile)
     - Shows relative/absolute timestamp
     - Clickable area links to tweet detail page

### User Flows

#### Post Tweet Flow
```
1. User navigates to /feed (must be authenticated)
2. User sees tweet composer at top of feed
3. User types tweet content
4. Character counter updates in real-time
5. Submit button enables when 1-140 characters entered
6. User clicks submit
7. Action validates content (server-side)
8. If valid: Tweet created, feed reloaded with new tweet at top
9. If invalid: Error message displayed, user corrects and resubmits
10. Tweet composer clears after successful submission
```

#### View Feed Flow
```
1. User navigates to /feed (no authentication required)
2. Loader fetches all tweets from database
3. User sees tweets in reverse chronological order
4. User reads tweet content, sees authors and timestamps
5. User can click tweet to view detail page
```

#### View Tweet Detail Flow
```
1. User navigates to /tweets/:id (via link or direct URL)
2. Loader fetches single tweet by ID
3. If found: Tweet displayed with full details
4. If not found: 404 error page shown
5. User can share URL to specific tweet
```

---

## API Specification

### Endpoints

#### `POST /api/tweets`
**Purpose:** Create new tweet

**Authentication:** Required (must be authenticated)

**Request:**
```typescript
// TypeScript type
interface CreateTweetRequest {
  content: string;  // 1-140 characters, non-whitespace-only
}

// Zod schema (conceptual)
// Validates content length, rejects empty/whitespace-only
```

**Response:**
```typescript
// TypeScript type (success)
interface CreateTweetResponse {
  tweet: {
    id: string;           // UUID v7
    content: string;
    profileId: string;    // Author's user ID
    createdAt: string;    // ISO 8601 datetime
  }
}

// TypeScript type (error)
interface CreateTweetError {
  error: string;     // Error message
  field?: string;    // Optional field identifier
}
```

**Error Responses:**
- `400`: Validation error (empty content, exceeds 140 chars, whitespace-only)
- `401`: Authentication required (user not signed in)
- `500`: Server error

#### `GET /api/tweets`
**Purpose:** Retrieve all tweets for feed display

**Authentication:** Public (no authentication required)

**Request:** None (query parameters)

**Response:**
```typescript
// TypeScript type (success)
interface GetTweetsResponse {
  tweets: Array<{
    id: string;
    content: string;
    author: {
      id: string;
      username: string;
    };
    createdAt: string;  // ISO 8601 datetime
  }>
}
```

**Error Responses:**
- `500`: Server error

#### `GET /api/tweets/:id`
**Purpose:** Retrieve single tweet by ID

**Authentication:** Public

**Request:** None (ID in URL path)

**Response:**
```typescript
// TypeScript type (success)
interface GetTweetResponse {
  tweet: {
    id: string;
    content: string;
    author: {
      id: string;
      username: string;
    };
    createdAt: string;
  }
}

// TypeScript type (error)
interface GetTweetError {
  error: string;
}
```

**Error Responses:**
- `404`: Tweet not found (invalid ID)
- `500`: Server error

---

## Data Model

### Database Schema

#### Table: tweets
```sql
CREATE TABLE tweets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  profile_id UUID NOT NULL REFERENCES profiles(id),
  content VARCHAR(140) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- [x] Index on `created_at DESC` for efficient feed ordering (newest first queries)
- [x] Index on `profile_id` for future user-specific tweet queries
- [x] Primary key index on `id` (automatic) for single tweet lookups

**Constraints:**
- [x] `profile_id` FOREIGN KEY REFERENCES profiles(id) (ensures tweet has valid author)
- [x] `content` NOT NULL CHECK(LENGTH(TRIM(content)) >= 1 AND LENGTH(content) <= 140)
- [x] `content` CHECK constraint prevents whitespace-only tweets

**Relationships:**
- [x] `profile_id` → `profiles.id` (many-to-one: many tweets belong to one profile)

### TypeScript Interfaces
```typescript
// Application layer (camelCase)
interface Tweet {
  id: string;
  profileId: string;
  content: string;
  createdAt: Date;
}

// Tweet with author information (for feed display)
interface TweetWithAuthor {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
  };
  createdAt: Date;
}
```

---

## Security Analysis

### Threat Model

1. **XSS via Tweet Content**
   - **Threat:** Attacker posts tweet with malicious JavaScript to attack viewers
   - **Mitigation:** Content sanitized before storage, framework auto-escaping on display, no HTML rendering in tweets

2. **SQL Injection via Content**
   - **Threat:** Attacker crafts tweet content to manipulate database queries
   - **Mitigation:** Parameterized queries only, input validation prevents SQL syntax characters if needed

3. **Spam/Abuse**
   - **Threat:** Attacker posts excessive tweets to flood feed
   - **Mitigation:** Authentication required for posting (rate limiting future enhancement), character limit prevents long spam

4. **Tweet Content Injection**
   - **Threat:** Attacker attempts to exceed character limit via client manipulation
   - **Mitigation:** Server-side validation enforces 140-character limit regardless of client state

5. **Unauthorized Tweet Creation**
   - **Threat:** Unauthenticated user attempts to post tweets
   - **Mitigation:** Authentication middleware blocks unauthenticated POST requests to /api/tweets

### Input Validation
- [x] All tweet content validated with schema validation before processing
- [x] SQL injection prevented via parameterized queries
- [x] XSS prevented via content sanitization and framework auto-escaping

### Authentication & Authorization
- [x] POST /api/tweets requires valid session (from feature 001)
- [x] GET endpoints public (no authentication required)
- [x] Tweet author ID captured from authenticated session (no client-provided author ID)

---

## Testing Requirements

### Unit Tests
- [x] Tweet content validation function tested (valid/invalid lengths, whitespace-only)
- [x] Validation schemas tested with edge cases (empty, 140 chars, 141 chars, whitespace)
- [x] Timestamp formatting function tested (relative vs absolute)
- [x] Character counter logic tested

### Integration Tests
- [x] POST /api/tweets with valid content (authenticated user, success case)
- [x] POST /api/tweets with invalid content (too long, too short, whitespace-only)
- [x] POST /api/tweets without authentication (401 error)
- [x] GET /api/tweets returns all tweets in correct order
- [x] GET /api/tweets/:id with valid ID (success case)
- [x] GET /api/tweets/:id with invalid ID (404 error)

### End-to-End Tests
- [x] Complete tweet posting flow (compose → submit → appears in feed)
- [x] Character counter updates correctly as user types
- [x] Submit button disabled/enabled based on content validity
- [x] Feed displays tweets in correct order (newest first)
- [x] Tweet detail page loads for valid tweet ID
- [x] 404 error shown for invalid tweet ID
- [x] Unauthenticated user can view feed but cannot post

---

## Performance Considerations

- [x] Database index on `created_at DESC` optimizes feed query (newest first)
- [x] Database index on `profile_id` optimizes join with profiles table
- [x] Feed query uses single JOIN (tweets + profiles) to minimize round trips
- [x] Client-side validation reduces unnecessary server requests
- [x] Pagination can be added later for large datasets (not in P0)

---

## Accessibility

- [x] Semantic HTML elements used (textarea for composition, article for tweets)
- [x] ARIA labels for tweet composer ("Compose tweet", "Submit tweet")
- [x] Keyboard navigation supported (tab through feed, enter to submit)
- [x] Character counter accessible via aria-live for screen readers
- [x] Color contrast meets WCAG AA standards for all text

---

## Dependencies

**Prerequisites:**
- [x] Feature 001 (User Authentication System) - Required for authentication
- [x] profiles table exists in database
- [x] Authentication middleware available

**External Services:**
- [x] PostgreSQL database (Neon hosted)

**Blocking Issues:**
- None (authentication system must be implemented first)

---

## Success Metrics

**How we'll measure success:**
- [ ] Users can compose and post a tweet in under 30 seconds
- [ ] Feed loads all tweets in under 2 seconds (for reasonable dataset size)
- [ ] 100% of invalid tweets (over 140 chars, empty) rejected before reaching database
- [ ] 0 XSS vulnerabilities in tweet content display
- [ ] All acceptance criteria met for posting, feed viewing, and tweet detail flows
- [ ] Character counter provides real-time feedback with no delay

---

## Assumptions

1. **Public Feed:** All tweets are public and visible to all users (no privacy controls in MVP)
2. **No Edit/Delete:** Tweets are immutable once posted (industry standard for microblogging)
3. **Chronological Feed:** Simple newest-first ordering sufficient for MVP (algorithmic ranking future enhancement)
4. **Character Encoding:** 140 characters counted as Unicode characters (not bytes)
5. **Whitespace Handling:** Leading/trailing whitespace trimmed but internal whitespace preserved
6. **Performance Scale:** System expected to handle up to 10,000 tweets initially (pagination added when needed)
7. **Timestamp Format:** Relative timestamps for recent tweets improve readability vs absolute timestamps

---

## Appendix

### References
- Project Constitution: `/memory/constitution.md`
- Feature 001: User Authentication System (dependency)
- README.md: Project overview and tech stack

### Change Log
| Date       | Change                     | Author        |
|------------|----------------------------|---------------|
| 2025-10-12 | Initial specification      | Claude Code   |
