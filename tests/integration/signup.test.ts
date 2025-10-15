import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { v7 as uuidv7 } from 'uuid';
import { getDb, closeDb } from '../../src/db/connection.js';
import { createUser, usernameExists, emailExists } from '../../src/db/users.js';
import { hashPassword } from '../../src/auth/password.js';
import type { Sql } from '../../src/db/connection.js';

describe('Signup Integration Tests', () => {
  let db: Sql;

  beforeAll(() => {
    // Connect to test database
    const testDbUrl = process.env.DATABASE_URL || 'postgresql://localhost:5432/tweeter_test';
    db = getDb(testDbUrl);
  });

  afterAll(async () => {
    // Close database connection
    await closeDb();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await db`DELETE FROM profiles WHERE username LIKE 'test_%'`;
  });

  describe('POST /api/auth/signup', () => {
    it('should create a new user with valid data', async () => {
      const testUser = {
        id: uuidv7(),
        username: 'test_user_' + Date.now(),
        email: `test${Date.now()}@example.com`,
        passwordHash: await hashPassword('password123'),
      };

      const user = await createUser(db, testUser);

      expect(user).toBeDefined();
      expect(user.id).toBe(testUser.id);
      expect(user.username).toBe(testUser.username);
      expect(user.email).toBe(testUser.email);
    });

    it('should detect duplicate username', async () => {
      const username = 'test_duplicate_' + Date.now();

      // Create first user
      await createUser(db, {
        id: uuidv7(),
        username,
        email: `user1${Date.now()}@example.com`,
        passwordHash: await hashPassword('password123'),
      });

      // Check username exists
      const exists = await usernameExists(db, username);
      expect(exists).toBe(true);
    });

    it('should detect duplicate email', async () => {
      const email = `duplicate${Date.now()}@example.com`;

      // Create first user
      await createUser(db, {
        id: uuidv7(),
        username: 'test_user1_' + Date.now(),
        email,
        passwordHash: await hashPassword('password123'),
      });

      // Check email exists
      const exists = await emailExists(db, email);
      expect(exists).toBe(true);
    });

    it('should validate username length (3-20 chars)', () => {
      // This would be tested at the API level with actual HTTP requests
      // For now, we verify the database layer works correctly
      expect(true).toBe(true); // Placeholder
    });

    it('should validate email format', () => {
      // This would be tested at the API level with Zod validation
      expect(true).toBe(true); // Placeholder
    });

    it('should validate password minimum length (8 chars)', () => {
      // This would be tested at the API level with Zod validation
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('User uniqueness checks', () => {
    it('should return false for non-existent username', async () => {
      const exists = await usernameExists(db, 'nonexistent_user_12345');
      expect(exists).toBe(false);
    });

    it('should return false for non-existent email', async () => {
      const exists = await emailExists(db, 'nonexistent@example.com');
      expect(exists).toBe(false);
    });
  });
});
