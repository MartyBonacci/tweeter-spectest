# Data Model: User Profile System

**Feature ID:** 004-user-profile-system
**Created:** 2025-10-12
**Version:** 1.0.0

---

## Overview

This document defines the data model for the user profile system, including extensions to the existing profiles table (bio and avatar_url columns), TypeScript type definitions, and query patterns for profile viewing and editing.

**Important:** The profiles table was created in Feature 001. This feature uses the existing table and adds data to the optional `bio` and `avatar_url` columns.

---

## Database Schema

### Table: profiles (existing, extended)

**Purpose:** Store user authentication and profile information

**Original Schema (Feature 001):**
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  username VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  bio VARCHAR(160),              -- ← Used by this feature
  avatar_url TEXT,               -- ← Used by this feature
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Schema Notes for Feature 004:**
- `bio` column already exists (nullable, max 160 characters)
- `avatar_url` column already exists (nullable, stores Cloudinary URL)
- No new columns or migrations required
- This feature populates bio and avatar_url through profile editing

**Column Descriptions (Focus on Profile Columns):**

| Column     | Type         | Constraints | Description                                      |
|------------|--------------|-------------|--------------------------------------------------|
| bio        | VARCHAR(160) | NULL        | User's bio text (0-160 chars, optional)          |
| avatar_url | TEXT         | NULL        | Cloudinary URL for user's avatar (optional)      |

**Constraints:**

- **bio:** Max length 160 characters (enforced by VARCHAR and validation)
- **avatar_url:** Valid URL format (enforced by validation, not DB constraint)
- Both columns nullable (optional profile fields)

**Indexes (Existing from Feature 001):**

- `idx_profiles_username` (UNIQUE) - Used for profile page lookups by username
- `idx_profiles_email` (UNIQUE) - Used for authentication
- `idx_profiles_created_at` (DESC) - Used for user analytics

**Relationships:**

- Same as Feature 001:
  - `tweets.profile_id → profiles.id` (one-to-many)
  - `likes.profile_id → profiles.id` (one-to-many)

---

## TypeScript Type Definitions

### Application Types (camelCase)

```typescript
/**
 * Complete user record (internal use only)
 * Extended from Feature 001 to include profile fields
 */
interface User {
  id: string;              // UUID v7
  username: string;        // 3-20 chars
  email: string;           // Valid email
  passwordHash: string;    // Argon2 hash (NEVER exposed in API)
  bio: string | null;      // Optional, max 160 chars
  avatarUrl: string | null; // Optional, Cloudinary URL
  createdAt: Date;         // Account creation time
}

/**
 * Public user data (safe for API responses)
 * Includes profile information, excludes sensitive fields
 */
interface PublicProfile {
  id: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: Date;
}

/**
 * Profile with statistics (for profile page display)
 */
interface ProfileWithStats {
  id: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  tweetCount: number;      // Aggregated from tweets table
}

/**
 * Database query result type
 * Mirrors database schema (snake_case)
 */
interface ProfileRow {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  bio: string | null;
  avatar_url: string | null;
  created_at: Date;
}

/**
 * Profile with tweet count (query result)
 */
interface ProfileWithTweetCountRow {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  bio: string | null;
  avatar_url: string | null;
  created_at: Date;
  tweet_count: number;     // COUNT aggregation result
}
```

### Case Mapping Helpers

```typescript
/**
 * Convert database row (snake_case) to application type (camelCase)
 */
function mapProfileRowToUser(row: ProfileRow): User {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    passwordHash: row.password_hash,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at
  };
}

/**
 * Convert User to PublicProfile (remove sensitive fields)
 */
function toPublicProfile(user: User): PublicProfile {
  return {
    id: user.id,
    username: user.username,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt
  };
}

/**
 * Convert ProfileWithTweetCountRow to ProfileWithStats
 */
function mapProfileWithStatsRow(row: ProfileWithTweetCountRow): ProfileWithStats {
  return {
    id: row.id,
    username: row.username,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    tweetCount: row.tweet_count
  };
}
```

---

## Validation Rules

### Bio Validation

**Format:** Plain text

**Rules:**
- Minimum length: 0 characters (optional field, empty allowed)
- Maximum length: 160 characters
- No special character restrictions (allow emojis, punctuation)
- Content sanitized before storage (XSS prevention)

**Zod Schema:**
```typescript
import { z } from 'zod';

const bioSchema = z.string()
  .max(160, 'Bio cannot exceed 160 characters')
  .optional()
  .nullable();

// For form validation with character count
const bioUpdateSchema = z.object({
  bio: z.string().max(160, 'Bio must be 160 characters or less')
});
```

**Examples:**
- ✅ Valid: `""` (empty), `"Software developer and coffee enthusiast"`, `"I love TypeScript! 🚀"`
- ❌ Invalid: (any string exceeding 160 characters)

### Avatar URL Validation

**Format:** Valid HTTP/HTTPS URL (from Cloudinary)

**Rules:**
- Must be valid URL format
- Typically starts with `https://res.cloudinary.com/`
- Server-side validation after Cloudinary upload
- Client never submits URL directly (submits file, receives URL)

**Zod Schema:**
```typescript
const avatarUrlSchema = z.string()
  .url('Invalid avatar URL')
  .nullable()
  .optional();
```

### Avatar File Upload Validation

**Format:** Image file (JPEG, PNG, GIF)

**Rules:**
- Allowed MIME types: `image/jpeg`, `image/png`, `image/gif`
- Maximum file size: 5 MB (configurable)
- Validated on client (UX) and server (security)
- Cloudinary performs additional validation

**Validation Logic:**
```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

function validateAvatarFile(file: File): boolean {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 5 MB');
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Only JPEG, PNG, and GIF images are allowed');
  }
  return true;
}
```

---

## State Transitions

### Profile Data States

```
[Minimal Profile] ──edit bio──> [Profile with Bio] ──edit bio──> [Profile with Bio]
       │                                  │
       │                                  │
       └──upload avatar──> [Profile with Avatar] ──upload avatar──> [Profile with Avatar]
                                  │
                                  └──edit bio + upload avatar──> [Complete Profile]
```

**State Definitions:**

1. **Minimal Profile:** User account with only required fields (username, email, password)
   - bio: null
   - avatar_url: null

2. **Profile with Bio:** User has added bio text
   - bio: string (1-160 chars)
   - avatar_url: null

3. **Profile with Avatar:** User has uploaded avatar image
   - bio: null
   - avatar_url: string (Cloudinary URL)

4. **Complete Profile:** User has both bio and avatar
   - bio: string (1-160 chars)
   - avatar_url: string (Cloudinary URL)

**Transitions:**

- **Edit Bio:** Updates bio field, preserves avatar_url
- **Upload Avatar:** Updates avatar_url, preserves bio
- **Clear Bio:** Sets bio to null or empty string
- **Remove Avatar:** Sets avatar_url to null (not implemented in MVP)

---

## Query Patterns

### Common Queries

**1. Get Profile by Username (for viewing):**
```sql
SELECT id, username, bio, avatar_url, created_at
FROM profiles
WHERE username = $1;
```

**2. Get Profile with Tweet Count (for profile page):**
```sql
SELECT
  p.id,
  p.username,
  p.bio,
  p.avatar_url,
  p.created_at,
  COUNT(t.id) AS tweet_count
FROM profiles p
LEFT JOIN tweets t ON p.id = t.profile_id
WHERE p.username = $1
GROUP BY p.id;
```

**3. Update Profile Bio (for editing):**
```sql
UPDATE profiles
SET bio = $1
WHERE id = $2
RETURNING id, username, bio, avatar_url, created_at;
```

**4. Update Avatar URL (after Cloudinary upload):**
```sql
UPDATE profiles
SET avatar_url = $1
WHERE id = $2
RETURNING id, username, bio, avatar_url, created_at;
```

**5. Get User's Tweets (for profile page):**
```sql
SELECT
  t.id,
  t.content,
  t.profile_id,
  t.created_at,
  COUNT(l.id) AS like_count,
  EXISTS(
    SELECT 1 FROM likes
    WHERE tweet_id = t.id AND profile_id = $2
  ) AS is_liked_by_user
FROM tweets t
LEFT JOIN likes l ON t.id = l.tweet_id
WHERE t.profile_id = (
  SELECT id FROM profiles WHERE username = $1
)
GROUP BY t.id
ORDER BY t.created_at DESC;
```

### Performance Notes

- Username lookup uses unique index (O(log n))
- Tweet count aggregation uses LEFT JOIN (efficient for profile display)
- User's tweets filtered by profile_id (indexed in Feature 002)
- Avatar URLs served by Cloudinary CDN (not from database)

---

## Migration Scripts

### No Migration Required

**Rationale:** The `bio` and `avatar_url` columns already exist in the profiles table (created in Feature 001 migration). This feature simply populates these optional fields through API endpoints.

**Verification Query:**
```sql
-- Verify columns exist
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('bio', 'avatar_url');

-- Expected output:
-- bio        | character varying | 160  | YES
-- avatar_url | text             | NULL | YES
```

**Optional: Set Default Values (if needed):**
```sql
-- If some profiles have undefined values, set to NULL explicitly
UPDATE profiles
SET bio = NULL
WHERE bio = '';

UPDATE profiles
SET avatar_url = NULL
WHERE avatar_url = '';
```

---

## Data Integrity Rules

1. **Referential Integrity:**
   - No new foreign keys (existing relationships maintained)
   - Tweets and likes still reference profiles via profile_id

2. **Nullability:**
   - bio: Optional (NULL allowed)
   - avatar_url: Optional (NULL allowed)
   - Both fields can be empty or populated independently

3. **Data Validation:**
   - Bio: Max 160 characters (enforced by VARCHAR and Zod)
   - Avatar URL: Valid URL format (enforced by Zod after Cloudinary upload)
   - Content sanitization: Bio sanitized before storage (XSS prevention)

4. **Immutability:**
   - `username`: Immutable (cannot be changed after account creation)
   - `bio`: Mutable (can be updated by user)
   - `avatar_url`: Mutable (can be updated by user)

5. **Data Exposure:**
   - `email`: NEVER exposed in profile API responses (authentication only)
   - `password_hash`: NEVER exposed in any API response
   - `bio`, `avatar_url`: Public (visible to all users)

---

## Security Considerations

1. **Authorization:**
   - Only authenticated user can update their own profile
   - Authorization check: Compare session user ID to profile owner ID
   - Public profiles viewable without authentication

2. **XSS Prevention:**
   - Bio content sanitized before storage
   - Framework auto-escaping on display (React)
   - No HTML tags allowed in bio

3. **File Upload Security:**
   - File type validation (MIME type check)
   - File size limits enforced (5 MB)
   - External service (Cloudinary) handles storage
   - Cloudinary performs additional security checks

4. **Information Disclosure:**
   - Profile API returns only public fields
   - Email and password_hash never exposed
   - Sensitive data filtered through `toPublicProfile` function

5. **Avatar URL Integrity:**
   - Avatar URLs only set by server after Cloudinary upload
   - Client cannot directly set avatar_url field
   - URLs validated as proper format

---

## Performance Optimization

### Query Optimization

1. **Username Lookups:**
   - Use existing unique index on username
   - Case-insensitive comparison via LOWER() if needed

2. **Tweet Count Aggregation:**
   - LEFT JOIN with COUNT for efficient aggregation
   - Single query avoids N+1 problem

3. **Avatar Delivery:**
   - Cloudinary CDN serves images (not database)
   - URLs cached by external service
   - No database blob storage (performance benefit)

### Caching Strategy (Future Enhancement)

- Profile data could be cached (bio changes infrequently)
- Avatar URLs already cached by Cloudinary CDN
- Tweet count recalculated on each request (acceptable for MVP)

---

## External Service Integration

### Cloudinary (Avatar Storage)

**Purpose:** Store and serve user avatar images via CDN

**Upload Flow:**
1. Client selects image file
2. Server validates file type and size
3. Server uploads to Cloudinary via API
4. Cloudinary returns URL
5. Server stores URL in profiles.avatar_url
6. Client displays image from Cloudinary URL

**Configuration Requirements:**
- Cloudinary account with API credentials
- Environment variables: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
- Upload preset configured for avatars (e.g., "avatar_uploads")

**Security:**
- Signed uploads (prevents unauthorized uploads)
- File type and size validation by Cloudinary
- Automatic image optimization and transformation

---

## Future Extensions

**Version 2.0 (Avatar Cropping):**
- Add client-side image cropping before upload
- Enforce square aspect ratio (1:1)
- Use Cloudinary transformation API for cropping

**Version 3.0 (Profile Statistics):**
- Add columns: `followers_count`, `following_count`, `likes_received_count`
- Computed fields or cached aggregations

**Version 4.0 (Profile Header Image):**
- Add `header_url` column
- Similar upload flow as avatar (Cloudinary)

**Version 5.0 (Username Changes):**
- Remove immutability constraint on username
- Add validation: Username change limit (e.g., once per 30 days)
- Add username history tracking table

---

## Change Log

| Version | Date       | Change                           | Author      |
|---------|------------|----------------------------------|-------------|
| 1.0.0   | 2025-10-12 | Initial data model definition    | Claude Code |
