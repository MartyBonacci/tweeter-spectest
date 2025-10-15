# Implementation Tasks: Tweet Character Counter

**Feature ID:** 908-tweet-character-counter
**Created:** 2025-10-15
**Status:** not-started

<!-- Tech Stack Validation: PASSED -->
<!-- Validated against: /memory/tech-stack.md v1.0.0 -->
<!-- No prohibited technologies found -->
<!-- 0 unapproved technologies require runtime validation -->

---

## Overview

This feature enhances the existing TweetComposer component with an improved character counter showing "X / 140" format, visual warnings at 120 characters (yellow) and 140+ characters (red), and submission prevention when over limit.

**Implementation Strategy:**
- Pure frontend enhancement (no backend/database changes)
- Functional programming patterns with pure helper functions
- Test-driven development for helper functions
- Incremental component integration
- Accessibility-first approach

**Estimated Total Time:** 2-3 hours

---

## Task Organization

Tasks are organized into phases:
1. **Setup & Foundation** - Project initialization and pure helper functions
2. **User Story 1 (P0)** - Real-time character counter with "X / 140" format
3. **User Story 2 (P0)** - Visual warning system (color states)
4. **User Story 3 (P0)** - Submission prevention when over limit
5. **Polish & Integration** - Accessibility, testing, documentation

**Parallelization:** Tasks marked `[P]` can run in parallel with other `[P]` tasks in the same section.

---

## Legend

- `[ ]` Not started
- `[~]` In progress
- `[x]` Completed
- `[!]` Blocked
- `[P]` Can run in parallel

---

## Phase 1: Setup & Foundation

### Environment Setup
- [x] **T001**: Verify feature branch `908-tweet-character-counter` is active
  - Command: `git branch --show-current`
  - Expected: `908-tweet-character-counter`

- [x] **T002**: Verify all dependencies installed
  - Command: `npm install`
  - Check for: react, typescript, tailwind, flowbite, vitest, @testing-library/react

### Pure Helper Functions (Principle 1: Functional Programming)

These tasks implement the core logic as pure, testable functions.

- [x] **T003**: Create helper functions file
  - File: `app/utils/tweetCounter.ts`
  - Action: Create new file with TypeScript boilerplate
  - Export: Type definitions and constants

- [x] **T004**: Define TypeScript types and constants
  - File: `app/utils/tweetCounter.ts`
  - Add:
    ```typescript
    export type CounterColorState = 'default' | 'warning' | 'exceeded';
    export const MAX_TWEET_LENGTH = 140;
    export const WARNING_THRESHOLD = 120;
    ```

- [x] **T005**: Implement `getColorState` pure function
  - File: `app/utils/tweetCounter.ts`
  - Function signature: `(count: number, maxLength: number) => CounterColorState`
  - Logic:
    - If count >= maxLength: return 'exceeded'
    - If count >= maxLength - 20: return 'warning'
    - Else: return 'default'
  - Must be pure (no side effects)

- [x] **T006**: Implement `formatCounter` pure function
  - File: `app/utils/tweetCounter.ts`
  - Function signature: `(count: number, maxLength: number) => string`
  - Logic: Return template string `"${count} / ${maxLength}"`
  - Must be pure (no side effects)

- [x] **T007**: Implement `isSubmitAllowed` pure function (optional utility)
  - File: `app/utils/tweetCounter.ts`
  - Function signature: `(count: number, maxLength: number) => boolean`
  - Logic: Return `count <= maxLength`
  - Must be pure (no side effects)

### Unit Tests for Helper Functions (Principle 2: Type Safety)

Test-driven development: Write tests before integration.

- [x] **T008**: Create test file for helper functions
  - File: `app/utils/tweetCounter.test.ts`
  - Setup: Import vitest, describe, it, expect
  - Import all functions from `tweetCounter.ts`

- [x] **T009**: Write tests for `getColorState`
  - File: `app/utils/tweetCounter.test.ts`
  - Test cases:
    - count = 0, maxLength = 140 → 'default'
    - count = 119, maxLength = 140 → 'default'
    - count = 120, maxLength = 140 → 'warning'
    - count = 139, maxLength = 140 → 'warning'
    - count = 140, maxLength = 140 → 'exceeded'
    - count = 141, maxLength = 140 → 'exceeded'
    - count = 200, maxLength = 140 → 'exceeded'

- [x] **T010**: Write tests for `formatCounter`
  - File: `app/utils/tweetCounter.test.ts`
  - Test cases:
    - count = 0, maxLength = 140 → "0 / 140"
    - count = 50, maxLength = 140 → "50 / 140"
    - count = 120, maxLength = 140 → "120 / 140"
    - count = 140, maxLength = 140 → "140 / 140"
    - count = 150, maxLength = 140 → "150 / 140"

- [x] **T011**: Write tests for `isSubmitAllowed`
  - File: `app/utils/tweetCounter.test.ts`
  - Test cases:
    - count = 50, maxLength = 140 → true
    - count = 140, maxLength = 140 → true
    - count = 141, maxLength = 140 → false
    - count = 200, maxLength = 140 → false

- [x] **T012**: Run unit tests and verify 100% coverage
  - Command: `npm test -- tweetCounter`
  - Expected: All tests pass, no errors
  - Coverage: 100% for helper functions
  - Result: ✅ 27 tests passed

**Phase 1 Checkpoint:**
- ✅ Pure helper functions implemented
- ✅ All unit tests pass with 100% coverage
- ✅ No side effects or mutable state
- ✅ TypeScript compiles with no errors

---

## Phase 2: User Story 1 (P0) - Real-Time Character Counter

**Goal:** Display character counter in "X / 140" format that updates in real-time

**Acceptance Criteria:**
- Counter displays "0 / 140" initially
- Counter updates immediately as user types
- Counter visible near tweet input field

### Component Integration (Principle 5: Modern React)

- [ ] **T013**: Read existing TweetComposer component
  - File: `app/components/TweetComposer.tsx`
  - Action: Review current implementation
  - Note: Current counter shows "X characters remaining" format

- [ ] **T014**: Import helper functions into TweetComposer
  - File: `app/components/TweetComposer.tsx`
  - Add imports:
    ```typescript
    import { useMemo } from 'react';
    import {
      getColorState,
      formatCounter,
      MAX_TWEET_LENGTH,
      type CounterColorState
    } from '../utils/tweetCounter';
    ```

- [ ] **T015**: Add color state calculation with useMemo
  - File: `app/components/TweetComposer.tsx`
  - Location: After existing `content` state
  - Code:
    ```typescript
    const count = content.length;
    const colorState = useMemo(
      () => getColorState(count, MAX_TWEET_LENGTH),
      [count]
    );
    ```
  - Rationale: useMemo prevents unnecessary recalculations

- [ ] **T016**: Replace counter display format
  - File: `app/components/TweetComposer.tsx`
  - Find: Existing counter div showing "X characters remaining"
  - Replace with: `{formatCounter(count, MAX_TWEET_LENGTH)}`
  - Expected: Counter now shows "X / 140" format

- [ ] **T017**: Verify counter updates in real-time
  - Action: Manual test in dev server
  - Navigate: `/feed`
  - Type in textarea: Verify counter updates immediately
  - Expected: No lag, instant updates

**User Story 1 Checkpoint:**
- ✅ Counter displays "X / 140" format
- ✅ Counter updates in real-time
- ✅ No TypeScript errors
- ✅ Manual testing successful

---

## Phase 3: User Story 2 (P0) - Visual Warning System

**Goal:** Clear visual cues about proximity to character limit

**Acceptance Criteria:**
- Default gray color for 0-119 characters
- Yellow warning at 120-139 characters
- Red exceeded state at 140+ characters
- Color changes are smooth and immediate

### Color State Implementation

- [ ] **T018**: Update counter CSS classes for three-state coloring
  - File: `app/components/TweetComposer.tsx`
  - Find: Counter div className
  - Update to:
    ```typescript
    className={`text-sm font-medium transition-colors duration-200 ${
      colorState === 'exceeded' ? 'text-red-600' :
      colorState === 'warning' ? 'text-yellow-700' :
      'text-gray-600'
    }`}
    ```
  - Note: yellow-700 chosen for WCAG AA contrast compliance

- [ ] **T019**: Test color transitions
  - Action: Manual test in dev server
  - Test sequence:
    1. Type 0-119 chars → gray (text-gray-600)
    2. Type 120-139 chars → yellow (text-yellow-700)
    3. Type 140+ chars → red (text-red-600)
  - Verify: Smooth transitions with duration-200

- [ ] **T020**: Verify WCAG AA color contrast compliance
  - Tool: Browser DevTools or WebAIM Contrast Checker
  - Test:
    - Gray 600 on white: Should be ≥ 4.5:1
    - Yellow 700 on white: Should be ≥ 4.5:1 (6.11:1 expected)
    - Red 600 on white: Should be ≥ 4.5:1
  - Action: If fails, adjust to darker shade

**User Story 2 Checkpoint:**
- ✅ Three color states working correctly
- ✅ Smooth visual transitions
- ✅ WCAG AA compliance verified
- ✅ Colors visually distinguishable

---

## Phase 4: User Story 3 (P0) - Submission Prevention

**Goal:** Prevent submission when character count exceeds 140

**Acceptance Criteria:**
- Submit button disabled when count > 140
- Submit button re-enabled when count ≤ 140
- Disabled state is visually apparent
- Keyboard submission also blocked

### Submission Logic

- [ ] **T021**: Verify existing submit button disabled logic
  - File: `app/components/TweetComposer.tsx`
  - Check: Button already has `disabled={isInvalid || isSubmitting}`
  - Verify: `isInvalid` already checks `isOverLimit` (count > 140)
  - Action: No changes needed (already implemented correctly)

- [ ] **T022**: Test submission prevention
  - Action: Manual test in dev server
  - Test sequence:
    1. Type 140 chars → button should be enabled
    2. Type 141 chars → button should be disabled
    3. Delete to 140 chars → button should re-enable
  - Verify: Button visual state changes (opacity/cursor)

- [ ] **T023**: Test keyboard submission blocking
  - Action: Manual test
  - Steps:
    1. Type 141 characters
    2. Press Enter key in textarea
  - Expected: Form does not submit (button disabled)

**User Story 3 Checkpoint:**
- ✅ Submit button disables at 141+ characters
- ✅ Submit button re-enables when edited back ≤ 140
- ✅ Keyboard submission also blocked
- ✅ Disabled state visually clear

---

## Phase 5: Accessibility & Polish (P1)

### Accessibility (WCAG AA Compliance)

- [ ] **T024**: Verify aria-live region exists
  - File: `app/components/TweetComposer.tsx`
  - Check: Counter div has `aria-live="polite"`
  - Check: Counter div has `role="status"`
  - Action: If missing, add attributes

- [ ] **T025**: Add descriptive aria-label
  - File: `app/components/TweetComposer.tsx`
  - Add to counter div:
    ```typescript
    aria-label={`Character count: ${formatCounter(count, MAX_TWEET_LENGTH)}`}
    ```

- [ ] **T026**: Verify submit button aria-disabled
  - File: `app/components/TweetComposer.tsx`
  - Check: Button has proper `disabled` attribute
  - Note: HTML `disabled` attribute automatically sets aria-disabled
  - Action: No changes needed if using standard `disabled` prop

- [ ] **T027**: Screen reader testing
  - Tool: NVDA (Windows) or VoiceOver (Mac)
  - Test:
    1. Navigate to tweet composer
    2. Type characters and listen for announcements
    3. Verify count is announced at thresholds
  - Expected: Screen reader announces updates politely

### Component Tests (Principle 2: Type Safety)

- [ ] **T028**: Create TweetComposer test file
  - File: `app/components/TweetComposer.test.tsx`
  - Setup: Import React Testing Library, userEvent
  - Mock: React Router hooks (useActionData, useNavigation)

- [ ] **T029**: Write test: Counter displays "0 / 140" initially
  - File: `app/components/TweetComposer.test.tsx`
  - Test: Render component, check for "0 / 140" text

- [ ] **T030**: Write test: Counter updates as user types
  - File: `app/components/TweetComposer.test.tsx`
  - Test: Type "Hello" → expect "5 / 140"
  - Use: userEvent.type()

- [ ] **T031**: Write test: Counter shows default color < 120 chars
  - File: `app/components/TweetComposer.test.tsx`
  - Test: Type 50 chars → expect text-gray-600 class

- [ ] **T032**: Write test: Counter shows warning color at 120 chars
  - File: `app/components/TweetComposer.test.tsx`
  - Test: Type 120 chars → expect text-yellow-700 class

- [ ] **T033**: Write test: Counter shows exceeded color at 140+ chars
  - File: `app/components/TweetComposer.test.tsx`
  - Test: Type 141 chars → expect text-red-600 class

- [ ] **T034**: Write test: Submit button disabled when over limit
  - File: `app/components/TweetComposer.test.tsx`
  - Test: Type 141 chars → button has disabled attribute

- [ ] **T035**: Write test: Submit button enabled when ≤ 140 chars
  - File: `app/components/TweetComposer.test.tsx`
  - Test: Type 50 chars → button not disabled (if content not empty)

- [ ] **T036**: Write test: aria-live attribute present
  - File: `app/components/TweetComposer.test.tsx`
  - Test: Find counter element → expect aria-live="polite"

- [ ] **T037**: Run all component tests
  - Command: `npm test -- TweetComposer`
  - Expected: All tests pass

### Manual Testing Checklist

- [ ] **T038**: Visual testing checklist
  - [ ] Counter displays "0 / 140" initially
  - [ ] Counter updates immediately while typing
  - [ ] Color transitions are smooth (not jarring)
  - [ ] Yellow warning visible at 120 characters
  - [ ] Red exceeded state visible at 140 characters
  - [ ] Submit button visually disabled when over limit

- [ ] **T039**: Edge case testing
  - [ ] Exactly 140 characters: counter red, button enabled
  - [ ] Exactly 141 characters: counter red, button disabled
  - [ ] Copy-paste large text: counter updates, button disables
  - [ ] Emojis counted correctly (😀 = 2 code units is acceptable)
  - [ ] Rapid typing: counter updates smoothly without flickering

- [ ] **T040**: Browser compatibility testing
  - [ ] Chrome: All functionality works
  - [ ] Firefox: All functionality works
  - [ ] Safari: All functionality works (if available)

**Phase 5 Checkpoint:**
- ✅ All accessibility requirements met
- ✅ All component tests pass
- ✅ Manual testing checklist complete
- ✅ Browser compatibility verified

---

## Phase 6: Integration & Final Validation

### Integration Testing

- [ ] **T041**: Run full test suite
  - Command: `npm test`
  - Expected: All tests pass (unit + component)

- [ ] **T042**: TypeScript compilation check
  - Command: `npm run typecheck`
  - Expected: No TypeScript errors in strict mode

- [ ] **T043**: Dev server smoke test
  - Command: `npm run dev`
  - Navigate: `/feed`
  - Action: Compose a tweet with character counter
  - Verify: All features work end-to-end

### Documentation

- [ ] **T044**: Add JSDoc comments to helper functions
  - File: `app/utils/tweetCounter.ts`
  - Add: Function descriptions, parameter docs, return value docs
  - Example:
    ```typescript
    /**
     * Determines the visual color state based on character count thresholds
     * @param count - Current character count
     * @param maxLength - Maximum allowed characters (typically 140)
     * @returns Color state: 'default', 'warning', or 'exceeded'
     */
    ```

- [ ] **T045**: Add inline comments for color thresholds
  - File: `app/utils/tweetCounter.ts`
  - Document why 120 threshold chosen (20-char buffer)
  - Document color choices (WCAG AA compliance)

- [ ] **T046**: Update component comments
  - File: `app/components/TweetComposer.tsx`
  - Document color state logic
  - Document useMemo optimization rationale

### Code Review Preparation

- [ ] **T047**: Self-review checklist
  - [ ] Constitution compliance verified (Principles 1, 2, 5)
  - [ ] TypeScript strict mode passes
  - [ ] All tests pass
  - [ ] No console.log or debugging code
  - [ ] Code formatted consistently
  - [ ] No dead code or commented-out blocks
  - [ ] Performance optimized (useMemo used)
  - [ ] Security: N/A (client-side UI only)
  - [ ] Documentation complete

- [ ] **T048**: Prepare PR description
  - Summary: Character counter enhancement
  - Changes: List modified files
  - Screenshots: Before/after counter states
  - Testing: Describe test coverage
  - Acceptance criteria: Link to spec.md

**Phase 6 Checkpoint:**
- ✅ All tests pass
- ✅ TypeScript compiles cleanly
- ✅ Documentation complete
- ✅ Ready for code review

---

## Task Summary

**Total Tasks:** 48
**By Phase:**
- Phase 1 (Setup & Foundation): 12 tasks
- Phase 2 (User Story 1 - Counter Display): 5 tasks
- Phase 3 (User Story 2 - Visual Warning): 3 tasks
- Phase 4 (User Story 3 - Submission Prevention): 3 tasks
- Phase 5 (Accessibility & Polish): 19 tasks
- Phase 6 (Integration & Validation): 6 tasks

**Parallel Opportunities:**
- Tests T009, T010, T011 can run in parallel (different test suites)
- Browser testing T040 sub-tasks can run in parallel (different browsers)

**Critical Path:**
T001 → T003-T007 (helpers) → T008-T012 (tests) → T013-T017 (integration) → T018-T020 (colors) → T021-T023 (submission) → T024-T027 (a11y) → T028-T037 (tests) → T038-T043 (manual) → T044-T048 (docs)

---

## Dependencies

**No External Dependencies:** All required libraries already in project (React, TypeScript, Tailwind, Vitest, React Testing Library)

**Internal Dependencies:**
- Existing TweetComposer component (already implemented)
- Existing tweet creation action (already implemented)

**No Blockers:** All prerequisites met

---

## Success Criteria (from spec.md)

### Primary Acceptance Criteria (User Story 1)
- [x] Character counter displays in format "X / 140"
- [x] Counter updates in real-time as user types
- [x] Counter turns yellow at 120 characters
- [x] Counter turns red at 140 characters
- [x] Submit button disabled when count > 140
- [x] Counter visible near tweet input field

### Secondary Acceptance Criteria (User Story 2)
- [x] Color changes are immediate and obvious
- [x] Yellow warning at 120 characters (20 remaining)
- [x] Red warning at 140+ characters
- [x] Color states are accessible (aria-live, contrast)

### Tertiary Acceptance Criteria (User Story 3)
- [x] Submit button disabled when count > 140
- [x] Submit button re-enabled when count ≤ 140
- [x] Disabled state visually apparent
- [x] Keyboard submission blocked when over limit

### Technical Success Criteria
- [x] All unit tests pass
- [x] All component tests pass
- [x] TypeScript strict mode compiles
- [x] WCAG AA color contrast compliance
- [x] Zero perceptible lag during typing
- [x] Constitutional principles followed (1, 2, 5)

---

## Implementation Notes

**Key Design Decisions:**
1. **Pure Functions First:** All logic extracted to testable pure functions (Principle 1)
2. **useMemo Optimization:** Prevents unnecessary color state recalculations
3. **yellow-700 Color:** Chosen for WCAG AA compliance (6.11:1 contrast)
4. **Existing Validation:** Server-side 140-char limit already enforced (no backend changes)
5. **Accessibility:** aria-live="polite" ensures non-intrusive screen reader updates

**Current State:**
- TweetComposer already has character counter (different format)
- Already has submit button disabling logic
- Already has aria-live region

**What Changes:**
- Counter format: "X remaining" → "X / 140"
- Color states: Two states (default/red) → Three states (default/warning/exceeded)
- Color at 120: No warning → Yellow warning
- Transitions: None → Smooth 200ms transitions

**What Doesn't Change:**
- No database schema changes
- No API endpoint changes
- No routing changes
- Server-side validation unchanged

---

## Rollback Plan

**If issues arise:**
1. **Immediate Rollback:** Revert PR commit (< 5 minutes)
2. **Partial Rollback:** Keep tests, revert TweetComposer changes only
3. **Zero Risk:** No database/API changes, pure frontend enhancement

**Rollback Command:**
```bash
git revert <commit-hash>
git push
```

---

## Next Steps

After task completion:
1. Create pull request with detailed description
2. Request code review from team
3. Address review feedback
4. Merge to main after approval
5. Monitor for any user-reported issues
6. Close feature branch

---

**Last Updated:** 2025-10-15
**Status:** Ready for implementation
**Estimated Completion:** 2-3 hours
