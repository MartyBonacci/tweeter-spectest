# Bug 904: Feed Route Missing Action Function

**Status**: Active
**Created**: 2025-10-13
**Priority**: High
**Severity**: Major

## Symptoms

When trying to post a tweet from the Feed page, the application throws an error preventing tweet submission.

- Error message: "Route 'pages/Feed' does not have an action, but you are trying to submit to it. To fix this, please add an `action` function to the route"
- TweetComposer form submit button is functional but submission fails
- No tweet is created
- User cannot post tweets from the Feed page

## Reproduction Steps

1. Navigate to http://localhost:5173/feed (requires authentication)
2. Type a tweet in the TweetComposer textarea
3. Click "Post Tweet" button
4. Observe error in browser console or error message

**Expected Behavior**: Tweet should be posted to backend API, saved to database, and appear in the feed

**Actual Behavior**: React Router throws error about missing action function, form submission fails

## Root Cause Analysis

**Cause**: app/pages/Feed.tsx is missing an `action` function to handle form submissions

- **Component affected**: Feed page route handler
- **Code location**: app/pages/Feed.tsx - no action export
- **Logic error**: React Router v7 requires routes to export an `action` function to handle POST/PUT/DELETE requests
- **Conditions**: Always fails when TweetComposer form is submitted

**Technical Details**:
- TweetComposer.tsx uses `<Form method="post">` without explicit action prop
- By React Router convention, form submits to current route (Feed)
- Feed.tsx exports `loader` function (for GET requests) but NO `action` function (for POST requests)
- React Router v7 throws error when receiving POST without action handler
- The backend API endpoint exists and works (POST /api/tweets at localhost:3000)

## Impact Assessment

**Affected Users**: All authenticated users

**Affected Features**:
- Tweet posting: Completely broken
- Feed functionality: Partially broken (can read tweets but not create)
- User engagement: Severely degraded

**Severity Justification**: Major - core feature (tweet posting) is non-functional

**Workaround Available**: No - users cannot post tweets through UI

## Regression Test Requirements

The regression test should verify:

1. Feed page exports an `action` function
2. Action function handles form data correctly
3. Action function calls backend API (POST /api/tweets)
4. Action function returns appropriate response data
5. Form submission succeeds without errors

**Test Success Criteria**:
- ✅ Test fails before fix (proves action export missing)
- ✅ Test passes after fix (proves action function added)
- ✅ Tweet posting works end-to-end

## Proposed Solution

Add an `action` function to app/pages/Feed.tsx that handles tweet form submissions.

**Changes Required**:
1. **File to modify**: `app/pages/Feed.tsx`
   - Add `action` export function
   - Extract form data (tweet content)
   - Send POST request to backend API
   - Handle success/error responses
   - Return appropriate data

**Implementation**:

**app/pages/Feed.tsx** (add action function):
```typescript
import type { ActionFunctionArgs } from 'react-router';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const content = formData.get('content') as string;

  // Validate content
  if (!content || content.trim().length === 0) {
    return { error: 'Tweet content is required' };
  }

  if (content.length > 140) {
    return { error: 'Tweet must be 140 characters or less' };
  }

  try {
    // Post tweet to backend API
    const response = await fetch('http://localhost:3000/api/tweets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Include auth cookies
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.message || 'Failed to post tweet' };
    }

    // Success - redirect will revalidate loader
    return { success: true };
  } catch (error) {
    console.error('Tweet post error:', error);
    return { error: 'Network error. Please try again.' };
  }
}
```

**Risks**: Minimal - adds missing functionality without changing existing code

**Why this approach**:
- Follows React Router v7 conventions for form handling
- Validates data client-side before sending to server
- Handles errors gracefully
- Uses progressive enhancement (works with JS disabled if needed)
- Leverages React Router's automatic revalidation after actions

---

## Tech Stack Compliance

**Tech Stack File**: /memory/tech-stack.md
**Validation Status**: Compliant

- Uses React Router v7 action function pattern
- Follows server-first architecture
- No prohibited technologies

---

## Metadata

**Workflow**: Bugfix (regression-test-first)
**Created By**: SpecLab Plugin v1.0.0
**Smart Integration**: SpecTest (parallel execution, hooks, metrics enabled)
