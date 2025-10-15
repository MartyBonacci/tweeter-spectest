import { generateToken } from './jwt.js';

/**
 * Session cookie configuration
 */
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

/**
 * Session result with token and cookie header
 */
export interface SessionResult {
  token: string;
  cookie: string;
}

/**
 * Create a new user session
 * Factory function that generates JWT and cookie header
 *
 * @param userId - User's UUID
 * @param jwtSecret - Secret key for JWT signing
 * @param cookieDomain - Domain for cookie (e.g., 'localhost' or 'example.com')
 * @param isProduction - Whether app is running in production (enables secure flag)
 * @returns Session result with token and Set-Cookie header
 */
export function createSession(
  userId: string,
  jwtSecret: string,
  cookieDomain: string,
  isProduction: boolean = false
): SessionResult {
  const token = generateToken(userId, jwtSecret);

  // Build cookie attributes
  const attributes = [
    `auth_token=${token}`,
    `Max-Age=${COOKIE_MAX_AGE}`,
    'Path=/',
    'HttpOnly',
  ];

  if (isProduction) {
    // Production: use domain, SameSite=Lax, and Secure
    attributes.push(`Domain=${cookieDomain}`);
    attributes.push('SameSite=Lax');
    attributes.push('Secure');
  } else {
    // Development: no domain (host-only), SameSite=None for cross-origin
    // SameSite=None normally requires Secure, but browsers allow it for localhost
    attributes.push('SameSite=None');
    attributes.push('Secure');
  }

  const cookie = attributes.join('; ');

  return { token, cookie };
}

/**
 * Destroy a user session
 * Factory function that generates cookie header to clear session
 *
 * @param cookieDomain - Domain for cookie (must match creation domain)
 * @param isProduction - Whether app is running in production
 * @returns Set-Cookie header that clears the auth token
 */
export function destroySession(cookieDomain: string, isProduction: boolean = false): string {
  const attributes = [
    'auth_token=',
    'Max-Age=0',
    'Path=/',
    'HttpOnly',
  ];

  if (isProduction) {
    // Production: use domain, SameSite=Lax, and Secure
    attributes.push(`Domain=${cookieDomain}`);
    attributes.push('SameSite=Lax');
    attributes.push('Secure');
  } else {
    // Development: no domain (host-only), SameSite=None for cross-origin
    attributes.push('SameSite=None');
    attributes.push('Secure');
  }

  return attributes.join('; ');
}
