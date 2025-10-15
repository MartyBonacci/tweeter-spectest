/**
 * Unit tests for session.ts
 * Bug 907: CORS Authentication Cookies
 *
 * These tests verify cookie string generation for both development and production modes.
 * They should FAIL before the fix and PASS after the fix.
 */

import { describe, it, expect } from 'vitest';
import { createSession, destroySession } from './session.js';

describe('createSession', () => {
  const userId = 'test-user-123';
  const jwtSecret = 'test-secret-key-at-least-32-chars-long';
  const cookieDomain = 'localhost';

  describe('Development Mode (isProduction = false)', () => {
    it('should create cookie with SameSite=None for cross-origin requests', () => {
      const { cookie } = createSession(userId, jwtSecret, cookieDomain, false);

      expect(cookie).toContain('SameSite=None');
    });

    it('should create cookie with Secure flag', () => {
      const { cookie } = createSession(userId, jwtSecret, cookieDomain, false);

      expect(cookie).toContain('Secure');
    });

    it('should NOT include Domain attribute (host-only cookie)', () => {
      const { cookie } = createSession(userId, jwtSecret, cookieDomain, false);

      // Cookie should NOT have Domain= attribute for localhost
      expect(cookie).not.toContain('Domain=');
    });

    it('should include HttpOnly flag', () => {
      const { cookie } = createSession(userId, jwtSecret, cookieDomain, false);

      expect(cookie).toContain('HttpOnly');
    });

    it('should include Path=/', () => {
      const { cookie } = createSession(userId, jwtSecret, cookieDomain, false);

      expect(cookie).toContain('Path=/');
    });

    it('should include Max-Age for 30 days', () => {
      const { cookie } = createSession(userId, jwtSecret, cookieDomain, false);
      const thirtyDaysInSeconds = 30 * 24 * 60 * 60;

      expect(cookie).toContain(`Max-Age=${thirtyDaysInSeconds}`);
    });

    it('should return a JWT token', () => {
      const { token } = createSession(userId, jwtSecret, cookieDomain, false);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
      // JWT format: xxx.yyy.zzz
      expect(token.split('.').length).toBe(3);
    });
  });

  describe('Production Mode (isProduction = true)', () => {
    const productionDomain = 'example.com';

    it('should create cookie with SameSite=Lax for same-site requests', () => {
      const { cookie } = createSession(userId, jwtSecret, productionDomain, true);

      expect(cookie).toContain('SameSite=Lax');
    });

    it('should create cookie with Secure flag', () => {
      const { cookie } = createSession(userId, jwtSecret, productionDomain, true);

      expect(cookie).toContain('Secure');
    });

    it('should include Domain attribute', () => {
      const { cookie } = createSession(userId, jwtSecret, productionDomain, true);

      expect(cookie).toContain(`Domain=${productionDomain}`);
    });

    it('should include HttpOnly flag', () => {
      const { cookie } = createSession(userId, jwtSecret, productionDomain, true);

      expect(cookie).toContain('HttpOnly');
    });

    it('should include Path=/', () => {
      const { cookie } = createSession(userId, jwtSecret, productionDomain, true);

      expect(cookie).toContain('Path=/');
    });
  });
});

describe('destroySession', () => {
  const cookieDomain = 'localhost';

  describe('Development Mode (isProduction = false)', () => {
    it('should create destroy cookie with SameSite=None', () => {
      const cookie = destroySession(cookieDomain, false);

      expect(cookie).toContain('SameSite=None');
    });

    it('should create destroy cookie with Secure flag', () => {
      const cookie = destroySession(cookieDomain, false);

      expect(cookie).toContain('Secure');
    });

    it('should NOT include Domain attribute', () => {
      const cookie = destroySession(cookieDomain, false);

      expect(cookie).not.toContain('Domain=');
    });

    it('should have Max-Age=0 to clear cookie', () => {
      const cookie = destroySession(cookieDomain, false);

      expect(cookie).toContain('Max-Age=0');
    });

    it('should have empty auth_token value', () => {
      const cookie = destroySession(cookieDomain, false);

      expect(cookie).toContain('auth_token=');
      // Should be auth_token= (empty value after =)
      expect(cookie).toMatch(/auth_token=;/);
    });
  });

  describe('Production Mode (isProduction = true)', () => {
    const productionDomain = 'example.com';

    it('should create destroy cookie with SameSite=Lax', () => {
      const cookie = destroySession(productionDomain, true);

      expect(cookie).toContain('SameSite=Lax');
    });

    it('should create destroy cookie with Secure flag', () => {
      const cookie = destroySession(productionDomain, true);

      expect(cookie).toContain('Secure');
    });

    it('should include Domain attribute', () => {
      const cookie = destroySession(productionDomain, true);

      expect(cookie).toContain(`Domain=${productionDomain}`);
    });

    it('should have Max-Age=0 to clear cookie', () => {
      const cookie = destroySession(productionDomain, true);

      expect(cookie).toContain('Max-Age=0');
    });
  });
});
