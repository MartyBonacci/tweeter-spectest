# Feature Specification: Password Reset Flow with Email Token Verification

**Feature ID:** 915
**Created:** 2025-10-16
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
- Uses functional components and pure functions for password reset logic
- All inputs/outputs validated with Zod schemas (email, password, tokens)
- Routes defined programmatically in app/routes.ts (/forgot-password, /reset-password/:token)
- Implements secure token generation with expiration, rate limiting, and argon2 password hashing
- Uses React Router v7 loaders/actions with modern hooks

---

## Summary

**What:** A secure password reset flow that allows users to reset their forgotten password via an email verification link containing a time-limited token.

**Why:** Users who forget their passwords need a secure way to regain access to their accounts without compromising security.

**Who:** All registered Tweeter users who have forgotten their password.

---

## User Stories

### Primary User Story
```
As a registered user who has forgotten my password
I want to request a password reset via email
So that I can securely regain access to my account
```

**Acceptance Criteria:**
- [ ] User can request password reset by entering their email address
- [ ] User receives an email with a unique, time-limited reset link
- [ ] User can set a new password using the reset link
- [ ] Reset link expires after a defined time period
- [ ] User is automatically signed in after successful password reset
- [ ] User receives confirmation that their password was changed

### Secondary User Stories

**Story 2: Token Expiration**
```
As a security-conscious platform
I want reset tokens to expire after a time period
So that old reset links cannot be exploited
```

**Acceptance Criteria:**
- [ ] Tokens expire after 1 hour
- [ ] Expired token shows clear error message
- [ ] User can request a new reset link

**Story 3: Invalid Email Handling**
```
As a user who entered the wrong email
I want to see a generic success message
So that attackers cannot enumerate valid user accounts
```

**Acceptance Criteria:**
- [ ] System shows same success message for valid and invalid emails
- [ ] No indication whether email exists in system

---

## Functional Requirements

### Must Have (P0)
1. **Request Password Reset**: User can submit their email address to request a password reset
   - Form validates email format before submission
   - Generic success message shown regardless of email validity
   - No enumeration of valid/invalid emails

2. **Generate Secure Reset Token**: System generates cryptographically secure token with expiration
   - Token is UUID v7 format
   - Token expires after 1 hour
   - Token is single-use (invalidated after password reset)
   - Token stored with hashed value in database

3. **Send Reset Email**: System sends password reset email with link to valid email addresses
   - Email contains reset link with token: `/reset-password/{token}`
   - Email includes expiration time information
   - Email sent only if email exists in system (silent fail for non-existent emails)

4. **Verify Reset Token**: System validates reset token when user clicks link
   - Token exists in database
   - Token has not expired
   - Token has not been used
   - Clear error messages for invalid/expired tokens

5. **Reset Password**: User can set new password using valid token
   - New password validated against strength requirements (min 8 chars, uppercase, lowercase, number)
   - Password hashed with argon2 before storage
   - Token invalidated after successful reset
   - User automatically signed in after reset

6. **Security Notifications**: User receives email confirmation after password change
   - Email sent to user's address confirming password was changed
   - Includes timestamp and basic security advice

### Should Have (P1)
1. **Rate Limiting**: Prevent abuse of password reset requests
   - Maximum 3 reset requests per email per hour
   - Clear error message when limit exceeded

2. **Token Invalidation**: Invalidate old tokens when new reset is requested
   - Only most recent token is valid
   - Previous tokens automatically expired

### Could Have (P2)
1. **Password Reset History**: Log password reset events for security audit
   - Track when reset was requested
   - Track when reset was completed
   - Track IP address of requests

### Won't Have (Out of Scope)
1. Security questions or alternative verification methods
2. SMS-based password reset
3. Account recovery for users without email access
4. Integration with external password managers

---

## Technical Requirements

### Type Safety Requirements
- [x] TypeScript interfaces defined for all data structures
- [x] Zod schemas created for:
  - [x] Password reset request validation (email)
  - [x] Password reset submission validation (token, new password)
  - [x] API response validation
  - [x] Database query results validation

### Security Requirements
- [x] Authentication method: Public for reset request, Token-based for password reset
- [x] Authorization rules: Token grants one-time access to reset specific user's password
- [x] Input sanitization: Email normalized, password validated for strength
- [x] Data protection:
  - Tokens stored as hashed values
  - Passwords hashed with argon2
  - No email enumeration
  - Rate limiting on reset requests

### Data Requirements
- [x] Database schema changes documented (new password_reset_tokens table)
- [x] Migration strategy defined
- [x] Data validation rules specified (email, password, token format)
- [x] snake_case ↔ camelCase mapping identified

### Routing Requirements
- [x] Routes added to `app/routes.ts`:
  - `/forgot-password` (GET + POST action)
  - `/reset-password/:token` (GET + POST action)
- [x] Loader functions defined for token validation
- [x] Action functions defined for reset request and password change
- [x] No file-based routes created

---

## User Interface

### Pages/Views

1. **Forgot Password Page** (`/forgot-password`)
   - Purpose: User enters email to request password reset
   - Components: ForgotPasswordForm (functional component)
   - Data: None (public page)
   - Layout: Simple centered form with email input and submit button
   - Success state: Shows message "If your email is registered, you'll receive a password reset link"

2. **Reset Password Page** (`/reset-password/:token`)
   - Purpose: User sets new password using valid token
   - Components: ResetPasswordForm (functional component)
   - Data: Token validation via loader (validates token exists and not expired)
   - Layout: Centered form with password and confirm password inputs
   - Error state: Shows "Invalid or expired reset link" if token invalid

### Components

1. **ForgotPasswordForm** (functional component)
   - Props: `{ action: string }` (form action URL)
   - State: Loading state during submission
   - Behavior:
     - Validates email format on blur
     - Shows generic success message after submission
     - Disables submit during loading

2. **ResetPasswordForm** (functional component)
   - Props: `{ token: string, action: string }`
   - State: Password visibility toggle, loading state, password match validation
   - Behavior:
     - Real-time password strength indicator
     - Validates passwords match before submission
     - Shows success message and auto-redirects to signin

### User Flows

**Flow 1: Request Password Reset**
```
1. User navigates to /signin
2. User clicks "Forgot password?" link
3. User redirected to /forgot-password
4. User enters email address
5. User clicks "Send reset link"
6. Action validates email format with Zod
7. Action generates token if email exists (silent for non-existent)
8. System sends email with reset link
9. User sees success message: "If your email is registered, you'll receive a password reset link"
```

**Flow 2: Reset Password**
```
1. User clicks reset link in email (e.g., /reset-password/abc123)
2. Loader validates token (exists, not expired, not used)
3. If valid: User sees reset password form
4. If invalid: User sees error "Invalid or expired reset link" with link to request new one
5. User enters new password
6. User confirms new password
7. User clicks "Reset password"
8. Action validates password strength with Zod
9. Action hashes password with argon2
10. Action updates password in database
11. Action invalidates token
12. Action creates session (signs user in)
13. Action sends confirmation email
14. User redirected to /feed with success message
```

---

## API Specification

### Endpoints

#### `POST /api/auth/forgot-password`
**Purpose:** Initiates password reset process by generating token and sending email

**Authentication:** Public

**Request:**
```typescript
// TypeScript type
interface ForgotPasswordRequest {
  email: string;
}

// Zod schema
const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase(),
});
```

**Response:**
```typescript
// TypeScript type (always success to prevent enumeration)
interface ForgotPasswordResponse {
  message: string;
}

// Zod schema
const forgotPasswordResponseSchema = z.object({
  message: z.string(),
});

// Example response
{
  "message": "If your email is registered, you'll receive a password reset link"
}
```

**Error Responses:**
- `400`: Invalid email format (Zod validation)
- `429`: Too many reset requests (rate limit exceeded)
- `500`: Server error (email service failure)

---

#### `GET /api/auth/verify-reset-token/:token`
**Purpose:** Validates reset token before showing reset form

**Authentication:** Public (token is the credential)

**Request:**
```typescript
// URL parameter
interface VerifyTokenRequest {
  token: string; // UUID v7 format
}
```

**Response:**
```typescript
// TypeScript type
interface VerifyTokenResponse {
  valid: boolean;
  email?: string; // Only included if valid (for display)
}

// Zod schema
const verifyTokenResponseSchema = z.object({
  valid: z.boolean(),
  email: z.string().email().optional(),
});

// Success example
{
  "valid": true,
  "email": "user@example.com"
}

// Error example
{
  "valid": false
}
```

**Error Responses:**
- `404`: Token not found or expired
- `500`: Server error

---

#### `POST /api/auth/reset-password`
**Purpose:** Resets password using valid token

**Authentication:** Token-based (token in request body)

**Request:**
```typescript
// TypeScript type
interface ResetPasswordRequest {
  token: string;
  password: string;
}

// Zod schema
const resetPasswordSchema = z.object({
  token: z.string().uuid("Invalid token format"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});
```

**Response:**
```typescript
// TypeScript type
interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

// Zod schema
const resetPasswordResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

// Example response
{
  "success": true,
  "message": "Password reset successful"
}
```

**Error Responses:**
- `400`: Invalid password format (Zod validation)
- `404`: Token not found or expired
- `410`: Token already used
- `500`: Server error

---

## Data Model

### Database Schema

#### Table: password_reset_tokens
```sql
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_password_reset_tokens_token_hash ON password_reset_tokens(token_hash);
CREATE INDEX idx_password_reset_tokens_profile_id ON password_reset_tokens(profile_id);
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
```

**Indexes:**
- [x] `idx_password_reset_tokens_token_hash`: Fast lookup by token hash
- [x] `idx_password_reset_tokens_profile_id`: Query tokens by user
- [x] `idx_password_reset_tokens_expires_at`: Clean up expired tokens

**Constraints:**
- [x] `profile_id` references profiles table
- [x] `expires_at` must be in future on creation
- [x] `token_hash` must be unique (though hash collisions are astronomically unlikely)

**Relationships:**
- [x] Many-to-one with profiles (one user can have multiple reset tokens, but only latest is valid)

### TypeScript Interfaces
```typescript
// Application layer (camelCase)
interface PasswordResetToken {
  id: string;
  profileId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

// Database layer automatically maps snake_case ↔ camelCase via postgres package
```

---

## Security Analysis

### Threat Model

1. **Email Enumeration Attack:** Attacker tries to discover valid user emails
   - **Mitigation:** Generic success message for all reset requests (valid or invalid email)

2. **Token Brute Force:** Attacker tries to guess reset tokens
   - **Mitigation:** UUID v7 tokens (128-bit entropy), rate limiting, expiration

3. **Token Reuse:** Attacker uses old/leaked token
   - **Mitigation:** Single-use tokens (marked as used after reset), 1-hour expiration

4. **Rate Limit Bypass:** Attacker floods reset requests
   - **Mitigation:** Rate limit per email (3 requests/hour), per IP (10 requests/hour)

5. **Man-in-the-Middle:** Attacker intercepts reset email
   - **Mitigation:** HTTPS-only links, short expiration, token invalidation on use

6. **Weak Password Selection:** User chooses weak password during reset
   - **Mitigation:** Zod validation enforces minimum strength (8 chars, upper, lower, number)

### Input Validation
- [x] All user inputs validated with Zod before processing
- [x] SQL injection prevented via parameterized queries (postgres package)
- [x] XSS prevented via React's automatic escaping + Zod email validation

### Authentication & Authorization
- [x] Reset token acts as temporary credential for password change
- [x] Token grants access only to reset specific user's password
- [x] Token cannot be used for any other action
- [x] Session created only after successful password reset

---

## Testing Requirements

### Unit Tests
- [x] `generateResetToken()` function creates valid UUID v7
- [x] `hashToken()` function produces consistent hashes
- [x] `isTokenExpired()` function correctly checks expiration
- [x] Zod schemas validate all valid and invalid inputs
- [x] Password strength validation rejects weak passwords

### Integration Tests
- [x] POST /api/auth/forgot-password returns success for valid email
- [x] POST /api/auth/forgot-password returns success for invalid email (no enumeration)
- [x] POST /api/auth/forgot-password respects rate limits
- [x] GET /api/auth/verify-reset-token/:token validates token correctly
- [x] POST /api/auth/reset-password changes password with valid token
- [x] POST /api/auth/reset-password rejects expired token
- [x] POST /api/auth/reset-password rejects used token

### End-to-End Tests
- [x] User can complete full password reset flow (request → email → reset → signin)
- [x] Expired token shows error message
- [x] Used token shows error message
- [x] User receives confirmation email after password change
- [x] Rate limiting prevents abuse

---

## Performance Considerations

- [x] Database indexes on token_hash, profile_id, expires_at for fast lookups
- [x] Automatic cleanup of expired tokens (background job runs daily)
- [x] Email sending is asynchronous (doesn't block response)
- [x] Token validation uses indexed queries

---

## Accessibility

- [x] Semantic HTML form elements used
- [x] ARIA labels on form inputs ("Email address", "New password", "Confirm password")
- [x] Keyboard navigation supported (tab through form)
- [x] Error messages announced to screen readers
- [x] Success messages have appropriate ARIA roles

---

## Dependencies

**Prerequisites:**
- [x] Existing authentication system (JWT in httpOnly cookies)
- [x] Mailgun account and domain verification
- [x] Profiles table with email and password_hash columns

**External Services:**
- [x] Mailgun API for email delivery (mailgun.js package)
- [x] Database (PostgreSQL via Neon - already configured)

**Blocking Issues:**
- [ ] Mailgun API credentials configuration (MAILGUN_API_KEY, MAILGUN_DOMAIN in .env)

---

## Open Questions

1. **Email Service Provider**: Using Mailgun for email delivery
   - Requires Mailgun API key and domain configuration in .env
   - Free tier: 5,000 emails/month (sufficient for initial deployment)
   - Configuration: MAILGUN_API_KEY, MAILGUN_DOMAIN environment variables
   - Official Node.js SDK: mailgun.js package

2. **Rate Limiting Storage**: Should rate limits be stored in database or in-memory cache (Redis)? Database is simpler but slower; Redis requires additional infrastructure. [Assumption: Database for simplicity, can migrate to Redis if needed]

3. **Token Cleanup**: Should expired tokens be cleaned up immediately or via daily background job? [Assumption: Daily background job to avoid performance impact]

---

## Success Metrics

**How we'll measure success:**
- [x] Users can complete password reset in under 2 minutes (request to sign-in)
- [x] 0 security vulnerabilities introduced (no email enumeration, no weak tokens)
- [x] All acceptance criteria met (reset works, tokens expire, confirmation sent)
- [x] Rate limiting prevents abuse (max 3 requests/email/hour enforced)
- [x] 100% of reset requests result in email delivery (for valid emails)

---

## Appendix

### References
- OWASP Password Reset Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html
- React Router v7 Actions: https://reactrouter.com/en/main/route/action
- Zod Validation: https://zod.dev/
- Argon2 Hashing: https://github.com/napi-rs/node-rs

### Change Log
| Date | Change | Author |
|------|--------|--------|
| 2025-10-16 | Initial specification | Claude Code |
