import jwt from 'jsonwebtoken';

/**
 * JWT payload structure
 */
export interface JwtPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

/**
 * JWT expiration time (30 days)
 */
const JWT_EXPIRES_IN = '30d';

/**
 * Generate a JWT token for a user
 * Pure function with no side effects
 *
 * @param userId - User's UUID
 * @param jwtSecret - Secret key for signing the token
 * @returns JWT token string
 */
export function generateToken(userId: string, jwtSecret: string): string {
  const payload: JwtPayload = { userId };

  return jwt.sign(payload, jwtSecret, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verify and decode a JWT token
 * Pure function with no side effects
 *
 * @param token - JWT token string to verify
 * @param jwtSecret - Secret key used to sign the token
 * @returns Decoded payload if valid, null if invalid or expired
 */
export function verifyToken(
  token: string,
  jwtSecret: string
): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    return decoded;
  } catch {
    // Invalid token, expired, or signature mismatch
    return null;
  }
}
