import { v7 as uuidv7 } from 'uuid';
import type { Sql } from './connection.js';
import type { User } from '../types/user.js';

/**
 * Create new user in profiles table
 * Pure function with no side effects beyond database write
 *
 * @param db - Database connection
 * @param data - User creation data
 * @returns Created user record
 * @throws {Error} If unique constraint violated or database error
 */
export async function createUser(
  db: Sql,
  data: {
    id: string;
    username: string;
    email: string;
    passwordHash: string;
  }
): Promise<User> {
  const [user] = await db<User[]>`
    INSERT INTO profiles (id, username, email, password_hash)
    VALUES (${data.id}, ${data.username}, ${data.email}, ${data.passwordHash})
    RETURNING *
  `;

  if (!user) {
    throw new Error('Failed to create user');
  }

  return user;
}

/**
 * Check if username already exists
 * Pure function with no side effects
 *
 * @param db - Database connection
 * @param username - Username to check
 * @returns True if username exists, false otherwise
 */
export async function usernameExists(
  db: Sql,
  username: string
): Promise<boolean> {
  const [result] = await db<[{ exists: boolean }]>`
    SELECT EXISTS(
      SELECT 1 FROM profiles WHERE username = ${username}
    )
  `;

  return result?.exists ?? false;
}

/**
 * Check if email already exists
 * Pure function with no side effects
 *
 * @param db - Database connection
 * @param email - Email to check
 * @returns True if email exists, false otherwise
 */
export async function emailExists(db: Sql, email: string): Promise<boolean> {
  const [result] = await db<[{ exists: boolean }]>`
    SELECT EXISTS(
      SELECT 1 FROM profiles WHERE email = ${email}
    )
  `;

  return result?.exists ?? false;
}

/**
 * Find user by email
 * Used for signin authentication
 *
 * @param db - Database connection
 * @param email - Email to search for
 * @returns User if found, null otherwise
 */
export async function findUserByEmail(
  db: Sql,
  email: string
): Promise<User | null> {
  const [user] = await db<User[]>`
    SELECT * FROM profiles WHERE email = ${email}
  `;

  return user ?? null;
}

/**
 * Find user by ID
 * Used for session validation
 *
 * @param db - Database connection
 * @param id - User ID (UUID)
 * @returns User if found, null otherwise
 */
export async function findUserById(db: Sql, id: string): Promise<User | null> {
  const [user] = await db<User[]>`
    SELECT * FROM profiles WHERE id = ${id}
  `;

  return user ?? null;
}
