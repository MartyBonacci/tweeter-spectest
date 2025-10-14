# Feature Specification: User Profile System

**Feature ID:** 004-user-profile-system
**Created:** 2025-10-12
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
This identity and personalization feature enables users to express themselves and discover others on the platform. Profile viewing and editing logic will use pure functions (Principle 1). All profile data including bio length and image uploads will have strict type definitions and validation (Principle 2). Profile and settings pages will be defined programmatically in the routing configuration (Principle 3). Profile updates require authentication, and avatar uploads use secure external service (Principle 4). Profile UI will use functional components with data loading through loaders (Principle 5).

---

## Summary

**What:** A user profile system enabling users to customize their identity (bio, avatar) and view profiles of themselves and others.

**Why:** Users need to express their personality, establish identity on the platform, and discover information about other users.

**Who:** All Tweeter users (authenticated users can edit their own profile, all users can view profiles).

---

## User Stories

### Primary User Story: View Own Profile
```
As an authenticated Tweeter user
I want to view my own profile page
So that I can see how I appear to others and access my profile settings
```

**Acceptance Criteria:**
- [ ] User can navigate to their own profile via menu/link
- [ ] Profile displays username, bio (if set), avatar (if set), and tweet count
- [ ] Profile shows user's tweets in reverse chronological order
- [ ] User sees "Edit Profile" button on their own profile
- [ ] Navigation to settings page available from profile

### Primary User Story: Edit Profile
```
As an authenticated Tweeter user
I want to edit my bio and avatar
So that I can personalize my profile and express my identity
```

**Acceptance Criteria:**
- [ ] User can access settings page from their profile
- [ ] User can edit bio text (0-160 characters)
- [ ] Character counter shows remaining characters for bio
- [ ] User can upload new avatar image from their device
- [ ] Avatar preview shown before saving
- [ ] Changes saved when user submits form
- [ ] Profile updates reflected immediately across platform

### Primary User Story: View Other Users' Profiles
```
As any Tweeter user
I want to view another user's profile by clicking their username
So that I can learn about them and see their tweets
```

**Acceptance Criteria:**
- [ ] User can click username anywhere (feed, tweet detail) to view profile
- [ ] Profile displays username, bio (if set), avatar (if set)
- [ ] Profile shows user's tweets in reverse chronological order
- [ ] No "Edit Profile" button visible on other users' profiles
- [ ] Profile accessible via direct URL (/profile/:username)

---

## Functional Requirements

### Must Have (P0)

1. **Profile Display**
   - Each user has a profile page accessible via `/profile/:username`
   - Profile displays: username, bio (if set), avatar (if set), tweet count
   - Profile shows user's tweets in reverse chronological order
   - Empty state shown if user has no tweets
   - Success: Profile page loads and displays complete user information

2. **Profile Viewing (Public)**
   - All users (authenticated or not) can view profiles
   - Username displayed prominently as page title
   - Bio displayed if user has set one (empty if not set)
   - Avatar displayed if user has uploaded one (default avatar if not)
   - Success: Any user can discover profile information

3. **Own Profile Access**
   - Authenticated user can navigate to their own profile
   - User sees "Edit Profile" or "Settings" link on their own profile
   - User does not see edit options on other profiles
   - Success: Clear distinction between own and others' profiles

4. **Bio Editing**
   - Authenticated user can edit their bio in settings page
   - Bio field accepts 0-160 characters
   - Real-time character counter shows remaining characters
   - Empty bio allowed (optional field)
   - Bio validation on client (UX) and server (security)
   - Success: Bio updates saved and displayed on profile

5. **Avatar Upload**
   - Authenticated user can upload avatar image in settings page
   - Supported formats: JPEG, PNG, GIF
   - Image preview shown after selection, before upload
   - Maximum file size enforced (reasonable limit for web)
   - Avatar stored in external service (not database)
   - Success: Avatar uploaded and displayed on profile

6. **User's Tweets on Profile**
   - Profile page displays all tweets from that user
   - Tweets sorted by newest first (reverse chronological)
   - Each tweet shows content, timestamp, like count
   - Same tweet display format as main feed
   - Success: Complete history of user's tweets viewable

7. **Profile URL Structure**
   - Profile accessible via `/profile/:username`
   - Username in URL is case-insensitive
   - 404 error shown for non-existent usernames
   - Direct URL shareable (deep linking)
   - Success: Profiles discoverable and shareable

8. **Authentication Requirements**
   - Viewing profiles does not require authentication
   - Editing profile requires authentication
   - Only user can edit their own profile (not others')
   - Success: Protected profile updates, public viewing

### Should Have (P1)

1. **Avatar Cropping**
   - User can crop uploaded image before saving
   - Square crop enforced (1:1 aspect ratio)
   - Maintains reasonable image quality

2. **Profile Statistics**
   - Display tweet count on profile
   - Display join date (account creation date)
   - Display like count received (total across all tweets)

3. **Settings Organization**
   - Separate settings page from profile view
   - Clear sections for bio, avatar, account settings
   - Cancel button to discard changes

### Could Have (P2)

1. **Avatar Image Optimization**
   - Automatic image compression on upload
   - Multiple avatar sizes generated (thumbnail, full)
   - Progressive image loading

2. **Bio Formatting**
   - Support for basic formatting (line breaks)
   - URL detection and hyperlinking
   - Emoji support

3. **Profile Header Image**
   - Banner/cover image above profile
   - Separate from avatar upload

### Won't Have (Out of Scope)

1. Username changes (username immutable after account creation)
2. Profile privacy controls (all profiles public in MVP)
3. Follower/following system
4. Profile badges or verification
5. Profile themes/customization
6. Pinned tweets on profile
7. Profile analytics (view counts, profile visits)
8. Multiple profile photos/gallery

---

## Technical Requirements

### Type Safety Requirements
- [x] TypeScript interfaces defined for Profile data structure
- [x] Zod schemas created for:
  - [x] Profile update request validation (bio length)
  - [x] Avatar upload validation (file type, size)
  - [x] Profile response validation (username, bio, avatar URL)

### Security Requirements
- [x] Authentication method: Session-based (JWT cookies from feature 001)
- [x] Authorization rules: Only authenticated users can update their own profile
- [x] Input sanitization: Bio content sanitized before storage and display
- [x] Data protection: Avatar uploads sent to secure external service (Cloudinary), file validation enforced

### Data Requirements
- [x] Database schema changes documented: profiles table already exists (created in feature 001), bio and avatar_url columns available
- [x] Migration strategy defined: No migration needed (columns exist), may need default values set
- [x] Data validation rules specified: bio 0-160 characters, avatar_url valid URL format
- [x] snake_case ↔ camelCase mapping identified: avatar_url ↔ avatarUrl

### Routing Requirements
- [x] Routes added to `app/routes.ts`: /profile/:username, /settings
- [x] Loader functions defined: Load profile data by username, load user's tweets
- [x] Action functions defined: Update profile action, upload avatar action
- [x] No file-based routes created: All routes in centralized configuration

---

## User Interface

### Pages/Views

1. **Profile Page** (`/profile/:username`)
   - Purpose: Display user information and their tweets
   - Components: ProfileHeader, TweetList
   - Data: User profile data (username, bio, avatar), user's tweets (via loader)

2. **Settings Page** (`/settings`)
   - Purpose: Edit profile information
   - Components: SettingsForm (bio input, avatar upload)
   - Data: Current user's profile data (via loader)

### Components

1. **ProfileHeader** (functional component)
   - Props:
     - `profile: Profile` (username, bio, avatarUrl, tweetCount)
     - `isOwnProfile: boolean`
   - State: None (stateless presentation)
   - Behavior:
     - Displays avatar (or default), username, bio
     - Shows "Edit Profile" button if `isOwnProfile` is true
     - Links to settings page

2. **SettingsForm** (functional component)
   - Props: None (uses form action)
   - State:
     - `bio` (controlled input)
     - `remainingChars` (computed: 160 - bio.length)
     - `selectedFile` (avatar file selected but not uploaded)
     - `previewUrl` (local preview of selected avatar)
   - Behavior:
     - Real-time character count for bio
     - Image preview after file selection
     - Submit via framework action
     - Clear/cancel returns to profile without saving

3. **TweetList (Reused)** (functional component)
   - Props: `tweets: Tweet[]`
   - State: None (stateless presentation)
   - Behavior: Same as feed, displays user's tweets chronologically

### User Flows

#### View Own Profile Flow
```
1. User signs in and navigates to "Profile" in menu
2. Loader fetches user's profile data and tweets
3. User sees their profile page with username, bio, avatar, tweets
4. User sees "Edit Profile" button
5. User can click "Edit Profile" to access settings
```

#### Edit Profile Flow
```
1. User navigates to /settings from their profile
2. User sees form pre-filled with current bio and avatar
3. User updates bio text (character counter updates in real-time)
4. User clicks "Choose File" to select avatar image
5. Image preview appears after selection
6. User clicks "Save Changes"
7. Action validates and saves bio and uploads avatar
8. If successful: User redirected to profile, changes visible
9. If failed: Error messages shown, user corrects and resubmits
```

#### View Other User's Profile Flow
```
1. User clicks username on tweet in feed
2. Loader fetches that user's profile data and tweets
3. User sees profile page with username, bio, avatar, tweets
4. No "Edit Profile" button visible (not their profile)
5. User can navigate back or click another username
```

#### Avatar Upload Flow
```
1. User on settings page clicks "Choose File"
2. User selects image file from device
3. Client validates file type and size
4. Image preview appears in settings form
5. User clicks "Save Changes"
6. Action uploads image to external service
7. External service returns URL
8. Profile record updated with avatar URL
9. User sees new avatar on profile immediately
```

---

## API Specification

### Endpoints

#### `GET /api/profiles/:username`
**Purpose:** Retrieve profile data for a specific user

**Authentication:** Public

**Request:** None (username in URL path)

**Response:**
```typescript
// TypeScript type (success)
interface GetProfileResponse {
  profile: {
    id: string;
    username: string;
    bio: string | null;        // Null if not set
    avatarUrl: string | null;  // Null if not uploaded
    createdAt: string;         // ISO 8601 datetime
  }
}

// TypeScript type (error)
interface GetProfileError {
  error: string;
}
```

**Error Responses:**
- `404`: User not found (username doesn't exist)
- `500`: Server error

#### `PUT /api/profiles/:username`
**Purpose:** Update user's profile (bio)

**Authentication:** Required (can only update own profile)

**Request:**
```typescript
// TypeScript type
interface UpdateProfileRequest {
  bio: string;  // 0-160 characters
}

// Zod schema (conceptual)
// Validates bio length
```

**Response:**
```typescript
// TypeScript type (success)
interface UpdateProfileResponse {
  profile: {
    id: string;
    username: string;
    bio: string | null;
    avatarUrl: string | null;
    createdAt: string;
  }
}

// TypeScript type (error)
interface UpdateProfileError {
  error: string;
  field?: string;
}
```

**Error Responses:**
- `400`: Validation error (bio exceeds 160 characters)
- `401`: Authentication required
- `403`: Forbidden (attempting to update another user's profile)
- `404`: Profile not found
- `500`: Server error

#### `POST /api/profiles/avatar`
**Purpose:** Upload avatar image

**Authentication:** Required

**Request:**
```typescript
// Multipart form data
// Field: "avatar" (file upload)
```

**Response:**
```typescript
// TypeScript type (success)
interface UploadAvatarResponse {
  avatarUrl: string;  // URL from external service (Cloudinary)
}

// TypeScript type (error)
interface UploadAvatarError {
  error: string;
}
```

**Error Responses:**
- `400`: Validation error (invalid file type, exceeds size limit)
- `401`: Authentication required
- `500`: Server error (upload failed)

#### `GET /api/tweets/user/:username`
**Purpose:** Retrieve all tweets from a specific user

**Authentication:** Public

**Request:** None (username in URL path)

**Response:**
```typescript
// TypeScript type (success)
interface GetUserTweetsResponse {
  tweets: Array<{
    id: string;
    content: string;
    author: {
      id: string;
      username: string;
    };
    createdAt: string;
    likeCount: number;
    isLikedByUser: boolean;  // False if not authenticated
  }>
}
```

**Error Responses:**
- `404`: User not found
- `500`: Server error

---

## Data Model

### Database Schema

#### Table: profiles (existing, modified)
```sql
-- Already exists from Feature 001
-- Ensure these columns exist with proper constraints:

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS bio VARCHAR(160),
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Constraints (already exist or add)
-- username UNIQUE NOT NULL (already exists)
-- bio check: LENGTH(bio) <= 160
```

**Indexes:**
- [x] Unique index on `username` (already exists from feature 001)
- [x] Primary key index on `id` (already exists)

**Constraints:**
- [x] `bio` CHECK (LENGTH(bio) <= 160) (optional field, max length enforced)
- [x] `avatar_url` TEXT (stores URL, nullable)

**Relationships:**
- [x] No new foreign keys (existing relationships to tweets/likes remain)

### TypeScript Interfaces
```typescript
// Application layer (camelCase)
interface Profile {
  id: string;
  username: string;
  email: string;          // Not displayed publicly
  passwordHash: string;   // Never exposed
  bio: string | null;
  avatarUrl: string | null;
  createdAt: Date;
}

// Public profile data (safe to display)
interface PublicProfile {
  id: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: Date;
}

// Profile with statistics
interface ProfileWithStats {
  id: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  tweetCount: number;
}
```

---

## Security Analysis

### Threat Model

1. **Unauthorized Profile Modification**
   - **Threat:** Attacker attempts to edit another user's profile
   - **Mitigation:** Authorization checks ensure user can only update their own profile (compare session user ID to profile owner ID)

2. **XSS via Bio Content**
   - **Threat:** Attacker sets bio with malicious JavaScript
   - **Mitigation:** Bio content sanitized before storage, framework auto-escaping on display

3. **Malicious File Upload**
   - **Threat:** Attacker uploads executable file disguised as image
   - **Mitigation:** File type validation (MIME type check), size limits, external service handles storage (Cloudinary validates images)

4. **Information Disclosure**
   - **Threat:** Sensitive data (email, password hash) exposed in profile API
   - **Mitigation:** API returns only public fields (username, bio, avatar), never email or password hash

5. **Profile Enumeration**
   - **Threat:** Attacker discovers valid usernames via 404 errors
   - **Mitigation:** Acceptable (profiles are public, usernames discoverable), consistent error messages

### Input Validation
- [x] All profile updates validated with schema validation before processing
- [x] SQL injection prevented via parameterized queries
- [x] XSS prevented via bio sanitization and framework auto-escaping
- [x] File uploads validated for type and size

### Authentication & Authorization
- [x] GET /api/profiles/:username public (no authentication required)
- [x] PUT /api/profiles/:username requires authentication and ownership
- [x] POST /api/profiles/avatar requires authentication
- [x] Authorization middleware verifies user owns profile before updates

---

## Testing Requirements

### Unit Tests
- [x] Bio validation function tested (valid/invalid lengths)
- [x] File type validation tested (valid image types, invalid types)
- [x] Profile data sanitization tested (XSS prevention)
- [x] Avatar URL generation tested

### Integration Tests
- [x] GET /api/profiles/:username with valid username (success case)
- [x] GET /api/profiles/:username with invalid username (404 error)
- [x] PUT /api/profiles/:username with valid bio (authenticated, own profile)
- [x] PUT /api/profiles/:username with bio exceeding 160 chars (400 error)
- [x] PUT /api/profiles/:username without authentication (401 error)
- [x] PUT /api/profiles/:username for another user's profile (403 error)
- [x] POST /api/profiles/avatar with valid image (success case)
- [x] POST /api/profiles/avatar with invalid file type (400 error)
- [x] GET /api/tweets/user/:username returns user's tweets only

### End-to-End Tests
- [x] Complete profile viewing flow (click username → view profile with tweets)
- [x] Complete bio edit flow (navigate to settings → update bio → see changes on profile)
- [x] Complete avatar upload flow (select file → preview → save → see on profile)
- [x] Edit button only visible on own profile
- [x] Profile updates reflected across platform (feed, tweet detail)
- [x] Direct URL navigation to profile works (/profile/:username)
- [x] 404 page shown for non-existent username

---

## Performance Considerations

- [x] Profile data query uses username index for fast lookup
- [x] User tweets query filtered by profile_id (indexed in feature 002)
- [x] Avatar images stored externally (no database blob storage)
- [x] Avatar URLs cached by external service (CDN)
- [x] Profile page combines profile data + tweets in single loader

---

## Accessibility

- [x] Semantic HTML elements used (form inputs, image alt text)
- [x] ARIA labels for bio textarea ("User bio"), avatar upload ("Upload avatar")
- [x] Keyboard navigation supported (tab through settings form)
- [x] Character counter accessible via aria-live for screen readers
- [x] Avatar has alt text with username
- [x] Color contrast meets WCAG AA standards

---

## Dependencies

**Prerequisites:**
- [x] Feature 001 (User Authentication System) - Required for authentication and profiles table
- [x] Feature 002 (Tweet Posting and Feed System) - Required for displaying user tweets
- [x] profiles table exists with username, email, password_hash columns
- [x] Cloudinary account configured for avatar storage

**External Services:**
- [x] PostgreSQL database (Neon hosted)
- [x] Cloudinary (avatar image storage and CDN)

**Blocking Issues:**
- None (authentication and tweets must be implemented first)

---

## Success Metrics

**How we'll measure success:**
- [ ] Users can view any profile page in under 2 seconds
- [ ] Users can complete profile edit (bio) in under 30 seconds
- [ ] Avatar uploads complete in under 5 seconds (reasonable for image upload)
- [ ] 100% of profile update authorization checks pass (users can only edit own profile)
- [ ] 0 instances of email/password exposure in profile API responses
- [ ] All acceptance criteria met for viewing, editing, and uploading
- [ ] Profile changes visible across platform within 1 second

---

## Assumptions

1. **Public Profiles:** All profiles are public and viewable by anyone (no privacy controls in MVP)
2. **Immutable Username:** Username cannot be changed after account creation (simplifies URL structure and identity)
3. **Single Avatar:** One avatar image per user (no gallery or multiple photos)
4. **External Storage:** Avatar images stored in Cloudinary, not database (performance and scalability)
5. **Default Avatar:** System provides default avatar if user hasn't uploaded one (visual consistency)
6. **Bio Optional:** Bio field is optional, empty bio is acceptable (not all users want to write bio)
7. **Image Format:** Standard web image formats supported (JPEG, PNG, GIF) with reasonable file size limit (e.g., 5MB)
8. **Tweet Display:** User's tweets on profile page use same display format as main feed (consistency)

---

## Appendix

### References
- Project Constitution: `/memory/constitution.md`
- Feature 001: User Authentication System (dependency - profiles table)
- Feature 002: Tweet Posting and Feed System (dependency - user tweets)
- README.md: Project overview and tech stack
- Cloudinary documentation: Image upload and CDN

### Change Log
| Date       | Change                     | Author        |
|------------|----------------------------|---------------|
| 2025-10-12 | Initial specification      | Claude Code   |
