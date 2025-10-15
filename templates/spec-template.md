# Feature Specification: [FEATURE_NAME]

**Feature ID:** [FEATURE_ID]
**Created:** [DATE]
**Status:** [draft|reviewed|approved|implemented]
**Priority:** [critical|high|medium|low]

---

## Constitution Alignment

This specification MUST comply with project constitution (`/memory/constitution.md`).

**Affected Principles:**
- [ ] Principle 1: Functional Programming Over OOP
- [ ] Principle 2: Type Safety (TypeScript + Zod)
- [ ] Principle 3: Programmatic Routing
- [ ] Principle 4: Security-First Architecture
- [ ] Principle 5: Modern React Patterns

**Compliance Statement:** [Explain how this feature adheres to each checked principle]

---

## Summary

**What:** [One-sentence description]

**Why:** [User problem being solved]

**Who:** [Target users]

---

## User Stories

### Primary User Story
```
As a [user type]
I want to [action]
So that [benefit]
```

**Acceptance Criteria:**
- [ ] [Specific, testable criterion]
- [ ] [Specific, testable criterion]
- [ ] [Specific, testable criterion]

### Secondary User Stories
[Additional user stories if applicable]

---

## Functional Requirements

### Must Have (P0)
1. [Requirement with clear success criteria]
2. [Requirement with clear success criteria]

### Should Have (P1)
1. [Requirement]
2. [Requirement]

### Could Have (P2)
1. [Requirement]
2. [Requirement]

### Won't Have (Out of Scope)
1. [Explicitly excluded item]
2. [Explicitly excluded item]

---

## Technical Requirements

### Type Safety Requirements
- [ ] TypeScript interfaces defined for all data structures
- [ ] Zod schemas created for:
  - [ ] API request validation
  - [ ] API response validation
  - [ ] Form input validation
  - [ ] [Other boundary validations]

### Security Requirements
- [ ] Authentication method: [JWT/Public/Other]
- [ ] Authorization rules: [Who can access what]
- [ ] Input sanitization: [Where and how]
- [ ] Data protection: [Sensitive data handling]

### Data Requirements
- [ ] Database schema changes documented
- [ ] Migration strategy defined
- [ ] Data validation rules specified
- [ ] snake_case ↔ camelCase mapping identified

### Routing Requirements
- [ ] Routes added to `app/routes.ts`
- [ ] Loader functions defined for data fetching
- [ ] Action functions defined for mutations
- [ ] No file-based routes created

---

## User Interface

### Pages/Views
1. **[Page Name]** (`[route path]`)
   - Purpose: [What user does here]
   - Components: [Main components used]
   - Data: [What data is displayed, source via loader]

### Components
1. **[ComponentName]** (functional component)
   - Props: [Interface definition]
   - State: [Local state with hooks]
   - Behavior: [Key interactions]

### User Flows
```
[Step-by-step user flow]
1. User navigates to [page]
2. User sees [content from loader]
3. User interacts with [component]
4. Action submits to [endpoint]
5. User sees [result]
```

---

## API Specification

### Endpoints

#### `[METHOD] [PATH]`
**Purpose:** [What this endpoint does]

**Authentication:** [Required/Optional/Public]

**Request:**
```typescript
// TypeScript type
interface [RequestType] {
  // ...
}

// Zod schema
const [requestSchema] = z.object({
  // ...
});
```

**Response:**
```typescript
// TypeScript type
interface [ResponseType] {
  // ...
}

// Zod schema
const [responseSchema] = z.object({
  // ...
});
```

**Error Responses:**
- `400`: [Validation error scenario]
- `401`: [Authentication error scenario]
- `403`: [Authorization error scenario]
- `404`: [Not found scenario]
- `500`: [Server error scenario]

---

## Data Model

### Database Schema

#### Table: [table_name]
```sql
CREATE TABLE [table_name] (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  [field_name] [TYPE] [CONSTRAINTS],
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- [ ] [Index description and columns]

**Constraints:**
- [ ] [Constraint description]

**Relationships:**
- [ ] [Foreign key relationships]

### TypeScript Interfaces
```typescript
// Application layer (camelCase)
interface [InterfaceName] {
  id: string;
  [fieldName]: [type];
  createdAt: Date;
}
```

---

## Security Analysis

### Threat Model
1. **[Threat]:** [Description]
   - **Mitigation:** [How principle 4 addresses this]

### Input Validation
- [ ] All user inputs validated with Zod before processing
- [ ] SQL injection prevented via parameterized queries
- [ ] XSS prevented via framework escaping + input validation

### Authentication & Authorization
- [ ] JWT tokens in httpOnly cookies only
- [ ] Protected routes have authentication middleware
- [ ] Authorization checks before data access

---

## Testing Requirements

### Unit Tests
- [ ] Pure functions tested with various inputs
- [ ] Zod schemas validated with valid/invalid data
- [ ] React hooks tested with React Testing Library
- [ ] Component rendering tested

### Integration Tests
- [ ] API endpoints tested with authentication
- [ ] Database operations tested
- [ ] Form submission flows tested

### End-to-End Tests
- [ ] Critical user flows automated
- [ ] Error handling tested
- [ ] Edge cases covered

---

## Performance Considerations

- [ ] Database queries optimized (indexes, N+1 prevention)
- [ ] Loader data fetching is efficient
- [ ] Components avoid unnecessary re-renders
- [ ] Large lists use virtualization if needed

---

## Accessibility

- [ ] Semantic HTML elements used
- [ ] ARIA labels where needed
- [ ] Keyboard navigation supported
- [ ] Color contrast meets WCAG standards
- [ ] Screen reader tested

---

## Dependencies

**Prerequisites:**
- [ ] [Required feature or infrastructure]

**External Services:**
- [ ] [API, service, or library needed]

**Blocking Issues:**
- [ ] [Any blockers to implementation]

---

## Open Questions

1. [Question requiring clarification or decision]
2. [Question requiring clarification or decision]

---

## Success Metrics

**How we'll measure success:**
- [ ] [Metric 1: e.g., User can complete flow in < X seconds]
- [ ] [Metric 2: e.g., 0 security vulnerabilities introduced]
- [ ] [Metric 3: e.g., All acceptance criteria met]

---

## Appendix

### References
- [Link to related docs, designs, or discussions]

### Change Log
| Date | Change | Author |
|------|--------|--------|
| [DATE] | Initial specification | [NAME] |
