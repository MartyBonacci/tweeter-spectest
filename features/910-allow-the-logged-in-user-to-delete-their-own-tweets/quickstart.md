# Quick Start Guide: Tweet Deletion

**Feature ID:** 910-allow-the-logged-in-user-to-delete-their-own-tweets
**Estimated Time:** 3-4 hours
**Difficulty:** Intermediate

---

## Prerequisites

- ✅ Existing TweetCard component
- ✅ Authentication system (JWT, authenticate middleware)
- ✅ React Router v7 useFetcher familiarity
- ✅ Flowbite UI library installed
- ✅ Database connection configured

---

## Implementation Roadmap

### Phase 1: Backend (DELETE API) - 60 minutes

#### Step 1: Add deleteTweet database function (15 min)

**File:** `src/db/tweets.ts`

```typescript
/**
 * Delete a tweet owned by the authenticated user
 */
export async function deleteTweet(
  db: Sql,
  tweetId: string,
  userId: string
): Promise<boolean> {
  const result = await db`
    DELETE FROM tweets
    WHERE id = ${tweetId}
      AND profile_id = ${userId}
    RETURNING id
  `;

  return result.length > 0;
}
```

**Test:**
```typescript
// src/db/tweets.test.ts
import { deleteTweet } from './tweets';

test('deleteTweet removes tweet owned by user', async () => {
  const db = createTestDb();
  const userId = 'user-123';
  const tweetId = await createTestTweet(db, userId, 'Test tweet');

  const deleted = await deleteTweet(db, tweetId, userId);

  expect(deleted).toBe(true);
  const tweets = await getAllTweets(db);
  expect(tweets).not.toContainEqual(expect.objectContaining({ id: tweetId }));
});

test('deleteTweet returns false for tweet not owned by user', async () => {
  const db = createTestDb();
  const ownerId = 'user-123';
  const otherUserId = 'user-456';
  const tweetId = await createTestTweet(db, ownerId, 'Test tweet');

  const deleted = await deleteTweet(db, tweetId, otherUserId);

  expect(deleted).toBe(false);
});
```

#### Step 2: Add Zod validation schema (5 min)

**File:** `src/schemas/tweet.ts`

```typescript
import { z } from 'zod';

export const deleteTweetParamsSchema = z.object({
  id: z.string().uuid('Invalid tweet ID format'),
});
```

#### Step 3: Implement DELETE /api/tweets/:id endpoint (30 min)

**File:** `src/routes/tweets.ts`

```typescript
import { deleteTweet } from '../db/tweets.js';
import { deleteTweetParamsSchema } from '../schemas/tweet.js';

/**
 * DELETE /api/tweets/:id
 * Delete a tweet owned by the authenticated user
 */
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  // Validate auth
  if (!req.user || !req.user.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Validate tweet ID
  const result = deleteTweetParamsSchema.safeParse({
    id: req.params.id,
  });

  if (!result.success) {
    return res.status(400).json({
      error: 'Invalid request',
      details: result.error.flatten().fieldErrors,
    });
  }

  const { id: tweetId } = result.data;
  const userId = req.user.userId;

  try {
    // Delete tweet (ownership check + deletion in single query)
    const deleted = await deleteTweet(db, tweetId, userId);

    if (!deleted) {
      // Either not found or not owned (we don't distinguish to prevent timing leak)
      return res.status(404).json({
        error: 'Tweet not found',
      });
    }

    // Success: 204 No Content
    return res.status(204).send();
  } catch (error) {
    console.error('Delete tweet error:', error);
    return res.status(500).json({ error: 'Failed to delete tweet' });
  }
});
```

#### Step 4: Test DELETE endpoint (10 min)

**File:** `tests/integration/tweets.test.ts`

```typescript
test('DELETE /api/tweets/:id deletes own tweet', async () => {
  const { token, userId } = await signupTestUser(app);
  const tweetId = await createTestTweet(userId, 'Test tweet');

  const response = await request(app)
    .delete(`/api/tweets/${tweetId}`)
    .set('Cookie', `auth_token=${token}`)
    .expect(204);

  // Verify tweet deleted
  const getTweet = await request(app)
    .get(`/api/tweets/${tweetId}`)
    .expect(404);
});

test('DELETE /api/tweets/:id returns 404 for other user tweet', async () => {
  const { token: token1 } = await signupTestUser(app, 'user1');
  const { userId: userId2 } = await signupTestUser(app, 'user2');
  const tweetId = await createTestTweet(userId2, 'Test tweet');

  const response = await request(app)
    .delete(`/api/tweets/${tweetId}`)
    .set('Cookie', `auth_token=${token1}`)
    .expect(404);
});
```

---

### Phase 2: Frontend Components (90 minutes)

#### Step 1: Create DeleteConfirmationModal component (30 min)

**File:** `app/components/DeleteConfirmationModal.tsx`

```typescript
import { Modal, Button } from 'flowbite-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  tweetContent: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

export function DeleteConfirmationModal({
  isOpen,
  tweetContent,
  onConfirm,
  onCancel,
  isDeleting,
}: DeleteConfirmationModalProps) {
  return (
    <Modal show={isOpen} onClose={onCancel} size="md">
      <Modal.Header>Delete Tweet</Modal.Header>
      <Modal.Body>
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete this tweet?
          </p>
          <div className="bg-gray-100 p-4 rounded-md">
            <p className="text-gray-900 italic">"{tweetContent}"</p>
          </div>
          <p className="text-sm text-gray-600">
            This action cannot be undone.
          </p>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button
          color="failure"
          onClick={onConfirm}
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
        <Button color="gray" onClick={onCancel} disabled={isDeleting}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
```

**Test:**
```typescript
// tests/components/DeleteConfirmationModal.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { DeleteConfirmationModal } from '../../app/components/DeleteConfirmationModal';

test('renders modal when open', () => {
  render(
    <DeleteConfirmationModal
      isOpen={true}
      tweetContent="Test tweet"
      onConfirm={vi.fn()}
      onCancel={vi.fn()}
      isDeleting={false}
    />
  );

  expect(screen.getByText('Delete Tweet')).toBeInTheDocument();
  expect(screen.getByText('"Test tweet"')).toBeInTheDocument();
});

test('calls onConfirm when Delete button clicked', () => {
  const onConfirm = vi.fn();

  render(
    <DeleteConfirmationModal
      isOpen={true}
      tweetContent="Test"
      onConfirm={onConfirm}
      onCancel={vi.fn()}
      isDeleting={false}
    />
  );

  fireEvent.click(screen.getByText('Delete'));
  expect(onConfirm).toHaveBeenCalledOnce();
});
```

#### Step 2: Create DeleteButton component (30 min)

**File:** `app/components/DeleteButton.tsx`

```typescript
import { useState } from 'react';
import { useFetcher } from 'react-router';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { Trash2 } from 'lucide-react'; // or any icon library

interface DeleteButtonProps {
  tweetId: string;
  tweetContent: string;
  onDeleteSuccess?: () => void;
}

export function DeleteButton({
  tweetId,
  tweetContent,
  onDeleteSuccess,
}: DeleteButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fetcher = useFetcher();

  const isDeleting = fetcher.state === 'submitting';

  const handleDelete = () => {
    fetcher.submit(null, {
      method: 'DELETE',
      action: `/api/tweets/${tweetId}`,
    });
  };

  // Handle success/error
  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data) {
      if (fetcher.data.error) {
        // Show error toast
        toast.error(fetcher.data.error);
      } else {
        // Success
        toast.success('Tweet deleted');
        setIsModalOpen(false);
        onDeleteSuccess?.();
      }
    }
  }, [fetcher.state, fetcher.data, onDeleteSuccess]);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="text-red-600 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
        aria-label="Delete tweet"
        title="Delete tweet"
      >
        <Trash2 size={18} />
      </button>

      <DeleteConfirmationModal
        isOpen={isModalOpen}
        tweetContent={tweetContent}
        onConfirm={handleDelete}
        onCancel={() => setIsModalOpen(false)}
        isDeleting={isDeleting}
      />
    </>
  );
}
```

#### Step 3: Modify TweetCard to show DeleteButton (30 min)

**File:** `app/components/TweetCard.tsx`

```typescript
import { DeleteButton } from './DeleteButton';

interface TweetCardProps {
  tweet: TweetWithAuthorAndLikes;
  currentUserId?: string; // NEW: Add optional currentUserId prop
}

export function TweetCard({ tweet, currentUserId }: TweetCardProps) {
  const navigate = useNavigate();
  const [isOptimisticallyDeleted, setIsOptimisticallyDeleted] = useState(false);

  const handleCardClick = () => {
    navigate(`/tweets/${tweet.id}`);
  };

  const handleUsernameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleDeleteSuccess = () => {
    // Optimistic UI update
    setIsOptimisticallyDeleted(true);
  };

  // Hide card if optimistically deleted
  if (isOptimisticallyDeleted) {
    return null;
  }

  return (
    <article
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Tweet header */}
      <div className="flex items-center justify-between mb-3">
        {/* Author info */}
        <Link
          to={`/profile/${tweet.author.username}`}
          className="font-semibold text-gray-900 hover:text-blue-600 hover:underline"
          onClick={handleUsernameClick}
        >
          @{tweet.author.username}
        </Link>

        {/* Timestamp */}
        <time
          dateTime={tweet.createdAt.toISOString()}
          className="text-sm text-gray-500"
        >
          {formatTimestamp(tweet.createdAt)}
        </time>
      </div>

      {/* Tweet content */}
      <p className="text-gray-800 text-base whitespace-pre-wrap break-words mb-3">
        {tweet.content}
      </p>

      {/* Actions */}
      <div className="flex items-center justify-between">
        {/* Like button */}
        <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
          <LikeButton
            tweetId={tweet.id}
            initialLikeCount={tweet.likeCount}
            initialIsLiked={tweet.isLikedByUser}
          />
        </div>

        {/* NEW: Delete button (only for own tweets) */}
        {currentUserId && currentUserId === tweet.author.id && (
          <div onClick={(e) => e.stopPropagation()}>
            <DeleteButton
              tweetId={tweet.id}
              tweetContent={tweet.content}
              onDeleteSuccess={handleDeleteSuccess}
            />
          </div>
        )}
      </div>
    </article>
  );
}
```

---

### Phase 3: Integration (30 minutes)

#### Step 1: Update Feed page to pass currentUserId (10 min)

**File:** `app/pages/Feed.tsx`

```typescript
export async function loader({ request }: LoaderFunctionArgs) {
  const cookie = request.headers.get('Cookie') || '';

  // Fetch tweets
  const tweetsResponse = await fetch('http://localhost:3000/api/tweets', {
    headers: { 'Cookie': cookie },
  });
  const { tweets } = await tweetsResponse.json();

  // Get current user
  let currentUserId: string | null = null;
  try {
    const meResponse = await fetch('http://localhost:3000/api/auth/me', {
      headers: { 'Cookie': cookie },
    });
    if (meResponse.ok) {
      const { user } = await meResponse.json();
      currentUserId = user?.id || null;
    }
  } catch {}

  return { tweets, currentUserId };
}

export default function Feed() {
  const { tweets, currentUserId } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-4">
      {tweets.map((tweet) => (
        <TweetCard key={tweet.id} tweet={tweet} currentUserId={currentUserId} />
      ))}
    </div>
  );
}
```

#### Step 2: Update Profile page (same pattern) (10 min)

**File:** `app/pages/Profile.tsx`

```typescript
// Profile loader already has currentUserId
export default function Profile() {
  const { profile, tweets, currentUserId } = useLoaderData<ProfileData>();

  return (
    <>
      {/* Profile header... */}

      {/* Tweets section */}
      <div className="space-y-4">
        {tweets.map((tweet) => (
          <TweetCard key={tweet.id} tweet={tweet} currentUserId={currentUserId} />
        ))}
      </div>
    </>
  );
}
```

#### Step 3: Update TweetDetail page (same pattern) (10 min)

**File:** `app/pages/TweetDetail.tsx`

```typescript
// Add currentUserId to loader, pass to TweetCard
```

---

### Phase 4: Testing & Polish (60 minutes)

#### Step 1: End-to-end testing (30 min)

**Manual Test Flow:**
1. Sign in as user
2. Navigate to feed
3. Verify delete button appears on own tweets only
4. Click delete on a tweet
5. Verify modal appears with tweet content
6. Click "Cancel" → modal closes, tweet still visible
7. Click delete again, click "Delete" → tweet disappears
8. Refresh page → tweet still gone
9. Check database → tweet and likes deleted

#### Step 2: Error handling testing (20 min)

**Test Cases:**
1. Network offline → error toast appears
2. Delete already-deleted tweet → 404 error
3. Delete another user's tweet (via API) → 403/404 error
4. Invalid UUID format → 400 error

#### Step 3: Accessibility testing (10 min)

**Checklist:**
- [ ] Tab to delete button
- [ ] Enter opens modal
- [ ] ESC closes modal
- [ ] Focus trap within modal
- [ ] Screen reader announces modal
- [ ] Delete button has aria-label

---

## Quick Reference

### File Checklist

Backend:
- [ ] `src/db/tweets.ts` - Add deleteTweet function
- [ ] `src/schemas/tweet.ts` - Add deleteTweetParamsSchema
- [ ] `src/routes/tweets.ts` - Add DELETE /:id endpoint
- [ ] `tests/db/tweets.test.ts` - Test deleteTweet function
- [ ] `tests/integration/tweets.test.ts` - Test DELETE endpoint

Frontend:
- [ ] `app/components/DeleteConfirmationModal.tsx` - New component
- [ ] `app/components/DeleteButton.tsx` - New component
- [ ] `app/components/TweetCard.tsx` - Modify to add delete button
- [ ] `app/pages/Feed.tsx` - Pass currentUserId to TweetCard
- [ ] `app/pages/Profile.tsx` - Pass currentUserId to TweetCard
- [ ] `app/pages/TweetDetail.tsx` - Pass currentUserId to TweetCard
- [ ] `tests/components/DeleteConfirmationModal.test.tsx` - Test modal
- [ ] `tests/components/DeleteButton.test.tsx` - Test button

---

## Common Pitfalls

1. **Forgetting to stop propagation** on delete button click
   - Fix: Add `onClick={(e) => e.stopPropagation()}` wrapper

2. **Not handling optimistic update revert**
   - Fix: Track fetcher.data.error and revert isOptimisticallyDeleted

3. **Authorization bypass** (client-side check only)
   - Fix: Server MUST validate ownership (already in deleteTweet function)

4. **Modal focus management**
   - Fix: Use Flowbite's built-in focus trap, or add custom useEffect

---

## Time Estimates

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1 | Backend DELETE API | 60 minutes |
| Phase 2 | Frontend components | 90 minutes |
| Phase 3 | Integration | 30 minutes |
| Phase 4 | Testing & polish | 60 minutes |
| **Total** | | **3-4 hours** |

---

## Success Criteria

- ✅ Users can delete their own tweets
- ✅ Confirmation modal prevents accidental deletion
- ✅ Tweet disappears immediately (optimistic update)
- ✅ Error handling with toast notifications
- ✅ Delete button only visible on own tweets
- ✅ All tests pass
- ✅ No TypeScript errors
- ✅ Accessible (keyboard navigation, screen readers)

---

**Ready to implement!** Start with Phase 1 (Backend) and work sequentially through phases.
