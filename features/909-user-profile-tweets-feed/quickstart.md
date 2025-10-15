# Quickstart Guide: User Profile Tweets Feed

**Feature ID:** 909-user-profile-tweets-feed
**For:** Developers implementing this feature
**Estimated Time:** 2-3 hours

---

## Prerequisites

Before starting implementation, ensure you have:

- [x] Read `spec.md` - Understanding of user stories and requirements
- [x] Read `research.md` - Understanding of technical decisions
- [x] Read `data-model.md` - Understanding of data structures and queries
- [x] Development environment running (Node.js, PostgreSQL, etc.)
- [x] Authenticated user session available for testing

---

## Implementation Overview

**Complexity:** Low - This is primarily an integration task

**What You'll Modify:**
1. Profile route loader (extend existing)
2. Profile component (add tweets section)
3. API utility (use existing endpoint)

**What You'll Reuse:**
- TweetCard component (no changes)
- GET /api/tweets/user/:username endpoint (no changes)
- LoadingSpinner component (existing pattern)

**What's New:**
- Empty state markup (simple conditional)
- Tweets list rendering (map over array)

---

## Step-by-Step Implementation

### Phase 1: Backend Integration (30 minutes)

#### Step 1.1: Verify API Endpoint Exists

**File:** `server/routes/tweets.ts` (or similar)

**Verify:**
```bash
# Search for the endpoint
grep -r "GET.*tweets/user/:username" server/
```

**Expected:** Endpoint exists and returns `TweetWithAuthorAndLikes[]`

**If Missing:** ERROR - endpoint should exist per CLAUDE.md. Check feature dependencies.

---

#### Step 1.2: Create Data Fetching Function

**File:** `app/api/tweets.ts` (or similar utility file)

**Add:**
```typescript
import { z } from 'zod';

// Zod schema for validation
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

/**
 * Fetch all tweets by a specific user
 * @param username - Username of the profile user
 * @param currentUserId - ID of authenticated user (for isLikedByUser)
 * @returns Array of tweets with author and like data
 */
export async function fetchTweetsByUsername(
  username: string,
  currentUserId: string
): Promise<TweetWithAuthorAndLikes[]> {
  const response = await fetch(`/api/tweets/user/${username}`, {
    credentials: 'include', // Include JWT cookie
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch tweets: ${response.statusText}`);
  }

  const data = await response.json();

  // Validate response with Zod
  return getUserTweetsResponseSchema.parse(data);
}
```

**Test:**
```bash
npm run typecheck  # Should pass with no errors
```

---

### Phase 2: Loader Extension (20 minutes)

#### Step 2.1: Extend Profile Loader

**File:** `app/routes/Profile.tsx` (or wherever loader is defined)

**Before:**
```typescript
export async function profileLoader({ params }: LoaderFunctionArgs) {
  const { username } = params;

  const profile = await fetchProfileByUsername(username);

  if (!profile) {
    throw new Response('Profile not found', { status: 404 });
  }

  return { profile };
}
```

**After:**
```typescript
import { fetchTweetsByUsername } from '~/api/tweets';
import { requireUserId } from '~/utils/auth'; // Existing auth utility

export async function profileLoader({ params, request }: LoaderFunctionArgs) {
  const { username } = params;

  // Get current user ID (for isLikedByUser calculation)
  const currentUserId = await requireUserId(request);

  // Fetch profile data (existing)
  const profile = await fetchProfileByUsername(username);

  if (!profile) {
    throw new Response('Profile not found', { status: 404 });
  }

  // Fetch user's tweets (NEW)
  const tweets = await fetchTweetsByUsername(username, currentUserId);

  return { profile, tweets };
}
```

**Test:**
```bash
# Start dev server
npm run dev

# Navigate to /profile/testuser
# Check browser network tab - should see loader request returning tweets
```

---

### Phase 3: Component Updates (45 minutes)

#### Step 3.1: Update Profile Component

**File:** `app/routes/Profile.tsx` (or `app/components/Profile.tsx`)

**Add Imports:**
```typescript
import { useLoaderData, useNavigation } from 'react-router';
import { TweetCard } from '~/components/TweetCard';
import type { TweetWithAuthorAndLikes } from '~/types/tweet';
```

**Update Component:**
```typescript
export function Profile() {
  const { profile, tweets } = useLoaderData<typeof profileLoader>();
  const navigation = useNavigation();

  const isLoading = navigation.state === 'loading';

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Existing profile header */}
      <ProfileHeader profile={profile} />

      {/* NEW: Tweets section */}
      <section className="mt-8" aria-labelledby="user-tweets-heading">
        <h2 id="user-tweets-heading" className="sr-only">
          {profile.username}'s tweets
        </h2>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : tweets.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No tweets yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tweets.map((tweet) => (
              <TweetCard key={tweet.id} tweet={tweet} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
```

**Styling Notes:**
- `space-y-4`: Tailwind class for consistent spacing between tweets
- `sr-only`: Screen reader only heading for accessibility
- `text-gray-500`: Muted text color for empty state (existing design system)

---

#### Step 3.2: Add TypeScript Types

**File:** `app/types/tweet.ts` (if not already defined)

```typescript
export interface TweetWithAuthorAndLikes {
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
```

**Verify:**
```bash
npm run typecheck  # Should pass
```

---

### Phase 4: Testing (45 minutes)

#### Step 4.1: Manual Testing Checklist

**Test Case 1: User with Tweets**
- [ ] Navigate to profile with tweets
- [ ] Tweets display in reverse chronological order (newest first)
- [ ] Each tweet shows: content, timestamp, like count
- [ ] TweetCard renders correctly (same as feed)
- [ ] Like button works (can like/unlike)
- [ ] Delete button visible only for own tweets

**Test Case 2: Empty State**
- [ ] Navigate to profile with zero tweets
- [ ] "No tweets yet" message displays
- [ ] Message appears centered and styled correctly
- [ ] No errors in console

**Test Case 3: Loading State**
- [ ] Throttle network in DevTools
- [ ] Navigate to profile
- [ ] Loading spinner displays during fetch
- [ ] No flash of empty state
- [ ] Spinner disappears when data loads

**Test Case 4: Own Profile**
- [ ] Navigate to own profile
- [ ] Own tweets display correctly
- [ ] Delete button works on own tweets
- [ ] After posting new tweet (from composer), new tweet appears at top

**Test Case 5: Error Handling**
- [ ] Navigate to non-existent username
- [ ] 404 error boundary displays
- [ ] No console errors

---

#### Step 4.2: Automated Testing

**Unit Test: Loader Function**

**File:** `app/routes/Profile.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { profileLoader } from './Profile';
import * as tweetsApi from '~/api/tweets';

describe('profileLoader', () => {
  it('should fetch profile and tweets', async () => {
    const mockProfile = { id: '1', username: 'testuser', /* ... */ };
    const mockTweets = [
      { id: '1', content: 'Hello', /* ... */ },
      { id: '2', content: 'World', /* ... */ },
    ];

    vi.spyOn(tweetsApi, 'fetchTweetsByUsername').mockResolvedValue(mockTweets);

    const result = await profileLoader({
      params: { username: 'testuser' },
      request: new Request('http://localhost/profile/testuser'),
    });

    expect(result.tweets).toEqual(mockTweets);
    expect(result.tweets).toHaveLength(2);
  });

  it('should return empty array for user with no tweets', async () => {
    vi.spyOn(tweetsApi, 'fetchTweetsByUsername').mockResolvedValue([]);

    const result = await profileLoader({
      params: { username: 'emptyuser' },
      request: new Request('http://localhost/profile/emptyuser'),
    });

    expect(result.tweets).toEqual([]);
  });
});
```

**Component Test: Profile**

**File:** `app/routes/Profile.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import { Profile } from './Profile';

describe('Profile Component', () => {
  it('should render empty state when no tweets', () => {
    render(<Profile />, {
      loader: { profile: mockProfile, tweets: [] },
    });

    expect(screen.getByText('No tweets yet')).toBeInTheDocument();
  });

  it('should render tweet cards when tweets exist', () => {
    const mockTweets = [
      { id: '1', content: 'First tweet', /* ... */ },
      { id: '2', content: 'Second tweet', /* ... */ },
    ];

    render(<Profile />, {
      loader: { profile: mockProfile, tweets: mockTweets },
    });

    expect(screen.getByText('First tweet')).toBeInTheDocument();
    expect(screen.getByText('Second tweet')).toBeInTheDocument();
  });

  it('should render loading state', () => {
    render(<Profile />, {
      loader: { profile: mockProfile, tweets: [] },
      navigation: { state: 'loading' },
    });

    expect(screen.getByRole('status')).toBeInTheDocument(); // LoadingSpinner
  });
});
```

**Run Tests:**
```bash
npm test -- Profile.test.tsx
```

---

### Phase 5: Accessibility Validation (20 minutes)

#### Step 5.1: Screen Reader Testing

**Tools:**
- NVDA (Windows)
- VoiceOver (Mac)
- JAWS (Windows)

**Test:**
- [ ] Navigate to profile page
- [ ] Screen reader announces: "{username}'s tweets"
- [ ] Empty state announced: "No tweets yet"
- [ ] Loading state announced: "Loading"
- [ ] Tweet cards navigable with arrow keys
- [ ] Like button accessible and actionable

---

#### Step 5.2: Keyboard Navigation

**Test:**
- [ ] Tab through page elements
- [ ] Focus visible on all interactive elements
- [ ] Like button activatable with Enter/Space
- [ ] Delete button (if visible) activatable with Enter/Space

---

#### Step 5.3: Color Contrast

**Tool:** Chrome DevTools Accessibility Pane

**Test:**
- [ ] Empty state text meets WCAG AA (4.5:1 minimum)
- [ ] Tweet content meets WCAG AA
- [ ] Timestamp text meets WCAG AA

---

### Phase 6: Performance Validation (15 minutes)

#### Step 6.1: Measure Query Performance

**Add Logging:**
```typescript
export async function fetchTweetsByUsername(username: string) {
  const startTime = performance.now();

  const tweets = await fetch(`/api/tweets/user/${username}`);

  const endTime = performance.now();
  console.log(`[PERF] fetchTweetsByUsername: ${endTime - startTime}ms`);

  return tweets;
}
```

**Benchmarks:**
- [ ] User with 10 tweets: < 100ms
- [ ] User with 50 tweets: < 200ms
- [ ] User with 100 tweets: < 500ms
- [ ] If > 1s: Consider implementing pagination (P2)

---

#### Step 6.2: Check Network Waterfall

**Chrome DevTools → Network Tab:**
- [ ] Single request to loader endpoint
- [ ] No sequential requests (no waterfall)
- [ ] Response size reasonable (< 50KB for 100 tweets)

---

### Phase 7: Code Review Checklist (15 minutes)

Before submitting PR:

**Constitution Compliance:**
- [ ] No classes used (Principle 1: Functional Programming) ✅
- [ ] All types defined (Principle 2: Type Safety) ✅
- [ ] Zod validation at boundaries (Principle 2) ✅
- [ ] Routes in app/routes.ts (Principle 3: Programmatic Routing) ✅
- [ ] Authentication enforced (Principle 4: Security-First) ✅
- [ ] Functional component with hooks (Principle 5: Modern React) ✅

**Code Quality:**
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] All tests passing
- [ ] No console.log statements (except intentional logging)
- [ ] Comments explain "why", not "what"

**Documentation:**
- [ ] Inline comments for non-obvious logic
- [ ] JSDoc for exported functions
- [ ] README updated if needed

---

## Common Issues & Solutions

### Issue 1: "Cannot read property 'tweets' of undefined"

**Cause:** Loader not returning tweets array

**Solution:**
```typescript
// Ensure loader returns both profile AND tweets
return { profile, tweets };  // ✅ Correct

return { profile };  // ❌ Missing tweets
```

---

### Issue 2: Tweets Not Ordered Correctly

**Cause:** Missing ORDER BY in query

**Solution:** Verify query includes:
```sql
ORDER BY t.created_at DESC
```

---

### Issue 3: Empty State Flashing Before Loading

**Cause:** Rendering empty state during loading

**Solution:**
```tsx
{isLoading ? (
  <LoadingSpinner />
) : tweets.length === 0 ? (
  <EmptyState />
) : (
  <TweetsList />
)}
```

**Order matters:** Check loading FIRST, then empty, then content.

---

### Issue 4: TypeScript Error on useLoaderData

**Cause:** Missing type annotation

**Solution:**
```typescript
const { profile, tweets } = useLoaderData<typeof profileLoader>();
//                                        ^^^^^^^^^^^^^^^^^^^^^^^^
//                                        Add this type annotation
```

---

### Issue 5: Like Count Not Updating

**Cause:** TweetCard expects specific data format

**Solution:** Verify API response includes:
```typescript
{
  likeCount: number,
  isLikedByUser: boolean,
}
```

---

## Performance Expectations

| Metric | Target | Acceptable | Action if Exceeded |
|--------|--------|------------|-------------------|
| Initial load (10 tweets) | < 100ms | < 200ms | Investigate query |
| Initial load (100 tweets) | < 500ms | < 1s | Consider pagination |
| Time to Interactive | < 2s | < 3s | Optimize loader |
| Lighthouse Performance | > 90 | > 80 | Profile bottlenecks |

---

## Deployment Checklist

Before merging to production:

- [ ] All tests passing in CI
- [ ] No TypeScript errors
- [ ] Manual testing complete
- [ ] Accessibility validated
- [ ] Performance benchmarks met
- [ ] Code reviewed and approved
- [ ] Feature flag enabled (if applicable)
- [ ] Monitoring in place (if applicable)

---

## Next Steps After Implementation

### Immediate (This Feature)
1. Create PR with descriptive title
2. Request code review from maintainer
3. Address review feedback
4. Merge to main branch

### Future Enhancements (P2)
1. **Pagination:** If users have >100 tweets, implement cursor-based pagination
2. **Tweet Count Badge:** Show total tweet count in profile header
3. **Filter by Date:** Allow users to filter tweets by date range
4. **Search Tweets:** Add search functionality for user's tweets

---

## Resources

**Documentation:**
- [React Router v7 Loaders](https://reactrouter.com/en/main/route/loader)
- [Zod Validation](https://zod.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

**Codebase References:**
- `app/components/TweetCard.tsx` - Component to reuse
- `app/routes/Feed.tsx` - Similar pattern for reference
- `/memory/constitution.md` - Project principles
- `/memory/tech-stack.md` - Approved technologies

**Related Features:**
- Feature 002: Tweet posting system
- Feature 003: Like functionality
- Feature 004: Profile page (base implementation)

---

## Estimated Timeline

| Phase | Time | Cumulative |
|-------|------|------------|
| Backend Integration | 30 min | 30 min |
| Loader Extension | 20 min | 50 min |
| Component Updates | 45 min | 1h 35min |
| Testing | 45 min | 2h 20min |
| Accessibility | 20 min | 2h 40min |
| Performance | 15 min | 2h 55min |
| Code Review Prep | 15 min | 3h 10min |

**Total:** ~3 hours for experienced developer

**First-time:** Add 1 hour for familiarization with codebase patterns

---

## Success Criteria

✅ **Feature Complete When:**
- Users can view tweet history on any profile
- Tweets display in reverse chronological order
- Empty state shows for users with no tweets
- Loading state displays during data fetch
- All acceptance criteria from spec.md met
- All tests passing
- Constitution principles followed
- Code reviewed and approved

🎉 **Ship it!**
