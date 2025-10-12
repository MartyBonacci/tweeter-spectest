# Tweeter

A simplified Twitter clone styled like the 140-character era.

## Features

- User signup and signin (authentication)
- Tweet posting (140 character limit)
- Tweet feed (newest first)
- Like tweets
- User profiles (bio, avatar)
- View other user profiles and their tweets

## Tech Stack

### Frontend
- React Router v7 (framework mode)
- Programmatic routes (app/routes.ts with RouteConfig - NOT file-based)
- TypeScript
- Functional programming patterns (not OOP)
- Tailwind CSS + Flowbite
- Zod validation

### Backend
- Express REST APIs
- JWT authentication + httpOnly cookies
- TypeScript
- Functional programming patterns (not OOP)
- Zod validation

### Database
- PostgreSQL (via Neon)
- postgres npm package (camelCase ↔ snake_case mapping)
- 3 tables: profiles, tweets, likes
- uuidv7 for IDs

### Security
- @node-rs/argon2 (password hashing)
- Zod (frontend UX + backend security)

### Storage
- Cloudinary (profile avatars)

## Data Structure

**Profile:**
- id (uuidv7)
- username (unique)
- email (unique)
- password_hash (argon2)
- bio (optional, max 160 chars)
- avatar_url (optional, Cloudinary)
- created_at

**Tweet:**
- id (uuidv7)
- profile_id (FK to profiles)
- content (max 140 chars)
- created_at

**Like:**
- id (uuidv7)
- tweet_id (FK to tweets)
- profile_id (FK to profiles)
- created_at
- Unique constraint: (tweet_id, profile_id)

## API Structure

### Authentication
- POST /api/auth/signup
- POST /api/auth/signin
- POST /api/auth/signout

### Tweets
- GET  /api/tweets (feed)
- GET  /api/tweets/:id
- POST /api/tweets
- GET  /api/tweets/user/:username

### Likes
- POST   /api/likes
- DELETE /api/likes/:id

### Profiles
- GET  /api/profiles/:username
- PUT  /api/profiles/:username
- POST /api/profiles/avatar

## Frontend Routes (Programmatic)

```typescript
// app/routes.ts
const routes: RouteConfig[] = [
  { path: '/', component: Landing },
  { path: '/signup', component: Signup },
  { path: '/signin', component: Signin },
  { path: '/feed', component: Feed },
  { path: '/profile/:username', component: Profile },
  { path: '/settings', component: Settings },
];
```

## Development

- Local testing only
- PostgreSQL via Neon
- Cloudinary for avatars