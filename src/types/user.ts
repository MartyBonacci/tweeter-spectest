/**
 * Complete user record from database
 * Includes all fields including sensitive data (passwordHash)
 * INTERNAL USE ONLY - never expose in API responses
 */
export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: Date;
}

/**
 * Public user data safe for API responses
 * Excludes sensitive fields (passwordHash, bio, avatarUrl)
 */
export interface PublicUser {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
}

/**
 * Session data stored in JWT payload
 * Minimal user information for authentication
 */
export interface SessionData {
  userId: string;
  username: string;
  email: string;
}

/**
 * Database result type (snake_case)
 * Mirrors profiles table schema directly
 */
export interface ProfileRow {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  bio: string | null;
  avatar_url: string | null;
  created_at: Date;
}

/**
 * Map database row (snake_case) to User type (camelCase)
 * Pure function with no side effects
 *
 * @param row - Raw database query result
 * @returns User object with camelCase properties
 */
export function mapProfileRowToUser(row: ProfileRow): User {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    passwordHash: row.password_hash,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
  };
}

/**
 * Convert User to PublicUser (remove sensitive fields)
 * Pure function with no side effects
 *
 * @param user - Complete user record
 * @returns Public user data (safe for API responses)
 */
export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
  };
}

/**
 * Convert User to SessionData (for JWT payload)
 * Pure function with no side effects
 *
 * @param user - Complete user record
 * @returns Minimal session data for JWT
 */
export function toSessionData(user: User): SessionData {
  return {
    userId: user.id,
    username: user.username,
    email: user.email,
  };
}
