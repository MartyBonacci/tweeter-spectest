# Data Model: Tweet Deletion

**Feature ID:** 910-allow-the-logged-in-user-to-delete-their-own-tweets
**Date:** 2025-10-15

---

## Overview

This feature uses **existing database schema** with no modifications. Tweet deletion leverages the existing `tweets` table and CASCADE foreign key constraints on the `likes` table.

---

## Database Schema

### Existing Tables (No Changes)

#### tweets table
```sql
CREATE TABLE tweets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content VARCHAR(140) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tweets_profile_id ON tweets(profile_id);
CREATE INDEX idx_tweets_created_at ON tweets(created_at DESC);
```

**Used For:**
- Delete operation: `DELETE FROM tweets WHERE id = $1 AND profile_id = $2`
- Primary key index enables fast lookup by `id`
- `profile_id` index used for ownership check

#### likes table (cascade behavior)
```sql
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  tweet_id UUID NOT NULL REFERENCES tweets(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_tweet_like UNIQUE (tweet_id, profile_id)
);
```

**Cascade Behavior:**
- When a tweet is deleted, `ON DELETE CASCADE` automatically deletes all associated likes
- No manual deletion logic needed
- Atomic transaction (database handles)

---

## TypeScript Interfaces

### Request/Response Types

```typescript
/**
 * DELETE /api/tweets/:id - Delete tweet by ID
 */

// Path parameter
interface DeleteTweetParams {
  id: string; // Tweet UUID
}

// Success response (204 No Content)
type DeleteTweetResponse = void;

// Error response
interface DeleteTweetError {
  error: string;
  details?: string;
}
```

### Zod Schemas

```typescript
import { z } from 'zod';

/**
 * Path parameter validation
 */
export const deleteTweetParamsSchema = z.object({
  id: z.string().uuid('Invalid tweet ID format'),
});

/**
 * Error response validation
 */
export const deleteTweetErrorSchema = z.object({
  error: z.string().min(1),
  details: z.string().optional(),
});

// Type inference
export type DeleteTweetParams = z.infer<typeof deleteTweetParamsSchema>;
export type DeleteTweetError = z.infer<typeof deleteTweetErrorSchema>;
```

---

## Database Operations

### Delete Tweet Function

**File:** `src/db/tweets.ts`

```typescript
import type { Sql } from 'postgres';

/**
 * Delete a tweet owned by the authenticated user
 *
 * @param db - PostgreSQL connection
 * @param tweetId - UUID of tweet to delete
 * @param userId - UUID of authenticated user (owner)
 * @returns true if deleted, false if not found or not owned
 * @throws Error if database operation fails
 *
 * @example
 * const deleted = await deleteTweet(db, tweetId, userId);
 * if (!deleted) {
 *   return res.status(404).json({ error: 'Tweet not found' });
 * }
 */
export async function deleteTweet(
  db: Sql,
  tweetId: string,
  userId: string
): Promise<boolean> {
  // Single query: check ownership AND delete atomically
  // RETURNING clause confirms deletion occurred
  const result = await db`
    DELETE FROM tweets
    WHERE id = ${tweetId}
      AND profile_id = ${userId}
    RETURNING id
  `;

  // If result is empty, tweet either:
  // 1. Doesn't exist (404)
  // 2. Exists but not owned by user (403 - but we return false for both)
  // This prevents timing-based ownership leak
  return result.length > 0;
}
```

**Query Explanation:**
- **WHERE id = ${tweetId}**: Find tweet by ID (primary key index)
- **AND profile_id = ${userId}**: Ownership check in same query
- **RETURNING id**: Confirm deletion occurred
- **Cascade**: Database automatically deletes associated likes via FK constraint

**Security:**
- Parameterized query prevents SQL injection
- Single query prevents TOCTOU race condition
- Returns boolean (doesn't leak 403 vs 404 via timing)

---

## State Transitions

### Tweet Lifecycle with Deletion

```
┌─────────────┐
│   Created   │ (POST /api/tweets)
└──────┬──────┘
       │
       v
┌─────────────┐
│   Visible   │ (GET /api/tweets, /api/tweets/:id, /api/tweets/user/:username)
└──────┬──────┘
       │
       v
┌─────────────┐
│   Deleted   │ (DELETE /api/tweets/:id) [TERMINAL STATE]
└─────────────┘
       │
       v
┌─────────────┐
│  Purged     │ (Cascade deletes likes, removed from all queries)
└─────────────┘
```

**Notes:**
- Deletion is **permanent** (hard delete)
- No soft delete or "recently deleted" state
- Cascade deletion ensures no orphaned data

---

## Data Validation

### Client-Side (UX Validation)

**Purpose:** Early feedback before API call

```typescript
// Tweet ID format check (before optimistic update)
const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

// In component
if (!isValidUUID(tweetId)) {
  console.error('Invalid tweet ID format');
  return; // Prevent API call
}
```

### Server-Side (Security Validation)

**Purpose:** Enforce data integrity, prevent malicious requests

```typescript
// In Express route handler
import { deleteTweetParamsSchema } from '../schemas/tweet.js';

router.delete('/:id', authenticate, async (req, res) => {
  // Validate path parameter
  const result = deleteTweetParamsSchema.safeParse({
    id: req.params.id,
  });

  if (!result.success) {
    return res.status(400).json({
      error: 'Invalid request',
      details: result.error.flatten().fieldErrors,
    });
  }

  const { id: tweetId } = result.data;
  const userId = req.user.userId;

  // Ownership + deletion in single query
  const deleted = await deleteTweet(db, tweetId, userId);

  if (!deleted) {
    return res.status(404).json({
      error: 'Tweet not found',
    });
  }

  return res.status(204).send();
});
```

---

## Index Usage

### Existing Indexes Used

1. **PRIMARY KEY (id)**
   - Query: `WHERE id = ${tweetId}`
   - Performance: O(log n) lookup
   - Usage: Every DELETE operation

2. **idx_tweets_profile_id**
   - Query: `WHERE profile_id = ${userId}`
   - Performance: O(log n) ownership check
   - Usage: Ownership validation in DELETE

**No new indexes needed** - existing indexes sufficient for delete performance.

---

## Cascade Deletion Details

### Foreign Key Constraints

```sql
-- Existing constraint on likes table
ALTER TABLE likes
  ADD CONSTRAINT fk_likes_tweet_id
  FOREIGN KEY (tweet_id)
  REFERENCES tweets(id)
  ON DELETE CASCADE;
```

**Cascade Flow:**

```
DELETE tweets WHERE id = '...'
       ↓
Database checks FK constraint on likes
       ↓
Automatically: DELETE likes WHERE tweet_id = '...'
       ↓
Both operations in single transaction
       ↓
Commit (atomic) OR Rollback (on error)
```

**Benefits:**
- Atomic: All or nothing
- No N+1 queries
- No orphaned likes
- Database-enforced referential integrity

---

## Performance Characteristics

### DELETE Operation Analysis

**Query:** `DELETE FROM tweets WHERE id = $1 AND profile_id = $2 RETURNING id`

**Execution Plan (Estimated):**
```
Delete on tweets (cost=0.29..8.30 rows=1)
  -> Index Scan using tweets_pkey on tweets (cost=0.29..8.30 rows=1)
       Index Cond: (id = '...'::uuid)
       Filter: (profile_id = '...'::uuid)
```

**Expected Performance:**
- Index seek: < 5ms (primary key lookup)
- Ownership check: < 1ms (filter on retrieved row)
- Cascade delete: < 10ms (delete associated likes via index)
- **Total: < 20ms** (database-level delete)

**Network + API overhead:** ~50-100ms (total roundtrip)

---

## Migration Strategy

**Migration Required:** None

**Reason:** Feature uses existing schema with no modifications.

**Verification:**
- ✅ tweets table exists
- ✅ Primary key index on id
- ✅ Index on profile_id
- ✅ CASCADE constraint on likes.tweet_id
- ✅ No schema changes needed

---

## Future Enhancements (Out of Scope)

### Potential Data Model Extensions (P2)

1. **Soft Delete** (if audit trail needed)
   ```sql
   ALTER TABLE tweets ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
   CREATE INDEX idx_tweets_deleted_at ON tweets(deleted_at);
   ```

2. **Deletion Log** (audit purposes)
   ```sql
   CREATE TABLE tweet_deletions (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
     tweet_id UUID NOT NULL,
     deleted_by_user_id UUID NOT NULL,
     content TEXT,
     deleted_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

3. **Undo Window** (5-second undo)
   ```sql
   ALTER TABLE tweets ADD COLUMN pending_deletion_until TIMESTAMPTZ DEFAULT NULL;
   ```

**Status:** Not implementing in this feature (MVP focused)

---

## Summary

- **No database changes** required
- **Existing schema** supports delete operation
- **CASCADE constraint** handles like deletion automatically
- **Indexes** already optimized for delete performance
- **Single query** for ownership check + deletion (atomic, efficient)
- **Hard delete** chosen for simplicity and user expectations

Ready for API implementation and UI integration.
