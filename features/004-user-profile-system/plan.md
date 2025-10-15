# Implementation Plan: User Profile System

**Feature ID:** 004-user-profile-system
**Created:** 2025-10-12
**Status:** draft

---

## Tech Stack Compliance Report

### ✅ Approved Technologies (from tech-stack.md v1.0.0)

All technologies for this feature are APPROVED:
- TypeScript 5.x, React Router v7, Express, PostgreSQL 17
- postgres npm package, uuid (uuidv7), Zod
- Tailwind CSS, Flowbite
- JWT authentication (from Feature 001)
- Cloudinary (avatar storage)

**Tech Stack Status:** ✅ COMPLIANT - Ready to proceed

**Tech Stack Changes:**
- Auto-added: 0 (all libraries already in stack)
- Conflicts: 0
- Prohibited: 0

---

## Constitution Compliance Check

- [x] **Principle 1 (Functional Programming):** Profile viewing/editing logic as pure functions. ProfileHeader, SettingsForm functional components. No classes.
- [x] **Principle 2 (Type Safety):** TypeScript strict mode. Zod schemas for bio validation (0-160 chars), file upload validation.
- [x] **Principle 3 (Programmatic Routing):** New routes (/profile/:username, /settings) in app/routes.ts. Loaders fetch profile data.
- [x] **Principle 4 (Security-First):** Authentication required for profile editing. Authorization checks (users can only edit own profile). Bio sanitized. Avatar uploaded to secure external service (Cloudinary). No email/password exposure in API.
- [x] **Principle 5 (Modern React):** Functional components with hooks. Loaders fetch profile data (not useEffect). Character counter with real-time updates.

---

## Overview

**Goal:** Enable users to customize their identity (bio, avatar) and view profiles of themselves and others.

**User Value:** Users can express their personality, establish identity, and discover information about other users.

**Scope:**
- **Included:** Profile viewing (public), profile editing (authenticated, own profile only), bio text (0-160 chars), avatar upload (Cloudinary), user's tweets on profile page
- **Excluded:** Username changes, profile privacy controls, follower/following system, profile badges, header images, profile analytics

---

## Technical Approach

### Data Model

**profiles table (existing, extended):**
```sql
-- Columns already exist from Feature 001:
-- bio VARCHAR(160) NULL
-- avatar_url TEXT NULL

-- No migration needed, just populate these columns
```

**Key Points:**
- Bio and avatar_url columns already exist (created in Feature 001)
- This feature simply populates these optional fields
- No new tables or migrations required

### API Endpoints

1. **GET /api/profiles/:username** - Get profile data (public)
   - Response: `{ profile: { id, username, bio, avatarUrl, createdAt } }`
   - Errors: 404 (user not found)

2. **PUT /api/profiles/:username** - Update profile bio (auth required)
   - Request: `{ bio: string }` (0-160 chars)
   - Response: `{ profile: { id, username, bio, avatarUrl, createdAt } }`
   - Errors: 400 (validation), 401 (auth), 403 (not own profile), 404

3. **POST /api/profiles/avatar** - Upload avatar image (auth required)
   - Request: multipart/form-data with "avatar" file field
   - Response: `{ avatarUrl: string }` (Cloudinary URL)
   - Errors: 400 (invalid file), 401 (auth), 500 (upload failed)

4. **GET /api/tweets/user/:username** - Get user's tweets (public)
   - Response: `{ tweets: [...] }` (with like counts and user's like status)
   - Errors: 404 (user not found)

### New Routes

1. **/profile/:username** - View user profile (public)
   - Loader: Fetch profile data + tweet count, fetch user's tweets
   - Components: ProfileHeader, TweetList

2. **/settings** - Edit own profile (authenticated)
   - Loader: Fetch current user's profile data
   - Action: Update bio, upload avatar
   - Components: SettingsForm

### Components

1. **ProfileHeader** (new functional component)
   - Props: profile (with bio, avatarUrl), isOwnProfile
   - Displays avatar (or default), username, bio, tweet count
   - Shows "Edit Profile" button if own profile

2. **SettingsForm** (new functional component)
   - Props: None (uses form action)
   - State: bio (controlled), selectedFile, previewUrl, remainingChars
   - Real-time character counter for bio (160 - bio.length)
   - Image preview after file selection

3. **TweetList** (reused from Feature 002)
   - Displays user's tweets on profile page
   - Same format as feed

### Pure Functions (Business Logic)

```typescript
// Profile retrieval
async function getProfileByUsername(username: string): Promise<PublicProfile | null> {
  // Query profiles table by username, return public fields only
}

// Profile update
async function updateProfileBio(userId: string, bio: string): Promise<PublicProfile> {
  // Update bio for user, validate length, sanitize content
}

// Avatar upload to Cloudinary
async function uploadAvatarToCloudinary(file: File): Promise<string> {
  // Upload to Cloudinary, return URL
}

// Update avatar URL
async function updateProfileAvatar(userId: string, avatarUrl: string): Promise<PublicProfile> {
  // Update avatar_url for user
}

// Get user's tweets
async function getUserTweets(username: string, currentUserId?: string): Promise<TweetWithLikes[]> {
  // Query tweets by profile_id, include like counts and user's like status
}

// Convert User to PublicProfile (security)
function toPublicProfile(user: User): PublicProfile {
  // Remove email, passwordHash - only return public fields
}
```

---

## Implementation Phases

### Phase 1: Backend - Profile API (2-3 hours)

1. Implement pure functions:
   - getProfileByUsername (query by username, return public fields)
   - toPublicProfile (strip sensitive fields)
   - updateProfileBio (validate, sanitize, update)
   - updateProfileAvatar (update avatar_url)
2. Implement GET /api/profiles/:username endpoint:
   - Call getProfileByUsername
   - Return 404 if user not found
   - Return public profile data
3. Implement PUT /api/profiles/:username endpoint:
   - Validate bio with Zod (0-160 chars)
   - Check authentication (JWT)
   - Check authorization (user can only update own profile)
   - Sanitize bio content (XSS prevention)
   - Call updateProfileBio
   - Return updated profile
4. Implement GET /api/tweets/user/:username endpoint:
   - Call getUserTweets
   - Include like counts and user's like status
   - Return 404 if user not found
5. Write integration tests for all endpoints

### Phase 2: Backend - Avatar Upload (2-3 hours)

1. Configure Cloudinary SDK:
   - Install cloudinary npm package
   - Set environment variables (CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET)
   - Create upload configuration (folder: "avatars", transformations)
2. Implement uploadAvatarToCloudinary function:
   - Accept file buffer
   - Upload to Cloudinary via SDK
   - Return secure URL
3. Implement POST /api/profiles/avatar endpoint:
   - Validate file type (JPEG, PNG, GIF)
   - Validate file size (max 5 MB)
   - Check authentication
   - Upload to Cloudinary
   - Call updateProfileAvatar with returned URL
   - Return avatar URL
4. Write integration tests for upload endpoint

### Phase 3: Frontend - Profile Viewing (2-3 hours)

1. Create ProfileHeader component:
   - Accept profile (username, bio, avatarUrl, tweetCount), isOwnProfile
   - Display avatar (or default placeholder)
   - Display username as page title
   - Display bio (or "No bio yet" if null)
   - Display tweet count
   - Show "Edit Profile" button if isOwnProfile=true
   - Add Tailwind styling (avatar circle, typography)
2. Add /profile/:username route to app/routes.ts:
   - Loader: Call GET /api/profiles/:username
   - Loader: Call GET /api/tweets/user/:username
   - Component renders ProfileHeader + TweetList
   - Handle 404 (user not found)
3. Update TweetCard component (if needed):
   - Make username clickable (link to /profile/:username)
4. Write component tests for ProfileHeader

### Phase 4: Frontend - Profile Editing (3-4 hours)

1. Create SettingsForm component:
   - Controlled textarea for bio (useState)
   - Real-time character counter (160 - bio.length)
   - File input for avatar upload
   - Image preview after file selection (FileReader API)
   - "Save Changes" button (submits form via action)
   - "Cancel" button (navigates back to profile)
   - Add Tailwind styling (form layout, character counter)
2. Add /settings route to app/routes.ts:
   - Loader: Fetch current user's profile (auth required)
   - Action: Handle bio update and/or avatar upload
   - Action calls PUT /api/profiles/:username and/or POST /api/profiles/avatar
   - Action revalidates loaders after successful update
   - Redirect to profile page after save
3. Implement form action logic:
   - Extract bio and/or file from FormData
   - Validate bio length (client-side, before submission)
   - Validate file type and size (client-side, before submission)
   - Submit to action
   - Handle errors (show messages)
4. Write component tests for SettingsForm

### Phase 5: Integration & Testing (1-2 hours)

1. Test complete profile viewing flow:
   - Click username in feed → navigate to profile → see profile data + tweets
2. Test complete profile editing flow:
   - Navigate to /settings → update bio → see character counter → save → see changes on profile
3. Test complete avatar upload flow:
   - Navigate to /settings → select image → see preview → save → see avatar on profile
4. Test authorization:
   - User can only edit own profile
   - "Edit Profile" button only visible on own profile
   - Direct navigation to /settings requires authentication
5. Test error handling:
   - Bio exceeds 160 chars → validation error
   - Invalid file type → error message
   - File size exceeds 5 MB → error message
   - Non-existent username → 404 page
6. Test profile updates reflected platform-wide:
   - Update bio → see new bio in feed (on tweet cards)
   - Update avatar → see new avatar in feed
7. End-to-end testing with Playwright (optional)

---

## Dependencies

- **Feature 001 (User Authentication System)** - REQUIRED (JWT auth, profiles table with bio/avatar_url columns, session management)
- **Feature 002 (Tweet Posting and Feed System)** - REQUIRED (tweets table, feed pages to link to profiles)
- **Feature 003 (Like Functionality)** - OPTIONAL (enhances tweet display on profile pages with like counts)
- **Cloudinary Account** - REQUIRED (avatar storage and CDN)

---

## Success Criteria

- [ ] Users can view any profile page in under 2 seconds
- [ ] Users can complete bio edit in under 30 seconds
- [ ] Avatar uploads complete in under 5 seconds
- [ ] 100% of profile update authorization checks pass (users can only edit own profile)
- [ ] 0 instances of email/password exposure in profile API responses
- [ ] Bio character counter updates in real-time
- [ ] Profile changes visible across platform within 1 second

---

## Security Considerations

1. **Authorization:**
   - Users can only edit their own profile (compare session user ID to profile owner ID)
   - Public profile viewing requires no authentication
   - Settings page requires authentication

2. **XSS Prevention:**
   - Bio content sanitized before storage
   - Framework auto-escaping on display (React)
   - No HTML tags allowed in bio

3. **File Upload Security:**
   - File type validation (MIME type check on client and server)
   - File size limits enforced (5 MB)
   - External service (Cloudinary) handles storage
   - Cloudinary performs additional security checks

4. **Information Disclosure:**
   - Profile API returns only public fields (id, username, bio, avatarUrl, createdAt)
   - Email and password_hash NEVER exposed in any API response
   - toPublicProfile function filters sensitive data

5. **Avatar URL Integrity:**
   - Avatar URLs only set by server after Cloudinary upload
   - Client cannot directly set avatar_url field
   - URLs validated as proper format

---

## Performance Considerations

- Username lookup uses unique index (fast O(log n))
- Tweet count aggregated via LEFT JOIN (single query)
- User's tweets filtered by profile_id (indexed in Feature 002)
- Avatar images served by Cloudinary CDN (not from database)
- Avatar URLs cached by external service

---

## Cloudinary Configuration

**Required Environment Variables:**
```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Upload Configuration:**
- Folder: "avatars"
- Transformation: Auto-optimize, auto-format
- Max file size: 5 MB
- Allowed formats: JPEG, PNG, GIF

**SDK Installation:**
```bash
npm install cloudinary
```

---

## Open Questions

None - all design decisions resolved in spec.md

---

## Change Log

| Date       | Change                    | Author      |
|------------|---------------------------|-------------|
| 2025-10-12 | Initial implementation plan | Claude Code |
