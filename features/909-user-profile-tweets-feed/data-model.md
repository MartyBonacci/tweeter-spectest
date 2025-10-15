# Data Model: User Profile Tweets Feed

**Feature ID:** 909-user-profile-tweets-feed
**Created:** 2025-10-15
**Status:** Completed

---

## Overview

This feature uses **existing database schema only** - no migrations or schema changes required. All necessary tables, columns, indexes, and relationships already exist in the database.

---

## Database Schema

### No Changes Required ✅

This feature leverages three existing tables:

#### Table: `profiles`
```sql
-- EXISTING TABLE (no changes)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  username VARCHAR UNIQUE NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  bio VARCHAR(160),
  avatar_url VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- EXISTING INDEXES (no changes)
CREATE UNIQUE INDEX idx_profiles_username ON profiles(username);
CREATE UNIQUE INDEX idx_profiles_email ON profiles(email);
```

**Usage in Feature:**
- Query profiles by `username` (route parameter)
- Display profile data in ProfileHeader component
- Join with tweets to get author information

---

#### Table: `tweets`
```sql
-- EXISTING TABLE (no changes)
CREATE TABLE tweets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content VARCHAR(140) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- EXISTING INDEXES (no changes)
CREATE INDEX idx_tweets_profile_id ON tweets(profile_id);
CREATE INDEX idx_tweets_created_at ON tweets(created_at);
```

**Usage in Feature:**
- Filter tweets by `profile_id` (matches profile user)
- Order by `created_at DESC` (reverse chronological)
- Display tweet content and timestamps

**Performance:**
- Index on `profile_id` enables efficient filtering
- Index on `created_at` supports efficient ordering
- Combined index not needed (profile_id filter is selective enough)

---

#### Table: `likes`
```sql
-- EXISTING TABLE (no changes)
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  tweet_id UUID NOT NULL REFERENCES tweets(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tweet_id, profile_id)
);

-- EXISTING INDEXES (no changes)
CREATE INDEX idx_likes_tweet_id ON likes(tweet_id);
CREATE INDEX idx_likes_profile_id ON likes(profile_id);
CREATE UNIQUE INDEX idx_likes_unique_pair ON likes(tweet_id, profile_id);
```

**Usage in Feature:**
- Count likes for each tweet: `COUNT(likes.id)`
- Determine if current user liked tweet: `EXISTS(SELECT 1 FROM likes WHERE ...)`
- Enable like/unlike functionality in TweetCard component

---

## Query Pattern

### Primary Query: Fetch User Tweets with Like Data

**Purpose:** Retrieve all tweets by a specific user with like counts and current user's like status

**SQL:**
```sql
SELECT
  t.id,
  t.content,
  t.created_at,
  p.id AS author_id,
  p.username AS author_username,
  p.avatar_url AS author_avatar_url,
  COUNT(l.id) AS like_count,
  EXISTS(
    SELECT 1
    FROM likes
    WHERE tweet_id = t.id
      AND profile_id = $2
  ) AS is_liked_by_user
FROM tweets t
  INNER JOIN profiles p ON t.profile_id = p.id
  LEFT JOIN likes l ON t.id = l.tweet_id
WHERE p.username = $1
GROUP BY t.id, p.id, p.username, p.avatar_url
ORDER BY t.created_at DESC;
```

**Parameters:**
- `$1`: username (string) - profile user's username
- `$2`: currentUserId (UUID) - authenticated user's ID

**Returns:** Array of TweetWithAuthorAndLikes objects

**Index Usage:**
1. `idx_profiles_username` - Fast profile lookup by username
2. `idx_tweets_profile_id` - Efficient filtering of user's tweets
3. `idx_tweets_created_at` - Efficient ordering by recency
4. `idx_likes_tweet_id` - Fast like counting

**Performance Characteristics:**
- Single query (no N+1 problem)
- All indexes present
- GROUP BY required for aggregate (like count)
- EXISTS subquery efficient with indexes

**Expected Performance:**
- User with 10 tweets: < 50ms
- User with 100 tweets: < 200ms
- User with 1000 tweets: < 1s (candidate for pagination - P2)

---

## TypeScript Interfaces

### Application Layer (camelCase)

```typescript
/**
 * Core profile data (existing interface)
 */
interface Profile {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: Date;
}

/**
 * Basic tweet data (existing interface)
 */
interface Tweet {
  id: string;
  profileId: string;
  content: string;
  createdAt: Date;
}

/**
 * Like relationship (existing interface)
 */
interface Like {
  id: string;
  tweetId: string;
  profileId: string;
  createdAt: Date;
}

/**
 * Tweet with author and aggregated like data
 * (existing interface - reused for this feature)
 */
interface TweetWithAuthorAndLikes {
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

/**
 * Profile loader return type (extended for this feature)
 */
interface ProfileLoaderData {
  profile: Profile;
  tweets: TweetWithAuthorAndLikes[]; // NEW: added for this feature
}
```

---

## Zod Schemas

### Validation Schemas

```typescript
import { z } from 'zod';

/**
 * Username parameter validation
 * (used in loader to validate route param)
 */
const usernameParamSchema = z.object({
  username: z
    .string()
    .min(1, 'Username required')
    .max(50, 'Username too long')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username must be alphanumeric with underscores'),
});

/**
 * Tweet with author and likes schema
 * (validates API response from GET /api/tweets/user/:username)
 */
const tweetWithAuthorAndLikesSchema = z.object({
  id: z.string().uuid(),
  content: z.string().min(1).max(140),
  createdAt: z.coerce.date(),
  author: z.object({
    id: z.string().uuid(),
    username: z.string(),
    avatarUrl: z.string().url().nullable().optional(),
  }),
  likeCount: z.number().int().min(0),
  isLikedByUser: z.boolean(),
});

/**
 * Array of tweets response schema
 * (validates GET /api/tweets/user/:username response)
 */
const getUserTweetsResponseSchema = z.array(tweetWithAuthorAndLikesSchema);

/**
 * Profile loader data schema
 * (validates complete loader response)
 */
const profileLoaderDataSchema = z.object({
  profile: profileSchema, // Existing profile schema
  tweets: getUserTweetsResponseSchema, // NEW: tweets array validation
});
```

---

## Data Flow

### 1. Route Navigation
```
User clicks profile link → /profile/:username
```

### 2. Loader Execution
```typescript
export async function profileLoader({ params }: LoaderFunctionArgs) {
  // Validate username parameter
  const { username } = usernameParamSchema.parse(params);

  // Fetch profile data (existing)
  const profile = await fetchProfileByUsername(username);

  if (!profile) {
    throw new Response('Profile not found', { status: 404 });
  }

  // Fetch user's tweets (NEW)
  const tweets = await fetchTweetsByUsername(username, currentUserId);

  // Validate response with Zod
  const validated = profileLoaderDataSchema.parse({ profile, tweets });

  return validated;
}
```

### 3. Database Query
```
postgres package executes parameterized query
  ↓
Snake_case → camelCase transformation (automatic)
  ↓
Returns TweetWithAuthorAndLikes[]
```

### 4. Component Rendering
```typescript
export function Profile() {
  const { profile, tweets } = useLoaderData<typeof profileLoader>();

  return (
    <div>
      <ProfileHeader profile={profile} />

      {tweets.length === 0 ? (
        <EmptyState />
      ) : (
        <TweetsList>
          {tweets.map(tweet => (
            <TweetCard key={tweet.id} tweet={tweet} />
          ))}
        </TweetsList>
      )}
    </div>
  );
}
```

---

## Edge Cases

### Case 1: User with No Tweets

**Database Result:**
```sql
-- Query returns empty array
[]
```

**Application Behavior:**
- Loader returns `{ profile, tweets: [] }`
- Component renders empty state message
- No errors thrown

---

### Case 2: User with Thousands of Tweets

**Database Result:**
```sql
-- Query returns all tweets (potentially slow)
[{ id: 1, ... }, { id: 2, ... }, ... { id: 5000, ... }]
```

**Application Behavior:**
- Current: All tweets loaded and rendered
- Performance concern: Query may exceed 1s threshold
- Future (P2): Implement pagination to load 20 tweets at a time

**Mitigation (Current):**
- Database indexes keep query fast for most users (< 100 tweets)
- Monitor query performance logs
- Implement pagination if threshold exceeded

---

### Case 3: User Deletes Tweet

**Database Result:**
```sql
-- ON DELETE CASCADE removes tweet and associated likes
DELETE FROM tweets WHERE id = '...';
-- CASCADE automatically deletes from likes table
```

**Application Behavior:**
- Loader refetches on navigation
- Tweet removed from list
- Like count updated automatically (JOIN with likes)
- No orphaned data

---

### Case 4: Non-Existent Profile

**Database Result:**
```sql
-- Profile query returns null
SELECT * FROM profiles WHERE username = 'nonexistent'; -- NULL
```

**Application Behavior:**
```typescript
if (!profile) {
  throw new Response('Profile not found', { status: 404 });
}
// React Router displays 404 error boundary
```

---

## Case Mapping Reference

### Database (snake_case) ↔ Application (camelCase)

| Database Column | TypeScript Property | Example Value |
|-----------------|---------------------|---------------|
| `id` | `id` | `"550e8400-e29b-41d4-a716-446655440000"` |
| `profile_id` | `profileId` | `"550e8400-e29b-41d4-a716-446655440001"` |
| `created_at` | `createdAt` | `new Date("2025-10-15T10:30:00Z")` |
| `avatar_url` | `avatarUrl` | `"https://cloudinary.com/..."` |
| `password_hash` | `passwordHash` | `"$argon2id$v=19$m=19456..."` |
| `like_count` | `likeCount` | `42` |
| `is_liked_by_user` | `isLikedByUser` | `true` |

**Automatic Transformation:** The `postgres` npm package handles all case conversion transparently.

---

## Security Considerations

### Input Validation

**Username Parameter:**
```typescript
// Zod schema prevents injection
const usernameParamSchema = z.object({
  username: z.string().regex(/^[a-zA-Z0-9_]+$/),
});

// Parameterized query prevents SQL injection
const tweets = await sql`
  SELECT ... WHERE p.username = ${username}
`;
```

### Data Exposure

**Public Data Only:**
- ✅ username (public)
- ✅ avatarUrl (public)
- ✅ tweet content (public)
- ✅ like count (public)
- ❌ email (NOT returned in query)
- ❌ passwordHash (NOT returned in query)

**Authorization:**
- All users can view any profile (within authenticated context)
- Delete tweet: Requires current user = tweet author (existing middleware)
- Like tweet: Requires authentication (existing middleware)

---

## Performance Optimization

### Current Optimizations

1. **Single Query:** One database round-trip for all data
2. **Efficient Indexes:** All filter/sort columns indexed
3. **Parameterized Queries:** Prepared statement caching
4. **Case Conversion:** Zero-overhead transformation by postgres package

### Future Optimizations (P2)

1. **Pagination:**
   - Cursor-based pagination using tweet ID + created_at
   - Load 20 tweets per page
   - Infinite scroll or "Load More" button

2. **Query Optimization:**
   - Consider materialized view for like counts (if needed)
   - Add composite index on (profile_id, created_at) if pagination implemented

---

## Migration Status

**No migrations required** ✅

All database tables, columns, indexes, and constraints already exist from previous features:
- Feature 001: Authentication system (profiles table)
- Feature 002: Tweet posting (tweets table)
- Feature 003: Like system (likes table)

---

## Appendix: Sample Data

### Example Query Result (JSON)

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "content": "Just deployed my new feature! 🚀",
    "createdAt": "2025-10-15T14:30:00Z",
    "author": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "username": "johndoe",
      "avatarUrl": "https://res.cloudinary.com/..."
    },
    "likeCount": 5,
    "isLikedByUser": true
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "content": "Learning React Router v7 - loving the loader pattern!",
    "createdAt": "2025-10-14T09:15:00Z",
    "author": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "username": "johndoe",
      "avatarUrl": "https://res.cloudinary.com/..."
    },
    "likeCount": 12,
    "isLikedByUser": false
  }
]
```

---

## Validation Checklist

- [x] No schema changes required
- [x] All tables exist in database
- [x] All indexes present for efficient queries
- [x] Query pattern documented with parameters
- [x] TypeScript interfaces defined
- [x] Zod schemas created for validation
- [x] Case mapping documented (snake_case ↔ camelCase)
- [x] Security considerations addressed
- [x] Performance characteristics analyzed
- [x] Edge cases identified and handled

**Status:** Data model complete - ready for implementation planning
