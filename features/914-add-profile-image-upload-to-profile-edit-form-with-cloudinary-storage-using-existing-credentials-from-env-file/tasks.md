# Implementation Tasks: Profile Image Upload

**Feature ID:** 914
**Created:** 2025-10-16
**Status:** not-started

<!-- Tech Stack Validation: PASSED -->
<!-- Validated against: /memory/tech-stack.md v1.2.0 -->
<!-- No prohibited technologies found -->
<!-- All technologies approved or auto-added -->

---

## Overview

This feature enables users to upload profile images directly from their devices to Cloudinary, replacing the manual URL entry method. Implementation follows a backend-first approach with comprehensive validation and security measures.

**User Stories:**
- **US1 (P0 - Primary)**: Direct file upload from device with preview and validation
- **US2 (P1 - Secondary)**: Maintain URL input as alternative method

**Implementation Strategy:**
1. Backend infrastructure first (API, Cloudinary, validation)
2. Frontend enhancement second (UI, preview, submission)
3. Testing and polish third (tests optional unless requested)

---

## Phase 1: Setup & Dependencies

### T001: Install and configure npm dependencies [P]
**File:** `package.json`
**Description:** Install required packages for file upload functionality
**Tasks:**
- [ ] Run `npm install multer @types/multer cloudinary`
- [ ] Verify package.json includes correct versions:
  - multer: ^1.4.x
  - @types/multer: ^1.4.x
  - cloudinary: ^2.x
- [ ] Run `npm install` to update lock file
- [ ] Verify no version conflicts in npm output

**Success Criteria:**
- All packages installed without errors
- package.json and package-lock.json updated
- No TypeScript errors related to missing types

---

### T002: Configure Cloudinary SDK [P]
**File:** `src/server/config/cloudinary.ts` (new file)
**Description:** Initialize Cloudinary SDK with credentials from environment variables
**Tasks:**
- [ ] Create `src/server/config/` directory if not exists
- [ ] Create `cloudinary.ts` config file
- [ ] Import cloudinary v2 SDK
- [ ] Configure with environment variables:
  - CLOUDINARY_CLOUD_NAME
  - CLOUDINARY_API_KEY
  - CLOUDINARY_API_SECRET
- [ ] Export configured cloudinary instance
- [ ] Add TypeScript types for configuration

**Code Structure:**
```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };
```

**Success Criteria:**
- Cloudinary configured successfully
- Environment variables loaded correctly
- TypeScript compiles without errors

---

### T003: Configure multer middleware
**File:** `src/server/middleware/upload.ts` (new file)
**Description:** Configure multer for file upload handling with memory storage
**Tasks:**
- [ ] Create `src/server/middleware/` directory if not exists
- [ ] Create `upload.ts` middleware file
- [ ] Import multer
- [ ] Configure multer with:
  - Storage: memoryStorage() (no disk writes)
  - Limits: fileSize 5MB (5 * 1024 * 1024 bytes)
  - File filter: accept only image types
- [ ] Export upload middleware instance
- [ ] Add TypeScript types

**Code Structure:**
```typescript
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

export const avatarUpload = upload.single('avatar');
```

**Success Criteria:**
- Multer configured with correct limits
- File type filter working
- TypeScript types correct
- No compilation errors

---

## Phase 2: Backend - File Validation Utilities

### T004: Create file validation utility (pure functions) [P]
**File:** `src/server/utils/fileValidation.ts` (new file)
**Description:** Pure functions for file type and size validation with magic number checks
**Tasks:**
- [ ] Create `src/server/utils/` directory if not exists
- [ ] Create `fileValidation.ts` utility file
- [ ] Implement `validateFileType(mimetype: string): boolean`
  - Check against allowed MIME types
  - Return boolean result
- [ ] Implement `validateMagicNumber(buffer: Buffer): boolean`
  - Check first bytes of buffer for image magic numbers
  - JPEG: FF D8 FF
  - PNG: 89 50 4E 47
  - GIF: 47 49 46 38
  - WebP: 52 49 46 46 (RIFF) + WebP signature
- [ ] Implement `validateFileSize(size: number): boolean`
  - Check size <= 5MB
- [ ] Add TypeScript interfaces for validation results
- [ ] Export all functions

**Code Structure:**
```typescript
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export const validateFileType = (mimetype: string): boolean => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return allowedTypes.includes(mimetype);
};

export const validateMagicNumber = (buffer: Buffer): boolean => {
  // Check magic numbers for actual file type
  // ... implementation
};

export const validateFileSize = (size: number): boolean => {
  return size <= 5 * 1024 * 1024;
};
```

**Success Criteria:**
- All validation functions are pure (no side effects)
- Magic number detection works for all supported types
- TypeScript types defined
- Functions testable with various inputs

---

### T005: Create Zod schema for file uploads [P]
**File:** `src/server/schemas/avatarUpload.ts` (new file)
**Description:** Zod schemas for validating file upload requests and Cloudinary responses
**Tasks:**
- [ ] Create `src/server/schemas/` directory if not exists
- [ ] Create `avatarUpload.ts` schema file
- [ ] Define `serverFileSchema` for multer file validation:
  - fieldname: literal 'avatar'
  - originalname: string
  - mimetype: enum with allowed types
  - size: number with max 5MB
  - buffer: instanceof Buffer
- [ ] Define `cloudinaryResponseSchema`:
  - public_id: string
  - secure_url: url string
  - width: number
  - height: number
  - format: string
  - resource_type: literal 'image'
- [ ] Define `avatarUploadResponseSchema` for API response
- [ ] Export all schemas

**Code Structure:**
```typescript
import { z } from 'zod';

export const serverFileSchema = z.object({
  fieldname: z.literal('avatar'),
  originalname: z.string(),
  encoding: z.string(),
  mimetype: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  size: z.number().max(5 * 1024 * 1024, 'File size must be under 5MB'),
  buffer: z.instanceof(Buffer),
});

export const cloudinaryResponseSchema = z.object({
  public_id: z.string(),
  secure_url: z.string().url(),
  width: z.number(),
  height: z.number(),
  format: z.string(),
  resource_type: z.literal('image'),
  created_at: z.string(),
});

export const avatarUploadResponseSchema = z.object({
  profile: z.object({
    id: z.string().uuid(),
    username: z.string(),
    bio: z.string().nullable(),
    avatarUrl: z.string().url(),
  }),
});
```

**Success Criteria:**
- All Zod schemas defined
- Schemas validate correct data
- TypeScript inference works
- Schemas can be tested with mock data

---

## Phase 3: Backend - Cloudinary Integration

### T006: Create Cloudinary upload utility (pure function)
**File:** `src/server/utils/cloudinaryUpload.ts` (new file)
**Description:** Pure function to upload image buffer to Cloudinary with transformations
**Tasks:**
- [ ] Create `cloudinaryUpload.ts` utility file
- [ ] Import configured Cloudinary instance
- [ ] Import Zod cloudinaryResponseSchema
- [ ] Implement `uploadAvatar(fileBuffer: Buffer, filename: string): Promise<CloudinaryUploadResult>`
  - Upload buffer to Cloudinary using upload_stream
  - Apply folder: 'avatars/'
  - Apply transformations: width=200, height=200, crop=fill, gravity=face
  - Use format: auto for optimization
  - Return upload result
- [ ] Validate response with Zod cloudinaryResponseSchema
- [ ] Handle errors gracefully
- [ ] Add TypeScript types

**Code Structure:**
```typescript
import { cloudinary } from '../config/cloudinary';
import { cloudinaryResponseSchema } from '../schemas/avatarUpload';

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
}

export const uploadAvatar = async (
  fileBuffer: Buffer,
  filename: string
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'avatars',
        public_id: filename,
        transformation: [
          { width: 200, height: 200, crop: 'fill', gravity: 'face' }
        ],
        format: 'auto',
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          // Validate with Zod
          const validated = cloudinaryResponseSchema.parse(result);
          resolve(validated);
        }
      }
    );
    uploadStream.end(fileBuffer);
  });
};
```

**Success Criteria:**
- Function is pure (predictable for same inputs)
- Upload works with Cloudinary API
- Transformations applied correctly
- Response validated with Zod
- Errors handled gracefully

---

### T007: Create database update utility (pure function)
**File:** `src/server/utils/profileUpdate.ts` (new file)
**Description:** Pure function to update profile avatar_url in database
**Tasks:**
- [ ] Create `profileUpdate.ts` utility file
- [ ] Import postgres SQL helper
- [ ] Implement `updateProfileAvatar(profileId: string, avatarUrl: string): Promise<Profile>`
  - Use parameterized query: UPDATE profiles SET avatar_url = $1 WHERE id = $2
  - Return updated profile
  - Handle case conversion (snake_case ↔ camelCase)
- [ ] Add TypeScript interfaces for Profile
- [ ] Handle errors (profile not found, database error)
- [ ] Export function

**Code Structure:**
```typescript
import { sql } from '../db'; // postgres package

export interface Profile {
  id: string;
  username: string;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: Date;
}

export const updateProfileAvatar = async (
  profileId: string,
  avatarUrl: string
): Promise<Profile> => {
  const [profile] = await sql`
    UPDATE profiles
    SET avatar_url = ${avatarUrl}
    WHERE id = ${profileId}
    RETURNING *
  `;

  if (!profile) {
    throw new Error('Profile not found');
  }

  return profile; // postgres package handles camelCase conversion
};
```

**Success Criteria:**
- Function uses parameterized queries
- Updates avatar_url correctly
- Returns updated profile
- Case conversion works (avatar_url → avatarUrl)
- Error handling in place

---

## Phase 4: Backend - API Endpoint

### T008: Implement POST /api/profiles/avatar endpoint
**File:** `src/server/routes/profiles.ts` (modify existing)
**Description:** Add avatar upload endpoint with authentication, validation, Cloudinary upload, and database update
**Tasks:**
- [ ] Open existing `src/server/routes/profiles.ts`
- [ ] Import required modules:
  - avatarUpload middleware (multer)
  - authenticate middleware (existing)
  - serverFileSchema, avatarUploadResponseSchema
  - uploadAvatar utility
  - updateProfileAvatar utility
  - validateMagicNumber utility
- [ ] Add POST /avatar route:
  - Middleware: authenticate, avatarUpload
  - Extract user ID from JWT token
  - Extract file from req.file
  - Validate file with Zod serverFileSchema
  - Validate magic number
  - Upload to Cloudinary (uploadAvatar)
  - Update profile in database (updateProfileAvatar)
  - Validate response with avatarUploadResponseSchema
  - Return updated profile (200)
  - Error handling:
    - 400: Invalid file/validation error
    - 401: Not authenticated
    - 403: Wrong profile (user can only update own)
    - 413: File too large
    - 500: Server/Cloudinary/database error

**Code Structure:**
```typescript
router.post(
  '/avatar',
  authenticate,
  avatarUpload,
  async (req, res) => {
    try {
      const userId = req.user.id; // from JWT
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Validate with Zod
      const validatedFile = serverFileSchema.parse(file);

      // Magic number check
      if (!validateMagicNumber(validatedFile.buffer)) {
        return res.status(400).json({ error: 'Invalid file type' });
      }

      // Upload to Cloudinary
      const cloudinaryResult = await uploadAvatar(
        validatedFile.buffer,
        `${userId}_${Date.now()}`
      );

      // Update profile
      const updatedProfile = await updateProfileAvatar(
        userId,
        cloudinaryResult.secure_url
      );

      // Validate and return response
      const response = avatarUploadResponseSchema.parse({
        profile: updatedProfile,
      });

      res.json(response);
    } catch (error) {
      // Error handling
      console.error('Avatar upload error:', error);
      res.status(500).json({ error: 'Failed to upload avatar' });
    }
  }
);
```

**Success Criteria:**
- Endpoint registered at POST /api/profiles/avatar
- Authentication middleware applied
- File validation working (Zod + magic numbers)
- Cloudinary upload functional
- Database update working
- Proper error responses for all scenarios
- TypeScript compiles without errors

---

## Phase 5: Frontend - File Upload Component

### T009: Create ImageUploadField component [P]
**File:** `app/components/ImageUploadField.tsx` (new file)
**Description:** Reusable functional component for file selection and preview
**Tasks:**
- [ ] Create `app/components/` directory if not exists
- [ ] Create `ImageUploadField.tsx` component file
- [ ] Define TypeScript props interface:
  - currentAvatarUrl: string | null
  - onFileSelect: (file: File | null) => void
  - previewUrl: string | null
  - error: string | null
- [ ] Implement functional component using hooks
- [ ] Render file input with styled button (Tailwind CSS + Flowbite)
- [ ] Display image preview if previewUrl exists
- [ ] Show current avatar if no preview
- [ ] Display validation errors
- [ ] Add accessibility:
  - Label for file input
  - aria-describedby for errors
  - Alt text for preview image
- [ ] Style with Tailwind CSS
- [ ] Export component

**Code Structure:**
```typescript
interface ImageUploadFieldProps {
  currentAvatarUrl: string | null;
  onFileSelect: (file: File | null) => void;
  previewUrl: string | null;
  error: string | null;
}

export default function ImageUploadField({
  currentAvatarUrl,
  onFileSelect,
  previewUrl,
  error,
}: ImageUploadFieldProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onFileSelect(file);
  };

  const displayUrl = previewUrl || currentAvatarUrl;

  return (
    <div className="space-y-4">
      <label htmlFor="avatar-upload" className="block text-sm font-medium">
        Profile Image
      </label>

      <input
        type="file"
        id="avatar-upload"
        name="avatar"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        aria-describedby={error ? "avatar-error" : undefined}
        className="block w-full text-sm"
      />

      {displayUrl && (
        <img
          src={displayUrl}
          alt="Profile preview"
          className="w-32 h-32 rounded-full object-cover"
        />
      )}

      {error && (
        <p id="avatar-error" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
```

**Success Criteria:**
- Component is functional (no class)
- Uses hooks for state
- Props interface defined
- File input works
- Preview displays correctly
- Accessibility attributes present
- Tailwind styling applied
- TypeScript compiles

---

### T010: Create client-side validation utility (pure function) [P]
**File:** `app/utils/fileValidation.ts` (new file)
**Description:** Pure function for client-side file validation before upload
**Tasks:**
- [ ] Create `app/utils/` directory if not exists
- [ ] Create `fileValidation.ts` utility file
- [ ] Import Zod
- [ ] Define clientFileSchema (Zod custom validator):
  - Check instanceof File
  - Check size <= 5MB
  - Check MIME type in allowed list
- [ ] Implement `validateImageFile(file: File): { valid: boolean; error?: string }`
  - Use Zod safeParse
  - Return validation result
- [ ] Export schema and function

**Code Structure:**
```typescript
import { z } from 'zod';

export const clientFileSchema = z.custom<File>((file) => {
  if (!(file instanceof File)) return false;

  // Size check (5MB max)
  if (file.size > 5 * 1024 * 1024) return false;

  // MIME type check
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.includes(file.type);
}, {
  message: 'File must be an image under 5MB (JPEG, PNG, GIF, or WebP)',
});

export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const result = clientFileSchema.safeParse(file);
  if (!result.success) {
    return {
      valid: false,
      error: result.error.errors[0]?.message || 'Invalid file',
    };
  }
  return { valid: true };
};
```

**Success Criteria:**
- Function is pure
- Zod validation works
- Returns clear error messages
- TypeScript types correct

---

### T011: Create image preview utility (pure function) [P]
**File:** `app/utils/imagePreview.ts` (new file)
**Description:** Pure function to generate blob URL for image preview
**Tasks:**
- [ ] Create `imagePreview.ts` utility file
- [ ] Implement `createImagePreview(file: File): string`
  - Use URL.createObjectURL
  - Return blob URL
- [ ] Implement `revokeImagePreview(url: string): void`
  - Use URL.revokeObjectURL
  - Clean up blob URL
- [ ] Export functions

**Code Structure:**
```typescript
export const createImagePreview = (file: File): string => {
  return URL.createObjectURL(file);
};

export const revokeImagePreview = (url: string): void => {
  URL.revokeObjectURL(url);
};
```

**Success Criteria:**
- Functions are pure
- Blob URLs generated correctly
- Cleanup function available
- TypeScript types correct

---

## Phase 6: Frontend - ProfileEdit Enhancement

### T012: Enhance ProfileEdit component with file upload state
**File:** `app/pages/ProfileEdit.tsx` (modify existing)
**Description:** Add file upload state and handlers to existing ProfileEdit component
**Tasks:**
- [ ] Open `app/pages/ProfileEdit.tsx`
- [ ] Import React hooks: useState, useEffect
- [ ] Import ImageUploadField component
- [ ] Import validation and preview utilities
- [ ] Add new state variables (using useState):
  - selectedFile: File | null
  - previewUrl: string | null
  - uploadMethod: 'file' | 'url' (default: 'url')
  - fileError: string | null
- [ ] Implement `handleFileSelect(file: File | null)` function:
  - Validate file
  - Set fileError if invalid
  - Generate preview URL if valid
  - Update selectedFile state
  - Set uploadMethod to 'file'
- [ ] Add useEffect to clean up blob URLs on unmount
- [ ] Add toggle between file upload and URL input
- [ ] Render ImageUploadField component in form
- [ ] Keep existing bio field and URL field

**Code Structure:**
```typescript
export default function ProfileEdit() {
  const { profile } = useLoaderData<ProfileEditData>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();

  // Existing state
  const [bioLength, setBioLength] = useState((profile.bio || '').length);

  // New state for file upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('url');
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileSelect = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setFileError(null);
      return;
    }

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setFileError(validation.error || 'Invalid file');
      return;
    }

    // Generate preview
    const preview = createImagePreview(file);
    setPreviewUrl(preview);
    setSelectedFile(file);
    setFileError(null);
    setUploadMethod('file');
  };

  // Cleanup blob URLs
  useEffect(() => {
    return () => {
      if (previewUrl) {
        revokeImagePreview(previewUrl);
      }
    };
  }, [previewUrl]);

  // Render
  return (
    <div>
      {/* ... existing header ... */}

      <Form method="post" encType={uploadMethod === 'file' ? 'multipart/form-data' : undefined}>
        {/* File upload option */}
        <div className="mb-6">
          <ImageUploadField
            currentAvatarUrl={profile.avatarUrl}
            onFileSelect={handleFileSelect}
            previewUrl={previewUrl}
            error={fileError}
          />
        </div>

        {/* OR divider */}
        <div className="text-center text-sm text-gray-500 mb-6">OR</div>

        {/* Existing URL input */}
        <div className="mb-6">
          {/* ... existing avatarUrl input field ... */}
        </div>

        {/* Existing bio field */}
        {/* ... */}

        {/* Submit button */}
        {/* ... */}
      </Form>
    </div>
  );
}
```

**Success Criteria:**
- File upload state added
- Handlers implemented as pure functions
- ImageUploadField component integrated
- Blob URL cleanup working
- Toggle between file/URL working
- TypeScript compiles
- Existing functionality preserved

---

### T013: Update ProfileEdit action to handle file uploads
**File:** `app/pages/ProfileEdit.tsx` (modify existing action function)
**Description:** Enhance action function to detect file uploads and submit to correct endpoint
**Tasks:**
- [ ] Open ProfileEdit action function
- [ ] Check if request.headers Content-Type includes 'multipart/form-data'
- [ ] If file upload:
  - Extract FormData
  - Submit to POST /api/profiles/avatar with file
  - Include authentication cookie
  - Handle response
- [ ] If URL update:
  - Use existing PUT /api/profiles/:username flow
- [ ] Handle errors for both paths
- [ ] Maintain existing redirect on success

**Code Structure:**
```typescript
export async function action({ request, params }: ActionFunctionArgs) {
  const { username } = params;
  const contentType = request.headers.get('Content-Type') || '';

  const cookie = request.headers.get('Cookie') || '';

  // Check if this is a file upload
  if (contentType.includes('multipart/form-data')) {
    try {
      const formData = await request.formData();

      // Submit to avatar upload endpoint
      const response = await fetch(getApiUrl('/api/profiles/avatar'), {
        method: 'POST',
        headers: {
          'Cookie': cookie,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.error || 'Failed to upload avatar' };
      }

      // Redirect on success
      return redirect(`/profile/${username}`);
    } catch (error) {
      console.error('Avatar upload error:', error);
      return { error: 'Network error. Please try again.' };
    }
  }

  // Existing URL/bio update flow
  // ... (keep existing code)
}
```

**Success Criteria:**
- Action detects file uploads correctly
- Submits to correct endpoint
- Handles both file and URL updates
- Error handling for both paths
- Redirects on success
- TypeScript compiles

---

### T014: Add upload progress indication
**File:** `app/pages/ProfileEdit.tsx` (modify existing)
**Description:** Show upload progress and disable submit during upload
**Tasks:**
- [ ] Add state for upload progress: uploadProgress (number)
- [ ] Use React Router navigation.state to detect submitting
- [ ] Show spinner or progress indicator when submitting
- [ ] Disable submit button during upload
- [ ] Add aria-live announcement for screen readers
- [ ] Clear progress after completion

**Code Structure:**
```typescript
const navigation = useNavigation();
const isSubmitting = navigation.state === 'submitting';

// In render:
<button
  type="submit"
  disabled={isSubmitting || !!fileError}
  className="..."
>
  {isSubmitting ? (
    <>
      <svg className="animate-spin h-5 w-5" />
      Uploading...
    </>
  ) : (
    'Save Changes'
  )}
</button>

{isSubmitting && (
  <div aria-live="polite" className="sr-only">
    Uploading avatar...
  </div>
)}
```

**Success Criteria:**
- Progress indication visible during upload
- Submit button disabled while uploading
- Screen reader announcement working
- UI updates correctly

---

## Phase 7: Testing (Optional - only if explicitly requested)

**Note:** Test tasks are optional. Only implement if tests are explicitly requested in feature spec or by user.

### T015: Write unit tests for backend utilities
**File:** `src/server/utils/__tests__/fileValidation.test.ts` (new file)
**Description:** Test file validation pure functions
**Tasks:**
- [ ] Create test file for fileValidation utilities
- [ ] Test validateFileType with valid MIME types
- [ ] Test validateFileType with invalid MIME types
- [ ] Test validateMagicNumber with actual image buffers
- [ ] Test validateFileSize with edge cases (exactly 5MB, 5MB+1)
- [ ] All tests pass

---

### T016: Write unit tests for Cloudinary upload
**File:** `src/server/utils/__tests__/cloudinaryUpload.test.ts` (new file)
**Description:** Test Cloudinary upload with mocked API
**Tasks:**
- [ ] Create test file
- [ ] Mock Cloudinary upload_stream
- [ ] Test successful upload
- [ ] Test upload failure
- [ ] Test Zod validation of response
- [ ] All tests pass

---

### T017: Write integration tests for API endpoint
**File:** `src/server/routes/__tests__/profiles.test.ts` (modify or create)
**Description:** Test POST /api/profiles/avatar endpoint with various scenarios
**Tasks:**
- [ ] Test with valid file and auth - expect 200
- [ ] Test without auth - expect 401
- [ ] Test with invalid file type - expect 400
- [ ] Test with oversized file - expect 413
- [ ] Test Cloudinary upload failure - expect 500
- [ ] Test database update
- [ ] All tests pass

---

### T018: Write E2E tests for avatar upload flow
**File:** `tests/e2e/avatar-upload.spec.ts` (new file)
**Description:** End-to-end Playwright test for complete user flow
**Tasks:**
- [ ] Set up test with authenticated user
- [ ] Navigate to /settings
- [ ] Select valid image file
- [ ] Verify preview appears
- [ ] Submit form
- [ ] Verify redirect to profile
- [ ] Verify avatar displayed
- [ ] Test with invalid file (expect error message)
- [ ] All tests pass

---

## Phase 8: Documentation & Polish

### T019: Update API documentation [P]
**File:** `README.md` or API docs file (modify existing)
**Description:** Document new POST /api/profiles/avatar endpoint
**Tasks:**
- [ ] Add endpoint documentation:
  - Method: POST
  - Path: /api/profiles/avatar
  - Auth: Required (JWT)
  - Request: multipart/form-data with avatar field
  - Response: Updated profile object
  - Error codes: 400, 401, 413, 500
- [ ] Include request example
- [ ] Include response example
- [ ] Document file requirements (types, size)

---

### T020: Update CLAUDE.md [P]
**File:** `CLAUDE.md` (modify existing)
**Description:** Verify API endpoint list includes new endpoint
**Tasks:**
- [ ] Open CLAUDE.md
- [ ] Verify "API Endpoints" section includes:
  - POST /api/profiles/avatar
- [ ] Update if missing
- [ ] Ensure description is accurate

---

### T021: Add code comments to complex functions [P]
**File:** Various utility files (modify existing)
**Description:** Add JSDoc comments to key functions
**Tasks:**
- [ ] Add JSDoc to `uploadAvatar` function:
  - Description
  - @param fileBuffer - The image file buffer
  - @param filename - Filename for Cloudinary
  - @returns Promise with upload result
  - @throws Error if upload fails
- [ ] Add JSDoc to `validateMagicNumber` function
- [ ] Add JSDoc to other pure functions
- [ ] Ensure TypeScript compiles

---

## Phase 9: Final Validation

### T022: Constitution compliance final check
**Description:** Verify all 5 constitutional principles followed
**Tasks:**
- [ ] **Principle 1 (Functional Programming):**
  - All utilities are pure functions ✓
  - No classes used (except library APIs) ✓
  - React components are functional ✓
- [ ] **Principle 2 (Type Safety):**
  - TypeScript strict mode enabled ✓
  - All boundaries have Zod schemas ✓
  - No `any` types ✓
- [ ] **Principle 3 (Programmatic Routing):**
  - No new routes in app/routes.ts ✓
  - Enhanced existing /settings route ✓
- [ ] **Principle 4 (Security-First):**
  - File validation (MIME + magic numbers) ✓
  - Authentication required ✓
  - Parameterized database queries ✓
  - Cloudinary credentials server-side only ✓
- [ ] **Principle 5 (Modern React):**
  - Functional components with hooks ✓
  - Loader/action for data fetching ✓
  - No class components ✓

---

### T023: TypeScript compilation check
**Description:** Ensure no TypeScript errors
**Tasks:**
- [ ] Run `npm run typecheck`
- [ ] Fix any TypeScript errors
- [ ] Verify strict mode compliance
- [ ] All checks pass

---

### T024: Manual testing - happy path
**Description:** Test complete user flow manually
**Tasks:**
- [ ] Start dev server
- [ ] Sign in as test user
- [ ] Navigate to /settings
- [ ] Select valid image file (JPEG, under 5MB)
- [ ] Verify preview appears
- [ ] Submit form
- [ ] Verify redirect to profile page
- [ ] Verify avatar displayed on profile
- [ ] Check avatar on feed (if applicable)

---

### T025: Manual testing - error scenarios
**Description:** Test error handling manually
**Tasks:**
- [ ] Try uploading PDF file - expect error message
- [ ] Try uploading 6MB image - expect error message
- [ ] Try uploading without authentication - expect 401
- [ ] Test with network error (disconnect) - expect error message
- [ ] Verify error messages are user-friendly

---

## Summary

**Total Tasks:** 25
**Parallelizable Tasks:** 11 (marked with [P])
**Dependencies:** Backend must complete before frontend

**Task Breakdown by Phase:**
- Phase 1 (Setup): 3 tasks
- Phase 2 (Validation): 2 tasks
- Phase 3 (Cloudinary): 2 tasks
- Phase 4 (API): 1 task
- Phase 5 (Frontend Components): 3 tasks
- Phase 6 (ProfileEdit): 3 tasks
- Phase 7 (Testing): 4 tasks (optional)
- Phase 8 (Documentation): 3 tasks
- Phase 9 (Validation): 4 tasks

**Parallel Execution Opportunities:**
- Phase 1: All 3 tasks can run in parallel (different files)
- Phase 2: Both tasks can run in parallel (different files)
- Phase 5: All 3 tasks can run in parallel (different files)
- Phase 8: All 3 tasks can run in parallel (different files)

**Critical Path:**
1. Setup & Dependencies (T001-T003)
2. Backend utilities (T004-T007)
3. API endpoint (T008)
4. Frontend components (T009-T011)
5. ProfileEdit enhancement (T012-T014)
6. Testing (T015-T018) - optional
7. Documentation (T019-T021)
8. Final validation (T022-T025)

**Estimated Completion:** Backend (8 tasks) + Frontend (6 tasks) + Docs/Polish (7 tasks) = 21 tasks minimum (excluding optional tests)

**MVP Scope:** Tasks T001-T014 deliver complete user-facing feature
**Full Scope:** All 25 tasks for production-ready implementation

---

## Dependencies

**External Dependencies:**
- Cloudinary account credentials (already configured in .env)
- Existing authentication system (JWT middleware)
- Existing ProfileEdit page and route

**Internal Dependencies:**
- Backend tasks (T001-T008) must complete before frontend testing
- Frontend state (T012) depends on components (T009-T011)
- Action update (T013) depends on API endpoint (T008)

**Blocking Issues:**
- None - all prerequisites are in place

---

## Parallel Execution Examples

**Backend Parallel Group 1 (can run simultaneously):**
- T001: Install dependencies
- T002: Configure Cloudinary
- T003: Configure multer

**Backend Parallel Group 2 (can run simultaneously):**
- T004: File validation utilities
- T005: Zod schemas

**Frontend Parallel Group (can run simultaneously):**
- T009: ImageUploadField component
- T010: Client validation utility
- T011: Image preview utility

**Documentation Parallel Group (can run simultaneously):**
- T019: API documentation
- T020: CLAUDE.md update
- T021: Code comments

---

## Implementation Strategy

**Approach:** Backend-first, incremental delivery

**Phase 1: Backend Infrastructure (MVP)**
- Complete T001-T008 (backend)
- Test with curl/Postman
- Verify Cloudinary uploads working
- Checkpoint: API functional, testable independently

**Phase 2: Frontend Integration**
- Complete T009-T014 (frontend)
- Test end-to-end user flow
- Checkpoint: Feature complete, user-facing

**Phase 3: Polish & Production-Ready**
- Complete T015-T025 (tests, docs, validation)
- Checkpoint: Production-ready, documented

**Success Criteria:**
- User can upload avatar in under 10 seconds
- File validation prevents 100% of invalid uploads
- Upload success rate above 95% for valid files
- All constitutional principles followed
- Zero TypeScript errors
- No security vulnerabilities
