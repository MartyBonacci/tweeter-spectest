# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tweeter is a simplified Twitter clone styled like the 140-character era, built with React Router v7 (framework mode) frontend and Express REST API backend.

## Architecture Principles

### Functional Programming Patterns
- Use functional programming patterns throughout (NOT object-oriented)
- Prefer pure functions and immutability
- Avoid classes and class-based components

### React Router v7 (Framework Mode)
- Uses **programmatic routes** defined in `app/routes.ts` with RouteConfig
- **NOT file-based routing** - do not create route files in directories
- Route configuration is centralized in a single routes.ts file

### Database Layer
- PostgreSQL via Neon with the `postgres` npm package
- Database uses snake_case (e.g., `profile_id`, `created_at`)
- Application code uses camelCase (e.g., `profileId`, `createdAt`)
- The postgres package handles automatic case mapping between conventions
- All IDs use uuidv7 format (not traditional UUIDs or auto-increment)

### Validation Strategy
- Zod is used for both frontend UX validation AND backend security validation
- Frontend: provides user feedback before submission
- Backend: ensures data integrity and security

## Data Model

Three core tables with the following structure:

**profiles**: id, username (unique), email (unique), password_hash (argon2), bio (optional, max 160 chars), avatar_url (optional, Cloudinary), created_at

**tweets**: id, profile_id (FK), content (max 140 chars), created_at

**likes**: id, tweet_id (FK), profile_id (FK), created_at, with unique constraint on (tweet_id, profile_id)

## API Endpoints

Authentication: POST /api/auth/{signup,signin,signout}
Tweets: GET /api/tweets, GET /api/tweets/:id, POST /api/tweets, GET /api/tweets/user/:username
Likes: POST /api/likes, DELETE /api/likes/:id
Profiles: GET /api/profiles/:username, PUT /api/profiles/:username, POST /api/profiles/avatar

## Frontend Routes (Programmatic Configuration)

Defined in app/routes.ts using RouteConfig array:
- / (Landing)
- /signup (Signup)
- /signin (Signin)
- /feed (Feed)
- /profile/:username (Profile)
- /settings (Settings)

## Tech Stack Details

**Frontend**: React Router v7 framework mode, TypeScript, Tailwind CSS + Flowbite, Zod validation

**Backend**: Express REST APIs, JWT auth with httpOnly cookies, TypeScript, Zod validation

**Database**: PostgreSQL (Neon), postgres npm package with camelCase ↔ snake_case mapping

**Security**: @node-rs/argon2 for password hashing

**Storage**: Cloudinary for profile avatars

## Development Context

- This is a local testing environment
- No production deployment configuration needed
- PostgreSQL hosted via Neon
- Avatar uploads handled through Cloudinary
