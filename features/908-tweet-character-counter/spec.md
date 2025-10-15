# Feature Specification: Tweet Character Counter

**Feature ID:** 908-tweet-character-counter
**Created:** 2025-10-15
**Status:** draft
**Priority:** medium

---

## Constitution Alignment

This specification MUST comply with project constitution (`/memory/constitution.md`).

**Affected Principles:**
- [x] Principle 1: Functional Programming Over OOP
- [x] Principle 2: Type Safety (TypeScript + Zod)
- [ ] Principle 3: Programmatic Routing
- [ ] Principle 4: Security-First Architecture
- [x] Principle 5: Modern React Patterns

**Compliance Statement:**
- Principle 1: Character counter logic will be implemented as pure functions for calculating character count, determining color state, and validating submission eligibility
- Principle 2: All character count thresholds and validation logic will use TypeScript types and Zod schemas for type safety
- Principle 5: Counter will be implemented as a functional React component using hooks for state management (useEffect for real-time updates)

---

## Summary

**What:** Real-time character counter for tweet composition that provides visual feedback and enforces the 140-character limit

**Why:** Users need immediate feedback while composing tweets to know how many characters they have left and avoid submission errors from exceeding the limit

**Who:** All authenticated users composing tweets on the platform

---

## User Stories

### Primary User Story
```
As a user composing a tweet
I want to see a real-time character counter that updates as I type
So that I know exactly how many characters I have remaining and can stay within the 140-character limit
```

**Acceptance Criteria:**
- [ ] Character counter displays in format "X / 140" where X is the current character count
- [ ] Counter updates in real-time as user types (no delay or lag)
- [ ] Counter turns yellow when character count reaches 120
- [ ] Counter turns red when character count reaches 140
- [ ] Submit button is disabled when character count exceeds 140
- [ ] Counter is visible and positioned near the tweet input field

### Secondary User Stories

**Story 2: Visual Warning System**
```
As a user approaching the character limit
I want clear visual cues about my proximity to the limit
So that I can edit my tweet before hitting the maximum
```

**Acceptance Criteria:**
- [ ] Color changes are immediate and obvious
- [ ] Yellow warning appears at 120 characters (20 characters remaining)
- [ ] Red warning appears at 140 characters (0 characters remaining)
- [ ] Color states are accessible (not color-only indicators)

**Story 3: Submission Prevention**
```
As a user who has exceeded the character limit
I want to be prevented from submitting an invalid tweet
So that I don't encounter submission errors
```

**Acceptance Criteria:**
- [ ] Submit button becomes disabled when count > 140
- [ ] Submit button becomes enabled again when count <= 140
- [ ] Disabled state is visually apparent
- [ ] Keyboard submission (Enter key) is also blocked when over limit

---

## Functional Requirements

### Must Have (P0)
1. Display character counter in "X / 140" format that updates in real-time as user types
2. Implement three visual states based on character count:
   - Default (0-119 characters): neutral color
   - Warning (120-139 characters): yellow/amber color
   - Over limit (140+ characters): red color
3. Disable tweet submission when character count exceeds 140
4. Re-enable submission when user edits tweet back to 140 or fewer characters
5. Character count must be accurate (count actual characters, not bytes)

### Should Have (P1)
1. Counter positioned consistently with Flowbite design system styling
2. Smooth visual transitions between color states (not jarring color jumps)
3. Accessible color contrast ratios for all counter states
4. Screen reader announcements for color state changes

### Could Have (P2)
1. Animation or pulse effect when approaching/exceeding limit
2. Tooltip or helper text explaining the character limit
3. Character count persistence across page navigation (if tweet draft is saved)

### Won't Have (Out of Scope)
1. Configurable character limits (always 140)
2. Different limits for different user types
3. Character count for tweet replies or quoted tweets (if those features exist)
4. Warning at intermediate thresholds (only 120 and 140)
5. Historical character count tracking or analytics

---

## Technical Requirements

### Type Safety Requirements
- [x] TypeScript interfaces defined for all data structures
- [x] Zod schemas created for:
  - [x] Form input validation (tweet content validation with max length)
  - [ ] API request validation (existing tweet schema already validates max 140)
  - [ ] API response validation (not applicable for client-side counter)

### Security Requirements
- [x] Authentication method: JWT (existing - counter only visible to authenticated users)
- [x] Authorization rules: Only authenticated users can compose tweets
- [x] Input sanitization: Character counting happens on sanitized input (counts characters after any processing)
- [x] Data protection: No sensitive data involved in character counting

### Data Requirements
- [ ] Database schema changes documented: None required (character limit already exists in database schema)
- [ ] Migration strategy defined: Not applicable (no schema changes)
- [x] Data validation rules specified: Max 140 characters enforced both client-side (counter) and server-side (existing validation)
- [ ] snake_case ↔ camelCase mapping identified: Not applicable (no new database fields)

### Routing Requirements
- [ ] Routes added to `app/routes.ts`: Not required (enhancement to existing tweet composition UI)
- [ ] Loader functions defined for data fetching: Not applicable
- [ ] Action functions defined for mutations: Not applicable (uses existing tweet creation action)
- [x] No file-based routes created: Confirmed

---

## User Interface

### Pages/Views
1. **Feed Page** (`/feed`)
   - Purpose: Users compose new tweets with character counter visible
   - Components: TweetForm component (enhanced with character counter)
   - Data: No additional data loading required

2. **Profile Page** (`/profile/:username`)
   - Purpose: Users compose tweets from their profile (if applicable)
   - Components: TweetForm component (same enhanced component)
   - Data: No additional data loading required

### Components
1. **TweetForm** (functional component - enhanced)
   - Props: Existing props remain unchanged
   - State: Add local state for character count (number)
   - Behavior:
     - Track character count in real-time using useEffect or onChange handler
     - Compute counter color based on character count thresholds
     - Disable/enable submit button based on character count

2. **CharacterCounter** (new functional component)
   - Props:
     ```typescript
     interface CharacterCounterProps {
       count: number;
       maxLength: number;
     }
     ```
   - State: No local state (presentational component)
   - Behavior:
     - Display formatted counter text ("X / 140")
     - Apply color styling based on count thresholds
     - Pure function to determine color state

### User Flows
```
Tweet Composition Flow with Character Counter:
1. User navigates to /feed (or any page with tweet composition)
2. User sees tweet input field with character counter showing "0 / 140" in default color
3. User begins typing in the tweet field
4. Counter updates in real-time with each character typed
5. When count reaches 120, counter changes to yellow/amber color
6. When count reaches 140, counter changes to red color
7. If count exceeds 140, submit button becomes disabled
8. User edits tweet to reduce character count below 140
9. Submit button re-enables when count <= 140
10. User submits tweet with valid character count
```

---

## API Specification

**No API changes required.** This feature is entirely client-side UI enhancement. Existing tweet creation endpoint already validates maximum 140 characters on the server side.

---

## Data Model

**No database changes required.** The tweets table already has a constraint for 140-character maximum content. This feature adds client-side visual feedback only.

### TypeScript Interfaces
```typescript
// Character counter state enumeration
type CounterColorState = 'default' | 'warning' | 'exceeded';

// Pure function to determine counter color state
interface CharacterCounterLogic {
  getColorState: (count: number, maxLength: number) => CounterColorState;
  isSubmitAllowed: (count: number, maxLength: number) => boolean;
}

// Component props
interface CharacterCounterProps {
  count: number;
  maxLength: number;
}
```

---

## Security Analysis

### Threat Model
1. **Client-side validation bypass:** User could bypass disabled submit button via browser dev tools or direct API calls
   - **Mitigation:** Server-side validation already exists and enforces 140-character maximum. Client-side counter is UX enhancement only, not security control

### Input Validation
- [x] All user inputs validated with Zod before processing (existing tweet validation)
- [x] SQL injection prevented via parameterized queries (existing)
- [x] XSS prevented via framework escaping + input validation (existing)

### Authentication & Authorization
- [x] JWT tokens in httpOnly cookies only (existing)
- [x] Protected routes have authentication middleware (existing)
- [x] Authorization checks before data access (existing)

---

## Testing Requirements

### Unit Tests
- [ ] Pure function `getColorState(count, maxLength)` tested with:
  - count = 0 (returns 'default')
  - count = 119 (returns 'default')
  - count = 120 (returns 'warning')
  - count = 139 (returns 'warning')
  - count = 140 (returns 'exceeded')
  - count = 141 (returns 'exceeded')
- [ ] Pure function `isSubmitAllowed(count, maxLength)` tested with:
  - count <= 140 (returns true)
  - count > 140 (returns false)
- [ ] CharacterCounter component renders correct text format
- [ ] CharacterCounter component applies correct color class for each state

### Integration Tests
- [ ] TweetForm updates character count when user types
- [ ] Submit button disabled state toggles correctly based on count
- [ ] Form submission blocked when count > 140
- [ ] Form submission allowed when count <= 140

### End-to-End Tests
- [ ] User can see character counter update in real-time while typing
- [ ] Counter color changes to yellow at 120 characters
- [ ] Counter color changes to red at 140 characters
- [ ] User cannot submit tweet with 141+ characters
- [ ] User can submit tweet with exactly 140 characters

---

## Performance Considerations

- [x] Database queries optimized: Not applicable (no database queries)
- [x] Loader data fetching is efficient: Not applicable (no data loading)
- [x] Components avoid unnecessary re-renders: Character counter should use React.memo or useMemo to avoid re-renders when count hasn't changed
- [ ] Large lists use virtualization if needed: Not applicable

**Additional Performance Notes:**
- Character counting should be efficient (use `.length` property, not regex or complex parsing)
- Color state calculation should be memoized to avoid repeated threshold comparisons
- Event handlers should be debounced if typing performance becomes an issue (unlikely for simple character counting)

---

## Accessibility

- [x] Semantic HTML elements used: Counter rendered in `<span>` or `<div>` with appropriate role
- [x] ARIA labels where needed: `aria-live="polite"` for screen reader announcements of count changes
- [x] Keyboard navigation supported: Not applicable (counter is display-only, doesn't receive focus)
- [x] Color contrast meets WCAG standards: All three color states (default, yellow, red) must meet WCAG AA contrast requirements
- [x] Screen reader tested: Screen reader should announce character count periodically and when crossing thresholds

**Accessibility Requirements:**
- Counter must have `aria-live="polite"` region for dynamic updates
- Color states must include non-color indicators (consider icon or additional text for warning/error states)
- Submit button disabled state must include `aria-disabled="true"` attribute
- Consider announcing "20 characters remaining" at 120-character threshold
- Consider announcing "Character limit reached" at 140 characters

---

## Dependencies

**Prerequisites:**
- [x] Existing TweetForm component in the codebase
- [x] Tailwind CSS and Flowbite design system for styling

**External Services:**
- None

**Blocking Issues:**
- None

---

## Open Questions

None. All requirements are clearly defined with industry-standard patterns for character counters.

---

## Success Metrics

**How we'll measure success:**
- [ ] Users can see character count update in real-time with zero perceptible lag
- [ ] 100% of tweets submitted have <= 140 characters (server-side validation prevents violations)
- [ ] Zero accessibility violations in automated accessibility testing
- [ ] Visual color states are clearly distinguishable in manual testing
- [ ] Submit button correctly disabled/enabled in 100% of manual test cases

**Qualitative Metrics:**
- Users receive clear feedback before attempting to submit over-limit tweets
- Reduced submission errors due to character limit violations
- Improved user experience during tweet composition

---

## Appendix

### References
- Character counter pattern: Standard UX pattern used by Twitter/X and similar platforms
- Flowbite form components: https://flowbite.com/docs/components/forms/
- WCAG 2.1 color contrast guidelines: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html

### Change Log
| Date | Change | Author |
|------|--------|--------|
| 2025-10-15 | Initial specification | SpecSwarm + Claude Code |
