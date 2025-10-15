# Implementation Plan: [FEATURE_NAME]

**Feature ID:** [FEATURE_ID]
**Created:** [DATE]
**Status:** [draft|approved|in-progress|completed]

---

## Constitution Compliance Check

Before proceeding, verify this plan complies with ALL principles in `/memory/constitution.md`:

- [ ] **Principle 1 (Functional Programming):** Design uses pure functions, no classes
- [ ] **Principle 2 (Type Safety):** All boundaries have TypeScript types + Zod schemas
- [ ] **Principle 3 (Programmatic Routing):** Routes defined in app/routes.ts only
- [ ] **Principle 4 (Security-First):** Authentication, validation, and sanitization addressed
- [ ] **Principle 5 (Modern React):** Uses hooks, composition, and loader-based data fetching

**Compliance Notes:** [Document any special considerations or exceptional cases]

---

## Overview

**Goal:** [What problem does this feature solve?]

**User Value:** [How does this benefit users?]

**Scope:** [What's included and explicitly excluded?]

---

## Technical Approach

### Architecture

[Describe the high-level architecture. Reference functional patterns, component composition, data flow.]

### Data Model Changes

**Database Changes:**
- [ ] New tables/columns (with snake_case naming)
- [ ] Migrations needed
- [ ] Updated schemas

**Type Definitions:**
```typescript
// TypeScript interfaces (camelCase)
interface [InterfaceName] {
  // ...
}
```

**Zod Schemas:**
```typescript
// Validation schemas for boundaries
const [SchemaName] = z.object({
  // ...
});
```

### API Design

**New Endpoints:**
- `[METHOD] [PATH]` - [Description]
  - Request: [Zod schema reference]
  - Response: [Zod schema reference]
  - Auth: [Required/Optional/Public]

**Modified Endpoints:**
- `[METHOD] [PATH]` - [Changes]

### Frontend Components

**New Components:**
- `[ComponentName]` - [Purpose, functional component with hooks]

**Modified Components:**
- `[ComponentName]` - [Changes]

**Routing Changes:**
```typescript
// app/routes.ts additions/changes
{
  path: '[path]',
  Component: [ComponentName],
  loader: [loaderFunction],
  action: [actionFunction]
}
```

### State Management

[Describe state approach: local state, context, form state, server state via loaders]

---

## Security Considerations

- [ ] Input validation with Zod on client and server
- [ ] Authentication requirements identified
- [ ] Authorization checks in place
- [ ] No sensitive data in localStorage/client state
- [ ] Parameterized database queries only

---

## Testing Strategy

**Unit Tests:**
- [ ] Pure functions and hooks
- [ ] Zod schema validation
- [ ] Component rendering

**Integration Tests:**
- [ ] API endpoints with authentication
- [ ] Database operations
- [ ] Full user flows

**Manual Testing:**
- [ ] User flows documented
- [ ] Edge cases identified

---

## Implementation Phases

### Phase 1: [Phase Name]
**Tasks:**
1. [Task description]
2. [Task description]

**Deliverables:** [What's done after this phase]

### Phase 2: [Phase Name]
**Tasks:**
1. [Task description]
2. [Task description]

**Deliverables:** [What's done after this phase]

### Phase 3: [Phase Name]
**Tasks:**
1. [Task description]
2. [Task description]

**Deliverables:** [What's done after this phase]

---

## Dependencies

**External Dependencies:**
- [ ] [Dependency name and reason]

**Internal Dependencies:**
- [ ] [Prerequisite feature or refactor]

**Blockers:**
- [ ] [Anything blocking this work]

---

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| [Risk description] | [High/Med/Low] | [High/Med/Low] | [How to address] |

---

## Success Criteria

- [ ] Feature works as specified
- [ ] All tests pass
- [ ] Constitution principles followed
- [ ] No TypeScript errors
- [ ] No security vulnerabilities introduced
- [ ] Code reviewed and approved

---

## Rollback Plan

[How to revert this feature if problems arise]

---

## Documentation Updates

- [ ] API documentation
- [ ] User-facing documentation
- [ ] Developer documentation
- [ ] CLAUDE.md updates if needed

---

## Notes

[Any additional context, decisions, or considerations]
