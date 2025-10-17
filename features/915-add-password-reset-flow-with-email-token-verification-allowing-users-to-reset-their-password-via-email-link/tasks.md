# Implementation Tasks: Password Reset Flow with Email Token Verification

**Feature ID:** 915
**Created:** 2025-10-16
**Status:** not-started

<!-- Tech Stack Validation: PASSED -->
<!-- Validated against: /memory/tech-stack.md v1.3.0 -->
<!-- No prohibited technologies found -->
<!-- All technologies approved or auto-added -->

---

## Task Organization

Tasks are organized by user story to enable independent implementation and testing.
Each phase represents a complete, testable user story increment.

### Legend
- `[ ]` Not started
- `[~]` In progress
- `[x]` Completed
- `[!]` Blocked
- `[P]` Can be parallelized with other [P] tasks
- `[US1]` User Story 1: Password Reset Request
- `[US2]` User Story 2: Password Reset Completion
- `[US3]` User Story 3: Security & Edge Cases

---

## Phase 1: Setup & Infrastructure

**Goal**: Initialize project dependencies and database schema

### T001: Install Dependencies [P]
- [ ] Install `mailgun.js` v10.x
- [ ] Install `@types/mailgun.js`
- [ ] Verify all existing dependencies up to date
- **File**: `package.json`
- **Principle**: Setup

### T002: Create Database Migration - Password Reset Tokens [P]
- [ ] Create `migrations/001_create_password_reset_tokens_table.sql`
- [ ] Define table: id, profile_id, token_hash, expires_at, used_at, created_at
- [ ] Add indexes: token_hash, profile_id, expires_at
- [ ] Add foreign key constraint to profiles table
- [ ] Test migration up/down
- **File**: `server/migrations/001_create_password_reset_tokens_table.sql`
- **Principle**: Data Layer (snake_case)

### T003: Create Database Migration - Rate Limiting [P]
- [ ] Create `migrations/002_create_password_reset_rate_limits_table.sql`
- [ ] Define table: id, email, requested_at
- [ ] Add indexes: email, requested_at
- [ ] Test migration up/down
- **File**: `server/migrations/002_create_password_reset_rate_limits_table.sql`
- **Principle**: Data Layer (snake_case)

### T004: Run Migrations
- [ ] Execute migrations against local database
- [ ] Verify tables created correctly
- [ ] Verify indexes exist
- [ ] Update database documentation
- **Dependencies**: T002, T003
- **Principle**: Data Layer

---

## Phase 2: Foundational - Core Utilities & Schemas

**Goal**: Build reusable pure functions and type-safe schemas (blocking prerequisites for all user stories)

### T005: Define TypeScript Interfaces [P]
- [ ] Create `server/types/password-reset.ts`
- [ ] Interface: `PasswordResetToken` (camelCase fields)
- [ ] Interface: `PasswordResetRateLimit`
- [ ] Interface: `ForgotPasswordRequest`
- [ ] Interface: `ResetPasswordRequest`
- [ ] Interface: `TokenValidationResult`
- **File**: `server/types/password-reset.ts`
- **Principle 2**: Type Safety

### T006: Create Zod Validation Schemas [P]
- [ ] Create `server/schemas/password-reset.ts`
- [ ] Schema: `forgotPasswordSchema` (email validation)
- [ ] Schema: `resetPasswordSchema` (token + password validation)
- [ ] Schema: `tokenValidationSchema` (validation result)
- [ ] Export all schemas
- **File**: `server/schemas/password-reset.ts`
- **Principle 2**: Type Safety (Zod)

### T007: Implement Pure Token Functions [P]
- [ ] Create `server/utils/password-reset-tokens.ts`
- [ ] Function: `generateResetToken(): string` (crypto.randomUUID)
- [ ] Function: `hashToken(token: string): string` (sha256)
- [ ] Function: `isTokenExpired(expiresAt: Date): boolean`
- [ ] Function: `isTokenUsed(usedAt: Date | null): boolean`
- [ ] All functions pure (no side effects)
- [ ] Add unit tests for each function
- **File**: `server/utils/password-reset-tokens.ts`
- **Principle 1**: Functional Programming (pure functions)

### T008: Implement Rate Limiting Functions [P]
- [ ] Create `server/utils/rate-limiting.ts`
- [ ] Function: `checkRateLimit(email: string): Promise<boolean>`
- [ ] Function: `recordResetRequest(email: string): Promise<void>`
- [ ] Function: `cleanupOldRateLimits(): Promise<void>`
- [ ] Use parameterized queries (postgres package)
- [ ] Add unit tests
- **File**: `server/utils/rate-limiting.ts`
- **Principle 1**: Functional Programming
- **Principle 4**: Security (rate limiting)

### T009: Configure Mailgun Email Service
- [ ] Create `server/services/email.ts`
- [ ] Factory function: `initMailgun()` (returns configured client)
- [ ] Function: `sendPasswordResetEmail(email: string, token: string): Promise<void>`
- [ ] Function: `sendPasswordChangedEmail(email: string): Promise<void>`
- [ ] Load MAILGUN_API_KEY and MAILGUN_DOMAIN from env
- [ ] Handle email errors gracefully
- [ ] Add logging for email events
- **File**: `server/services/email.ts`
- **Principle 1**: Functional Programming (factory functions)
- **Principle 4**: Security (env vars)

---

## Phase 3: User Story 1 - Password Reset Request

**Goal**: User can request password reset via email with rate limiting and no enumeration

**Acceptance Criteria** (from spec.md):
- ✅ User can request password reset by entering email
- ✅ Generic success message shown (valid or invalid email)
- ✅ Rate limiting enforced (max 3/hour per email)
- ✅ Email sent if valid, silent if invalid

### T010: [US1] Implement Forgot Password API Endpoint
- [ ] Create `POST /api/auth/forgot-password` in `server/routes/auth.ts`
- [ ] Validate request body with `forgotPasswordSchema`
- [ ] Check rate limit (call `checkRateLimit`)
- [ ] If limit exceeded: return 429 with error message
- [ ] Query database for profile by email
- [ ] If profile exists:
  - Generate token (call `generateResetToken`)
  - Hash token (call `hashToken`)
  - Store in password_reset_tokens table
  - Send email (call `sendPasswordResetEmail`)
  - Record request (call `recordResetRequest`)
- [ ] If profile doesn't exist:
  - Record request (still rate limit)
  - Skip email sending
- [ ] Return generic success message (same for both cases)
- [ ] Add error handling
- [ ] Write integration tests (valid email, invalid email, rate limit)
- **File**: `server/routes/auth.ts`
- **Dependencies**: T006, T007, T008, T009
- **Principle 2**: Type Safety (Zod validation)
- **Principle 4**: Security (no enumeration, rate limiting)

### T011: [US1] Create Forgot Password Frontend Form Component
- [ ] Create `app/components/ForgotPasswordForm.tsx`
- [ ] Functional component with hooks
- [ ] Props: `{ action?: string }`
- [ ] State: `loading` (boolean), `submitted` (boolean)
- [ ] Email input with Zod validation on blur
- [ ] Submit button (disabled during loading)
- [ ] Show generic success message after submission
- [ ] Use Tailwind + Flowbite styling
- [ ] Add unit tests (React Testing Library)
- **File**: `app/components/ForgotPasswordForm.tsx`
- **Principle 1**: Functional Programming (function component)
- **Principle 5**: Modern React (hooks, controlled component)

### T012: [US1] Create Forgot Password Page Route
- [ ] Create `app/routes/forgot-password.tsx`
- [ ] Page component using `ForgotPasswordForm`
- [ ] Action function: handle form submission to `/api/auth/forgot-password`
- [ ] Use `useActionData()` for form response
- [ ] Add route to `app/routes.ts`: `/forgot-password`
- [ ] Test navigation from signin page
- **File**: `app/routes/forgot-password.tsx`, `app/routes.ts`
- **Dependencies**: T011
- **Principle 3**: Programmatic Routing (app/routes.ts)
- **Principle 5**: Modern React (actions for mutations)

### T013: [US1] Add "Forgot Password?" Link to Sign In Page
- [ ] Open `app/routes/signin.tsx`
- [ ] Add link below password input
- [ ] Link text: "Forgot password?"
- [ ] Link to: `/forgot-password`
- [ ] Style with Tailwind
- **File**: `app/routes/signin.tsx`
- **Dependencies**: T012
- **Principle 5**: Modern React (React Router Link)

**US1 Checkpoint**: User can request password reset, receive email, rate limiting works, no enumeration

---

## Phase 4: User Story 2 - Password Reset Completion

**Goal**: User can reset password using valid token and be signed in

**Acceptance Criteria** (from spec.md):
- ✅ User can set new password using reset link
- ✅ Token validated (exists, not expired, not used)
- ✅ Password meets strength requirements
- ✅ User automatically signed in after reset
- ✅ Token marked as used

### T014: [US2] Implement Verify Token API Endpoint
- [ ] Create `GET /api/auth/verify-reset-token/:token` in `server/routes/auth.ts`
- [ ] Validate token format (UUID)
- [ ] Hash incoming token
- [ ] Query password_reset_tokens table by token_hash
- [ ] Join with profiles to get email
- [ ] Check expiration (call `isTokenExpired`)
- [ ] Check if used (call `isTokenUsed`)
- [ ] Return validation result with email if valid
- [ ] Return 404 if invalid/expired/used
- [ ] Write integration tests
- **File**: `server/routes/auth.ts`
- **Dependencies**: T007
- **Principle 2**: Type Safety (Zod)
- **Principle 4**: Security (token validation)

### T015: [US2] Implement Reset Password API Endpoint
- [ ] Create `POST /api/auth/reset-password` in `server/routes/auth.ts`
- [ ] Validate request body with `resetPasswordSchema`
- [ ] Verify token (same logic as T014)
- [ ] If invalid/expired/used: return 404 or 410
- [ ] Hash new password with argon2
- [ ] Update profiles.password_hash
- [ ] Mark token as used (set used_at = NOW())
- [ ] Create JWT session (httpOnly cookie)
- [ ] Send confirmation email (call `sendPasswordChangedEmail`)
- [ ] Return success response
- [ ] Write integration tests (valid token, expired, used, weak password)
- **File**: `server/routes/auth.ts`
- **Dependencies**: T006, T007, T009
- **Principle 2**: Type Safety (Zod password validation)
- **Principle 4**: Security (argon2 hashing, JWT in httpOnly cookie)

### T016: [US2] Create Reset Password Form Component [P]
- [ ] Create `app/components/ResetPasswordForm.tsx`
- [ ] Functional component with hooks
- [ ] Props: `{ token: string, email: string }`
- [ ] State: `password`, `confirmPassword`, `showPassword`, `loading`
- [ ] Password input with strength indicator (real-time)
- [ ] Confirm password input with match validation
- [ ] Show/hide password toggle
- [ ] Submit button (disabled if passwords don't match)
- [ ] Use Tailwind + Flowbite styling
- [ ] Add unit tests
- **File**: `app/components/ResetPasswordForm.tsx`
- **Principle 1**: Functional Programming (function component)
- **Principle 5**: Modern React (hooks, controlled component)

### T017: [US2] Create Reset Password Page Route
- [ ] Create `app/routes/reset-password.$token.tsx`
- [ ] Loader: call `GET /api/auth/verify-reset-token/:token`
- [ ] If token invalid: show error message with link to /forgot-password
- [ ] If token valid: show `ResetPasswordForm` with email
- [ ] Action: submit to `POST /api/auth/reset-password`
- [ ] On success: redirect to `/feed` (user signed in)
- [ ] Add route to `app/routes.ts`: `/reset-password/:token`
- [ ] Test with valid/invalid/expired tokens
- **File**: `app/routes/reset-password.$token.tsx`, `app/routes.ts`
- **Dependencies**: T014, T015, T016
- **Principle 3**: Programmatic Routing (app/routes.ts)
- **Principle 5**: Modern React (loader for data, action for mutation)

**US2 Checkpoint**: User can complete password reset, token validation works, user signed in

---

## Phase 5: User Story 3 - Security & Edge Cases

**Goal**: Handle token expiration, reuse prevention, and confirmation emails

**Acceptance Criteria** (from spec.md):
- ✅ Tokens expire after 1 hour
- ✅ Expired token shows clear error message
- ✅ Used token cannot be reused
- ✅ User receives confirmation email

### T018: [US3] Add Token Expiration Error Handling [P]
- [ ] Update `ResetPasswordPage` loader
- [ ] Detect expired token (loader returns error)
- [ ] Show error: "This reset link has expired"
- [ ] Provide "Request new reset link" button → /forgot-password
- [ ] Test with expired token
- **File**: `app/routes/reset-password.$token.tsx`
- **Dependencies**: T017
- **Principle 5**: Modern React (error states)

### T019: [US3] Add Used Token Error Handling [P]
- [ ] Update `POST /api/auth/reset-password` endpoint
- [ ] Return 410 status if token already used
- [ ] Update `ResetPasswordPage` action
- [ ] Show error: "This reset link has already been used"
- [ ] Provide "Request new reset link" button → /forgot-password
- [ ] Test with used token
- **File**: `server/routes/auth.ts`, `app/routes/reset-password.$token.tsx`
- **Dependencies**: T015, T017
- **Principle 4**: Security (single-use tokens)

### T020: [US3] Test Confirmation Email Delivery
- [ ] Verify `sendPasswordChangedEmail` called after successful reset
- [ ] Test email content includes timestamp
- [ ] Test email sent to correct address
- [ ] Add integration test
- **File**: `server/routes/auth.ts` (tests)
- **Dependencies**: T015
- **Principle 4**: Security (user notification)

### T021: [US3] Create Background Job for Token Cleanup
- [ ] Create `server/jobs/cleanup-password-reset-tokens.ts`
- [ ] Function: `cleanupExpiredTokens(): Promise<void>`
- [ ] Delete tokens where expires_at < NOW() - 24 hours
- [ ] Delete rate limits where requested_at < NOW() - 24 hours
- [ ] Add logging
- [ ] Document cron schedule (daily at 2 AM)
- **File**: `server/jobs/cleanup-password-reset-tokens.ts`
- **Principle 1**: Functional Programming (pure function)

**US3 Checkpoint**: All edge cases handled, security measures verified, cleanup job ready

---

## Phase 6: Integration & Polish

**Goal**: End-to-end testing, documentation, and final validation

### T022: End-to-End Testing - Happy Path
- [ ] Test complete flow: request → email → reset → signin
- [ ] Verify email received within 1 minute
- [ ] Verify token link works
- [ ] Verify password updated
- [ ] Verify user signed in (JWT cookie set)
- [ ] Verify confirmation email sent
- [ ] Document test results
- **Dependencies**: T010, T015, T017
- **Principle**: Integration Testing

### T023: End-to-End Testing - Error Scenarios [P]
- [ ] Test expired token (mock time)
- [ ] Test used token (reset password twice)
- [ ] Test invalid token (random UUID)
- [ ] Test rate limiting (4 requests rapidly)
- [ ] Test weak password (various violations)
- [ ] Test email enumeration (valid vs invalid email returns same)
- [ ] Document test results
- **Principle 4**: Security Testing

### T024: Accessibility Audit [P]
- [ ] Test keyboard navigation (tab through forms)
- [ ] Test screen reader (NVDA/VoiceOver)
- [ ] Verify ARIA labels on inputs
- [ ] Verify error messages announced
- [ ] Verify color contrast (WCAG 2.1 AA)
- [ ] Fix any accessibility issues found
- **Principle 5**: Modern React (accessibility)

### T025: Update API Documentation
- [ ] Document `POST /api/auth/forgot-password` in `docs/api.md`
- [ ] Document `GET /api/auth/verify-reset-token/:token`
- [ ] Document `POST /api/auth/reset-password`
- [ ] Include request/response examples
- [ ] Include error codes and meanings
- [ ] Update OpenAPI spec if exists
- **File**: `docs/api.md`

### T026: Update User Documentation
- [ ] Create `docs/password-reset.md`
- [ ] How to reset password
- [ ] What to do if email doesn't arrive
- [ ] Security best practices
- [ ] FAQs
- **File**: `docs/password-reset.md`

### T027: Update Developer Documentation
- [ ] Create `docs/dev/password-reset.md`
- [ ] Architecture overview
- [ ] Token lifecycle diagram
- [ ] Mailgun configuration guide
- [ ] Testing guide
- [ ] Troubleshooting section
- **File**: `docs/dev/password-reset.md`

### T028: Update Project Context Files
- [ ] Update `CLAUDE.md`:
  - Add password reset endpoints to API Endpoints section
  - Add /forgot-password and /reset-password to Frontend Routes
  - Add Mailgun to Tech Stack Details (External Services)
- [ ] Update `.env.example`:
  - Add MAILGUN_API_KEY=your_mailgun_api_key
  - Add MAILGUN_DOMAIN=mg.yourdomain.com
- [ ] Update README.md if needed
- **Files**: `CLAUDE.md`, `.env.example`, `README.md`

---

## Constitution Compliance Checklist

Before marking feature complete, verify all principles:

### Principle 1: Functional Programming
- [x] All business logic in pure functions (token utils, rate limiting)
- [x] No class declarations (except Mailgun client - third-party)
- [x] Factory functions used (initMailgun)
- [x] Function composition over inheritance

### Principle 2: Type Safety
- [x] TypeScript interfaces defined (PasswordResetToken, etc.)
- [x] Zod schemas for all boundaries (email, password, token)
- [x] No `any` types (or documented exceptions)
- [x] Frontend validation (UX) and backend validation (security)

### Principle 3: Programmatic Routing
- [x] Routes in app/routes.ts only (/forgot-password, /reset-password/:token)
- [x] Loaders for data fetching (token validation)
- [x] Actions for mutations (password reset)
- [x] No file-based routes

### Principle 4: Security-First
- [x] Tokens hashed before storage (sha256)
- [x] Passwords hashed with argon2
- [x] JWT in httpOnly cookies only
- [x] Rate limiting enforced (3 requests/hour/email)
- [x] No email enumeration (generic success message)
- [x] Parameterized database queries
- [x] Input validation with Zod

### Principle 5: Modern React
- [x] Functional components only (no classes)
- [x] Hooks for state (useState, custom hooks)
- [x] Loaders for data fetching (not useEffect)
- [x] Actions for form submissions
- [x] Controlled components for forms

---

## Task Summary

**Total Tasks**: 28

**By Phase**:
- Phase 1 (Setup): 4 tasks
- Phase 2 (Foundation): 5 tasks
- Phase 3 (US1 - Request): 4 tasks
- Phase 4 (US2 - Completion): 4 tasks
- Phase 5 (US3 - Security): 4 tasks
- Phase 6 (Polish): 7 tasks

**By User Story**:
- Setup & Foundation: 9 tasks
- User Story 1 (Request): 4 tasks
- User Story 2 (Completion): 4 tasks
- User Story 3 (Security): 4 tasks
- Integration & Polish: 7 tasks

**Parallel Opportunities**:
- Phase 1: T001, T002, T003 (3 parallel)
- Phase 2: T005, T006, T007, T008 (4 parallel)
- Phase 5: T018, T019 (2 parallel)
- Phase 6: T023, T024 (2 parallel)

**Estimated Completion**: 4-6 hours for experienced developer

---

## Execution Strategy

### MVP Scope (User Story 1 + 2)
Minimum viable product includes:
- Phase 1: Setup & Infrastructure (T001-T004)
- Phase 2: Foundational (T005-T009)
- Phase 3: User Story 1 (T010-T013) - Request flow
- Phase 4: User Story 2 (T014-T017) - Completion flow

**Delivers**: Complete password reset flow with basic security

### Full Feature (All User Stories)
- Add Phase 5: User Story 3 (T018-T021) - Security & edge cases
- Add Phase 6: Integration & Polish (T022-T028)

**Delivers**: Production-ready feature with comprehensive error handling, testing, and documentation

---

## Dependencies Graph

```
Setup (T001-T004)
    ↓
Foundation (T005-T009)
    ↓
    ├─→ US1: Request Flow (T010-T013)
    ├─→ US2: Completion Flow (T014-T017)
    └─→ US3: Security & Edge Cases (T018-T021)
            ↓
        Integration & Polish (T022-T028)
```

**Critical Path**: T001 → T004 → T005-T009 → T010 → T014 → T015 → T017 → T022

**Parallel Paths**:
- Frontend components (T011, T016) can be built while backend endpoints (T010, T014-T015) are developed
- Documentation (T025-T028) can be written in parallel with testing (T022-T024)

---

## Blockers

| Blocker | Impact | Resolution | Owner |
|---------|--------|------------|-------|
| Mailgun account not set up | High | Create Mailgun account, verify domain, add API key to .env | Developer |
| Database migration fails | High | Debug migration script, check PostgreSQL version compatibility | Developer |
| None currently | - | - | - |

---

## Notes

**Design Decisions**:
1. Token hashing uses sha256 (one-way) instead of encryption - no need to decrypt, only verify match
2. Rate limiting stored in database (not Redis) for simplicity - can migrate later if performance issues
3. 1-hour token expiration balances security vs UX (OWASP recommendation)
4. Generic success message critical for security (prevents email enumeration)
5. Mailgun chosen for better deliverability vs raw SMTP

**Testing Strategy**:
- Unit tests for pure functions (token utils, rate limiting)
- Integration tests for API endpoints
- E2E tests for complete user flows
- Manual testing for email delivery and UX

**Future Enhancements** (out of scope for this feature):
- SMS-based password reset
- Multi-factor authentication requirement
- Account lockout after N failed attempts
- Password reset history log (audit trail)
- Admin dashboard for reset metrics

---

**Ready to implement!** Start with Phase 1 (Setup) and progress sequentially through each user story.
