# Implementation Tasks: User Profile System

**Feature ID:** 004-user-profile-system
**Created:** 2025-10-12
**Status:** ready-for-implementation

---

## Task Summary

**Total Tasks:** 30
**User Stories:** 3
**Estimated Time:** 12-18 hours (sequential), 8-12 hours (parallel)
**Parallel Tasks:** 20 (67%)
**Sequential Tasks:** 10 (33%)

**External Dependencies:**
- Feature 001 (User Authentication System) - MUST be complete
- Feature 002 (Tweet Posting and Feed System) - MUST be complete
- Cloudinary account configured with API credentials

---

## User Story Mapping

### US1: View Own Profile
**Story:** As an authenticated Tweeter user, I want to view my own profile page, so that I can see how I appear to others and access my profile settings.

**Tasks:** T01, T02, T03, T04, T05, T10, T14, T15, T16, T23

### US2: Edit Profile
**Story:** As an authenticated Tweeter user, I want to edit my bio and avatar, so that I can personalize my profile and express my identity.

**Tasks:** T06, T07, T08, T09, T11, T12, T13, T17, T18, T19, T20, T24, T25

### US3: View Other Users' Profiles
**Story:** As any Tweeter user, I want to view another user's profile by clicking their username, so that I can learn about them and see their tweets.

**Tasks:** T10, T21, T22, T26

---

## Phase 1: Foundational Setup (BLOCKS All User Stories)

**Purpose:** Verify database schema and create TypeScript type definitions required by all features.
**Blocking:** All subsequent tasks depend on this phase.
**Estimated Time:** 1-2 hours (mostly parallel)

### T01: Verify profiles table schema
**Type:** sequential
**Priority:** critical
**Blocks:** All subsequent tasks
**Estimated Time:** 20 minutes

**Description:**
Verify that profiles table has bio and avatar_url columns from Feature 001, no migration needed.

**Acceptance Criteria:**
- [ ] Query profiles table schema to confirm columns exist
- [ ] Verify bio column: VARCHAR(160), nullable
- [ ] Verify avatar_url column: TEXT, nullable
- [ ] Verify username unique index exists
- [ ] Document schema verification in console output
- [ ] If columns missing: Create migration to add them

**Files to Check:**
- Database: `profiles` table

**Technical Notes:**
- Use SQL query: `SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'profiles';`
- Feature 001 should have created these columns
- No new indexes needed (username already indexed)

---

### T02: Define profile TypeScript types
**Type:** parallel (can start after T01)
**Priority:** high
**Blocks:** T03, T04, T05, T06, T07, T08
**Estimated Time:** 30 minutes

**Description:**
Define TypeScript interfaces for profile data structures including public and private profiles.

**Acceptance Criteria:**
- [ ] `User` interface defined (id, username, email, passwordHash, bio, avatarUrl, createdAt)
- [ ] `PublicProfile` interface defined (id, username, bio, avatarUrl, createdAt) - no email/password
- [ ] `ProfileWithStats` interface defined (extends PublicProfile with tweetCount)
- [ ] `ProfileRow` interface for database results (snake_case)
- [ ] `toPublicProfile()` helper function converts User → PublicProfile
- [ ] `mapProfileRowToUser()` helper function converts snake_case → camelCase
- [ ] All types exported from types file

**Files to Create/Modify:**
- `app/types/profile.ts` (new)
- `app/types/index.ts` (export profile types)

**Technical Notes:**
- Strict TypeScript mode
- Never expose email or passwordHash in PublicProfile
- Application layer uses camelCase

---

### T03: Define Zod validation schemas
**Type:** parallel (depends on T02)
**Priority:** high
**Blocks:** T06, T07, T08
**Estimated Time:** 30 minutes

**Description:**
Create Zod schemas for bio validation, avatar file validation, and profile update requests.

**Acceptance Criteria:**
- [ ] `bioSchema` validates string length (0-160 characters)
- [ ] `bioUpdateSchema` validates bio update request
- [ ] `avatarFileSchema` validates file type (JPEG, PNG, GIF) and size (max 5MB)
- [ ] `updateProfileRequestSchema` validates PUT /api/profiles/:username request
- [ ] Error messages user-friendly ("Bio must be 160 characters or less")
- [ ] All schemas exported

**Files to Create:**
- `app/schemas/profile.ts` (new)

**Technical Notes:**
- Bio: max 160 characters, optional/nullable
- Avatar: MIME types ['image/jpeg', 'image/png', 'image/gif']
- File size: 5 MB limit (5 * 1024 * 1024 bytes)

---

## Phase 2: Backend - Profile API (US1, US3)

**Purpose:** Implement server-side profile retrieval and display logic.
**Depends On:** Phase 1 (T01, T02, T03)
**Estimated Time:** 2-3 hours (mostly parallel)

### T04: Implement getProfileByUsername function
**Type:** parallel (depends on T02)
**Priority:** high
**Blocks:** T10, T14
**Estimated Time:** 30 minutes
**User Story:** US1, US3

**Description:**
Create pure async function that queries profiles table by username and returns PublicProfile.

**Acceptance Criteria:**
- [ ] Function signature: `async function getProfileByUsername(username: string): Promise<PublicProfile | null>`
- [ ] Queries profiles table WHERE username = $1 (case-insensitive)
- [ ] Uses parameterized query (SQL injection prevention)
- [ ] Returns null if user not found
- [ ] Converts database row to PublicProfile (removes email, passwordHash)
- [ ] Function is pure (no side effects beyond database read)

**Files to Create:**
- `app/models/profile.server.ts`

**Technical Notes:**
- Use postgres npm package
- Map snake_case to camelCase
- Never expose email or password_hash

---

### T05: Implement getUserTweets function
**Type:** parallel (depends on T02)
**Priority:** high
**Blocks:** T10, T14
**Estimated Time:** 30 minutes
**User Story:** US1, US3

**Description:**
Create pure async function that retrieves all tweets from a specific user by username.

**Acceptance Criteria:**
- [ ] Function signature: `async function getUserTweets(username: string, currentUserId?: string): Promise<TweetWithLikes[]>`
- [ ] Queries tweets table filtered by profile_id (from username lookup)
- [ ] LEFT JOINs likes table for like counts
- [ ] Includes EXISTS check for current user's like status (if authenticated)
- [ ] Orders by created_at DESC (newest first)
- [ ] Uses parameterized queries
- [ ] Returns empty array if user has no tweets

**Files to Create/Modify:**
- `app/models/tweet.server.ts` (add getUserTweets function)

**Technical Notes:**
- Reuses like count logic from Feature 003
- Profile_id indexed in Feature 002
- Handle null currentUserId (unauthenticated)

---

### T06: Implement updateProfileBio function
**Type:** parallel (depends on T02, T03)
**Priority:** high
**Blocks:** T12
**Estimated Time:** 30 minutes
**User Story:** US2

**Description:**
Create pure async function that updates bio field for a user profile.

**Acceptance Criteria:**
- [ ] Function signature: `async function updateProfileBio(userId: string, bio: string): Promise<PublicProfile>`
- [ ] Validates bio length with Zod schema (0-160 chars)
- [ ] Sanitizes bio content (XSS prevention - strip HTML tags)
- [ ] Updates profiles table WHERE id = $1
- [ ] Uses parameterized query
- [ ] Returns updated PublicProfile
- [ ] Function is pure

**Files to Modify:**
- `app/models/profile.server.ts`

**Technical Notes:**
- Use Zod parse with bioUpdateSchema
- Sanitize: Remove/escape HTML tags
- RETURNING clause for updated record

---

### T07: Implement updateProfileAvatar function
**Type:** parallel (depends on T02)
**Priority:** high
**Blocks:** T13
**Estimated Time:** 20 minutes
**User Story:** US2

**Description:**
Create pure async function that updates avatar_url field for a user profile.

**Acceptance Criteria:**
- [ ] Function signature: `async function updateProfileAvatar(userId: string, avatarUrl: string): Promise<PublicProfile>`
- [ ] Validates avatarUrl is valid URL format
- [ ] Updates profiles table WHERE id = $1 SET avatar_url = $2
- [ ] Uses parameterized query
- [ ] Returns updated PublicProfile
- [ ] Function is pure

**Files to Modify:**
- `app/models/profile.server.ts`

**Technical Notes:**
- URL validation via Zod
- Avatar URL set only after successful Cloudinary upload
- RETURNING clause

---

### T08: Configure Cloudinary SDK
**Type:** parallel (depends on T03)
**Priority:** high
**Blocks:** T09
**Estimated Time:** 30 minutes
**User Story:** US2

**Description:**
Install and configure Cloudinary Node.js SDK with environment variables for avatar uploads.

**Acceptance Criteria:**
- [ ] Cloudinary npm package installed (`npm install cloudinary`)
- [ ] Environment variables documented: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
- [ ] Cloudinary config initialized in server code
- [ ] Upload configuration defined (folder: "avatars", transformations)
- [ ] Configuration validated on server startup
- [ ] Error handling for missing credentials

**Files to Create/Modify:**
- `package.json` (add cloudinary dependency)
- `app/lib/cloudinary.server.ts` (new - config and helpers)
- `.env.example` (document required variables)

**Technical Notes:**
- Use Cloudinary v2 API
- Folder structure: avatars/{userId}
- Auto-optimize and auto-format transformations

---

### T09: Implement uploadAvatarToCloudinary function
**Type:** sequential (depends on T08)
**Priority:** high
**Blocks:** T13
**Estimated Time:** 45 minutes
**User Story:** US2

**Description:**
Create pure async function that uploads image file to Cloudinary and returns secure URL.

**Acceptance Criteria:**
- [ ] Function signature: `async function uploadAvatarToCloudinary(fileBuffer: Buffer, userId: string): Promise<string>`
- [ ] Accepts file buffer from multipart upload
- [ ] Uploads to Cloudinary via SDK (v2.uploader.upload)
- [ ] Sets folder to "avatars"
- [ ] Uses userId as public_id for easier management
- [ ] Returns secure_url from Cloudinary response
- [ ] Handles upload errors gracefully
- [ ] Function is pure (no side effects beyond upload)

**Files to Modify:**
- `app/lib/cloudinary.server.ts`

**Technical Notes:**
- Use upload_stream for buffer uploads
- Apply transformations: auto quality, auto format
- Return secure_url (HTTPS)

---

### T10: Implement GET /api/profiles/:username endpoint
**Type:** sequential (depends on T04, T05)
**Priority:** high
**Blocks:** T14, T21
**Estimated Time:** 45 minutes
**User Story:** US1, US3

**Description:**
Create API endpoint for retrieving public profile data and user's tweets.

**Acceptance Criteria:**
- [ ] Route: GET /api/profiles/:username
- [ ] No authentication required (public endpoint)
- [ ] Calls getProfileByUsername(username)
- [ ] Returns 404 if user not found
- [ ] Response includes profile data (username, bio, avatarUrl, createdAt)
- [ ] Optionally includes tweet count (COUNT from tweets table)
- [ ] Returns 200 with profile object on success
- [ ] Returns 500 for server errors

**Files to Create/Modify:**
- `app/routes/api/profiles.ts` (new)
- `app/routes.ts` (register route)

**Technical Notes:**
- Username lookup case-insensitive
- Never expose email or password_hash
- Aggregate tweet count via LEFT JOIN

---

### T11: Implement GET /api/tweets/user/:username endpoint
**Type:** parallel (depends on T05)
**Priority:** high
**Blocks:** T14
**Estimated Time:** 30 minutes
**User Story:** US1, US3

**Description:**
Create API endpoint for retrieving all tweets from a specific user.

**Acceptance Criteria:**
- [ ] Route: GET /api/tweets/user/:username
- [ ] No authentication required (public endpoint)
- [ ] Calls getUserTweets(username, currentUserId)
- [ ] Returns 404 if user not found
- [ ] Response includes array of tweets with like data
- [ ] Returns 200 with tweets array on success
- [ ] Handles unauthenticated users (isLikedByUser = false)

**Files to Create/Modify:**
- `app/routes/api/tweets.ts` (add new endpoint)

**Technical Notes:**
- Reuses TweetWithLikes type from Feature 003
- Extract currentUserId from session if authenticated

---

### T12: Implement PUT /api/profiles/:username endpoint
**Type:** sequential (depends on T06)
**Priority:** high
**Blocks:** T19
**Estimated Time:** 45 minutes
**User Story:** US2

**Description:**
Create API endpoint for updating user profile bio with authentication and authorization.

**Acceptance Criteria:**
- [ ] Route: PUT /api/profiles/:username
- [ ] Validates request body with updateProfileRequestSchema
- [ ] Requires authentication (JWT middleware)
- [ ] Returns 401 if not authenticated
- [ ] Verifies user is updating their own profile (session.userId === profile.id)
- [ ] Returns 403 if attempting to update another user's profile
- [ ] Calls updateProfileBio(userId, bio)
- [ ] Returns 200 with updated profile on success
- [ ] Returns 400 for validation errors (bio > 160 chars)
- [ ] Returns 404 if profile not found

**Files to Modify:**
- `app/routes/api/profiles.ts`

**Technical Notes:**
- Use authentication middleware from Feature 001
- Compare session userId to profile owner
- Sanitize bio before storage

---

### T13: Implement POST /api/profiles/avatar endpoint
**Type:** sequential (depends on T07, T09)
**Priority:** high
**Blocks:** T20
**Estimated Time:** 1 hour
**User Story:** US2

**Description:**
Create API endpoint for uploading avatar image with multipart form data handling.

**Acceptance Criteria:**
- [ ] Route: POST /api/profiles/avatar
- [ ] Handles multipart/form-data with "avatar" field
- [ ] Requires authentication (JWT middleware)
- [ ] Returns 401 if not authenticated
- [ ] Validates file type (JPEG, PNG, GIF) on server
- [ ] Validates file size (max 5 MB) on server
- [ ] Returns 400 for invalid file type or size
- [ ] Calls uploadAvatarToCloudinary(fileBuffer, userId)
- [ ] Calls updateProfileAvatar(userId, avatarUrl)
- [ ] Returns 200 with { avatarUrl } on success
- [ ] Returns 500 if upload fails
- [ ] Handles upload errors gracefully

**Files to Modify:**
- `app/routes/api/profiles.ts`

**Technical Notes:**
- Use multipart parser (e.g., multer or busboy)
- Validate MIME type on server (don't trust client)
- Clean up temp files after upload

---

### T14: Write integration tests for profile endpoints
**Type:** parallel (depends on T10, T11, T12, T13)
**Priority:** medium
**Blocks:** None
**Estimated Time:** 1 hour
**User Story:** US1, US2, US3

**Description:**
Write comprehensive integration tests for all profile API endpoints.

**Acceptance Criteria:**
- [ ] Test GET /api/profiles/:username with valid username - 200 success
- [ ] Test GET /api/profiles/:username with invalid username - 404 error
- [ ] Test GET /api/tweets/user/:username returns user's tweets only
- [ ] Test PUT /api/profiles/:username with valid bio (authenticated, own profile) - 200
- [ ] Test PUT /api/profiles/:username with bio > 160 chars - 400 error
- [ ] Test PUT /api/profiles/:username without authentication - 401 error
- [ ] Test PUT /api/profiles/:username for another user's profile - 403 error
- [ ] Test POST /api/profiles/avatar with valid image - 200 success
- [ ] Test POST /api/profiles/avatar with invalid file type - 400 error
- [ ] Test POST /api/profiles/avatar without authentication - 401 error
- [ ] All tests pass

**Files to Create:**
- `app/routes/api/__tests__/profiles.test.ts`

**Technical Notes:**
- Use test database
- Create test fixtures (users, tweets)
- Mock Cloudinary uploads for tests
- Clean up after each test

---

## Phase 3: Frontend - Profile Viewing (US1, US3)

**Purpose:** Create UI components for displaying user profiles.
**Depends On:** Phase 2
**Estimated Time:** 2-3 hours (mostly parallel)

### T15: Implement ProfileHeader component
**Type:** parallel (depends on T02, T10)
**Priority:** high
**Blocks:** T16, T21
**Estimated Time:** 1 hour
**User Story:** US1, US3

**Description:**
Create functional React component that displays profile information with conditional edit button.

**Acceptance Criteria:**
- [ ] Functional component with props: profile (PublicProfile), isOwnProfile (boolean)
- [ ] Displays avatar (or default placeholder if avatarUrl is null)
- [ ] Displays username as page heading
- [ ] Displays bio (or "No bio yet" if bio is null)
- [ ] Displays tweet count (if provided)
- [ ] Shows "Edit Profile" link/button if isOwnProfile=true, links to /settings
- [ ] No edit button if isOwnProfile=false
- [ ] Styled with Tailwind CSS (avatar circle, typography)
- [ ] Responsive design (mobile-friendly)
- [ ] Accessible (semantic HTML, alt text for avatar)

**Files to Create:**
- `app/components/ProfileHeader.tsx`

**Technical Notes:**
- Default avatar: Use placeholder service or static default image
- Avatar: rounded-full class for circle
- Use Flowbite typography components

---

### T16: Implement /profile/:username route
**Type:** sequential (depends on T10, T11, T15)
**Priority:** high
**Blocks:** T23, T26
**Estimated Time:** 45 minutes
**User Story:** US1, US3

**Description:**
Create profile page route with loader that fetches profile data and user's tweets.

**Acceptance Criteria:**
- [ ] Route added to app/routes.ts: `/profile/:username`
- [ ] Loader fetches profile via GET /api/profiles/:username
- [ ] Loader fetches user's tweets via GET /api/tweets/user/:username
- [ ] Loader handles 404 (user not found) - throws 404 response
- [ ] Loader determines isOwnProfile (compare session userId to profile.id)
- [ ] Page component renders ProfileHeader with profile data, isOwnProfile
- [ ] Page component renders TweetList with user's tweets (reuse from Feature 002)
- [ ] Empty state shown if user has no tweets ("No tweets yet")
- [ ] Page title set to username (e.g., "@alice's Profile")
- [ ] Handle loading and error states

**Files to Create/Modify:**
- `app/routes/profile.$username.tsx` (new)
- `app/routes.ts` (register route)

**Technical Notes:**
- Use React Router v7 loader pattern
- Reuse TweetList component from Feature 002
- Extract session from cookies in loader

---

## Phase 4: Frontend - Profile Editing (US2)

**Purpose:** Create UI for editing profile information.
**Depends On:** Phase 2, Phase 3
**Estimated Time:** 3-4 hours (mostly sequential)

### T17: Implement SettingsForm component
**Type:** parallel (depends on T02, T03)
**Priority:** high
**Blocks:** T18, T24
**Estimated Time:** 1.5 hours
**User Story:** US2

**Description:**
Create functional React component with controlled form for bio editing and avatar upload.

**Acceptance Criteria:**
- [ ] Functional component with Form action submission
- [ ] Controlled textarea for bio (useState)
- [ ] Real-time character counter displays remaining characters (160 - bio.length)
- [ ] Character counter updates on every keystroke
- [ ] Character counter shows red when limit exceeded
- [ ] File input for avatar upload
- [ ] Image preview displayed after file selection (FileReader API)
- [ ] "Save Changes" button submits form via action
- [ ] "Cancel" button navigates back to profile without saving
- [ ] Form pre-filled with current profile data (from loader)
- [ ] Styled with Tailwind CSS and Flowbite forms
- [ ] Accessible (labels, ARIA attributes, keyboard navigation)
- [ ] Loading state during submission

**Files to Create:**
- `app/components/SettingsForm.tsx`

**Technical Notes:**
- Use React Router v7 Form component
- FileReader API for client-side preview
- Validate bio length before submission (client-side UX)
- Disable submit button if bio > 160 chars

---

### T18: Implement /settings route
**Type:** sequential (depends on T17)
**Priority:** high
**Blocks:** T24, T25
**Estimated Time:** 1 hour
**User Story:** US2

**Description:**
Create settings page route with loader and action for profile editing.

**Acceptance Criteria:**
- [ ] Route added to app/routes.ts: `/settings`
- [ ] Requires authentication (redirects to signin if not authenticated)
- [ ] Loader fetches current user's profile data
- [ ] Loader passes profile data to SettingsForm component
- [ ] Action handles bio update (calls PUT /api/profiles/:username)
- [ ] Action handles avatar upload (calls POST /api/profiles/avatar)
- [ ] Action can handle both bio and avatar in single submission
- [ ] Action revalidates loaders after successful update
- [ ] Redirects to /profile/:username after successful save
- [ ] Displays error messages if validation fails
- [ ] Page title: "Edit Profile" or "Settings"

**Files to Create/Modify:**
- `app/routes/settings.tsx` (new)
- `app/routes.ts` (register route)

**Technical Notes:**
- Use React Router v7 loader + action pattern
- Extract FormData for bio and file
- Handle multipart/form-data for file upload

---

### T19: Implement profile update action logic
**Type:** sequential (depends on T12, T18)
**Priority:** high
**Blocks:** T24
**Estimated Time:** 45 minutes
**User Story:** US2

**Description:**
Implement action handler for PUT /api/profiles/:username with validation and error handling.

**Acceptance Criteria:**
- [ ] Action extracts bio from FormData
- [ ] Action validates bio length (client-side check before API call)
- [ ] Action calls PUT /api/profiles/:username with bio
- [ ] Action handles 400 (validation error) - displays error message
- [ ] Action handles 401 (not authenticated) - redirects to signin
- [ ] Action handles 403 (forbidden) - displays error message
- [ ] Action revalidates profile loader on success
- [ ] Returns json({ error }) for failures
- [ ] Returns redirect to profile on success

**Files to Modify:**
- `app/routes/settings.tsx` (action function)

**Technical Notes:**
- Use React Router v7 action return patterns
- Display validation errors inline

---

### T20: Implement avatar upload action logic
**Type:** sequential (depends on T13, T18)
**Priority:** high
**Blocks:** T25
**Estimated Time:** 1 hour
**User Story:** US2

**Description:**
Implement action handler for POST /api/profiles/avatar with file processing.

**Acceptance Criteria:**
- [ ] Action extracts file from FormData ("avatar" field)
- [ ] Action validates file type (JPEG, PNG, GIF) before upload
- [ ] Action validates file size (max 5 MB) before upload
- [ ] Action calls POST /api/profiles/avatar with file
- [ ] Action handles 400 (invalid file) - displays error message
- [ ] Action handles 500 (upload failed) - displays error message
- [ ] Action revalidates profile loader on success
- [ ] Returns json({ error }) for failures
- [ ] Returns redirect to profile on success
- [ ] Handles large file uploads gracefully (progress indication optional)

**Files to Modify:**
- `app/routes/settings.tsx` (action function)

**Technical Notes:**
- File size check: file.size <= 5 * 1024 * 1024
- MIME type check: ['image/jpeg', 'image/png', 'image/gif']
- Send file as multipart/form-data

---

## Phase 5: Integration & Cross-Cutting (All User Stories)

**Purpose:** Integrate profile links across the platform and comprehensive testing.
**Depends On:** Phase 3, Phase 4
**Estimated Time:** 2-3 hours (mostly parallel)

### T21: Add username links in TweetCard component
**Type:** sequential (depends on T16)
**Priority:** high
**Blocks:** T26
**Estimated Time:** 20 minutes
**User Story:** US3

**Description:**
Modify TweetCard component to make username clickable, linking to user's profile.

**Acceptance Criteria:**
- [ ] Username in TweetCard rendered as Link component
- [ ] Link href: `/profile/${tweet.author.username}`
- [ ] Link styled consistently (color, hover effect)
- [ ] Click navigates to profile page
- [ ] Link accessible (keyboard navigation, screen reader friendly)
- [ ] Works in feed view and tweet detail view

**Files to Modify:**
- `app/components/TweetCard.tsx`

**Technical Notes:**
- Use React Router Link component
- Prevent link click from triggering parent actions
- Style: underline on hover, primary color

---

### T22: Update navigation menu with profile link
**Type:** parallel (depends on T16)
**Priority:** medium
**Blocks:** None
**Estimated Time:** 20 minutes
**User Story:** US1, US3

**Description:**
Add "Profile" navigation item to main menu for authenticated users.

**Acceptance Criteria:**
- [ ] "Profile" link added to navigation menu (if authenticated)
- [ ] Link href: `/profile/${currentUser.username}`
- [ ] Link only visible when user is authenticated
- [ ] Link styled consistently with other nav items
- [ ] Active state shown when on profile page
- [ ] Mobile-responsive navigation

**Files to Modify:**
- `app/components/Navigation.tsx` (or equivalent nav component)

**Technical Notes:**
- Extract currentUser from session
- Use conditional rendering for authenticated state

---

### T23: End-to-end test for viewing own profile
**Type:** parallel (depends on T16)
**Priority:** high
**Blocks:** None
**Estimated Time:** 30 minutes
**User Story:** US1

**Description:**
Write E2E test for complete own profile viewing flow.

**Acceptance Criteria:**
- [ ] Test: User signs in → navigates to profile → sees username, bio, avatar, tweets
- [ ] Test: User sees "Edit Profile" button on own profile
- [ ] Test: Profile displays tweet count
- [ ] Test: Profile shows user's tweets in chronological order
- [ ] Test: Direct URL navigation to own profile works
- [ ] Test passes consistently

**Files to Create:**
- `e2e/profile-own.spec.ts` (if using Playwright)

**Technical Notes:**
- Use Playwright or Cypress
- Create test user with fixtures
- Seed tweets for test user

---

### T24: End-to-end test for editing profile bio
**Type:** parallel (depends on T19)
**Priority:** high
**Blocks:** None
**Estimated Time:** 30 minutes
**User Story:** US2

**Description:**
Write E2E test for complete bio editing flow.

**Acceptance Criteria:**
- [ ] Test: User navigates to settings → updates bio → character counter updates → saves → sees changes on profile
- [ ] Test: Bio changes reflected in feed (on tweet cards)
- [ ] Test: Validation: bio > 160 chars shows error
- [ ] Test: Cancel button discards changes
- [ ] Test passes consistently

**Files to Create:**
- `e2e/profile-edit-bio.spec.ts`

**Technical Notes:**
- Test both success and validation failure cases
- Verify character counter accuracy

---

### T25: End-to-end test for uploading avatar
**Type:** parallel (depends on T20)
**Priority:** high
**Blocks:** None
**Estimated Time:** 45 minutes
**User Story:** US2

**Description:**
Write E2E test for complete avatar upload flow.

**Acceptance Criteria:**
- [ ] Test: User navigates to settings → selects image file → sees preview → saves → sees avatar on profile
- [ ] Test: Avatar changes reflected in feed (on tweet cards)
- [ ] Test: Validation: invalid file type shows error
- [ ] Test: Validation: file > 5MB shows error
- [ ] Test passes consistently
- [ ] Test handles mock Cloudinary upload (don't actually upload to Cloudinary in tests)

**Files to Create:**
- `e2e/profile-upload-avatar.spec.ts`

**Technical Notes:**
- Use test image file (small JPEG)
- Mock Cloudinary API in test environment
- Verify preview rendering

---

### T26: End-to-end test for viewing other profiles
**Type:** parallel (depends on T16, T21)
**Priority:** high
**Blocks:** None
**Estimated Time:** 30 minutes
**User Story:** US3

**Description:**
Write E2E test for viewing another user's profile flow.

**Acceptance Criteria:**
- [ ] Test: User clicks username in feed → navigates to that user's profile
- [ ] Test: Profile displays username, bio, avatar, tweets
- [ ] Test: No "Edit Profile" button visible on other user's profile
- [ ] Test: Direct URL navigation to other user's profile works
- [ ] Test: 404 page shown for non-existent username
- [ ] Test passes consistently

**Files to Create:**
- `e2e/profile-other.spec.ts`

**Technical Notes:**
- Create two test users (viewer and profile owner)
- Seed tweets for profile owner
- Test both authenticated and unauthenticated viewing

---

### T27: Write unit tests for ProfileHeader component
**Type:** parallel (depends on T15)
**Priority:** medium
**Blocks:** None
**Estimated Time:** 30 minutes
**User Story:** US1, US3

**Description:**
Write component tests for ProfileHeader visual states.

**Acceptance Criteria:**
- [ ] Test renders avatar when avatarUrl provided
- [ ] Test renders default avatar when avatarUrl is null
- [ ] Test displays username correctly
- [ ] Test displays bio when bio provided
- [ ] Test displays "No bio yet" when bio is null
- [ ] Test shows "Edit Profile" button when isOwnProfile=true
- [ ] Test hides "Edit Profile" button when isOwnProfile=false
- [ ] Test displays tweet count if provided
- [ ] All tests pass

**Files to Create:**
- `app/components/__tests__/ProfileHeader.test.tsx`

**Technical Notes:**
- Use React Testing Library
- Mock profile data

---

### T28: Write unit tests for SettingsForm component
**Type:** parallel (depends on T17)
**Priority:** medium
**Blocks:** None
**Estimated Time:** 45 minutes
**User Story:** US2

**Description:**
Write component tests for SettingsForm interactions and validation.

**Acceptance Criteria:**
- [ ] Test bio textarea controlled input works
- [ ] Test character counter displays correctly (160 - bio.length)
- [ ] Test character counter turns red when bio > 160 chars
- [ ] Test file input triggers preview
- [ ] Test preview displays selected image
- [ ] Test submit button disabled when bio > 160 chars
- [ ] Test cancel button behavior
- [ ] All tests pass

**Files to Create:**
- `app/components/__tests__/SettingsForm.test.tsx`

**Technical Notes:**
- Mock FileReader API
- Test character counter edge cases (0, 160, 161)

---

### T29: Update feature documentation
**Type:** parallel (no blockers)
**Priority:** low
**Blocks:** None
**Estimated Time:** 20 minutes
**User Story:** All

**Description:**
Update README and feature docs to reflect profile system implementation.

**Acceptance Criteria:**
- [ ] README.md updated with profile feature description
- [ ] API documentation includes GET/PUT /api/profiles endpoints
- [ ] API documentation includes POST /api/profiles/avatar endpoint
- [ ] API documentation includes GET /api/tweets/user/:username endpoint
- [ ] Component documentation includes ProfileHeader, SettingsForm
- [ ] Cloudinary configuration documented

**Files to Modify:**
- `README.md`
- `features/004-user-profile-system/IMPLEMENTATION.md` (optional)

**Technical Notes:**
- Document Cloudinary setup requirements
- Include example API requests/responses
- Document environment variables

---

### T30: Verify profile updates reflected platform-wide
**Type:** sequential (depends on T21, T22, T24, T25)
**Priority:** high
**Blocks:** None
**Estimated Time:** 20 minutes
**User Story:** All

**Description:**
Manual verification that profile changes (bio, avatar) propagate to all places they're displayed.

**Acceptance Criteria:**
- [ ] Update bio in settings → verify bio shown on profile page
- [ ] Update bio → verify bio shown in feed (on tweet cards with author info)
- [ ] Update avatar → verify avatar shown on profile page
- [ ] Update avatar → verify avatar shown in feed (on tweet cards)
- [ ] Update avatar → verify avatar shown in navigation (if displayed)
- [ ] Profile changes visible within 1 second (no caching issues)

**Files to Check:**
- Profile page, Feed page, Tweet detail page, Navigation

**Technical Notes:**
- Test across multiple browser tabs
- Clear cache if needed
- Verify loader revalidation working correctly

---

## Dependency Graph

```
Phase 1 (Foundational - BLOCKS ALL):
  T01 [verify schema] ────┬─────────────────────────┐
                          │                         │
  T02 [types] ────────────┼─────┬──────────────────┐│
  T03 [Zod schemas] ──────┤     │                  ││
                          ↓     ↓                  ↓↓
Phase 2 (Backend):        │     │                  ││
  T04 [getProfile] ───────┼─────┼──> T10 [GET profile endpoint]
  T05 [getUserTweets] ────┼─────┼──> T11 [GET user tweets]
  T06 [updateBio] ────────┼─────┼──> T12 [PUT profile]
  T07 [updateAvatar] ─────┤     │
  T08 [Cloudinary config] ─┼──> T09 [uploadAvatar] ──> T13 [POST avatar]
                          │     │
  T10 + T11 + T12 + T13 ──┼─────┼──> T14 [integration tests]
                          │     │
Phase 3 (Frontend View):  │     │
  T15 [ProfileHeader] ────┼─────┼──> T16 [/profile route]
                          │     │          ↓
                          │     └────> T21 [username links]
                          │              T22 [nav menu]
                          │              T23 [E2E own profile]
Phase 4 (Frontend Edit):  │
  T17 [SettingsForm] ─────┼──> T18 [/settings route]
                          │          ↓
  T12 ────────────────────┼──> T19 [bio update action]
  T13 ────────────────────┼──> T20 [avatar upload action]
                          │
Phase 5 (Integration):    │
  T16 + T21 ──────────────┼──> T26 [E2E other profiles]
  T19 ────────────────────┼──> T24 [E2E bio edit]
  T20 ────────────────────┼──> T25 [E2E avatar upload]
  T15 ────────────────────┼──> T27 [ProfileHeader tests]
  T17 ────────────────────┼──> T28 [SettingsForm tests]
  T29 [docs] ─────────────┘
  T30 [platform-wide verification]
```

---

## Parallel Execution Strategy

**Wave 1:** T01 (foundational, must complete first)

**Wave 2:** T02, T03 (all parallel after T01)

**Wave 3:** T04, T05, T06, T07, T08 (all parallel after T02/T03)

**Wave 4:** T09, T10, T11, T12 (after respective dependencies)

**Wave 5:** T13, T14, T15, T17 (all parallel after Wave 4)

**Wave 6:** T16, T18 (after T15, T17)

**Wave 7:** T19, T20, T21, T22 (all parallel after Wave 6)

**Wave 8:** T23, T24, T25, T26, T27, T28, T29 (all parallel, final testing)

**Wave 9:** T30 (final verification)

**Time Savings:** ~33% reduction via parallelization (18h → 12h estimated)

---

## Testing Strategy

**Unit Tests:** T27 (ProfileHeader), T28 (SettingsForm)

**Integration Tests:** T14 (all profile API endpoints)

**End-to-End Tests:** T23 (own profile), T24 (bio edit), T25 (avatar upload), T26 (other profiles)

**Manual Verification:** T30 (platform-wide propagation)

**Coverage Goals:**
- 100% of profile CRUD business logic
- 100% of API endpoints
- 100% of user-facing interactions
- Cross-platform consistency verified

---

## MVP Scope

**Minimum for deployment:**
- Phase 1: T01, T02, T03 ✅ (foundation)
- Phase 2: T04, T05, T06, T07, T08, T09, T10, T11, T12, T13 ✅ (all backend)
- Phase 3: T15, T16 ✅ (profile viewing)
- Phase 4: T17, T18, T19, T20 ✅ (profile editing)
- Phase 5: T21, T30 ✅ (integration, verification)

**Post-MVP enhancements:**
- T14 (integration tests)
- T22 (nav menu enhancement)
- T23-T28 (comprehensive E2E and unit tests)
- T29 (documentation)

---

## External Service Configuration

**Cloudinary Setup Required (T08):**
```bash
# Environment variables (.env)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Upload Configuration:**
- Folder: "avatars"
- Transformation: Auto-optimize, auto-format
- Max file size: 5 MB
- Allowed formats: JPEG, PNG, GIF

**Account Creation:**
1. Sign up at cloudinary.com
2. Get API credentials from dashboard
3. Configure upload presets (optional)

---

## Success Criteria

- [ ] All 30 tasks completed
- [ ] All unit, integration, and E2E tests passing
- [ ] Users can view any profile page in under 2 seconds
- [ ] Users can complete bio edit in under 30 seconds
- [ ] Avatar uploads complete in under 5 seconds
- [ ] 100% of profile update authorization checks pass
- [ ] 0 instances of email/password exposure in profile API responses
- [ ] Profile changes visible across platform within 1 second
- [ ] All acceptance criteria from spec.md met

---

## Change Log

| Date       | Change                          | Author      |
|------------|---------------------------------|-------------|
| 2025-10-12 | Initial task breakdown created  | Claude Code |
