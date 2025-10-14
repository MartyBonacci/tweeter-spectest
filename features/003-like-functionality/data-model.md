# Data Model: Tweet Like Functionality

**Feature ID:** 003-like-functionality
**Created:** 2025-10-12
**Version:** 1.0.0

---

## Overview

This document defines the data model for the like functionality, including the likes table schema, relationships with existing tables (tweets, profiles), constraints, and TypeScript type definitions.

---

## Database Schema

### Table: likes

**Purpose:** Store user engagement data - which users have liked which tweets

**Schema Definition:**

```sql
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  tweet_id UUID NOT NULL REFERENCES tweets(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tweet_id, profile_id)
);

-- Indexes for performance
CREATE UNIQUE INDEX idx_likes_tweet_profile ON likes(tweet_id, profile_id);
CREATE INDEX idx_likes_tweet_id ON likes(tweet_id);
CREATE INDEX idx_likes_profile_id ON likes(profile_id);
```

**Column Descriptions:**

| Column     | Type        | Constraints                                    | Description                                |
|------------|-------------|------------------------------------------------|--------------------------------------------|
| id         | UUID        | PRIMARY KEY                                    | Unique identifier (UUID v7, time-sortable) |
| tweet_id   | UUID        | NOT NULL, FK REFERENCES tweets(id) ON DELETE CASCADE | Tweet being liked                          |
| profile_id | UUID        | NOT NULL, FK REFERENCES profiles(id) ON DELETE CASCADE | User who liked the tweet                   |
| created_at | TIMESTAMPTZ | DEFAULT NOW()                                  | When the like was created                  |

**Constraints:**

- **Primary Key:** `id` (UUID v7)
- **Foreign Keys:**
  - `tweet_id → tweets(id)` ON DELETE CASCADE - Like deleted when tweet deleted
  - `profile_id → profiles(id)` ON DELETE CASCADE - Like deleted when user deleted
- **Unique Constraint:**
  - `UNIQUE(tweet_id, profile_id)` - Prevents duplicate likes (one like per user per tweet)

**Indexes:**

- `idx_likes_tweet_profile` (UNIQUE, composite) - Enforces uniqueness, optimizes duplicate detection
- `idx_likes_tweet_id` - Fast like count aggregation per tweet (COUNT queries)
- `idx_likes_profile_id` - Fast queries for user's likes (future: "my likes" feature)

**Relationships:**

- **Many-to-One with tweets:** Each like belongs to one tweet, each tweet can have many likes
- **Many-to-One with profiles:** Each like belongs to one user, each user can create many likes
- **Cascade Delete:** Deleting a tweet or user account automatically deletes associated likes

---

## TypeScript Type Definitions

### Application Types (camelCase)

```typescript
/**
 * Like record (internal use)
 */
interface Like {
  id: string;              // UUID v7
  tweetId: string;         // UUID v7 of tweet
  profileId: string;       // UUID v7 of user who liked
  createdAt: Date;         // When like was created
}

/**
 * Tweet with like metadata (for UI display)
 * Extends basic Tweet type with like information
 */
interface TweetWithLikes {
  id: string;
  content: string;
  profileId: string;       // Tweet author
  createdAt: Date;
  // Like metadata:
  likeCount: number;       // Total likes from all users
  isLikedByUser: boolean;  // Current user's like status
}

/**
 * Database query result type
 * Mirrors database schema (snake_case)
 */
interface LikeRow {
  id: string;
  tweet_id: string;
  profile_id: string;
  created_at: Date;
}

/**
 * Aggregate query result for like counts
 */
interface LikeCountResult {
  tweet_id: string;
  like_count: number;      // COUNT(*) aggregation
}
```

### Case Mapping Helper

```typescript
/**
 * Convert database row (snake_case) to application type (camelCase)
 */
function mapLikeRowToLike(row: LikeRow): Like {
  return {
    id: row.id,
    tweetId: row.tweet_id,
    profileId: row.profile_id,
    createdAt: row.created_at
  };
}
```

---

## Validation Rules

### Tweet ID Validation

**Format:** UUID v7

**Rules:**
- Must be valid UUID format
- Must reference existing tweet in tweets table
- Foreign key constraint enforces referential integrity

**Zod Schema:**
```typescript
import { z } from 'zod';

const tweetIdSchema = z.string().uuid('Invalid tweet ID format');
```

### Profile ID Validation

**Format:** UUID v7

**Rules:**
- Captured from authenticated session (not client-provided)
- Must reference existing profile in profiles table
- Foreign key constraint enforces referential integrity

**Security Note:** Profile ID NEVER accepted from client input - always extracted from JWT session

### Uniqueness Validation

**Format:** Composite (tweet_id, profile_id)

**Rules:**
- Each user can like a tweet only once
- Database enforces uniqueness at constraint level
- Duplicate attempts return 409 Conflict error

---

## State Transitions

### Like Lifecycle States

```
[No Like] ──like action──> [Active Like] ──unlike action──> [No Like]
```

**State Definitions:**

1. **No Like:** User has not liked the tweet (no record in likes table)
2. **Active Like:** User has liked the tweet (record exists in likes table)

**Transitions:**

- **Like Action:** Creates like record, increments tweet's like count
- **Unlike Action:** Deletes like record, decrements tweet's like count

**Idempotency:**
- Like action when already liked: Returns 409 Conflict (idempotent)
- Unlike action when not liked: Returns 404 Not Found (idempotent)

---

## Query Patterns

### Common Queries

**1. Create Like (User Likes Tweet):**
```sql
INSERT INTO likes (id, tweet_id, profile_id, created_at)
VALUES ($1, $2, $3, NOW())
RETURNING id, tweet_id, profile_id, created_at;
```

**2. Delete Like (User Unlikes Tweet):**
```sql
-- Option A: Delete by like ID
DELETE FROM likes
WHERE id = $1 AND profile_id = $2
RETURNING id;

-- Option B: Delete by tweet ID + profile ID (simpler for client)
DELETE FROM likes
WHERE tweet_id = $1 AND profile_id = $2
RETURNING id;
```

**3. Count Likes for Tweet:**
```sql
SELECT COUNT(*) AS like_count
FROM likes
WHERE tweet_id = $1;
```

**4. Check if User Liked Tweet:**
```sql
SELECT EXISTS(
  SELECT 1 FROM likes
  WHERE tweet_id = $1 AND profile_id = $2
) AS is_liked_by_user;
```

**5. Get Tweets with Like Data (for Feed):**
```sql
SELECT
  t.id,
  t.content,
  t.profile_id,
  t.created_at,
  COUNT(l.id) AS like_count,
  EXISTS(
    SELECT 1 FROM likes
    WHERE tweet_id = t.id AND profile_id = $1
  ) AS is_liked_by_user
FROM tweets t
LEFT JOIN likes l ON t.id = l.tweet_id
WHERE t.id IN ($2, $3, $4, ...)  -- Feed tweet IDs
GROUP BY t.id
ORDER BY t.created_at DESC;
```

### Performance Notes

- Unique composite index on (tweet_id, profile_id) makes duplicate detection O(log n)
- Index on tweet_id makes like count aggregation efficient
- LEFT JOIN pattern efficiently computes like counts and user status in single query
- CASCADE DELETE ensures no orphaned likes when tweets/users deleted

---

## Migration Scripts

### Migration: 003_create_likes_table.sql

```sql
-- Create likes table
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  tweet_id UUID NOT NULL REFERENCES tweets(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tweet_id, profile_id)
);

-- Create indexes
CREATE UNIQUE INDEX idx_likes_tweet_profile ON likes(tweet_id, profile_id);
CREATE INDEX idx_likes_tweet_id ON likes(tweet_id);
CREATE INDEX idx_likes_profile_id ON likes(profile_id);

-- Add comments for documentation
COMMENT ON TABLE likes IS 'User engagement data - which users liked which tweets';
COMMENT ON COLUMN likes.id IS 'UUID v7 primary key (time-sortable)';
COMMENT ON COLUMN likes.tweet_id IS 'Tweet being liked (FK to tweets.id, cascade delete)';
COMMENT ON COLUMN likes.profile_id IS 'User who liked the tweet (FK to profiles.id, cascade delete)';
COMMENT ON COLUMN likes.created_at IS 'When the like was created';
COMMENT ON CONSTRAINT likes_tweet_id_profile_id_key ON likes IS 'Ensures one like per user per tweet';
```

### Rollback Migration: 003_down.sql

```sql
-- Drop indexes first
DROP INDEX IF EXISTS idx_likes_profile_id;
DROP INDEX IF EXISTS idx_likes_tweet_id;
DROP INDEX IF EXISTS idx_likes_tweet_profile;

-- Drop table (cascade not needed as no tables reference likes)
DROP TABLE IF EXISTS likes;
```

---

## Data Integrity Rules

1. **Referential Integrity:**
   - tweet_id must reference existing tweet (enforced by FK constraint)
   - profile_id must reference existing user (enforced by FK constraint)
   - CASCADE DELETE ensures likes deleted when tweets or users deleted

2. **Uniqueness:**
   - Each (tweet_id, profile_id) pair must be unique
   - Prevents duplicate likes from same user
   - Enforced at database level via UNIQUE constraint

3. **Immutability:**
   - `id`: Never changes (UUID v7)
   - `tweet_id`: Never changes (immutable association)
   - `profile_id`: Never changes (immutable association)
   - `created_at`: Set once, never updated

4. **Nullability:**
   - Required: `id`, `tweet_id`, `profile_id`, `created_at`
   - No optional columns in this table

5. **Cascade Behavior:**
   - Delete tweet → Delete all likes on that tweet
   - Delete user → Delete all likes by that user
   - No soft deletes (likes are hard-deleted on unlike action)

---

## Security Considerations

1. **Authorization:**
   - Profile ID captured from authenticated session (never from client)
   - Users can only create likes for themselves
   - Users can only delete their own likes
   - No way to like as another user

2. **Input Validation:**
   - Tweet ID validated as UUID format before database query
   - Parameterized queries prevent SQL injection
   - Zod schemas validate all like-related requests

3. **Rate Limiting (Future):**
   - No rate limiting in MVP
   - Could add: Max N likes per user per minute (prevent abuse)

4. **Data Exposure:**
   - Like counts are public (visible to all users)
   - Individual likes are public (who liked what)
   - No privacy controls in MVP

---

## Performance Optimization

### Index Strategy

1. **idx_likes_tweet_profile (UNIQUE):**
   - Primary purpose: Enforce uniqueness constraint
   - Secondary benefit: Fast duplicate detection on INSERT
   - Used by: Like creation, duplicate check

2. **idx_likes_tweet_id:**
   - Primary purpose: Fast like count aggregation
   - Used by: COUNT(*) queries, feed queries with GROUP BY
   - Covers: `SELECT COUNT(*) FROM likes WHERE tweet_id = ?`

3. **idx_likes_profile_id:**
   - Primary purpose: Future "my likes" feature
   - Secondary benefit: Fast cascade delete on user deletion
   - Used by: Future user profile queries

### Query Optimization

- Use LEFT JOIN pattern for tweets + likes in single query
- GROUP BY on tweets avoids N+1 queries
- EXISTS subquery for user's like status (more efficient than COUNT)
- Avoid correlated subqueries where possible

---

## Future Extensions

**Version 2.0 (Like Timestamps for Analytics):**
- Add analytics queries: likes per day, trending tweets
- Aggregate tables for performance if needed

**Version 3.0 (Like Lists):**
- Endpoint to list users who liked a tweet
- Pagination for large like counts

**Version 4.0 (Reaction Types):**
- Extend table to support multiple reaction types (like, love, laugh)
- Migration strategy: Add `reaction_type` enum column

**Version 5.0 (Notifications):**
- Integrate with notification system
- Notify tweet authors when tweets receive likes

---

## Change Log

| Version | Date       | Change                           | Author      |
|---------|------------|----------------------------------|-------------|
| 1.0.0   | 2025-10-12 | Initial data model definition    | Claude Code |
