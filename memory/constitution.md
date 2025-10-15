<!--
SYNC IMPACT REPORT (Initial Creation)
Version: 1.0.0
Change Type: Initial constitution creation
Rationale: Establishing foundational governance and principles for the Tweeter project

Modified Principles: N/A (initial creation)
Added Sections:
  - All core principles (5 total)
  - Governance section
  - Tech stack constraints
  - Enforcement section

Templates Status:
  ✅ plan-template.md - created with constitution compliance checklist
  ✅ spec-template.md - created with principle alignment section
  ✅ tasks-template.md - created with principle-based task categorization

Follow-up TODOs: None - all templates aligned with constitution
-->

# Tweeter Project Constitution

**Version:** 1.0.0
**Ratification Date:** 2025-10-12
**Last Amended:** 2025-10-12

---

## Purpose

This constitution defines the non-negotiable technical and architectural principles
governing the Tweeter project. All features, refactors, and code contributions MUST
comply with these principles. Violations require explicit constitutional amendment.

---

## Core Principles

### Principle 1: Functional Programming Over OOP

**Declaration:**
All code MUST use functional programming patterns. Object-oriented programming
(classes, inheritance, class-based components) is prohibited except when required
by third-party library APIs.

**Requirements:**
- Use pure functions with explicit inputs and outputs
- Maintain immutability; avoid mutating state
- Prefer function composition over class hierarchies
- Use factory functions instead of constructors
- React components MUST be function components, not class components

**Rationale:**
Functional patterns produce more predictable, testable, and maintainable code.
Pure functions eliminate hidden state and side effects, making debugging and
reasoning about code behavior significantly easier.

**Validation:**
- Code reviews MUST reject class declarations (except library integration)
- No `this` keyword usage outside third-party API requirements
- No component lifecycle methods (componentDidMount, etc.)

---

### Principle 2: Type Safety (TypeScript + Zod)

**Declaration:**
All code MUST use TypeScript with strict mode enabled. All data crossing boundaries
(API requests/responses, form inputs, external data) MUST be validated with Zod
schemas.

**Requirements:**
- `tsconfig.json` MUST enable strict mode
- No `any` types except in exceptional cases with documented justification
- Zod schemas MUST validate:
  - All API request payloads (client → server)
  - All API responses (server → client)
  - All form inputs before submission
  - All external data sources
- Frontend uses Zod for UX (early validation feedback)
- Backend uses Zod for security (data integrity enforcement)

**Rationale:**
TypeScript catches errors at compile time. Zod catches runtime data errors before
they propagate. Together they provide defense-in-depth against type-related bugs
and malicious inputs.

**Validation:**
- Build MUST fail on TypeScript errors
- All API endpoints MUST have corresponding Zod schemas
- Code reviews MUST verify Zod validation at boundaries

---

### Principle 3: Programmatic Routing (React Router v7)

**Declaration:**
React Router v7 MUST be used in framework mode with programmatic routing.
File-based routing is prohibited. All routes MUST be defined in `app/routes.ts`
using the RouteConfig array.

**Requirements:**
- Single source of truth: `app/routes.ts`
- Route definitions use `RouteConfig[]` type
- No route files in directories (no `app/routes/*.tsx` files)
- Route changes MUST be made in `app/routes.ts` only
- Loaders and actions can be colocated with components but referenced from routes.ts

**Rationale:**
Programmatic routing provides explicit, centralized control over application flow.
File-based routing creates implicit magic and makes refactoring difficult. A single
routes file makes the application structure immediately clear.

**Validation:**
- No route files outside `app/routes.ts`
- `app/routes.ts` MUST export RouteConfig array
- Code reviews MUST reject scattered route definitions

---

### Principle 4: Security-First Architecture

**Declaration:**
Security MUST be architected into every layer. Authentication uses JWT tokens in
httpOnly cookies. Passwords MUST use argon2 hashing. All user inputs MUST be
validated and sanitized.

**Requirements:**
- Password hashing: @node-rs/argon2 only (no bcrypt, no plaintext)
- JWT tokens MUST be stored in httpOnly cookies (no localStorage)
- Cookie settings MUST include: httpOnly, secure (in production), sameSite
- All database queries MUST use parameterized queries (no string concatenation)
- All user inputs MUST pass Zod validation before database operations
- Authentication middleware MUST verify tokens on protected routes

**Rationale:**
httpOnly cookies prevent XSS attacks from stealing tokens. argon2 is the modern
standard for password hashing, resistant to GPU attacks. Input validation prevents
injection attacks. Defense-in-depth ensures a single vulnerability doesn't compromise
the entire system.

**Validation:**
- No JWT in localStorage
- No password libraries other than @node-rs/argon2
- All protected routes MUST have authentication middleware
- Database queries MUST use prepared statements/parameterized queries

---

### Principle 5: Modern React Patterns

**Declaration:**
React code MUST use modern patterns: function components, hooks, composition over
inheritance, and declarative state management.

**Requirements:**
- Function components only (no class components)
- Use hooks for state and side effects (useState, useEffect, custom hooks)
- Custom hooks for reusable logic
- Component composition via props.children and render props
- Avoid prop drilling; use context for deeply nested shared state
- Prefer controlled components for forms
- Use React Router v7 loaders for data fetching (not useEffect)

**Rationale:**
Modern React patterns leverage functional programming principles, improve code
reuse through hooks, and provide better performance through composition. Loaders
eliminate loading states and race conditions associated with useEffect data fetching.

**Validation:**
- No class components in codebase
- Data fetching MUST use loaders/actions, not useEffect
- Custom hooks MUST follow naming convention (use* prefix)
- Code reviews MUST reject prop drilling beyond 2 levels

---

## Tech Stack Constraints

These constraints derive from the principles above and MUST be followed:

**Frontend:**
- React Router v7 (framework mode)
- TypeScript (strict mode)
- Zod validation
- Tailwind CSS + Flowbite UI

**Backend:**
- Express REST APIs
- TypeScript (strict mode)
- Zod validation
- @node-rs/argon2 (passwords)
- JWT (authentication)

**Database:**
- PostgreSQL (via Neon)
- postgres npm package
- uuidv7 for IDs
- snake_case in database, camelCase in code

**Storage:**
- Cloudinary (avatars)

---

## Governance

### Amendment Procedure

1. Propose amendment via issue/discussion with rationale
2. Demonstrate how amendment improves code quality or developer experience
3. Identify all affected code and migration path
4. Require consensus from maintainers
5. Update constitution version (semantic versioning)
6. Update all dependent templates and documentation
7. Create migration guide if existing code affected

### Version Semantics

- **MAJOR** (X.0.0): Principle removed/redefined (breaking change)
- **MINOR** (x.Y.0): New principle added or material expansion
- **PATCH** (x.y.Z): Clarifications, wording improvements, no semantic change

### Compliance Review

- All PRs MUST pass principle compliance check
- Constitution violations MUST be documented if accepted (with amendment proposal)
- Quarterly reviews to ensure principles remain relevant

### Enforcement

Code that violates these principles MUST NOT be merged unless accompanied by:
1. A constitutional amendment proposal, OR
2. Documented justification for exceptional case (library requirement, etc.)

---

## Living Document

This constitution is a living document. As the project evolves and new patterns
emerge, principles may be refined. However, changes MUST be deliberate, documented,
and backward-compatible when possible.

**Last Review:** 2025-10-12
**Next Scheduled Review:** 2026-01-12
