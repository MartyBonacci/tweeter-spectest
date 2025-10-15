# Data Model: User Authentication System

**Feature ID:** 001-user-authentication-system
**Created:** 2025-10-12
**Version:** 1.0.0

---

## Overview

This document defines the data model for user authentication, including the profiles table schema, relationships, constraints, and TypeScript type definitions.

---

## Database Schema

### Table: profiles

**Purpose:** Store user account information for authentication and profile features

**Schema Definition:**

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  username VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  bio VARCHAR(160),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE UNIQUE INDEX idx_profiles_username ON profiles(username);
CREATE UNIQUE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_created_at ON profiles(created_at DESC);
```

**Column Descriptions:**

| Column        | Type         | Constraints           | Description                                    |
|---------------|--------------|----------------------|------------------------------------------------|
| id            | UUID         | PRIMARY KEY          | Unique identifier (UUID v7, time-sortable)     |
| username      | VARCHAR(20)  | UNIQUE NOT NULL      | User's display name (3-20 chars, alphanumeric) |
| email         | VARCHAR(255) | UNIQUE NOT NULL      | User's email address (for signin)              |
| password_hash | TEXT         | NOT NULL             | Argon2 hash of password (never plaintext)      |
| bio           | VARCHAR(160) | NULL                 | Optional user bio (for profile feature)        |
| avatar_url    | TEXT         | NULL                 | Optional avatar image URL (Cloudinary)         |
| created_at    | TIMESTAMPTZ  | DEFAULT NOW()        | Account creation timestamp                     |

**Constraints:**

- **Primary Key:** `id` (UUID v7)
- **Unique Constraints:**
  - `username` - Prevents duplicate usernames
  - `email` - Prevents duplicate email addresses
- **Not Null Constraints:**
  - `username`, `email`, `password_hash` - Required for authentication
- **Check Constraints:** (future enhancements)
  - `username` length: 3-20 characters
  - `bio` length: max 160 characters

**Indexes:**

- `idx_profiles_username` (UNIQUE) - Fast username lookups for signin and uniqueness checks
- `idx_profiles_email` (UNIQUE) - Fast email lookups for signin and uniqueness checks
- `idx_profiles_created_at` (DESC) - Fast queries for user analytics (future)

**Relationships:**

- None in this feature (foundation for future relationships)
- Future: `tweets.profile_id → profiles.id` (one-to-many)
- Future: `likes.profile_id → profiles.id` (one-to-many)

---

## TypeScript Type Definitions

### Application Types (camelCase)

```typescript
/**
 * Complete user record (internal use only)
 * WARNING: Never send passwordHash to client
 */
interface User {
  id: string;              // UUID v7
  username: string;        // 3-20 chars
  email: string;           // Valid email
  passwordHash: string;    // Argon2 hash (internal only)
  bio: string | null;      // Optional, max 160 chars
  avatarUrl: string | null; // Optional, Cloudinary URL
  createdAt: Date;         // Account creation time
}

/**
 * Public user data (safe for API responses)
 * No sensitive fields like passwordHash
 */
interface PublicUser {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
}

/**
 * Session data (stored in JWT)
 */
interface SessionData {
  userId: string;
  username: string;
  email: string;
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
```

### Case Mapping Helper

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
 * Convert User to PublicUser (remove sensitive fields)
 */
function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt
  };
}
```

---

## Validation Rules

### Username Validation

**Format:** Alphanumeric with optional hyphens and underscores

**Rules:**
- Minimum length: 3 characters
- Maximum length: 20 characters
- Allowed characters: `a-z`, `A-Z`, `0-9`, `-`, `_`
- No spaces or special characters

**Regex:** `/^[a-zA-Z0-9_-]{3,20}$/`

**Examples:**
- ✅ Valid: `john_doe`, `user123`, `test-user`
- ❌ Invalid: `ab` (too short), `this_is_too_long_username` (too long), `user@name` (special char)

### Email Validation

**Format:** Standard email format

**Rules:**
- Must match email regex pattern
- Maximum length: 255 characters (database constraint)
- Case-insensitive comparison (convert to lowercase before storage)

**Validation:** Use Zod's `.email()` validator

**Examples:**
- ✅ Valid: `user@example.com`, `john.doe+tag@domain.co.uk`
- ❌ Invalid: `notanemail`, `@domain.com`, `user@`

### Password Validation

**Format:** Minimum 8 characters

**Rules:**
- Minimum length: 8 characters
- No maximum length (argon2 handles any length)
- No specific character requirements (flexibility vs security trade-off)
- Never stored in plaintext (always hashed with argon2)

**Storage:** Argon2 hash (TEXT column, ~100 characters)

**Examples:**
- ✅ Valid: `password123`, `MySecureP@ssw0rd!`
- ❌ Invalid: `short` (too short)

---

## State Transitions

### User Account States

```
[No Account] ─────signup─────> [Active Account]
                                       │
                                       │ signin
                                       ↓
                                 [Authenticated Session]
                                       │
                                       │ signout
                                       ↓
                                 [Active Account] (session ends, account persists)
```

**State Definitions:**

1. **No Account:** User does not exist in database
2. **Active Account:** User record exists, can sign in
3. **Authenticated Session:** User has valid JWT cookie

**Transitions:**

- **Signup:** Creates profile record, immediately establishes authenticated session
- **Signin:** Verifies credentials, establishes authenticated session
- **Signout:** Destroys session (clears cookie), profile persists

**Future States (out of scope for MVP):**
- Suspended account (moderation)
- Email verified (email verification feature)
- Deleted account (soft delete)

---

## Query Patterns

### Common Queries

**1. Create User (Signup):**
```sql
INSERT INTO profiles (id, username, email, password_hash, created_at)
VALUES ($1, $2, $3, $4, NOW())
RETURNING id, username, email, created_at;
```

**2. Find User by Email (Signin):**
```sql
SELECT id, username, email, password_hash, created_at
FROM profiles
WHERE email = $1;
```

**3. Check Username Uniqueness:**
```sql
SELECT EXISTS(
  SELECT 1 FROM profiles WHERE username = $1
) AS username_exists;
```

**4. Check Email Uniqueness:**
```sql
SELECT EXISTS(
  SELECT 1 FROM profiles WHERE email = $1
) AS email_exists;
```

**5. Get User by ID (Session Validation):**
```sql
SELECT id, username, email, created_at
FROM profiles
WHERE id = $1;
```

### Performance Notes

- Username and email queries use unique indexes (O(log n) lookup)
- Password hash comparison done in application (argon2.verify, not SQL)
- No full table scans (all queries indexed)

---

## Migration Scripts

### Initial Migration (001_create_profiles_table.sql)

```sql
-- Enable UUID v7 generation (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  username VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  bio VARCHAR(160),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE UNIQUE INDEX idx_profiles_username ON profiles(username);
CREATE UNIQUE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_created_at ON profiles(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE profiles IS 'User authentication and profile data';
COMMENT ON COLUMN profiles.id IS 'UUID v7 primary key (time-sortable)';
COMMENT ON COLUMN profiles.username IS 'Unique username (3-20 chars, alphanumeric + hyphen/underscore)';
COMMENT ON COLUMN profiles.email IS 'Unique email address (for signin)';
COMMENT ON COLUMN profiles.password_hash IS 'Argon2 password hash (never plaintext)';
COMMENT ON COLUMN profiles.bio IS 'Optional user bio (max 160 chars)';
COMMENT ON COLUMN profiles.avatar_url IS 'Optional avatar URL (Cloudinary)';
COMMENT ON COLUMN profiles.created_at IS 'Account creation timestamp';
```

### Rollback Migration (001_down.sql)

```sql
-- Drop indexes first
DROP INDEX IF EXISTS idx_profiles_created_at;
DROP INDEX IF EXISTS idx_profiles_email;
DROP INDEX IF EXISTS idx_profiles_username;

-- Drop table
DROP TABLE IF EXISTS profiles;
```

---

## Data Integrity Rules

1. **Referential Integrity:**
   - No foreign keys in this feature (foundation for future features)
   - Future features will add FK constraints (tweets.profile_id, likes.profile_id)

2. **Uniqueness:**
   - Username must be unique (case-sensitive)
   - Email must be unique (case-insensitive via lowercase conversion)

3. **Data Validation:**
   - Username: 3-20 chars, alphanumeric + hyphen/underscore
   - Email: Valid email format
   - Password: Hashed with argon2 (never plaintext in database)

4. **Immutability:**
   - `id`: Never changes (UUID v7)
   - `username`: Immutable in MVP (future feature may allow changes)
   - `created_at`: Set once, never updated

5. **Nullability:**
   - Required: `id`, `username`, `email`, `password_hash`, `created_at`
   - Optional: `bio`, `avatar_url` (for future profile feature)

---

## Security Considerations

1. **Password Storage:**
   - NEVER store plaintext passwords
   - Always use argon2 hashing (via @node-rs/argon2)
   - Hash stored in `password_hash` column (TEXT type, ~100 chars)

2. **Password Hash Verification:**
   - Comparison done in application code (argon2.verify)
   - NOT done in SQL queries
   - Timing-constant comparison (prevents timing attacks)

3. **Sensitive Data Exposure:**
   - `password_hash` never sent to client
   - `email` public in MVP (future: privacy settings)
   - `id` public (used in URLs)

4. **Query Injection Prevention:**
   - All queries use parameterized statements ($1, $2, etc.)
   - Never concatenate user input into SQL strings

---

## Future Extensions

**Version 2.0 (Profile Feature):**
- Populate `bio` and `avatar_url` columns
- Add profile update queries

**Version 3.0 (Social Features):**
- Add FK constraints: `tweets.profile_id → profiles.id`
- Add FK constraints: `likes.profile_id → profiles.id`
- Add CASCADE DELETE rules

**Version 4.0 (Enhanced Security):**
- Add `email_verified` boolean column
- Add `last_signin_at` timestamp
- Add `signin_count` integer

**Version 5.0 (Moderation):**
- Add `status` enum (active, suspended, deleted)
- Add soft delete timestamp

---

## Change Log

| Version | Date       | Change                           | Author      |
|---------|------------|----------------------------------|-------------|
| 1.0.0   | 2025-10-12 | Initial data model definition    | Claude Code |
