# Tweeter Tech Stack

**Version:** 1.0.0
**Last Updated:** 2025-10-12
**Status:** Active

---

## Purpose

This document defines the APPROVED technology stack for the Tweeter project. All features MUST use these technologies unless explicitly justified and approved through constitutional amendment.

**This file enforces Principle 5 of the constitution**: Tech Stack Compliance

---

## Core Technologies

### Language
- ✅ **TypeScript 5.x** (strict mode required)
  - Rationale: Type safety, compile-time error detection, better IDE support
  - Context: All code (frontend and backend) uses TypeScript

### Frontend Framework
- ✅ **React Router v7** (framework mode)
  - Rationale: Modern React with SSR, built-in data loading, framework-grade features
  - Context: Programmatic routing via app/routes.ts (NOT file-based routing)
  - ⚠️ IMPORTANT: Must use RouteConfig[] array, no file-based routes

### Backend Framework
- ✅ **Express** (REST APIs)
  - Rationale: Mature, simple, widely adopted Node.js framework
  - Context: RESTful API endpoints for all backend operations

### Database
- ✅ **PostgreSQL 17** (via Neon)
  - Rationale: Robust relational database, ACID compliance, rich feature set
  - Context: Hosted on Neon, accessed via postgres npm package
  - ⚠️ IMPORTANT: snake_case in database, camelCase in application code

---

## Standard Libraries

### Data Layer
- ✅ **postgres** npm package
  - Purpose: PostgreSQL client with automatic case conversion
  - Context: Handles snake_case ↔ camelCase mapping automatically
- ✅ **uuid** (uuidv7)
  - Purpose: Generate v7 UUIDs for all primary keys
  - Context: Time-sortable, better than v4 for database performance

### Validation
- ✅ **Zod**
  - Purpose: Runtime type validation + schema definition
  - Context: Used on both frontend (UX) and backend (security)
  - Rationale: TypeScript-first, composable, excellent error messages

### Security
- ✅ **@node-rs/argon2**
  - Purpose: Password hashing
  - Context: Modern, GPU-resistant, recommended over bcrypt
- ✅ **jsonwebtoken** (JWT)
  - Purpose: Session token generation and verification
  - Context: Tokens stored in httpOnly cookies only (never localStorage)

### UI/Styling
- ✅ **Tailwind CSS**
  - Purpose: Utility-first CSS framework
  - Context: Rapid UI development with consistent design
- ✅ **Flowbite**
  - Purpose: Tailwind component library
  - Context: Pre-built UI components (buttons, forms, modals)

### File Storage
- ✅ **Cloudinary**
  - Purpose: Image upload, storage, and CDN
  - Context: User avatar uploads
  - Rationale: External storage, automatic optimization, reliable CDN

---

## Prohibited Technologies

**IMPORTANT:** These technologies are PROHIBITED and MUST NOT be used in any feature. Violations require constitutional amendment.

### ❌ Object-Oriented Patterns
- ❌ **Class components** (React)
  - Use: Functional components with hooks
  - Reason: Violates Principle 1 (Functional Programming)

- ❌ **Class-based services/controllers**
  - Use: Pure functions and factory functions
  - Reason: Violates Principle 1 (Functional Programming)

### ❌ File-Based Routing
- ❌ **File-based routes** (e.g., app/routes/*.tsx)
  - Use: Programmatic routes in app/routes.ts
  - Reason: Violates Principle 3 (Programmatic Routing)

### ❌ Alternative Password Hashing
- ❌ **bcrypt**
  - Use: @node-rs/argon2
  - Reason: Argon2 is more modern and GPU-resistant

- ❌ **crypto.pbkdf2** (built-in)
  - Use: @node-rs/argon2
  - Reason: Argon2 is stronger and more configurable

### ❌ Insecure Token Storage
- ❌ **localStorage** (for JWTs)
  - Use: httpOnly cookies
  - Reason: Violates Principle 4 (Security-First), vulnerable to XSS

- ❌ **sessionStorage** (for JWTs)
  - Use: httpOnly cookies
  - Reason: Violates Principle 4 (Security-First), vulnerable to XSS

### ❌ Alternative ORMs/Query Builders
- ❌ **Drizzle ORM**
  - Use: postgres npm package with raw SQL
  - Reason: Simplicity, direct control, automatic case mapping built-in

- ❌ **Prisma**
  - Use: postgres npm package
  - Reason: Overhead, complexity, schema-first approach conflicts with our needs

- ❌ **TypeORM**
  - Use: postgres npm package
  - Reason: Violates Principle 1 (OOP patterns)

### ❌ Alternative Validation Libraries
- ❌ **Joi**
  - Use: Zod
  - Reason: Zod is TypeScript-first with better type inference

- ❌ **Yup**
  - Use: Zod
  - Reason: Zod has better TypeScript integration

### ❌ Client-Side State Management (for server data)
- ❌ **Redux** (for server state)
  - Use: React Router loaders/actions
  - Reason: Violates Principle 5 (Modern React), loaders handle server state better

- ❌ **useEffect for data fetching**
  - Use: React Router loaders
  - Reason: Violates Principle 5 (Modern React), causes race conditions and loading states

---

## Version History

| Version | Date       | Change                                    | Reason                        |
|---------|------------|-------------------------------------------|-------------------------------|
| 1.0.0   | 2025-10-12 | Initial tech stack definition             | First feature (001-auth)      |

---

## Amendment Process

To modify this tech stack:

1. **Document justification** in feature's research.md
2. **Propose constitutional amendment** if adding to prohibited list
3. **Get maintainer approval**
4. **Update this file**:
   - MAJOR version: Remove/replace core technology (breaking change)
   - MINOR version: Add new approved technology
   - PATCH version: Clarify existing entries, fix typos
5. **Update all affected features**

---

## Enforcement

- All `/spectest:plan` commands validate against this file
- Prohibited technologies cause planning to HALT
- New technologies auto-added if no conflicts detected
- Conflicting technologies require explicit approval

**Violations are constitutional violations** (see `/memory/constitution.md`)
