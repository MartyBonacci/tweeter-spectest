# Implementation Tasks: User Authentication System

**Feature ID:** 001-user-authentication-system
**Created:** 2025-10-12
**Status:** ready-for-implementation

<!-- Tech Stack Validation: PASSED -->
<!-- Validated against: /memory/tech-stack.md v1.0.0 -->
<!-- No prohibited technologies found -->
<!-- 0 unapproved technologies require runtime validation -->

---

## Overview

This document provides a complete task breakdown for implementing the User Authentication System feature. Tasks are organized by user story to enable independent implementation and testing.

**Total Tasks:** 42
**Estimated Time:**
- Sequential execution: ~18-22 hours
- Parallel execution: ~10-12 hours (45% time savings)

**User Stories:**
1. **US1**: New User Signup (P0 - Critical)
2. **US2**: Returning User Signin (P0 - Critical)
3. **US3**: User Signout (P0 - Critical)

---

## Implementation Strategy

**Approach:** Incremental delivery with independent user stories

1. **Phase 1: Setup** - Project initialization and shared infrastructure
2. **Phase 2: Foundational** - Database schema and core auth functions (BLOCKS all user stories)
3. **Phase 3: US1 - Signup** - Complete signup flow (MVP)
4. **Phase 4: US2 - Signin** - Complete signin flow
5. **Phase 5: US3 - Signout** - Complete signout flow
6. **Phase 6: Polish** - Cross-cutting concerns and optimization

**MVP Scope:** Complete Phase 1, 2, and 3 (Signup flow only) for initial launch

**Delivery Increments:**
- Increment 1: Signup flow working end-to-end (Phases 1-3)
- Increment 2: Add signin flow (Phase 4)
- Increment 3: Add signout flow (Phase 5)
- Increment 4: Polish and production-ready (Phase 6)

---

## Phase 1: Setup

**Goal:** Initialize project infrastructure shared by all user stories

**Duration:** 2-3 hours

**Dependencies:** None

**Deliverables:**
- Project configured with TypeScript strict mode
- Database connection established
- Environment variables configured
- Tech stack dependencies installed

### Tasks

**T001**: [Setup] Initialize TypeScript configuration
- **File:** `tsconfig.json`
- **Description:** Create tsconfig.json with strict mode enabled, module resolution configured for Node + React Router v7
- **Details:**
  - Set `"strict": true`
  - Set `"esModuleInterop": true`
  - Set `"skipLibCheck": true`
  - Set `"target": "ES2022"`
  - Set `"module": "ESNext"`
  - Set `"moduleResolution": "Bundler"`
- **Verification:** Run `tsc --noEmit` with no errors
- **Story:** Setup (prerequisite for all)
- **Parallel:** No

**T002**: [Setup] Install core dependencies
- **File:** `package.json`
- **Description:** Install approved libraries from tech-stack.md v1.0.0
- **Details:**
  ```bash
  npm install express @types/express
  npm install react-router react-router-dom @react-router/dev
  npm install postgres uuid zod
  npm install @node-rs/argon2 jsonwebtoken @types/jsonwebtoken
  npm install tailwindcss @tailwindcss/forms flowbite flowbite-react
  npm install --save-dev @types/node typescript vitest
  ```
- **Verification:** All packages in package.json, no installation errors
- **Story:** Setup (prerequisite for all)
- **Parallel:** No (depends on T001)

**T003**: [Setup] Configure environment variables
- **File:** `.env.example`, `src/config/env.ts`
- **Description:** Create .env.example template and environment variable loader
- **Details:**
  - Create .env.example with: DATABASE_URL, JWT_SECRET, NODE_ENV, COOKIE_DOMAIN
  - Create env.ts with Zod validation for required env vars
  - Function: `loadEnv(): { databaseUrl, jwtSecret, nodeEnv, cookieDomain }`
- **Verification:** loadEnv() returns typed config object without errors
- **Story:** Setup (prerequisite for all)
- **Parallel:** [P] (can develop alongside T004)

**T004**: [Setup] Create database connection module
- **File:** `src/db/connection.ts`
- **Description:** Pure function to create PostgreSQL connection using postgres npm package
- **Details:**
  - Function: `createDbConnection(databaseUrl: string): Sql`
  - Use postgres npm package
  - Enable automatic camelCase conversion
  - Connection pool configuration
- **Verification:** Can connect to database, run simple query
- **Story:** Setup (prerequisite for all)
- **Parallel:** [P] (can develop alongside T003)

---

## Phase 2: Foundational

**Goal:** Implement blocking prerequisites required by ALL user stories

**Duration:** 4-5 hours

**Dependencies:** Phase 1 complete

**Deliverables:**
- profiles table created in database
- Core authentication functions implemented and tested
- Zod validation schemas defined

**⚠️ BLOCKER:** No user story can begin until Phase 2 is complete

### Tasks

**T005**: [Foundational] Create profiles table migration
- **File:** `migrations/001_create_profiles_table.sql`
- **Description:** SQL migration to create profiles table with all columns and indexes
- **Details:**
  - Table: profiles (id UUID v7 PK, username VARCHAR(20) UNIQUE, email VARCHAR(255) UNIQUE, password_hash TEXT, bio VARCHAR(160), avatar_url TEXT, created_at TIMESTAMPTZ)
  - Indexes: UNIQUE on username, UNIQUE on email, INDEX on created_at DESC
  - Enable uuid_generate_v7() extension
- **Verification:** Migration runs successfully, table exists with correct schema
- **Story:** Foundational (blocks all user stories)
- **Parallel:** No

**T006**: [Foundational] Create migration runner
- **File:** `src/db/migrate.ts`
- **Description:** Script to run database migrations
- **Details:**
  - Function: `runMigrations(db: Sql): Promise<void>`
  - Reads .sql files from migrations/ folder
  - Tracks applied migrations in migrations table
  - Idempotent (can run multiple times safely)
- **Verification:** Runs T005 migration successfully
- **Story:** Foundational (blocks all user stories)
- **Parallel:** No (depends on T005)

**T007**: [Foundational] Implement password hashing functions
- **File:** `src/auth/password.ts`
- **Description:** Pure functions for password hashing and verification using argon2
- **Details:**
  - Function: `hashPassword(password: string): Promise<string>` - uses @node-rs/argon2
  - Function: `verifyPassword(hash: string, password: string): Promise<boolean>` - timing-constant comparison
  - Use recommended argon2 work factors
- **Verification:** Unit test - hash password, verify correct password returns true, verify incorrect password returns false
- **Story:** Foundational (blocks US1, US2)
- **Parallel:** [P] (independent from T008, T009)

**T008**: [Foundational] Implement JWT token functions
- **File:** `src/auth/jwt.ts`
- **Description:** Pure functions for JWT generation and verification using jsonwebtoken
- **Details:**
  - Function: `generateToken(userId: string, jwtSecret: string): string` - creates JWT with 30d expiration
  - Function: `verifyToken(token: string, jwtSecret: string): { userId: string } | null` - validates and decodes JWT
  - Token payload: { userId, iat, exp }
- **Verification:** Unit test - generate token, verify valid token returns userId, verify invalid token returns null
- **Story:** Foundational (blocks US1, US2, US3)
- **Parallel:** [P] (independent from T007, T009)

**T009**: [Foundational] Implement session factory functions
- **File:** `src/auth/session.ts`
- **Description:** Factory functions for session creation and destruction
- **Details:**
  - Function: `createSession(userId: string, jwtSecret: string, cookieDomain: string): { token: string, cookie: string }` - generates JWT and cookie header
  - Function: `destroySession(cookieDomain: string): string` - returns cookie header to clear session
  - Cookie config: httpOnly, secure (production only), sameSite: 'lax', maxAge: 30 days
- **Verification:** Unit test - createSession returns valid token and Set-Cookie header, destroySession returns cookie with maxAge=0
- **Story:** Foundational (blocks US1, US2, US3)
- **Parallel:** [P] (independent from T007, T008, but uses T008)

**T010**: [Foundational] Define Zod validation schemas
- **File:** `src/schemas/auth.ts`
- **Description:** Shared Zod schemas for authentication validation
- **Details:**
  - Schema: `signupSchema` - username (3-20 chars, alphanumeric + hyphen/underscore), email (valid email), password (min 8 chars)
  - Schema: `signinSchema` - email, password (min 1 char)
  - Schema: `publicUserSchema` - id (UUID), username, email, createdAt (datetime)
  - Schema: `authResponseSchema` - { user: publicUserSchema }
  - Schema: `errorResponseSchema` - { error: string, field?: string }
- **Verification:** Unit test - validate valid inputs pass, invalid inputs throw with error messages
- **Story:** Foundational (blocks US1, US2)
- **Parallel:** [P] (independent from T007-T009)

**T011**: [Foundational] Create TypeScript type definitions
- **File:** `src/types/user.ts`
- **Description:** TypeScript interfaces for user data structures
- **Details:**
  - Interface: `User` - complete user record (id, username, email, passwordHash, bio, avatarUrl, createdAt)
  - Interface: `PublicUser` - safe user data (id, username, email, createdAt)
  - Interface: `SessionData` - JWT payload (userId, username, email)
  - Type: `ProfileRow` - database result (snake_case)
  - Helper: `mapProfileRowToUser(row: ProfileRow): User`
  - Helper: `toPublicUser(user: User): PublicUser`
- **Verification:** TypeScript compilation passes with strict mode
- **Story:** Foundational (blocks all user stories)
- **Parallel:** [P] (independent from T007-T010)

---

## Checkpoint: Phase 2 Complete ✓

**Verification before proceeding to user stories:**
- [ ] profiles table exists in database
- [ ] Password hashing functions tested and working
- [ ] JWT functions tested and working
- [ ] Session factory functions tested and working
- [ ] Zod schemas validated with passing tests
- [ ] TypeScript types compile without errors

**All user stories BLOCKED until this checkpoint passes.**

---

## Phase 3: US1 - New User Signup

**User Story:** As a new visitor, I want to create an account with username, email, and password, so that I can access the platform.

**Goal:** Implement complete signup flow - backend API, frontend form, integration

**Duration:** 4-5 hours

**Dependencies:** Phase 2 complete

**Deliverables:**
- POST /api/auth/signup endpoint working
- SignupForm component functional
- Signup flow working end-to-end

**Test Criteria (US1 Complete):**
- [ ] User can fill signup form with username, email, password
- [ ] Form shows validation errors for invalid inputs (client-side)
- [ ] Form prevents submission with invalid data
- [ ] Duplicate username returns 409 error with message
- [ ] Duplicate email returns 409 error with message
- [ ] Successful signup creates user in database
- [ ] Successful signup establishes session (cookie set)
- [ ] Successful signup redirects to /feed
- [ ] User remains authenticated after page reload

### Tasks

**T012**: [US1] Implement user creation database function
- **File:** `src/db/users.ts`
- **Description:** Pure function to insert new user into profiles table
- **Details:**
  - Function: `createUser(db: Sql, data: { id: string, username: string, email: string, passwordHash: string }): Promise<User>`
  - Use parameterized query
  - Return created user with camelCase mapping
  - Handle unique constraint violations (return null or throw specific error)
- **Verification:** Integration test - create user, verify exists in database
- **Story:** US1 (Signup)
- **Parallel:** [P] (independent from T013)

**T013**: [US1] Implement username/email uniqueness check function
- **File:** `src/db/users.ts`
- **Description:** Pure functions to check if username or email already exists
- **Details:**
  - Function: `usernameExists(db: Sql, username: string): Promise<boolean>`
  - Function: `emailExists(db: Sql, email: string): Promise<boolean>`
  - Use EXISTS queries for performance
- **Verification:** Integration test - create user, check returns true, check non-existent returns false
- **Story:** US1 (Signup)
- **Parallel:** [P] (independent from T012)

**T014**: [US1] Implement POST /api/auth/signup endpoint
- **File:** `src/routes/auth.ts`
- **Description:** Express endpoint for user signup
- **Details:**
  - Endpoint: POST /api/auth/signup
  - Validate request body with signupSchema (Zod)
  - Check username uniqueness (usernameExists)
  - Check email uniqueness (emailExists)
  - Hash password (hashPassword)
  - Generate UUID v7 for user ID
  - Create user (createUser)
  - Generate session (createSession)
  - Return authResponseSchema + Set-Cookie header
  - Error handling: 400 (validation), 409 (duplicate), 500 (server)
- **Verification:** Integration test - POST with valid data returns 200 and cookie, POST with duplicate returns 409
- **Story:** US1 (Signup)
- **Parallel:** No (depends on T012, T013)

**T015**: [US1] Create Express server setup
- **File:** `src/server/app.ts`
- **Description:** Express app configuration with middleware
- **Details:**
  - Configure body parser (express.json())
  - Configure cookie parser
  - Configure CORS (if needed)
  - Mount /api/auth routes
  - Error handling middleware
  - 404 handler
- **Verification:** Server starts on configured port, can receive requests
- **Story:** US1 (Signup)
- **Parallel:** No (depends on T014)

**T016**: [US1] Set up React Router v7 project structure
- **File:** `app/routes.ts`, `app/root.tsx`
- **Description:** Initialize React Router v7 in framework mode with programmatic routing
- **Details:**
  - Create app/routes.ts with empty RouteConfig[] array
  - Create app/root.tsx with Outlet, error boundary
  - Configure Vite for React Router v7
  - Verify programmatic routing (NOT file-based)
- **Verification:** Dev server starts, root route renders
- **Story:** US1 (Signup)
- **Parallel:** [P] (independent from backend tasks T012-T015)

**T017**: [US1] Create Signup page component
- **File:** `app/pages/Signup.tsx`
- **Description:** Signup page wrapper component
- **Details:**
  - Functional component with SignupForm
  - Loader: Redirect to /feed if already authenticated (future)
  - Action: Handle signup form submission
  - Export: default component, loader, action
- **Verification:** Page renders SignupForm component
- **Story:** US1 (Signup)
- **Parallel:** [P] (can develop alongside T018)

**T018**: [US1] Implement SignupForm component
- **File:** `app/components/SignupForm.tsx`
- **Description:** Functional component for signup form with real-time validation
- **Details:**
  - Props: None (uses React Router Form and action)
  - State: useState for username, email, password, validation errors
  - Real-time client-side validation with signupSchema (Zod)
  - Controlled inputs for all fields
  - Display validation errors below each field
  - Submit button disabled if validation fails
  - Use Tailwind CSS + Flowbite for styling
- **Verification:** Component test - renders form fields, shows validation errors on invalid input, enables submit on valid input
- **Story:** US1 (Signup)
- **Parallel:** [P] (can develop alongside T017, independent from backend)

**T019**: [US1] Implement signup action
- **File:** `app/pages/Signup.tsx` (action function)
- **Description:** React Router action to handle signup form submission
- **Details:**
  - Extract formData (username, email, password)
  - Validate with signupSchema (server-side)
  - Call POST /api/auth/signup
  - On success: Extract Set-Cookie, redirect to /feed
  - On error: Return error object to form
  - Handle network errors gracefully
- **Verification:** Submit form → API called → user created → redirected to /feed
- **Story:** US1 (Signup)
- **Parallel:** No (depends on T014, T017, T018)

**T020**: [US1] Add /signup route to routes.ts
- **File:** `app/routes.ts`
- **Description:** Add signup route to programmatic routing configuration
- **Details:**
  - Import Signup page, loader, action
  - Add route: `{ path: '/signup', Component: lazy(() => import('./pages/Signup')), loader: signupLoader, action: signupAction }`
  - Verify RouteConfig[] array structure
- **Verification:** Navigate to /signup → Signup page renders
- **Story:** US1 (Signup)
- **Parallel:** No (depends on T017, T019)

**T021**: [US1] Style SignupForm with Tailwind CSS
- **File:** `app/components/SignupForm.tsx`
- **Description:** Apply Tailwind CSS styling to signup form
- **Details:**
  - Use Flowbite form components (input, label, button)
  - Responsive design (mobile-first)
  - Error messages in red text
  - Focus states for inputs
  - Disabled button state styling
- **Verification:** Form looks polished on desktop and mobile
- **Story:** US1 (Signup)
- **Parallel:** No (depends on T018)

**T022**: [US1] Write integration tests for signup flow
- **File:** `tests/integration/signup.test.ts`
- **Description:** Integration tests for complete signup flow
- **Details:**
  - Test: POST /api/auth/signup with valid data → 200, user created, cookie set
  - Test: POST /api/auth/signup with duplicate username → 409 error
  - Test: POST /api/auth/signup with duplicate email → 409 error
  - Test: POST /api/auth/signup with invalid data → 400 validation error
  - Test: Form submission → API called → redirect to /feed
- **Verification:** All tests pass
- **Story:** US1 (Signup)
- **Parallel:** [P] (can write alongside implementation)

---

## Checkpoint: US1 Complete ✓

**Verification (US1 acceptance criteria):**
- [ ] User can enter username, email, password in signup form
- [ ] System validates inputs and shows clear error messages
- [ ] User receives feedback if username/email taken
- [ ] Upon successful signup, user is automatically signed in
- [ ] User is redirected to /feed after signup

**MVP Launch Ready:** If time-constrained, can launch with just signup flow (users can create accounts)

---

## Phase 4: US2 - Returning User Signin

**User Story:** As a returning user, I want to sign in with email and password, so that I can access my account.

**Goal:** Implement complete signin flow - backend API, frontend form, integration

**Duration:** 3-4 hours

**Dependencies:** Phase 2 complete (Phase 3 optional but recommended)

**Deliverables:**
- POST /api/auth/signin endpoint working
- SigninForm component functional
- Signin flow working end-to-end

**Test Criteria (US2 Complete):**
- [ ] User can fill signin form with email and password
- [ ] Invalid credentials show generic error ("Invalid credentials")
- [ ] Successful signin establishes session (cookie set)
- [ ] Successful signin redirects to /feed
- [ ] User session persists across page reloads

### Tasks

**T023**: [US2] Implement find user by email function
- **File:** `src/db/users.ts`
- **Description:** Pure function to find user by email
- **Details:**
  - Function: `findUserByEmail(db: Sql, email: string): Promise<User | null>`
  - Use parameterized query
  - Return null if not found (not an error)
  - Include password_hash in result (needed for verification)
- **Verification:** Integration test - create user, findUserByEmail returns user, non-existent email returns null
- **Story:** US2 (Signin)
- **Parallel:** [P] (independent from T024)

**T024**: [US2] Implement POST /api/auth/signin endpoint
- **File:** `src/routes/auth.ts`
- **Description:** Express endpoint for user signin
- **Details:**
  - Endpoint: POST /api/auth/signin
  - Validate request body with signinSchema (Zod)
  - Find user by email (findUserByEmail)
  - If user not found: Return 401 "Invalid credentials" (generic error)
  - Verify password (verifyPassword)
  - If password invalid: Return 401 "Invalid credentials" (generic error)
  - Generate session (createSession)
  - Return authResponseSchema + Set-Cookie header
  - Error handling: 400 (validation), 401 (auth failed), 500 (server)
- **Verification:** Integration test - POST with valid credentials returns 200 and cookie, POST with invalid returns 401
- **Story:** US2 (Signin)
- **Parallel:** No (depends on T023)

**T025**: [US2] Create Signin page component
- **File:** `app/pages/Signin.tsx`
- **Description:** Signin page wrapper component
- **Details:**
  - Functional component with SigninForm
  - Loader: Redirect to /feed if already authenticated (future)
  - Action: Handle signin form submission
  - Export: default component, loader, action
- **Verification:** Page renders SigninForm component
- **Story:** US2 (Signin)
- **Parallel:** [P] (can develop alongside T026)

**T026**: [US2] Implement SigninForm component
- **File:** `app/components/SigninForm.tsx`
- **Description:** Functional component for signin form
- **Details:**
  - Props: None (uses React Router Form and action)
  - State: useState for email, password, validation errors
  - Client-side validation with signinSchema (Zod)
  - Controlled inputs for email and password
  - Display generic error message on auth failure
  - Submit button
  - Use Tailwind CSS + Flowbite for styling
- **Verification:** Component test - renders form fields, shows errors, submits via action
- **Story:** US2 (Signin)
- **Parallel:** [P] (can develop alongside T025)

**T027**: [US2] Implement signin action
- **File:** `app/pages/Signin.tsx` (action function)
- **Description:** React Router action to handle signin form submission
- **Details:**
  - Extract formData (email, password)
  - Validate with signinSchema (server-side)
  - Call POST /api/auth/signin
  - On success: Extract Set-Cookie, redirect to /feed
  - On 401: Return "Invalid credentials" error to form
  - On network error: Return generic error
- **Verification:** Submit form → API called → user authenticated → redirected to /feed
- **Story:** US2 (Signin)
- **Parallel:** No (depends on T024, T025, T026)

**T028**: [US2] Add /signin route to routes.ts
- **File:** `app/routes.ts`
- **Description:** Add signin route to programmatic routing configuration
- **Details:**
  - Import Signin page, loader, action
  - Add route: `{ path: '/signin', Component: lazy(() => import('./pages/Signin')), loader: signinLoader, action: signinAction }`
- **Verification:** Navigate to /signin → Signin page renders
- **Story:** US2 (Signin)
- **Parallel:** No (depends on T025, T027)

**T029**: [US2] Create Landing page component
- **File:** `app/pages/Landing.tsx`
- **Description:** Landing page for unauthenticated users
- **Details:**
  - Hero section with app description
  - "Sign up" button (links to /signup)
  - "Sign in" link (links to /signin)
  - Use Tailwind CSS + Flowbite for styling
  - Loader: Redirect to /feed if authenticated (future)
- **Verification:** Landing page renders with signup/signin links
- **Story:** US2 (Signin) - provides navigation to signin
- **Parallel:** [P] (independent task)

**T030**: [US2] Add / (landing) route to routes.ts
- **File:** `app/routes.ts`
- **Description:** Add landing page route to routing configuration
- **Details:**
  - Import Landing page and loader
  - Add route: `{ path: '/', Component: lazy(() => import('./pages/Landing')), loader: landingLoader }`
  - Set as index route
- **Verification:** Navigate to / → Landing page renders
- **Story:** US2 (Signin) - entry point for users
- **Parallel:** No (depends on T029)

**T031**: [US2] Write integration tests for signin flow
- **File:** `tests/integration/signin.test.ts`
- **Description:** Integration tests for complete signin flow
- **Details:**
  - Test: POST /api/auth/signin with valid credentials → 200, cookie set
  - Test: POST /api/auth/signin with invalid email → 401 "Invalid credentials"
  - Test: POST /api/auth/signin with invalid password → 401 "Invalid credentials"
  - Test: POST /api/auth/signin with missing fields → 400 validation error
  - Test: Form submission → API called → redirect to /feed
- **Verification:** All tests pass
- **Story:** US2 (Signin)
- **Parallel:** [P] (can write alongside implementation)

---

## Checkpoint: US2 Complete ✓

**Verification (US2 acceptance criteria):**
- [ ] User can enter email and password in signin form
- [ ] System validates credentials without revealing which field is incorrect
- [ ] Upon successful signin, user is redirected to /feed
- [ ] Failed signin shows generic error message
- [ ] User session persists across browser refreshes

---

## Phase 5: US3 - User Signout

**User Story:** As a signed-in user, I want to sign out, so that others using my device cannot access my account.

**Goal:** Implement complete signout flow - backend API, frontend button, integration

**Duration:** 2-3 hours

**Dependencies:** Phase 2 complete, Phase 4 (signin) recommended

**Deliverables:**
- POST /api/auth/signout endpoint working
- SignoutButton component functional
- Signout flow working end-to-end

**Test Criteria (US3 Complete):**
- [ ] User can trigger signout from any page
- [ ] Session is immediately terminated
- [ ] User is redirected to / (landing) after signout
- [ ] Attempting to access protected pages after signout redirects to /signin

### Tasks

**T032**: [US3] Implement authentication middleware
- **File:** `src/middleware/auth.ts`
- **Description:** Express middleware to verify JWT from cookie
- **Details:**
  - Function: `authenticate(req: Request, res: Response, next: NextFunction)`
  - Extract JWT from cookie
  - Verify token (verifyToken)
  - If valid: Attach userId to req.user, call next()
  - If invalid/missing: Return 401 Unauthorized
  - Use for protected endpoints (signout, future endpoints)
- **Verification:** Integration test - request with valid cookie passes, request without cookie returns 401
- **Story:** US3 (Signout) - required to protect signout endpoint
- **Parallel:** [P] (independent task)

**T033**: [US3] Implement POST /api/auth/signout endpoint
- **File:** `src/routes/auth.ts`
- **Description:** Express endpoint for user signout
- **Details:**
  - Endpoint: POST /api/auth/signout
  - Middleware: authenticate (requires valid JWT)
  - Call destroySession to generate cookie-clearing header
  - Return { success: true } + Set-Cookie header (maxAge=0)
  - Error handling: 401 (not authenticated), 500 (server)
- **Verification:** Integration test - POST with valid cookie returns 200 and clears cookie, POST without cookie returns 401
- **Story:** US3 (Signout)
- **Parallel:** No (depends on T032)

**T034**: [US3] Implement SignoutButton component
- **File:** `app/components/SignoutButton.tsx`
- **Description:** Functional component for signout button
- **Details:**
  - Props: None (uses React Router Form)
  - Renders form with hidden fields
  - Button text: "Sign out"
  - On click: Submits form to signout action
  - Use Tailwind CSS for styling (secondary button style)
- **Verification:** Component test - renders button, clicking triggers form submission
- **Story:** US3 (Signout)
- **Parallel:** [P] (independent from backend)

**T035**: [US3] Implement signout action
- **File:** `app/actions/signout.ts`
- **Description:** React Router action to handle signout
- **Details:**
  - Call POST /api/auth/signout
  - On success: Redirect to / (landing page)
  - On error: Return error (unlikely, but handle gracefully)
  - Clear any client-side state (if applicable)
- **Verification:** Click signout button → API called → cookie cleared → redirected to /
- **Story:** US3 (Signout)
- **Parallel:** No (depends on T033, T034)

**T036**: [US3] Add SignoutButton to navigation
- **File:** `app/components/Navigation.tsx` (or appropriate layout component)
- **Description:** Create navigation component with SignoutButton
- **Details:**
  - Functional component for app navigation
  - Shows different content based on auth status (future)
  - For authenticated users: Show SignoutButton
  - For unauthenticated: Show Signin/Signup links
- **Verification:** Navigation renders, SignoutButton visible for authenticated users
- **Story:** US3 (Signout)
- **Parallel:** No (depends on T034)

**T037**: [US3] Write integration tests for signout flow
- **File:** `tests/integration/signout.test.ts`
- **Description:** Integration tests for complete signout flow
- **Details:**
  - Test: POST /api/auth/signout with valid cookie → 200, cookie cleared
  - Test: POST /api/auth/signout without cookie → 401
  - Test: Signout button click → API called → redirect to /
  - Test: After signout, accessing protected route → redirect to /signin
- **Verification:** All tests pass
- **Story:** US3 (Signout)
- **Parallel:** [P] (can write alongside implementation)

---

## Checkpoint: US3 Complete ✓

**Verification (US3 acceptance criteria):**
- [ ] User can trigger signout from any page
- [ ] Session is immediately terminated upon signout
- [ ] User is redirected to landing page after signout
- [ ] Attempting to access protected pages after signout redirects to signin

---

## Phase 6: Polish & Cross-Cutting Concerns

**Goal:** Production-ready polish, accessibility, and cross-cutting features

**Duration:** 3-4 hours

**Dependencies:** Phases 3, 4, 5 complete

**Deliverables:**
- Route protection (loaders redirect unauthenticated users)
- Root loader (session data available throughout app)
- Accessibility improvements
- Error handling polish

### Tasks

**T038**: [Polish] Implement root loader for session data
- **File:** `app/root.tsx`
- **Description:** Root loader to load session data for entire app
- **Details:**
  - Loader function: Check for JWT cookie
  - If valid: Verify token, load user data
  - Make session available via useLoaderData throughout app
  - If invalid: Return null (unauthenticated state)
- **Verification:** Session data available in all components via useLoaderData
- **Story:** Cross-cutting (benefits all user stories)
- **Parallel:** No (integrates with existing routes)

**T039**: [Polish] Implement loader redirects for auth pages
- **File:** `app/pages/Signup.tsx`, `app/pages/Signin.tsx`, `app/pages/Landing.tsx`
- **Description:** Loaders to redirect authenticated users away from auth pages
- **Details:**
  - signupLoader: If authenticated → redirect to /feed
  - signinLoader: If authenticated → redirect to /feed
  - landingLoader: If authenticated → redirect to /feed
  - Prevents authenticated users from seeing signup/signin forms
- **Verification:** Authenticated user navigates to /signup → redirected to /feed
- **Story:** Cross-cutting (UX improvement for all user stories)
- **Parallel:** No (depends on T038)

**T040**: [Polish] Create placeholder /feed route
- **File:** `app/pages/Feed.tsx`, `app/routes.ts`
- **Description:** Placeholder feed page for authenticated users
- **Details:**
  - Simple page with "Feed" heading
  - Loader: Redirect to /signin if not authenticated
  - Shows SignoutButton in navigation
  - Will be implemented in future feature (002-tweet-posting)
- **Verification:** Authenticated user sees feed page, unauthenticated user redirected to /signin
- **Story:** Cross-cutting (redirect destination for all auth flows)
- **Parallel:** [P] (independent task)

**T041**: [Polish] Add accessibility attributes
- **File:** `app/components/SignupForm.tsx`, `app/components/SigninForm.tsx`
- **Description:** Improve accessibility of form components
- **Details:**
  - Add ARIA labels to all form fields
  - Add aria-describedby for error messages
  - Ensure keyboard navigation (tab order)
  - Add focus visible styles
  - Test with screen reader (VoiceOver, NVDA)
- **Verification:** Forms usable with keyboard only, screen reader announces fields and errors
- **Story:** Cross-cutting (accessibility for US1, US2)
- **Parallel:** [P] (independent polishing task)

**T042**: [Polish] Write end-to-end tests
- **File:** `tests/e2e/auth-flow.spec.ts`
- **Description:** End-to-end tests with Playwright
- **Details:**
  - Test: Complete signup flow (fill form → submit → redirect → reload → still authenticated)
  - Test: Complete signin flow (fill form → submit → redirect → session persists)
  - Test: Complete signout flow (signout → redirect → cannot access protected route)
  - Test: Form validation (invalid inputs → errors shown → correct → submit)
- **Verification:** All E2E tests pass
- **Story:** Cross-cutting (validates all user stories)
- **Parallel:** [P] (can write alongside other polish tasks)

---

## Final Checkpoint: Feature Complete ✓

**Verification (all acceptance criteria met):**

**US1 - Signup:**
- [ ] User can enter username, email, password in signup form
- [ ] System validates inputs and shows clear error messages
- [ ] User receives feedback if username/email taken
- [ ] Upon successful signup, user is automatically signed in
- [ ] User is redirected to /feed after signup

**US2 - Signin:**
- [ ] User can enter email and password in signin form
- [ ] System validates credentials without revealing which field is incorrect
- [ ] Upon successful signin, user is redirected to /feed
- [ ] Failed signin shows generic error message
- [ ] User session persists across browser refreshes

**US3 - Signout:**
- [ ] User can trigger signout from any page
- [ ] Session is immediately terminated upon signout
- [ ] User is redirected to landing page after signout
- [ ] Attempting to access protected pages after signout redirects to signin

**Cross-Cutting:**
- [ ] All TypeScript compilation passes (strict mode)
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] Accessibility requirements met (WCAG AA)
- [ ] Constitution principles verified (functional programming, no classes, Zod validation, programmatic routing, httpOnly cookies)

---

## Dependency Graph

```
Phase 1 (Setup)
  └─> Phase 2 (Foundational) [BLOCKS ALL USER STORIES]
       ├─> Phase 3 (US1 - Signup) [MVP]
       ├─> Phase 4 (US2 - Signin)
       └─> Phase 5 (US3 - Signout)
            └─> Phase 6 (Polish)
```

**Critical Path:** T001 → T002 → T005 → T006 → T007 → T014 → T015 → T019 (Signup working)

**Parallel Opportunities:**
- Phase 2: T007, T008, T009, T010, T011 (all parallelizable)
- Phase 3: T012 ‖ T013 (can develop simultaneously), T016 ‖ T017 ‖ T018 (frontend parallel)
- Phase 4: T023 independent, T025 ‖ T026 (frontend parallel)
- Phase 6: T040, T041, T042 (all parallelizable)

---

## Parallel Execution Examples

**Batch 1 (Phase 2 - Foundational):**
Run in parallel:
- T007 (password hashing)
- T008 (JWT functions)
- T009 (session factory)
- T010 (Zod schemas)
- T011 (TypeScript types)

**Batch 2 (Phase 3 - US1 Backend):**
Run in parallel:
- T012 (createUser function)
- T013 (uniqueness check functions)

**Batch 3 (Phase 3 - US1 Frontend):**
Run in parallel:
- T016 (React Router setup)
- T017 (Signup page)
- T018 (SignupForm component)

**Batch 4 (Phase 6 - Polish):**
Run in parallel:
- T040 (Feed placeholder)
- T041 (Accessibility)
- T042 (E2E tests)

---

## Estimated Time Breakdown

| Phase | Sequential | Parallel | Savings |
|-------|-----------|----------|---------|
| Phase 1: Setup | 2-3h | 2-3h | 0% (sequential setup required) |
| Phase 2: Foundational | 4-5h | 2-3h | 50% (5 tasks parallelizable) |
| Phase 3: US1 - Signup | 4-5h | 3-4h | 25% (some frontend parallel) |
| Phase 4: US2 - Signin | 3-4h | 2-3h | 33% (frontend parallel) |
| Phase 5: US3 - Signout | 2-3h | 2-3h | 0% (mostly sequential) |
| Phase 6: Polish | 3-4h | 1-2h | 50% (3 tasks parallelizable) |
| **Total** | **18-24h** | **12-18h** | **33% average** |

---

## Notes

**MVP Scope:** Phases 1, 2, and 3 (Signup only) = 10-11 hours sequential, 7-9 hours parallel

**Testing Strategy:** Tests are integrated throughout (not separate phase) - each user story includes integration tests

**File Organization:**
```
src/
├── auth/          # Pure functions (password, jwt, session)
├── db/            # Database connection and user queries
├── middleware/    # Express middleware (auth)
├── routes/        # Express endpoints
├── schemas/       # Zod validation schemas
├── types/         # TypeScript interfaces
└── server/        # Express app setup

app/
├── pages/         # React Router page components
├── components/    # React components (forms, buttons)
├── actions/       # React Router actions
└── routes.ts      # Programmatic routing configuration

tests/
├── unit/          # Pure function tests
├── integration/   # API endpoint tests
└── e2e/           # Playwright E2E tests
```

**Constitutional Compliance:**
- ✓ Principle 1: All authentication logic as pure functions (no classes)
- ✓ Principle 2: TypeScript strict mode, Zod validation at all boundaries
- ✓ Principle 3: Programmatic routing in app/routes.ts
- ✓ Principle 4: httpOnly cookies, argon2 hashing, parameterized queries
- ✓ Principle 5: Functional components, React Router loaders/actions (no useEffect)
