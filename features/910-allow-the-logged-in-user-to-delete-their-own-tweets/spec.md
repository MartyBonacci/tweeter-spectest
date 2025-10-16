# Feature Specification: Tweet Deletion

**Feature ID:** 910-allow-the-logged-in-user-to-delete-their-own-tweets
**Created:** 2025-10-15
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
- **Principle 1:** Delete functionality will use pure functions for API calls and database operations, no class-based components
- **Principle 2:** TypeScript interfaces for delete operations, Zod validation for API request/response
- **Principle 3:** Uses React Router actions for delete mutations, no new routes required
- **Principle 4:** Authorization enforced at API layer (users can only delete their own tweets), parameterized SQL queries prevent injection
- **Principle 5:** Uses React Router useFetcher for optimistic UI updates, functional components with hooks

---

## Summary

**What:** Allow authenticated users to delete their own tweets with confirmation

**Why:** Users need the ability to remove tweets they no longer want visible, providing control over their published content

**Who:** Authenticated Tweeter users viewing their own tweets

---

## User Stories

### Primary User Story
```
As an authenticated user
I want to delete my own tweets
So that I can remove content I no longer want to be visible
```

**Acceptance Criteria:**
- [x] Delete button appears ONLY on tweets authored by the current user
- [x] Clicking delete shows a confirmation modal before executing
- [x] Confirmed deletion removes tweet from database permanently
- [x] Tweet disappears from UI immediately after confirmation (optimistic update)
- [x] Error state displays if deletion fails (with option to retry)
- [x] Unauthorized deletion attempts are rejected by the API

### Secondary User Stories

#### US-2: Error Handling
```
As a user attempting to delete a tweet
I want clear error messages if deletion fails
So that I understand what went wrong and can take appropriate action
```

**Acceptance Criteria:**
- [x] "Tweet not found" error if tweet was already deleted
- [x] "Not authorized" error if user doesn't own the tweet
- [x] Network error handling with retry option
- [x] Optimistic update reverts if deletion fails

#### US-3: Confirmation Safety
```
As a user who accidentally clicks delete
I want a confirmation modal before deletion
So that I don't lose content unintentionally
```

**Acceptance Criteria:**
- [x] Modal displays the tweet content being deleted
- [x] Clear "Delete" and "Cancel" buttons
- [x] Pressing Escape or clicking outside cancels deletion
- [x] Modal is keyboard accessible

---

## Functional Requirements

### Must Have (P0)

1. **Delete Button Visibility**
   - Delete button appears on TweetCard component ONLY when `currentUserId === tweet.author.id`
   - Button is visually distinct (e.g., red color, trash icon)
   - Button has accessible label ("Delete tweet")

2. **Confirmation Modal**
   - Modal displays when delete button is clicked
   - Shows confirmation message: "Are you sure you want to delete this tweet?"
   - Displays tweet content preview in modal
   - Provides "Delete" (destructive action) and "Cancel" buttons
   - Clicking outside modal or pressing Escape dismisses modal without deleting

3. **DELETE API Endpoint**
   - Endpoint: `DELETE /api/tweets/:id`
   - Requires authentication (JWT token in cookie)
   - Validates tweet ownership (tweet.profile_id === authenticated user ID)
   - Returns 204 No Content on success
   - Returns appropriate error codes (401, 403, 404, 500)

4. **Optimistic UI Update**
   - Tweet disappears from feed immediately after user confirms deletion
   - If API call fails, tweet reappears with error message
   - Loading state shown on delete button during API call

5. **Database Deletion**
   - Tweet row deleted from `tweets` table
   - Associated likes deleted via CASCADE foreign key constraint
   - Deletion is permanent (no soft delete for MVP)

### Should Have (P1)

1. **Keyboard Shortcuts**
   - Delete key on focused tweet opens confirmation modal
   - Enter confirms deletion in modal
   - Escape cancels modal

2. **Toast Notifications**
   - Success toast: "Tweet deleted" (auto-dismiss after 3 seconds)
   - Error toast: Specific error message (persists until dismissed)

### Could Have (P2)

1. **Undo Deletion**
   - 5-second window to undo deletion before permanent removal
   - "Undo" button in success toast
   - Tweet soft-deleted during undo window

2. **Deletion Analytics**
   - Track deletion rate for content moderation insights
   - Log deleted tweet content for audit purposes (with retention policy)

### Won't Have (Out of Scope)

1. **Bulk Deletion** - Users cannot delete multiple tweets at once
2. **Archive Feature** - No option to archive instead of delete
3. **Admin Deletion** - Only tweet authors can delete, no admin override in this feature
4. **Deletion History** - No "recently deleted" view or trash folder

---

## Technical Requirements

### Type Safety Requirements
- [x] TypeScript interfaces defined for all data structures
- [x] Zod schemas created for:
  - [x] API request validation (DELETE params)
  - [x] API response validation (204 success, error responses)
  - [x] Tweet ownership validation

### Security Requirements
- [x] Authentication method: JWT token in httpOnly cookie
- [x] Authorization rules: Users can ONLY delete tweets where `tweet.profile_id === authenticated_user_id`
- [x] Input sanitization: Tweet ID validated as UUID format before database query
- [x] Data protection: No sensitive data exposed in error messages (generic "Not authorized" instead of revealing ownership)

### Data Requirements
- [x] Database schema changes documented: No schema changes (uses existing `tweets` table)
- [x] Migration strategy defined: N/A (no schema changes)
- [x] Data validation rules specified: UUID validation for tweet ID
- [x] snake_case ↔ camelCase mapping identified: `profile_id` ↔ `profileId`

### Routing Requirements
- [x] Routes added to `app/routes.ts`: No new routes (uses React Router action)
- [x] Loader functions defined for data fetching: N/A (deletion is mutation)
- [x] Action functions defined for mutations: DELETE action handled via fetcher
- [x] No file-based routes created: Confirmed

---

## User Interface

### Pages/Views

1. **Feed Page** (`/feed`)
   - Purpose: Display all tweets with delete button on user's own tweets
   - Components: TweetList, TweetCard (modified), DeleteConfirmationModal
   - Data: Tweets loaded via existing feed loader

2. **Profile Page** (`/profile/:username`)
   - Purpose: Display user's profile with their tweets, including delete functionality
   - Components: Profile, TweetList, TweetCard (modified), DeleteConfirmationModal
   - Data: Profile and tweets loaded via existing profile loader

3. **Tweet Detail Page** (`/tweets/:id`)
   - Purpose: Display single tweet with delete button if owned by current user
   - Components: TweetDetail, TweetCard (modified), DeleteConfirmationModal
   - Data: Single tweet loaded via existing detail loader

### Components

1. **DeleteButton** (functional component)
   - Props: `{ tweetId: string, tweetContent: string, onDelete: () => void }`
   - State: `isModalOpen: boolean`, `isDeleting: boolean`
   - Behavior: Opens confirmation modal on click, handles delete action via fetcher

2. **DeleteConfirmationModal** (functional component)
   - Props: `{ isOpen: boolean, tweetContent: string, onConfirm: () => void, onCancel: () => void, isDeleting: boolean }`
   - State: None (controlled by parent)
   - Behavior: Renders modal with Flowbite styling, handles confirm/cancel actions

3. **TweetCard** (modified existing component)
   - Props: Add `currentUserId?: string` to existing props
   - State: No changes to existing state
   - Behavior: Conditionally renders DeleteButton when `currentUserId === tweet.author.id`

### User Flows

```
Delete Tweet Flow:
1. User views feed, profile, or tweet detail page
2. User sees their own tweets with delete button (red trash icon)
3. User clicks delete button on a tweet
4. Confirmation modal appears with tweet content preview
5. User clicks "Delete" button in modal (or "Cancel" to abort)
6. Tweet immediately disappears from UI (optimistic update)
7. DELETE request sent to /api/tweets/:id
8. On success: Success toast appears briefly, tweet stays removed
9. On failure: Tweet reappears, error toast displays with retry option
```

---

## API Specification

### Endpoints

#### `DELETE /api/tweets/:id`
**Purpose:** Delete a tweet authored by the authenticated user

**Authentication:** Required (JWT token in httpOnly cookie)

**Request:**
```typescript
// Path parameter
interface DeleteTweetParams {
  id: string; // Tweet UUID
}

// Zod schema for validation
const deleteTweetParamsSchema = z.object({
  id: z.string().uuid('Invalid tweet ID format'),
});
```

**Response:**
```typescript
// Success (204 No Content)
// No response body

// Error response body
interface ErrorResponse {
  error: string;
  details?: string;
}

// Zod schema
const errorResponseSchema = z.object({
  error: z.string(),
  details: z.string().optional(),
});
```

**Error Responses:**
- `400`: Invalid tweet ID format (not a UUID)
- `401`: Authentication required (no valid JWT token)
- `403`: Not authorized (tweet not owned by authenticated user)
- `404`: Tweet not found (already deleted or never existed)
- `500`: Server error (database failure)

**Example Requests:**

```typescript
// Success
DELETE /api/tweets/550e8400-e29b-41d4-a716-446655440000
Headers: Cookie: auth_token=<jwt>
Response: 204 No Content

// Error - Not authorized
DELETE /api/tweets/550e8400-e29b-41d4-a716-446655440001
Headers: Cookie: auth_token=<jwt>
Response: 403 Forbidden
Body: { "error": "Not authorized to delete this tweet" }

// Error - Tweet not found
DELETE /api/tweets/550e8400-e29b-41d4-a716-446655440002
Headers: Cookie: auth_token=<jwt>
Response: 404 Not Found
Body: { "error": "Tweet not found" }
```

---

## Data Model

### Database Schema

#### Table: tweets (existing table, no changes)
```sql
-- No schema changes required
-- Deletion uses existing structure
DELETE FROM tweets WHERE id = $1;
```

**Cascade Behavior:**
- When a tweet is deleted, all associated likes are automatically deleted via existing CASCADE constraint on `likes.tweet_id` foreign key

**Indexes:**
- [x] Existing primary key index on `id` used for delete operation
- [x] Existing index on `profile_id` used for ownership check

**Constraints:**
- [x] Foreign key constraint on `likes.tweet_id` ensures orphaned likes are removed

### TypeScript Interfaces

```typescript
// No new interfaces required - uses existing TweetWithAuthorAndLikes

// Delete operation request (path param)
interface DeleteTweetRequest {
  tweetId: string; // UUID
}

// Delete operation response (empty on success)
type DeleteTweetResponse = void;

// Error response
interface DeleteError {
  error: string;
  details?: string;
}
```

---

## Security Analysis

### Threat Model

1. **Unauthorized Deletion:** Malicious user attempts to delete another user's tweets
   - **Mitigation:** API validates `tweet.profile_id === authenticated_user_id` before deletion, returns 403 if not authorized

2. **SQL Injection:** Attacker sends malicious tweet ID to execute arbitrary SQL
   - **Mitigation:** Parameterized queries via `postgres` package, Zod validation ensures ID is valid UUID format

3. **CSRF (Cross-Site Request Forgery):** Attacker tricks user into deleting tweets via malicious site
   - **Mitigation:** JWT in httpOnly cookie (not accessible to JavaScript), SameSite cookie attribute prevents cross-site requests

4. **Replay Attacks:** Attacker intercepts and replays delete request
   - **Mitigation:** Idempotent DELETE operation (deleting already-deleted tweet returns 404, no side effects)

### Input Validation
- [x] All user inputs validated with Zod before processing (tweet ID as UUID)
- [x] SQL injection prevented via parameterized queries (`db`DELETE FROM tweets WHERE id = ${tweetId}``)
- [x] XSS prevented via React's automatic escaping (tweet content never rendered as HTML)

### Authentication & Authorization
- [x] JWT tokens in httpOnly cookies only (not accessible via JavaScript)
- [x] Protected routes have authentication middleware (`authenticate` middleware on DELETE endpoint)
- [x] Authorization checks before data access (ownership validation: `tweet.profile_id === req.user.userId`)

---

## Testing Requirements

### Unit Tests

- [x] `deleteTweet` database function tested with valid/invalid IDs
- [x] Zod schema validates UUID format (rejects non-UUID strings)
- [x] DeleteButton component renders only when `currentUserId` matches tweet author
- [x] DeleteConfirmationModal renders with correct content and buttons
- [x] Modal handlers (onConfirm, onCancel) called correctly

### Integration Tests

- [x] DELETE /api/tweets/:id endpoint tested with authentication
  - Success case: User deletes their own tweet (204)
  - Error case: User tries to delete another user's tweet (403)
  - Error case: Tweet not found (404)
  - Error case: Invalid UUID format (400)
  - Error case: No authentication (401)
- [x] Database cascade deletion verified (likes deleted when tweet deleted)
- [x] Optimistic update behavior tested (tweet removed, then reverted on error)

### End-to-End Tests

- [x] User can delete their own tweet from feed page
- [x] User can delete their own tweet from profile page
- [x] User can delete their own tweet from tweet detail page
- [x] Confirmation modal prevents accidental deletion
- [x] Error handling displays appropriate messages
- [x] Delete button does NOT appear on other users' tweets

---

## Performance Considerations

- [x] Database delete operation is fast (indexed primary key lookup)
- [x] Optimistic UI update provides instant feedback (no waiting for API)
- [x] Modal component is lazy-loaded to reduce initial bundle size
- [x] Cascade deletion handled by database (no N+1 queries)

---

## Accessibility

- [x] Semantic HTML elements used (`<button>`, `<dialog>` or ARIA modal)
- [x] ARIA labels where needed (`aria-label="Delete tweet"` on button)
- [x] Keyboard navigation supported (Tab to button, Enter to open modal, Escape to cancel)
- [x] Color contrast meets WCAG standards (red delete button has sufficient contrast)
- [x] Screen reader announces modal opening and deletion status

---

## Dependencies

**Prerequisites:**
- [x] Authentication system (JWT tokens, `authenticate` middleware)
- [x] Existing TweetCard component
- [x] Existing database connection (`createDbConnection`)
- [x] React Router fetcher API for optimistic updates

**External Services:**
- None

**Blocking Issues:**
- None

---

## Open Questions

1. **Soft Delete vs Hard Delete:** Should we implement soft delete (mark as deleted, hide from UI) or hard delete (permanently remove from database)?
   - **Decision:** Hard delete for MVP. Soft delete can be added later if needed for audit/compliance.

2. **Cascade Deletion Scope:** What happens to data referencing deleted tweets beyond likes (e.g., notifications, analytics)?
   - **Assumption:** Only likes exist currently. Future features will need to handle their own cascade logic.

3. **Rate Limiting:** Should we limit deletion frequency to prevent abuse?
   - **Decision:** No rate limiting for MVP. Users deleting their own content is legitimate use case.

---

## Success Metrics

**How we'll measure success:**
- [x] Users can successfully delete their own tweets within 3 clicks (delete → confirm → done)
- [x] 0 unauthorized deletion incidents (API correctly enforces ownership)
- [x] Delete operation completes in < 500ms (database + API roundtrip)
- [x] Error rate < 1% for valid deletion attempts
- [x] All acceptance criteria met (delete button visibility, confirmation modal, optimistic update, error handling)

---

## Appendix

### References
- Feature 002: Tweet Posting and Feed System (existing tweets functionality)
- Feature 003: Like Functionality (cascade deletion of likes)
- React Router useFetcher documentation: https://reactrouter.com/en/main/hooks/use-fetcher
- Flowbite Modal component: https://flowbite.com/docs/components/modal/

### Change Log
| Date | Change | Author |
|------|--------|--------|
| 2025-10-15 | Initial specification | Claude + User |
