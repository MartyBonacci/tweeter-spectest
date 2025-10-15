# Quickstart Guide: Tweet Character Counter

**Feature ID:** 908-tweet-character-counter
**Created:** 2025-10-15

---

## Overview

This guide helps developers quickly understand and implement the tweet character counter enhancement.

**What it does:** Enhances the TweetComposer component with an improved character counter showing "X / 140" format, yellow warning at 120 characters, and red error state at 140 characters.

**Estimated implementation time:** 2-3 hours (including testing)

---

## Prerequisites

- [ ] Node.js 18+ installed
- [ ] Project dependencies installed (`npm install`)
- [ ] Existing TweetComposer component (`app/components/TweetComposer.tsx`)
- [ ] Tailwind CSS configured
- [ ] Test environment set up (Vitest)

---

## Quick Implementation Checklist

### Phase 1: Pure Helper Functions (30-45 min)

1. **Create helper file:**
   ```bash
   touch app/utils/tweetCounter.ts
   touch app/utils/tweetCounter.test.ts
   ```

2. **Implement pure functions in `app/utils/tweetCounter.ts`:**
   ```typescript
   export type CounterColorState = 'default' | 'warning' | 'exceeded';

   export const MAX_TWEET_LENGTH = 140;
   export const WARNING_THRESHOLD = 120;

   export function getColorState(count: number, maxLength: number): CounterColorState {
     if (count >= maxLength) return 'exceeded';
     if (count >= maxLength - 20) return 'warning';
     return 'default';
   }

   export function isSubmitAllowed(count: number, maxLength: number): boolean {
     return count <= maxLength;
   }

   export function formatCounter(count: number, maxLength: number): string {
     return `${count} / ${maxLength}`;
   }
   ```

3. **Write unit tests in `app/utils/tweetCounter.test.ts`:**
   ```typescript
   import { describe, it, expect } from 'vitest';
   import { getColorState, formatCounter, isSubmitAllowed } from './tweetCounter';

   describe('getColorState', () => {
     it('returns default for counts under 120', () => {
       expect(getColorState(0, 140)).toBe('default');
       expect(getColorState(119, 140)).toBe('default');
     });

     it('returns warning for counts 120-139', () => {
       expect(getColorState(120, 140)).toBe('warning');
       expect(getColorState(139, 140)).toBe('warning');
     });

     it('returns exceeded for counts 140+', () => {
       expect(getColorState(140, 140)).toBe('exceeded');
       expect(getColorState(150, 140)).toBe('exceeded');
     });
   });

   // Add more test cases for other functions...
   ```

4. **Run tests:**
   ```bash
   npm test -- tweetCounter
   ```

### Phase 2: Component Integration (30-45 min)

1. **Update `app/components/TweetComposer.tsx`:**

   **Import helpers:**
   ```typescript
   import { useMemo } from 'react';
   import {
     getColorState,
     formatCounter,
     MAX_TWEET_LENGTH,
     type CounterColorState
   } from '../utils/tweetCounter';
   ```

   **Add color state calculation:**
   ```typescript
   // After existing content state
   const count = content.length;
   const colorState = useMemo(
     () => getColorState(count, MAX_TWEET_LENGTH),
     [count]
   );
   ```

   **Update counter display (find existing counter div):**
   ```typescript
   // Replace existing counter div with:
   <div
     className={`text-sm font-medium transition-colors duration-200 ${
       colorState === 'exceeded' ? 'text-red-600' :
       colorState === 'warning' ? 'text-yellow-700' :
       'text-gray-600'
     }`}
     role="status"
     aria-live="polite"
     aria-label={`Character count: ${formatCounter(count, MAX_TWEET_LENGTH)}`}
   >
     {formatCounter(count, MAX_TWEET_LENGTH)}
   </div>
   ```

2. **Test component renders:**
   ```bash
   npm run dev
   ```
   Navigate to `/feed` and test character counter:
   - Type 0-119 characters → gray
   - Type 120-139 characters → yellow
   - Type 140+ characters → red + button disabled

### Phase 3: Accessibility & Polish (30-45 min)

1. **Verify WCAG compliance:**
   - Use browser dev tools (Chrome: Lighthouse audit)
   - Check color contrast for all three states
   - Ensure aria-live region is working

2. **Screen reader testing:**
   - Test with NVDA (Windows) or VoiceOver (Mac)
   - Verify counter updates are announced
   - Check announcements aren't too frequent

3. **Visual polish:**
   - Verify smooth color transitions
   - Check alignment with Flowbite design system
   - Test on different screen sizes

### Phase 4: Testing & Documentation (45-60 min)

1. **Write component tests:**
   ```bash
   touch app/components/TweetComposer.test.tsx
   ```

   ```typescript
   import { render, screen } from '@testing-library/react';
   import userEvent from '@testing-library/user-event';
   import { TweetComposer } from './TweetComposer';

   describe('TweetComposer character counter', () => {
     it('displays 0 / 140 initially', () => {
       render(<TweetComposer />);
       expect(screen.getByText('0 / 140')).toBeInTheDocument();
     });

     it('updates counter as user types', async () => {
       const user = userEvent.setup();
       render(<TweetComposer />);
       const textarea = screen.getByRole('textbox');

       await user.type(textarea, 'Hello');
       expect(screen.getByText('5 / 140')).toBeInTheDocument();
     });

     // Add more test cases...
   });
   ```

2. **Run full test suite:**
   ```bash
   npm test
   npm run typecheck
   ```

3. **Manual testing checklist:**
   - [ ] Counter shows "0 / 140" initially
   - [ ] Counter updates in real-time while typing
   - [ ] Color changes to yellow at 120 characters
   - [ ] Color changes to red at 140 characters
   - [ ] Button disabled when over 140 characters
   - [ ] Button enabled when edited back under 140
   - [ ] Works with copy-paste
   - [ ] Works with emojis and special characters
   - [ ] Screen reader announces changes

---

## File Structure

After implementation, you'll have:

```
app/
├── utils/
│   ├── tweetCounter.ts          # Pure helper functions
│   └── tweetCounter.test.ts     # Unit tests
├── components/
│   ├── TweetComposer.tsx        # Enhanced component
│   └── TweetComposer.test.tsx   # Component tests
└── actions/
    └── tweets.ts                 # Unchanged (already validates 140 chars)
```

---

## Common Issues & Solutions

### Issue: Yellow color not visible enough

**Solution:** Use `text-yellow-700` instead of `text-yellow-600` for better contrast.

```typescript
colorState === 'warning' ? 'text-yellow-700' : ...
```

### Issue: Counter updates feel laggy

**Solution:** Verify useMemo is in place and no unnecessary re-renders:

```typescript
const colorState = useMemo(
  () => getColorState(count, MAX_TWEET_LENGTH),
  [count]
);
```

### Issue: Screen reader announces too frequently

**Solution:** Ensure using `aria-live="polite"` not `"assertive"`:

```typescript
<div aria-live="polite" role="status">
```

### Issue: Tests fail with "Cannot find module"

**Solution:** Check TypeScript paths in `tsconfig.json` or use relative imports:

```typescript
import { getColorState } from '../utils/tweetCounter';
```

---

## Testing Commands

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tweetCounter

# Run tests in watch mode
npm test -- --watch

# Type checking
npm run typecheck

# Start dev server
npm run dev

# Build for production
npm run build
```

---

## Validation Checklist

Before marking feature complete:

- [ ] All unit tests pass
- [ ] All component tests pass
- [ ] TypeScript compiles with no errors
- [ ] Manual testing checklist complete
- [ ] WCAG AA color contrast verified
- [ ] Screen reader tested
- [ ] Works in Chrome, Firefox, Safari
- [ ] Code reviewed by teammate
- [ ] PR description includes screenshots/GIF

---

## Key Code Snippets

### Helper Function (Pure)

```typescript
export function getColorState(count: number, maxLength: number): CounterColorState {
  if (count >= maxLength) return 'exceeded';
  if (count >= maxLength - 20) return 'warning';
  return 'default';
}
```

### Component Integration

```typescript
const colorState = useMemo(() => getColorState(count, 140), [count]);

<div className={`text-sm font-medium transition-colors duration-200 ${
  colorState === 'exceeded' ? 'text-red-600' :
  colorState === 'warning' ? 'text-yellow-700' :
  'text-gray-600'
}`}>
  {formatCounter(count, 140)}
</div>
```

### Test Example

```typescript
it('shows red color when over 140 characters', async () => {
  const user = userEvent.setup();
  render(<TweetComposer />);

  await user.type(screen.getByRole('textbox'), 'a'.repeat(141));

  const counter = screen.getByText('141 / 140');
  expect(counter).toHaveClass('text-red-600');
});
```

---

## Next Steps

After completing this feature:

1. **Run `/specswarm:tasks`** to generate actionable task breakdown
2. **Run `/specswarm:implement`** to execute tasks systematically
3. **Create PR** with comprehensive description and screenshots
4. **Monitor user feedback** after deployment

---

## Support

**Questions?** Check these resources:
- Feature spec: `features/908-tweet-character-counter/spec.md`
- Implementation plan: `features/908-tweet-character-counter/plan.md`
- Research notes: `features/908-tweet-character-counter/research.md`

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-10-15 | Initial quickstart guide | SpecSwarm + Claude Code |
