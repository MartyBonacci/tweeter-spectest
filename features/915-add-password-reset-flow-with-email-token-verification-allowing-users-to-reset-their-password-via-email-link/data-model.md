# Data Model: Password Reset Flow

**Feature ID:** 915
**Created:** 2025-10-16

---

## Overview

This data model defines the database schema, entity relationships, and data validation rules for the password reset feature.

---

## Entities

### PasswordResetToken

**Purpose**: Stores time-limited, single-use tokens for password reset verification.

**Fields:**

| Field Name | Type | Constraints | Description |
|------------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v7() | Unique identifier |
| profileId | UUID | NOT NULL, FOREIGN KEY → profiles(id) ON DELETE CASCADE | User requesting password reset |
| tokenHash | VARCHAR(255) | NOT NULL | SHA-256 hash of the reset token |
| expiresAt | TIMESTAMPTZ | NOT NULL | Token expiration time (1 hour from creation) |
| usedAt | TIMESTAMPTZ | NULL | Timestamp when token was used (NULL if unused) |
| createdAt | TIMESTAMPTZ | DEFAULT NOW() | When token was created |

**Relationships:**
- **Many-to-One** with Profile: A user can have multiple reset tokens (e.g., requested multiple times), but only the most recent unexpired one is valid.
- **Cascade Delete**: If user profile is deleted, all their reset tokens are deleted.

**Indexes:**
- `idx_password_reset_tokens_token_hash` on `token_hash` - Fast token lookup during validation
- `idx_password_reset_tokens_profile_id` on `profile_id` - Query user's tokens
- `idx_password_reset_tokens_expires_at` on `expires_at` - Cleanup expired tokens efficiently

**State Transitions:**
```
[Created] → expiresAt set to NOW() + 1 hour, usedAt = NULL
    ↓
[Valid] → createdAt < NOW() < expiresAt AND usedAt IS NULL
    ↓
[Used] → usedAt set to NOW() when password reset succeeds
    OR
[Expired] → NOW() > expiresAt
```

**Business Rules:**
1. Token is valid ONLY if:
   - Current time is before expiresAt
   - usedAt is NULL
   - Token hash matches database record
2. After successful password reset, usedAt is set to NOW()
3. Expired tokens (NOW() > expiresAt) cannot be used
4. Used tokens (usedAt IS NOT NULL) cannot be reused

---

### PasswordResetRateLimit (Supporting Table)

**Purpose**: Track password reset requests to enforce rate limiting (max 3 requests/email/hour).

**Fields:**

| Field Name | Type | Constraints | Description |
|------------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v7() | Unique identifier |
| email | VARCHAR(255) | NOT NULL | Email address requesting reset |
| requestedAt | TIMESTAMPTZ | DEFAULT NOW() | When request was made |

**Indexes:**
- `idx_password_reset_rate_limits_email` on `email` - Fast lookup by email
- `idx_password_reset_rate_limits_requested_at` on `requestedAt` - Cleanup old entries efficiently

**Business Rules:**
1. Count requests WHERE email = X AND requestedAt > (NOW() - INTERVAL '1 hour')
2. If count >= 3, reject new request with 429 status
3. Cleanup entries older than 24 hours (background job)

---

## TypeScript Interfaces

### Application Layer (camelCase)

```typescript
/**
 * Password reset token entity
 */
interface PasswordResetToken {
  id: string;
  profileId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

/**
 * Rate limit tracking entity
 */
interface PasswordResetRateLimit {
  id: string;
  email: string;
  requestedAt: Date;
}

/**
 * Request to initiate password reset
 */
interface ForgotPasswordRequest {
  email: string;
}

/**
 * Request to reset password with token
 */
interface ResetPasswordRequest {
  token: string; // Original token (not hashed)
  password: string;
}

/**
 * Token validation result
 */
interface TokenValidationResult {
  valid: boolean;
  profileId?: string; // Included if valid
  email?: string; // Included if valid (for display)
  error?: 'expired' | 'used' | 'not_found' | 'invalid';
}
```

---

## Database Schema (SQL)

### Migration: 001_create_password_reset_tokens_table.sql

```sql
-- Enable uuid-ossp extension for uuid_generate_v7()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Password reset tokens table
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_password_reset_tokens_token_hash ON password_reset_tokens(token_hash);
CREATE INDEX idx_password_reset_tokens_profile_id ON password_reset_tokens(profile_id);
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Comments for documentation
COMMENT ON TABLE password_reset_tokens IS 'Stores time-limited, single-use tokens for password reset';
COMMENT ON COLUMN password_reset_tokens.token_hash IS 'SHA-256 hash of the reset token (for security)';
COMMENT ON COLUMN password_reset_tokens.expires_at IS 'Token expires 1 hour after creation';
COMMENT ON COLUMN password_reset_tokens.used_at IS 'NULL if unused, set to NOW() when password reset';
```

### Migration: 002_create_password_reset_rate_limits_table.sql

```sql
-- Rate limiting table
CREATE TABLE password_reset_rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  email VARCHAR(255) NOT NULL,
  requested_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_password_reset_rate_limits_email ON password_reset_rate_limits(email);
CREATE INDEX idx_password_reset_rate_limits_requested_at ON password_reset_rate_limits(requested_at);

-- Comments for documentation
COMMENT ON TABLE password_reset_rate_limits IS 'Tracks password reset requests for rate limiting (max 3/hour per email)';
```

---

## Data Validation Rules

### Email Validation (Zod Schema)

```typescript
const emailSchema = z.string()
  .email("Invalid email format")
  .toLowerCase()
  .trim()
  .max(255, "Email too long");
```

**Rules:**
- Must be valid email format (RFC 5322)
- Normalized to lowercase
- Whitespace trimmed
- Max 255 characters

### Password Validation (Zod Schema)

```typescript
const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password too long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");
```

**Rules:**
- Minimum 8 characters
- Maximum 128 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)

### Token Validation (Zod Schema)

```typescript
const tokenSchema = z.string()
  .uuid("Invalid token format");
```

**Rules:**
- Must be valid UUID v7 format (36 characters with hyphens)

---

## Database Queries

### Common Queries

**1. Create Reset Token**
```sql
INSERT INTO password_reset_tokens (profile_id, token_hash, expires_at)
VALUES ($1, $2, NOW() + INTERVAL '1 hour')
RETURNING id, profile_id, token_hash, expires_at, used_at, created_at;
```

**2. Validate Token**
```sql
SELECT
  prt.id,
  prt.profile_id,
  prt.expires_at,
  prt.used_at,
  p.email
FROM password_reset_tokens prt
JOIN profiles p ON p.id = prt.profile_id
WHERE prt.token_hash = $1
  AND prt.expires_at > NOW()
  AND prt.used_at IS NULL;
```

**3. Mark Token as Used**
```sql
UPDATE password_reset_tokens
SET used_at = NOW()
WHERE token_hash = $1
  AND used_at IS NULL
RETURNING id;
```

**4. Check Rate Limit**
```sql
SELECT COUNT(*) as request_count
FROM password_reset_rate_limits
WHERE email = $1
  AND requested_at > (NOW() - INTERVAL '1 hour');
```

**5. Record Reset Request**
```sql
INSERT INTO password_reset_rate_limits (email)
VALUES ($1);
```

**6. Cleanup Expired Tokens (Background Job)**
```sql
DELETE FROM password_reset_tokens
WHERE expires_at < (NOW() - INTERVAL '24 hours');
```

**7. Cleanup Old Rate Limit Entries (Background Job)**
```sql
DELETE FROM password_reset_rate_limits
WHERE requested_at < (NOW() - INTERVAL '24 hours');
```

---

## Data Flow

### Password Reset Request Flow

```
1. User submits email
   ↓
2. Validate email format (Zod)
   ↓
3. Check rate limit:
   SELECT COUNT(*) FROM password_reset_rate_limits
   WHERE email = $email AND requested_at > NOW() - '1 hour'
   ↓
4. If count >= 3: REJECT (429 Too Many Requests)
   ↓
5. Look up user:
   SELECT id FROM profiles WHERE email = $email
   ↓
6. If user exists:
   a. Generate token (crypto.randomUUID())
   b. Hash token (sha256)
   c. INSERT INTO password_reset_tokens
   d. INSERT INTO password_reset_rate_limits
   e. Send email with token link
   ↓
7. If user doesn't exist:
   a. INSERT INTO password_reset_rate_limits (still rate limit)
   b. Skip email sending
   ↓
8. Return generic success message (same for valid/invalid email)
```

### Password Reset Flow

```
1. User clicks link with token
   ↓
2. Loader validates token:
   SELECT * FROM password_reset_tokens prt
   JOIN profiles p ON p.id = prt.profile_id
   WHERE token_hash = hash($token)
     AND expires_at > NOW()
     AND used_at IS NULL
   ↓
3. If invalid/expired/used: Show error page
   ↓
4. If valid: Show password reset form
   ↓
5. User submits new password
   ↓
6. Validate password strength (Zod)
   ↓
7. Re-validate token (same query as step 2)
   ↓
8. Hash new password (argon2)
   ↓
9. Update user password:
   UPDATE profiles
   SET password_hash = $new_password_hash
   WHERE id = $profile_id
   ↓
10. Mark token as used:
    UPDATE password_reset_tokens
    SET used_at = NOW()
    WHERE token_hash = hash($token)
   ↓
11. Create JWT session
   ↓
12. Send confirmation email
   ↓
13. Redirect to /feed (user signed in)
```

---

## Security Considerations

### Token Storage

- **Original token**: Never stored in database
- **Token hash**: Stored using SHA-256 (one-way hash)
- **Rationale**: Even if database is compromised, attackers cannot derive original token from hash

### Rate Limiting

- **Email-based**: Max 3 requests per email per hour
- **Purpose**: Prevent abuse and enumeration attacks
- **Implementation**: Database table with timestamp tracking

### No Email Enumeration

- **Generic response**: Same success message for valid and invalid emails
- **Rate limiting**: Applied to both valid and invalid emails
- **Purpose**: Attackers cannot determine which emails are registered

### Token Expiration

- **Duration**: 1 hour from creation
- **Cleanup**: Background job removes tokens older than 24 hours
- **Purpose**: Minimize window of vulnerability if token is intercepted

---

## Maintenance

### Background Jobs

**1. Cleanup Expired Tokens (Daily)**
```bash
# Cron: 0 2 * * * (2 AM daily)
psql -c "DELETE FROM password_reset_tokens WHERE expires_at < NOW() - INTERVAL '24 hours';"
```

**2. Cleanup Old Rate Limit Entries (Daily)**
```bash
# Cron: 0 2 * * * (2 AM daily)
psql -c "DELETE FROM password_reset_rate_limits WHERE requested_at < NOW() - INTERVAL '24 hours';"
```

### Monitoring Queries

**1. Active Reset Tokens**
```sql
SELECT COUNT(*) as active_tokens
FROM password_reset_tokens
WHERE expires_at > NOW() AND used_at IS NULL;
```

**2. Reset Success Rate (Last 24 Hours)**
```sql
SELECT
  COUNT(*) FILTER (WHERE used_at IS NOT NULL) as successful_resets,
  COUNT(*) as total_tokens,
  ROUND(100.0 * COUNT(*) FILTER (WHERE used_at IS NOT NULL) / NULLIF(COUNT(*), 0), 2) as success_rate
FROM password_reset_tokens
WHERE created_at > NOW() - INTERVAL '24 hours';
```

**3. Rate Limit Violations (Last Hour)**
```sql
SELECT email, COUNT(*) as request_count
FROM password_reset_rate_limits
WHERE requested_at > NOW() - INTERVAL '1 hour'
GROUP BY email
HAVING COUNT(*) >= 3
ORDER BY request_count DESC;
```

---

## Future Enhancements

1. **IP-based rate limiting**: Additional layer (max 10 requests/hour per IP)
2. **Geographic anomaly detection**: Flag reset requests from unusual locations
3. **Account lockout**: Temporary lock after N failed attempts within timeframe
4. **Password reset history**: Audit log of all password changes (compliance)
5. **Multi-factor requirement**: Require MFA code before showing reset form
