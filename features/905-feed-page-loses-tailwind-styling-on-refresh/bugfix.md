# Bug 905: Feed Page Loses Tailwind Styling on Refresh

**Status**: Active
**Created**: 2025-10-13
**Priority**: High
**Severity**: Major

## Symptoms

When refreshing the feed page (F5 or browser reload), all Tailwind CSS styling is lost:

- Page content renders correctly (markup is present)
- All visual styling disappears (no colors, spacing, typography)
- Page appears as unstyled HTML
- Functionality works but UX is completely broken
- Navigating away and back restores styling

## Reproduction Steps

1. Navigate to http://localhost:5173/feed (via client-side navigation)
2. Observe: Page displays correctly with Tailwind styling
3. Press F5 or click browser reload button
4. Observe: Page reloads without any CSS styling

**Expected Behavior**: Feed page should display with full Tailwind CSS styling after page refresh

**Actual Behavior**: Page loads without any CSS styling, appearing as unstyled HTML

## Root Cause Analysis

**Cause**: Incorrect stylesheet import pattern in app/root.tsx

- **Component affected**: Root layout (app/root.tsx)
- **Code location**: app/root.tsx:3
- **Logic error**: Using side-effect CSS import instead of React Router v7 `links` export pattern
- **Conditions**: Occurs on all full page refreshes (SSR renders)

**Technical Details**:

React Router v7 (framework mode) requires stylesheets to be exported via a `links` function for proper server-side rendering. The current implementation uses:

```typescript
import './globals.css';  // ❌ Side-effect import
```

This works for client-side navigation (SPA mode) because the CSS module is loaded once and persists, but on full page refresh (SSR), the stylesheet link tag is not included in the server-rendered HTML because React Router doesn't know about the side-effect import.

The `<Links />` component in root.tsx (line 16) renders `<link>` tags from `links` exports, but there's no `links` function defined.

## Impact Assessment

**Affected Users**: All users who refresh any page

**Affected Features**:
- All pages: Completely unstyled on refresh
- Visual design: 100% broken
- User experience: Severely degraded
- Functionality: Intact (but unusable due to poor UX)

**Severity Justification**: Major - core UX is broken for common user action (page refresh)

**Workaround Available**: Yes - navigate to homepage and then navigate to desired page (client-side navigation)

## Regression Test Requirements

The regression test should verify:

1. Root layout exports a `links` function
2. `links` function includes globals.css stylesheet
3. Server-rendered HTML includes `<link>` tag for globals.css
4. Page styling works correctly on full page refresh
5. Page styling works correctly on client-side navigation

**Test Success Criteria**:
- ✅ Test fails before fix (no links export, SSR HTML missing stylesheet link)
- ✅ Test passes after fix (links export present, stylesheet included in SSR HTML)
- ✅ Both SSR and CSR rendering include styles

## Proposed Solution

Replace side-effect import with React Router v7 `links` export pattern.

**Changes Required**:

**File**: app/root.tsx

1. Remove side-effect import: `import './globals.css';`
2. Add `links` export function that returns stylesheet link descriptor
3. Keep `LinksFunction` type import (already present)

**Implementation**:

```typescript
// Remove line 3:
// import './globals.css';

// Add links export:
export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: '/app/globals.css' },
];
```

**Note**: The href path should be relative to the build output. React Router will process this correctly during the build step.

**Alternative**: Import the CSS as a URL:

```typescript
import stylesheetUrl from './globals.css?url';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: stylesheetUrl },
];
```

**Risks**: Minimal - standard React Router v7 pattern

**Why this approach**:
- Follows React Router v7 official documentation for stylesheet handling
- Ensures stylesheets are included in both SSR and CSR
- Proper hydration of styles on page refresh
- Standard pattern used across React Router apps

---

## Tech Stack Compliance

**Tech Stack File**: /memory/tech-stack.md
**Validation Status**: Compliant

- Uses React Router v7 framework mode patterns
- Follows React Router conventions for asset handling
- No prohibited technologies

---

## Metadata

**Workflow**: Bugfix (regression-test-first)
**Created By**: SpecLab Plugin v1.0.0
**Smart Integration**: SpecTest (parallel execution, hooks, metrics enabled)
