# Feature Specification: Profile Image Upload

**Feature ID:** 914
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
- **Functional Programming**: All components and utilities will use functional programming patterns with pure functions
- **Type Safety**: TypeScript interfaces and Zod schemas for all data structures including file uploads, API requests/responses
- **Programmatic Routing**: No new routes needed; extends existing `/settings` route functionality
- **Security-First**: File type validation, size limits, authentication required, secure Cloudinary upload with signed URLs
- **Modern React Patterns**: Functional components with hooks, React Router v7 Form component for progressive enhancement

---

## Summary

**What:** Add profile image upload functionality to the profile edit form with direct file upload to Cloudinary

**Why:** Users currently must manually enter image URLs for their avatars, which is cumbersome and error-prone. Direct file upload provides a better user experience and ensures images are properly hosted.

**Who:** Authenticated users editing their own profiles

---

## User Stories

### Primary User Story
```
As a Tweeter user
I want to upload a profile image directly from my device
So that I can easily set my avatar without finding and copying image URLs
```

**Acceptance Criteria:**
- [x] User can click a button to select an image file from their device
- [x] Selected image is previewed before upload
- [x] Image is uploaded to Cloudinary and profile is updated in one action
- [x] User sees upload progress indication
- [x] Invalid files (wrong type, too large) show clear error messages
- [x] Uploaded image appears immediately on profile after save

### Secondary User Stories

**Alternative Input Method**
```
As a user who already has an image URL
I want to still be able to paste a URL instead of uploading
So that I can use images I've already hosted elsewhere
```

**Acceptance Criteria:**
- [x] URL input field remains available alongside upload option
- [x] User can choose between file upload or URL input
- [x] Only one method needs to be used (not both)

---

## Functional Requirements

### Must Have (P0)

1. **File Upload Interface**
   - File input button accepts image files (JPEG, PNG, GIF, WebP)
   - Maximum file size: 5MB
   - Image preview displays selected file before upload
   - Clear indication of accepted file types and size limit

2. **Cloudinary Integration**
   - Upload directly to Cloudinary using existing credentials from .env
   - Use Cloudinary's signed upload for security
   - Store returned Cloudinary URL in profile.avatar_url
   - Handle Cloudinary upload errors gracefully

3. **Form Handling**
   - Extend existing profile edit form to handle file uploads
   - Submit file upload and bio update in single form submission
   - Show upload progress indicator during file upload
   - Disable submit button while uploading

4. **Validation**
   - Frontend: Validate file type and size before upload attempt
   - Backend: Re-validate file type and size at API endpoint
   - Zod schema for file upload validation
   - Clear error messages for validation failures

5. **API Endpoint**
   - Implement POST /api/profiles/avatar endpoint (currently documented but not implemented)
   - Accept multipart/form-data with image file
   - Require JWT authentication
   - Upload to Cloudinary and update profile in database
   - Return updated profile with new avatar URL

### Should Have (P1)

1. **Progressive Enhancement**
   - Form works without JavaScript (degrades to URL input only)
   - File upload enhanced with JavaScript for better UX
   - Client-side validation provides immediate feedback

2. **Image Optimization**
   - Cloudinary transformations for consistent avatar sizing
   - Generate thumbnail version for performance
   - Set appropriate Cloudinary upload preset

3. **User Feedback**
   - Success message after upload completes
   - Error messages distinguish between network, validation, and server errors
   - Visual feedback during upload (progress bar or spinner)

### Could Have (P2)

1. **Image Cropping**
   - Client-side image cropping tool before upload
   - Preview cropped result
   - Upload cropped version to Cloudinary

2. **Drag and Drop**
   - Drag image files onto upload area
   - Visual feedback during drag operation

### Won't Have (Out of Scope)

1. **Multiple image uploads** - Only single avatar per profile
2. **Image gallery or history** - No storage of previous avatars
3. **Image editing tools** - No filters, brightness, contrast adjustments
4. **Direct camera capture** - No webcam integration
5. **Social media import** - No importing avatars from Twitter, Facebook, etc.

---

## Technical Requirements

### Type Safety Requirements
- [x] TypeScript interfaces defined for all data structures
- [x] Zod schemas created for:
  - [x] API request validation (file upload multipart data)
  - [x] API response validation (profile with avatar URL)
  - [x] Form input validation (file type, size)
  - [x] Cloudinary upload response

### Security Requirements
- [x] Authentication method: JWT (existing auth middleware)
- [x] Authorization rules: Users can only upload avatars for their own profile
- [x] Input sanitization: File type validation (magic number check, not just extension)
- [x] Data protection:
  - Signed Cloudinary uploads prevent unauthorized uploads
  - File size limits prevent DoS attacks
  - Content-Type validation prevents malicious uploads

### Data Requirements
- [x] Database schema changes documented: None (avatar_url column already exists in profiles table)
- [x] Migration strategy defined: Not needed (using existing schema)
- [x] Data validation rules specified: URL format, Cloudinary domain validation
- [x] snake_case ↔ camelCase mapping identified: avatar_url ↔ avatarUrl

### Routing Requirements
- [x] Routes added to `app/routes.ts`: Not needed (extends existing /settings route)
- [x] Loader functions defined for data fetching: Use existing ProfileEdit loader
- [x] Action functions defined for mutations: Extend existing ProfileEdit action to handle file uploads
- [x] No file-based routes created: Confirmed

---

## User Interface

### Pages/Views

1. **Profile Edit Page** (`/settings`)
   - Purpose: User edits their profile bio and uploads avatar
   - Components: ProfileEdit (enhanced with file upload)
   - Data: Current profile data via existing loader

### Components

1. **ProfileEdit** (functional component - enhanced)
   - Props: None (uses loaderData and actionData)
   - State:
     - bioLength: number (existing)
     - selectedFile: File | null (new)
     - previewUrl: string | null (new)
     - uploadProgress: number (new)
     - uploadMethod: 'file' | 'url' (new)
   - Behavior:
     - Handle file selection and preview
     - Toggle between file upload and URL input
     - Show upload progress
     - Submit multipart form data when file selected

2. **ImageUploadField** (functional component - new)
   - Props:
     - currentAvatarUrl: string | null
     - onFileSelect: (file: File) => void
     - previewUrl: string | null
     - error: string | null
   - State: Local drag/drop state
   - Behavior:
     - Render file input with styled button
     - Display image preview
     - Show validation errors
     - Optional drag-and-drop support

### User Flows

```
1. User navigates to /settings (profile edit page)
2. User sees their current avatar (if set) and bio
3. User sees two options:
   - "Upload Image" button
   - "Or enter image URL" text input (existing)
4. User clicks "Upload Image" button
5. File picker dialog opens
6. User selects an image file (JPEG, PNG, GIF, WebP)
7. Image preview appears below upload button
8. User optionally edits bio
9. User clicks "Save Changes"
10. Upload progress indicator appears
11. File uploads to Cloudinary via API
12. Profile updates with new avatar URL
13. User redirected to profile page showing new avatar
```

**Error Flow:**
```
1-6. Same as above
7. User selects invalid file (e.g., .pdf or >5MB image)
8. Validation error appears: "Please select an image under 5MB (JPEG, PNG, GIF, or WebP)"
9. User selects valid file
10-13. Same as happy path
```

---

## API Specification

### Endpoints

#### `POST /api/profiles/avatar`
**Purpose:** Upload avatar image to Cloudinary and update user's profile

**Authentication:** Required (JWT)

**Request:**
```typescript
// Content-Type: multipart/form-data

interface AvatarUploadRequest {
  avatar: File; // Image file (JPEG, PNG, GIF, WebP)
}

// Zod schema for validation
const avatarUploadSchema = z.object({
  avatar: z.custom<File>((file) => {
    if (!(file instanceof File)) return false;

    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) return false;

    // Check MIME type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    return validTypes.includes(file.type);
  }, {
    message: 'File must be an image under 5MB (JPEG, PNG, GIF, or WebP)',
  }),
});
```

**Response:**
```typescript
interface AvatarUploadResponse {
  profile: {
    id: string;
    username: string;
    bio: string | null;
    avatarUrl: string; // Cloudinary URL
  };
}

// Zod schema
const avatarUploadResponseSchema = z.object({
  profile: z.object({
    id: z.string().uuid(),
    username: z.string(),
    bio: z.string().nullable(),
    avatarUrl: z.string().url(),
  }),
});
```

**Error Responses:**
- `400`: Invalid file type or size, validation error
- `401`: Not authenticated (missing or invalid JWT)
- `413`: File too large (exceeds 5MB)
- `500`: Cloudinary upload failed or database error

---

## Data Model

### Database Schema

**No schema changes needed** - The `profiles` table already has an `avatar_url` column:

```sql
-- Existing schema (no changes)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  bio VARCHAR(160),
  avatar_url TEXT, -- Already exists
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### TypeScript Interfaces

```typescript
// Application layer (camelCase) - existing interface
interface Profile {
  id: string;
  username: string;
  email: string;
  bio: string | null;
  avatarUrl: string | null; // Updated by avatar upload
  createdAt: Date;
}

// Cloudinary upload response
interface CloudinaryUploadResponse {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
}
```

---

## Security Analysis

### Threat Model

1. **Threat: Malicious File Upload**
   - **Description:** Attacker uploads executable file disguised as image
   - **Mitigation:**
     - Validate file MIME type on client and server
     - Check file magic numbers (not just extension)
     - Cloudinary performs additional validation
     - Store files on Cloudinary (isolated from application server)

2. **Threat: Large File DoS**
   - **Description:** Attacker uploads very large files to exhaust bandwidth/storage
   - **Mitigation:**
     - 5MB file size limit enforced
     - Cloudinary quota limits
     - Rate limiting on upload endpoint (recommended)

3. **Threat: Unauthorized Avatar Upload**
   - **Description:** Attacker uploads avatar for another user's profile
   - **Mitigation:**
     - JWT authentication required
     - Server verifies user can only update their own profile
     - Profile ID from JWT compared to target profile

4. **Threat: Cloudinary Credential Exposure**
   - **Description:** API keys exposed to client-side code
   - **Mitigation:**
     - Server-side upload only (credentials never sent to client)
     - Signed uploads using API secret (not exposed)
     - Environment variables for credential storage

### Input Validation

- [x] All user inputs validated with Zod before processing
- [x] File type validated by MIME type and magic numbers
- [x] File size validated before upload attempt
- [x] Cloudinary performs additional validation on uploaded files

### Authentication & Authorization

- [x] JWT tokens in httpOnly cookies only
- [x] POST /api/profiles/avatar requires authentication middleware
- [x] Authorization check: user can only upload avatar for their own profile

---

## Testing Requirements

### Unit Tests

- [x] File validation function with various file types
- [x] File size validation with edge cases (exactly 5MB, 5MB+1)
- [x] Zod schemas validated with valid/invalid data
- [x] Cloudinary upload utility function (mocked)
- [x] Image preview URL generation

### Integration Tests

- [x] POST /api/profiles/avatar with valid image (success case)
- [x] POST /api/profiles/avatar with invalid file type (400 error)
- [x] POST /api/profiles/avatar with oversized file (413 error)
- [x] POST /api/profiles/avatar without authentication (401 error)
- [x] POST /api/profiles/avatar for another user's profile (403 error)
- [x] Profile edit form submission with file upload
- [x] Profile update reflected in database

### End-to-End Tests

- [x] User uploads avatar and sees it on profile page
- [x] User uploads invalid file and sees error message
- [x] User switches between file upload and URL input
- [x] Upload progress indicator appears during upload
- [x] Form validation prevents submission with invalid file

---

## Performance Considerations

- [x] File upload happens directly to Cloudinary (not through app server)
- [x] Image preview uses blob URLs (no unnecessary network requests)
- [x] Cloudinary transformations applied for consistent avatar sizing
- [x] Avatar images cached by Cloudinary CDN
- [x] Form submission disabled during upload to prevent duplicates

---

## Accessibility

- [x] File input has accessible label
- [x] Error messages associated with form controls (aria-describedby)
- [x] Upload progress announced to screen readers (aria-live)
- [x] Keyboard navigation for all interactive elements
- [x] Focus management during file selection and upload
- [x] Image preview has alt text

---

## Dependencies

**Prerequisites:**
- [x] Cloudinary account with credentials in .env file
- [x] Existing authentication system (JWT)
- [x] Existing profile edit page and API

**External Services:**
- [x] Cloudinary for image hosting and transformation
- [x] Cloudinary SDK/API for server-side uploads

**Environment Variables (Already Configured):**
- `CLOUDINARY_CLOUD_NAME` - Cloudinary account name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret

**Blocking Issues:**
- None

---

## Open Questions

*All requirements are clear based on existing implementation patterns and Cloudinary documentation. No clarification needed.*

---

## Success Metrics

**How we'll measure success:**
- [x] User can upload avatar image in under 10 seconds (including selection and upload)
- [x] File validation prevents 100% of invalid file uploads
- [x] Uploaded avatars display correctly on profile page immediately after save
- [x] Zero security vulnerabilities in file upload implementation
- [x] Upload success rate above 95% for valid files
- [x] Error messages clearly guide users when upload fails

---

## Appendix

### References
- Existing feature: `/features/004-user-profile-system/` (documented POST /api/profiles/avatar endpoint)
- Cloudinary Upload API: https://cloudinary.com/documentation/image_upload_api_reference
- Current implementation: `app/pages/ProfileEdit.tsx`
- CLAUDE.md: Project architecture and patterns

### Change Log
| Date | Change | Author |
|------|--------|--------|
| 2025-10-16 | Initial specification | SpecSwarm |
