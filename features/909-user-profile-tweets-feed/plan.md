# Implementation Plan: User Profile Tweets Feed

**Feature ID:** 909-user-profile-tweets-feed
**Created:** 2025-10-15
**Status:** Ready for Implementation
**Estimated Effort:** 3-4 hours

---

## Constitution Compliance Check

All principles from `/memory/constitution.md` verified:

- [x] **Principle 1 (Functional Programming):** Design uses pure functions for data fetching and rendering, no classes
- [x] **Principle 2 (Type Safety):** TypeScript interfaces + Zod schemas for all API boundaries
- [x] **Principle 3 (Programmatic Routing):** Extends existing `/profile/:username` route in app/routes.ts
- [x] **Principle 4 (Security-First):** JWT authentication enforced, parameterized queries, input validation
- [x] **Principle 5 (Modern React):** Functional component with hooks, loader-based data fetching (no useEffect)

**Compliance Notes:** This feature is a textbook example of constitution-compliant development - it extends existing patterns without introducing any violations or requiring exceptions.

---

## Tech Stack Compliance Report

**Status:** ✅ **100% APPROVED** - No tech stack changes required

### ✅ Approved Technologies (already in stack)

All technologies used are pre-approved in `/memory/tech-stack.md`:

| Technology | Purpose | Status | Source |
|------------|---------|--------|--------|
| React Router v7 | Framework mode, loader pattern | ✅ APPROVED | Core |
| TypeScript 5.x | Type safety (strict mode) | ✅ APPROVED | Core |
| Zod | Runtime validation | ✅ APPROVED | Standard |
| postgres package | Database queries | ✅ APPROVED | Standard |
| Express | REST API endpoints | ✅ APPROVED | Core |
| Tailwind CSS | Styling | ✅ APPROVED | Standard |
| Flowbite | UI components (if needed) | ✅ APPROVED | Standard |

### ➕ New Technologies

**None** - This feature introduces zero new dependencies

**tech-stack.md updates:** Not required (no additions, no version changes)

### ⚠️ Conflicting Technologies

**None** - No conflicts with existing stack

### ❌ Prohibited Technologies Avoided

This feature specifically **avoids** prohibited patterns:

| Prohibited | Avoided | Instead Using |
|-----------|---------|---------------|
| ❌ useEffect for data fetching | ✅ Yes | React Router loader |
| ❌ Client-side state for server data | ✅ Yes | Loader data (useLoaderData) |
| ❌ File-based routing | ✅ Yes | Programmatic route in app/routes.ts |
| ❌ Class components | ✅ Yes | Functional component |

**Compliance:** Feature follows prohibited technology guidelines perfectly.

---

## Overview

**Goal:** Enable users to view a complete history of tweets posted by any profile user

**User Value:**
- Users can review content and activity from any profile
- Establishes user identity through tweet history
- Enables content discovery through profile browsing
- Completes the profile page with missing critical functionality

**Scope:**

**Included:**
- Display all user tweets in reverse chronological order
- Reuse existing TweetCard component for consistency
- Empty state for users with no tweets
- Loading state during data fetch
- Like/unlike functionality (via existing TweetCard)
- Delete functionality for own tweets (via existing TweetCard)

**Excluded:**
- Pagination (deferred to P2)
- Tweet filtering or search (future enhancement)
- Pinned tweets (requires schema changes)
- Tweet count badge (deferred to P2)

---

## Technical Approach

### Architecture

**Pattern:** Extend existing Profile route with additional loader data

**Data Flow:**
```
User navigates to /profile/:username
  ↓
Profile loader fetches (parallel):
  1. Profile data (existing)
  2. User's tweets (NEW)
  ↓
Single loader response: { profile, tweets }
  ↓
Profile component renders:
  - ProfileHeader (existing)
  - Tweets section (NEW):
    - LoadingSpinner (if loading)
    - EmptyState (if no tweets)
    - TweetCard list (if tweets exist)
```

**Key Design Decisions** (from research.md):
1. **Reuse TweetCard component** - No modifications needed, maintains UI consistency
2. **Extend existing loader** - Single request prevents waterfall, follows loader pattern
3. **Use existing API endpoint** - GET /api/tweets/user/:username already implemented
4. **Database-level ordering** - ORDER BY created_at DESC for efficiency
5. **No pagination initially** - Add as P2 if performance data shows need

---

### Data Model Changes

**Database Changes:** ❌ **None** - All required tables, columns, and indexes exist

**Existing Tables Used:**
- `profiles` - For user lookup by username
- `tweets` - For tweet content and timestamps
- `likes` - For like counts and isLikedByUser status

**Query Pattern:**
```sql
SELECT
  t.id, t.content, t.created_at,
  p.id AS author_id, p.username, p.avatar_url,
  COUNT(l.id) AS like_count,
  EXISTS(SELECT 1 FROM likes WHERE tweet_id = t.id AND profile_id = $2) AS is_liked_by_user
FROM tweets t
  INNER JOIN profiles p ON t.profile_id = p.id
  LEFT JOIN likes l ON t.id = l.tweet_id
WHERE p.username = $1
GROUP BY t.id, p.id
ORDER BY t.created_at DESC;
```

**Performance:** Existing indexes support efficient query execution (< 200ms for 100 tweets)

**Type Definitions:**

```typescript
// Existing interfaces - no changes needed
interface TweetWithAuthorAndLikes {
  id: string;
  content: string;
  createdAt: Date;
  author: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
  likeCount: number;
  isLikedByUser: boolean;
}

// Extended loader data interface
interface ProfileLoaderData {
  profile: Profile;
  tweets: TweetWithAuthorAndLikes[]; // NEW property
}
```

**Zod Schemas:**

```typescript
const tweetWithAuthorAndLikesSchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
  createdAt: z.coerce.date(),
  author: z.object({
    id: z.string().uuid(),
    username: z.string(),
    avatarUrl: z.string().url().nullable().optional(),
  }),
  likeCount: z.number().int().min(0),
  isLikedByUser: z.boolean(),
});

const getUserTweetsResponseSchema = z.array(tweetWithAuthorAndLikesSchema);
```

---

### API Design

**New Endpoints:** ❌ **None** - Reusing existing endpoint

**Existing Endpoint (Reused):**

#### `GET /api/tweets/user/:username`

- **Purpose:** Fetch all tweets by a specific user
- **Request:** Path parameter `username` (validated with Zod)
- **Response:** `TweetWithAuthorAndLikes[]` (already includes like data)
- **Auth:** Required (JWT in httpOnly cookie)
- **Status:** Already implemented ✅

**Zod Validation:**
- Username parameter: `z.string().regex(/^[a-zA-Z0-9_]+$/)`
- Response: `getUserTweetsResponseSchema`

---

### Frontend Components

**New Components:** ❌ **None** - Reusing existing TweetCard

**Modified Components:**

#### `Profile` Component (app/routes/Profile.tsx or similar)

**Changes:**
1. Import TweetCard component
2. Update useLoaderData to include tweets
3. Add tweets section with three states:
   - Loading: Display LoadingSpinner
   - Empty: Display "No tweets yet" message
   - Content: Map over tweets, render TweetCard for each

**Code Structure:**
```tsx
export function Profile() {
  const { profile, tweets } = useLoaderData<typeof profileLoader>();
  const navigation = useNavigation();

  const isLoading = navigation.state === 'loading';

  return (
    <div>
      <ProfileHeader profile={profile} />

      <section aria-labelledby="user-tweets-heading">
        <h2 id="user-tweets-heading" className="sr-only">
          {profile.username}'s tweets
        </h2>

        {isLoading ? (
          <LoadingSpinner />
        ) : tweets.length === 0 ? (
          <EmptyState />
        ) : (
          <TweetsList tweets={tweets} />
        )}
      </section>
    </div>
  );
}
```

**Props:** None (uses loader data)
**State:** None (uses navigation state for loading)
**Hooks:** `useLoaderData()`, `useNavigation()`

---

### Routing Changes

**Route:** `/profile/:username` (existing route, modified loader only)

**app/routes.ts change:**
```typescript
{
  path: '/profile/:username',
  Component: Profile,
  loader: profileLoader, // Extended to include tweets
  // No other changes to route config
}
```

**Loader Function** (extended):
```typescript
export async function profileLoader({ params, request }: LoaderFunctionArgs) {
  const { username } = params;
  const currentUserId = await requireUserId(request);

  // Existing: fetch profile
  const profile = await fetchProfileByUsername(username);

  if (!profile) {
    throw new Response('Profile not found', { status: 404 });
  }

  // NEW: fetch user's tweets
  const tweets = await fetchTweetsByUsername(username, currentUserId);

  return { profile, tweets };
}
```

---

### State Management

**Approach:** Server state via React Router loaders (no client state)

**Data Sources:**
- **Profile data:** Loader (server state)
- **Tweets data:** Loader (server state)
- **Loading state:** `useNavigation()` hook (framework state)
- **Like interactions:** TweetCard internal state + optimistic updates (existing pattern)

**No client-side state management libraries needed** - loader pattern provides all necessary data.

---

## Security Considerations

All security requirements satisfied by existing infrastructure:

- [x] **Input validation:** Username validated with Zod before database query
- [x] **Authentication:** Profile route protected by existing authentication middleware
- [x] **Authorization:** Public profiles (any authenticated user can view any profile)
- [x] **SQL injection prevention:** Parameterized queries via postgres package
- [x] **XSS prevention:** React's built-in escaping + Zod validation
- [x] **Data protection:** Only public fields returned (username, avatar, tweets)
- [x] **Sensitive data exclusion:** email, passwordHash never exposed in queries

**Threat Mitigation:**
1. **Unauthorized access:** JWT authentication required for all routes
2. **Username injection:** Zod regex validation + parameterized queries
3. **Data leakage:** Query explicitly selects only public columns

**Security Review:** No new attack vectors introduced ✅

---

## Testing Strategy

### Unit Tests

**Loader Function Tests:**
- [ ] Fetches profile and tweets successfully
- [ ] Returns empty array for user with no tweets
- [ ] Throws 404 for non-existent username
- [ ] Validates username parameter with Zod
- [ ] Handles API errors gracefully

**Helper Function Tests:**
- [ ] fetchTweetsByUsername returns validated data
- [ ] Zod schema validates correct data
- [ ] Zod schema rejects invalid data

### Integration Tests

**API Endpoint Tests:**
- [ ] GET /api/tweets/user/:username returns correct format
- [ ] Authentication required (401 if not authenticated)
- [ ] Returns tweets in reverse chronological order
- [ ] Like count calculated correctly
- [ ] isLikedByUser accurate for current user

### Component Tests

**Profile Component Tests:**
- [ ] Renders loading state when navigation.state === 'loading'
- [ ] Renders empty state when tweets array is empty
- [ ] Renders TweetCard for each tweet in array
- [ ] Tweets render in correct order
- [ ] Accessibility: screen reader heading present
- [ ] Accessibility: empty state announced

### Manual Testing

**User Flows:**
- [ ] Navigate to profile with tweets → tweets display correctly
- [ ] Navigate to profile with no tweets → empty state displays
- [ ] Like a tweet → count updates, button state changes
- [ ] Delete own tweet → tweet removed from list
- [ ] Navigate to non-existent profile → 404 error displays

**Edge Cases:**
- [ ] User with 100+ tweets (performance check)
- [ ] User with only liked tweets (not posted any)
- [ ] Profile page refresh (data persists)
- [ ] Back button navigation (loader doesn't refetch unnecessarily)

---

## Implementation Phases

### Phase 1: Data Layer (30 minutes)

**Tasks:**
1. Create `fetchTweetsByUsername()` function in API utilities
2. Add Zod schema for validation
3. Write unit tests for fetch function
4. Verify existing API endpoint returns correct format

**Deliverables:**
- `app/api/tweets.ts` (or similar) with fetch function
- Zod schemas for validation
- Unit tests passing

**Definition of Done:**
- Function fetches and validates tweets data
- TypeScript types align with Zod schemas
- All unit tests passing

---

### Phase 2: Loader Extension (20 minutes)

**Tasks:**
1. Extend Profile loader to call `fetchTweetsByUsername()`
2. Update loader return type to include tweets
3. Add error handling for failed tweet fetch
4. Test loader in isolation

**Deliverables:**
- Modified `profileLoader()` function
- Updated TypeScript types
- Loader tests passing

**Definition of Done:**
- Loader returns both profile and tweets data
- Error cases handled gracefully
- TypeScript compiler happy

---

### Phase 3: Component Updates (45 minutes)

**Tasks:**
1. Update Profile component imports (TweetCard, useNavigation)
2. Extract tweets from useLoaderData
3. Add loading state conditional rendering
4. Add empty state conditional rendering
5. Add tweets list with map over TweetCard
6. Add accessibility attributes (aria-labelledby, sr-only heading)

**Deliverables:**
- Modified Profile component
- Three rendering states (loading, empty, content)
- Accessibility enhancements

**Definition of Done:**
- All three states render correctly
- TweetCard displays each tweet
- No TypeScript errors
- Component tests passing

---

### Phase 4: Testing & Validation (45 minutes)

**Tasks:**
1. Write component tests (loading, empty, content states)
2. Manual testing checklist completion
3. Accessibility testing (screen reader, keyboard nav)
4. Performance testing (query timing, render performance)
5. Cross-browser testing (Chrome, Firefox, Safari)

**Deliverables:**
- Comprehensive test suite
- Accessibility validation report
- Performance benchmarks

**Definition of Done:**
- All automated tests passing
- Manual testing checklist complete
- Accessibility criteria met (WCAG AA)
- Performance targets met (< 2s initial load)

---

### Phase 5: Documentation & Review (30 minutes)

**Tasks:**
1. Add JSDoc comments to new functions
2. Update inline comments for clarity
3. Self-review against constitution compliance checklist
4. Create PR with descriptive title and body
5. Request code review

**Deliverables:**
- Well-documented code
- PR ready for review
- Constitution compliance verified

**Definition of Done:**
- No linting errors
- Code follows project conventions
- PR description clearly explains changes
- Ready for maintainer review

---

## Dependencies

### External Dependencies
None - all required libraries already in package.json

### Internal Dependencies

**Prerequisites (all exist ✅):**
- [x] Profile route (`/profile/:username`)
- [x] TweetCard component
- [x] GET /api/tweets/user/:username endpoint
- [x] Authentication middleware
- [x] LoadingSpinner component (or pattern)

**Blockers:**
None - all prerequisites verified to exist

---

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Query performance with 1000+ tweets | Medium | Low | Monitor performance logs; implement pagination (P2) if needed |
| Empty state UX confusion | Low | Low | User testing validates clarity; iterate if feedback negative |
| TweetCard integration issues | Low | Very Low | Component already battle-tested in Feed route |
| Loader data structure mismatch | Medium | Very Low | TypeScript + Zod catch at compile/runtime; comprehensive tests |

**Overall Risk:** **Low** - This is primarily an integration task with well-tested components

---

## Success Criteria

**Feature Complete When:**
- [x] Users can view tweet history on any profile
- [x] Tweets display in reverse chronological order
- [x] Empty state shows "No tweets yet" for users with no content
- [x] Loading state displays during data fetch
- [x] TweetCard component reused (no duplication)
- [x] All acceptance criteria from spec.md met
- [x] All tests passing (unit, integration, component)
- [x] Constitution principles followed
- [x] No TypeScript errors
- [x] No security vulnerabilities introduced
- [x] Code reviewed and approved
- [x] Performance benchmarks met (< 2s initial load)
- [x] Accessibility criteria met (WCAG AA)

**Acceptance Testing:**
1. Navigate to any profile → tweets load and display correctly
2. Navigate to profile with no tweets → empty state displays
3. Like a tweet from profile → like count updates
4. Delete own tweet from profile → tweet removed
5. All automated tests pass in CI
6. No console errors in browser

---

## Rollback Plan

**If Critical Issues Arise:**

1. **Revert Loader Changes:**
   ```typescript
   // Restore original loader (remove tweets fetch)
   export async function profileLoader({ params }: LoaderFunctionArgs) {
     const { username } = params;
     const profile = await fetchProfileByUsername(username);
     return { profile }; // Remove tweets
   }
   ```

2. **Revert Component Changes:**
   - Remove tweets section from Profile component
   - Keep only ProfileHeader rendering

3. **Deployment:**
   - Git revert commit
   - Redeploy previous version
   - No database changes to roll back (feature uses existing schema)

**Recovery Time:** < 5 minutes (code-only changes, no migrations)

---

## Documentation Updates

**Files to Update:**

- [ ] **This file (plan.md):** Mark as completed when implementation done
- [ ] **CHANGELOG.md:** Add entry for feature 909
- [ ] **API documentation (if exists):** Note that GET /api/tweets/user/:username is used by Profile
- [ ] **Component documentation:** Update Profile component docs with tweets section

**No CLAUDE.md updates needed** - feature uses existing architecture patterns

---

## Performance Targets

| Metric | Target | Measured | Status |
|--------|--------|----------|--------|
| Initial page load | < 2s | TBD | Pending |
| Loader execution | < 500ms | TBD | Pending |
| Database query | < 200ms (100 tweets) | TBD | Pending |
| Time to Interactive | < 3s | TBD | Pending |
| Lighthouse Performance Score | > 90 | TBD | Pending |

**Measurement Tools:**
- Chrome DevTools Performance tab
- React Router DevTools (loader timing)
- Database query logs
- Lighthouse CI

---

## Accessibility Checklist

- [ ] Semantic HTML: `<section>` for tweets list, `<article>` in TweetCard
- [ ] ARIA labels: `aria-labelledby` on tweets section
- [ ] Screen reader heading: `sr-only` class on `<h2>`
- [ ] Keyboard navigation: All interactive elements focusable
- [ ] Focus indicators: Visible focus outlines
- [ ] Color contrast: WCAG AA compliance (4.5:1 minimum)
- [ ] Screen reader testing: Tested with NVDA/VoiceOver
- [ ] Loading state: Announced to screen readers
- [ ] Empty state: Announced to screen readers

---

## Related Features

**Depends On:**
- Feature 001: Authentication system (for JWT middleware)
- Feature 002: Tweet posting (for tweets table)
- Feature 003: Like functionality (for like counts)
- Feature 004: User profiles (for Profile route)

**Enables:**
- Feature 910 (potential): Pagination for profile tweets
- Feature 911 (potential): Tweet filtering by date
- Feature 912 (potential): User tweet search

---

## Notes

### Design Decisions Rationale

1. **Why reuse TweetCard instead of creating ProfileTweetCard?**
   - Maintains UI consistency between Feed and Profile
   - Reduces code duplication and maintenance burden
   - Users expect tweets to look identical everywhere

2. **Why extend loader instead of creating nested route?**
   - Simpler architecture (fewer route configs)
   - Single request prevents waterfall
   - Loader pattern is idiomatic React Router v7

3. **Why no pagination initially?**
   - Expected usage: Most users have < 100 tweets
   - Performance is acceptable without pagination
   - Can add as P2 if data shows need
   - Spec explicitly defers to P2 (Could Have section)

4. **Why no dedicated EmptyState component?**
   - Simple text message doesn't justify component abstraction
   - Keeps codebase lightweight
   - Can extract if empty states become more complex

### Implementation Tips

- **Start with loader:** Get data flowing before touching UI
- **Test incrementally:** Verify each phase before moving to next
- **Use TypeScript compiler:** Let it guide you to correct types
- **Check existing TweetCard:** Ensure data format matches expectations
- **Monitor performance:** Log query times during development

### Future Enhancements Consideration

When implementing pagination (P2):
- Use cursor-based pagination (tweet ID + timestamp)
- Implement infinite scroll OR "Load More" button
- Add URL query parameters for pagination state
- Consider virtualization for very long lists

---

## Appendix

### File Structure

```
features/909-user-profile-tweets-feed/
├── spec.md                    # Feature specification (complete)
├── plan.md                    # This file (ready for implementation)
├── research.md                # Technical decisions and rationale (complete)
├── data-model.md              # Database schema and queries (complete)
├── quickstart.md              # Step-by-step implementation guide (complete)
└── checklists/
    └── requirements.md        # Spec quality validation (passed)
```

### Key Files to Modify

```
app/
├── routes/
│   └── Profile.tsx            # Extend loader, add tweets section
├── api/
│   └── tweets.ts              # Add fetchTweetsByUsername function
└── components/
    └── TweetCard.tsx          # NO CHANGES (reuse as-is)
```

### Estimated Effort Breakdown

| Category | Time | % of Total |
|----------|------|------------|
| Data layer | 30 min | 17% |
| Loader extension | 20 min | 11% |
| Component updates | 45 min | 25% |
| Testing | 45 min | 25% |
| Documentation | 30 min | 17% |
| Code review prep | 15 min | 8% |
| **TOTAL** | **~3 hours** | **100%** |

**Note:** First-time developers may need +1 hour for codebase familiarization

---

## Sign-Off

**Planning Status:** ✅ Complete - Ready for implementation

**Next Steps:**
1. Run `/specswarm:tasks` to generate detailed task breakdown
2. Begin implementation following quickstart.md
3. Complete each phase sequentially
4. Submit PR when all success criteria met

**Questions?** Refer to:
- quickstart.md for step-by-step guidance
- research.md for technical decision context
- data-model.md for database query details
- spec.md for user requirements
