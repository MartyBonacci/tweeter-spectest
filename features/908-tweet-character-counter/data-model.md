# Data Model: Tweet Character Counter

**Feature ID:** 908-tweet-character-counter
**Created:** 2025-10-15

---

## Overview

**No database changes required.** This feature is a pure frontend UI enhancement to the existing TweetComposer component. The 140-character limit is already enforced in the database schema and backend validation.

---

## Existing Data Model (Reference)

### Database Schema

The existing `tweets` table already enforces the character limit:

```sql
-- Existing schema (no changes)
CREATE TABLE tweets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content VARCHAR(140) NOT NULL, -- ← Character limit already enforced
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tweets_profile_id ON tweets(profile_id);
CREATE INDEX idx_tweets_created_at ON tweets(created_at DESC);
```

**No migrations needed** - schema remains unchanged.

---

## Frontend Type Definitions

### New Types

These types are introduced for the character counter feature:

```typescript
/**
 * Character counter color state enumeration
 * Determines visual styling based on character count thresholds
 */
type CounterColorState = 'default' | 'warning' | 'exceeded';

/**
 * Props for CharacterCounter component (if extracted)
 * Currently inline in TweetComposer, but typed for future extraction
 */
interface CharacterCounterProps {
  count: number;
  maxLength: number;
}

/**
 * Helper functions for character counter logic
 * Pure functions with no side effects
 */
interface TweetCounterHelpers {
  /**
   * Determines color state based on character count
   * @param count - Current character count
   * @param maxLength - Maximum allowed characters (140)
   * @returns Color state: 'default' | 'warning' | 'exceeded'
   */
  getColorState: (count: number, maxLength: number) => CounterColorState;

  /**
   * Checks if submission should be allowed
   * @param count - Current character count
   * @param maxLength - Maximum allowed characters (140)
   * @returns true if count <= maxLength, false otherwise
   */
  isSubmitAllowed: (count: number, maxLength: number) => boolean;

  /**
   * Formats counter display text
   * @param count - Current character count
   * @param maxLength - Maximum allowed characters (140)
   * @returns Formatted string "X / 140"
   */
  formatCounter: (count: number, maxLength: number) => string;
}
```

### Existing Types (Unchanged)

The TweetComposer component already uses these types (no changes):

```typescript
// From app/types/index.ts (existing)
interface Tweet {
  id: string;
  profileId: string;
  content: string; // Max 140 characters (validated)
  createdAt: Date;
}

// React Router types (existing)
interface ActionData {
  error?: string;
}
```

---

## State Model

### Component State

**TweetComposer Component:**

```typescript
// Existing state (unchanged)
const [content, setContent] = useState<string>('');

// Derived/computed values (not state)
const count = content.length;
const colorState = useMemo(
  () => getColorState(count, 140),
  [count]
);
const isOverLimit = count > 140;
const isEmpty = content.trim().length === 0;
const isInvalid = isEmpty || isOverLimit;
```

**No global state** - all character counter logic is local to the component.

---

## Validation Schema (Zod)

### Frontend Validation

**No new Zod schemas** - character limit validation already exists in backend.

Frontend uses simple JavaScript length check:
```typescript
const MAX_LENGTH = 140;
const isValid = content.length <= MAX_LENGTH && content.trim().length > 0;
```

### Backend Validation (Existing)

Reference only - backend validation unchanged:

```typescript
// Backend Zod schema (existing, no changes)
// src/validation/tweets.ts
import { z } from 'zod';

export const createTweetSchema = z.object({
  content: z.string()
    .min(1, 'Tweet cannot be empty')
    .max(140, 'Tweet cannot exceed 140 characters')
    .trim(),
});
```

---

## Data Flow

### Character Counter Data Flow

```
User Input
   ↓
textarea onChange event
   ↓
Update local state: setContent(value)
   ↓
Derive count: content.length
   ↓
Compute color state: getColorState(count, 140)
   ↓
Render counter with:
  - Text: formatCounter(count, 140) → "X / 140"
  - Color: CSS class based on colorState
  - Aria-live: announce changes
   ↓
Update submit button:
  - disabled = isInvalid (count > 140 || isEmpty)
```

No database queries, no API calls, no external state - purely local UI logic.

---

## Constants

```typescript
/**
 * Maximum allowed characters for a tweet
 * Matches database VARCHAR(140) constraint
 */
export const MAX_TWEET_LENGTH = 140;

/**
 * Character count threshold for warning state (yellow)
 * Warning appears 20 characters before limit
 */
export const WARNING_THRESHOLD = MAX_TWEET_LENGTH - 20; // 120

/**
 * Tailwind CSS classes for counter color states
 */
export const COUNTER_COLORS = {
  default: 'text-gray-600',
  warning: 'text-yellow-700',
  exceeded: 'text-red-600',
} as const;
```

---

## Entity Relationships

**No entity changes** - this feature operates entirely within the existing Tweet entity model.

```
Profile (1) ───< (N) Tweet
                     ↑
                     │ content: VARCHAR(140)
                     │ (unchanged)
```

---

## Summary

- **Database Changes:** None
- **API Changes:** None
- **New Types:** `CounterColorState`, `CharacterCounterProps`, `TweetCounterHelpers`
- **State Changes:** No new state (all derived from existing `content` state)
- **Validation Changes:** None (frontend uses same 140 limit, backend unchanged)
- **Data Flow:** Pure frontend, no external data sources

This feature is a **view-only enhancement** with no data persistence requirements.

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-10-15 | Initial data model documentation | SpecSwarm + Claude Code |
