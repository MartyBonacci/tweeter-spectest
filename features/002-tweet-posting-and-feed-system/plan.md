# Implementation Plan: Tweet Posting and Feed System

**Feature ID:** 002-tweet-posting-and-feed-system
**Created:** 2025-10-12
**Status:** draft

---

## Tech Stack Compliance Report

### ✅ Approved Technologies (from tech-stack.md v1.0.0)

All technologies for this feature are APPROVED:
- TypeScript 5.x, React Router v7, Express, PostgreSQL 17
- postgres npm package, uuid (uuidv7), Zod
- Tailwind CSS, Flowbite

**Tech Stack Status:** ✅ COMPLIANT - Ready to proceed

---

## Constitution Compliance Check

- [x] **Principle 1 (Functional Programming):** Tweet creation/retrieval logic as pure functions. TweetComposer, TweetList, TweetCard all functional components.
- [x] **Principle 2 (Type Safety):** TypeScript strict mode. Zod schemas for tweet creation, content validation (1-140 chars).
- [x] **Principle 3 (Programmatic Routing):** Routes (/feed, /tweets/:id) in app/routes.ts. Loaders for data fetching.
- [x] **Principle 4 (Security-First):** Content sanitization, parameterized queries, authentication required for posting.
- [x] **Principle 5 (Modern React):** Loaders fetch tweets (not useEffect). Actions handle tweet creation. Real-time character counter with hooks.

---

## Overview

**Goal:** Enable users to post short messages (140 characters) and view a chronological feed of all tweets.

**User Value:** Core platform functionality - users can express themselves and discover content.

**Scope:**
- **Included:** Tweet posting (authenticated), feed viewing (public), tweet detail pages, character validation, chronological ordering
- **Excluded:** Edit/delete, replies, likes (separate feature), media, hashtags, search

---

## Technical Approach

### Data Model

**tweets table:**
```sql
CREATE TABLE tweets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  profile_id UUID NOT NULL REFERENCES profiles(id),
  content VARCHAR(140) NOT NULL CHECK(LENGTH(TRIM(content)) >= 1 AND LENGTH(content) <= 140),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_tweets_created_at DESC ON tweets(created_at);
CREATE INDEX idx_tweets_profile_id ON tweets(profile_id);
```

### API Endpoints

1. **POST /api/tweets** - Create tweet (auth required)
2. **GET /api/tweets** - Get all tweets (public)
3. **GET /api/tweets/:id** - Get single tweet (public)

### Components

1. **TweetComposer** - Form with character counter, real-time validation
2. **TweetList** - Maps tweets array to TweetCard components
3. **TweetCard** - Displays tweet content, author, timestamp

---

## Implementation Phases

### Phase 1: Database & Backend (2-3 hours)
1. Create tweets table migration
2. Implement POST /api/tweets (validate, sanitize, insert)
3. Implement GET /api/tweets (join with profiles, order by created_at DESC)
4. Implement GET /api/tweets/:id
5. Write integration tests

### Phase 2: Frontend Components (2-3 hours)
1. Implement TweetComposer with character counter
2. Implement TweetList and TweetCard
3. Add Tailwind styling
4. Write component tests

### Phase 3: Integration (1-2 hours)
1. Connect composer to POST action
2. Connect feed loader to GET endpoint
3. Connect detail page loader
4. End-to-end testing

---

## Dependencies

- **Feature 001 (User Authentication)** - REQUIRED (profiles table, auth middleware, session management)

---

## Success Criteria

- [ ] Users post tweets in under 30 seconds
- [ ] Feed loads in under 2 seconds
- [ ] 100% invalid tweets rejected
- [ ] 0 XSS vulnerabilities
- [ ] Character counter real-time

