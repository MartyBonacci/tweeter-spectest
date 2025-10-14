import { hash, verify } from '@node-rs/argon2';

/**
 * Argon2 configuration
 * Using recommended work factors for security vs performance balance
 */
const ARGON2_OPTIONS = {
  memoryCost: 19456, // 19 MiB
  timeCost: 2,       // 2 iterations
  parallelism: 1,    // 1 thread
};

/**
 * Hash a password using Argon2id
 * Pure function with no side effects
 *
 * @param password - Plain text password to hash
 * @returns Promise resolving to Argon2 hash string
 * @throws {Error} If hashing fails
 */
export async function hashPassword(password: string): Promise<string> {
  return await hash(password, ARGON2_OPTIONS);
}

/**
 * Verify a password against its hash using Argon2id
 * Pure function with timing-safe comparison
 *
 * @param hash - Argon2 hash string from database
 * @param password - Plain text password to verify
 * @returns Promise resolving to true if password matches, false otherwise
 */
export async function verifyPassword(
  hash: string,
  password: string
): Promise<boolean> {
  try {
    return await verify(hash, password);
  } catch {
    // Invalid hash format or verification error
    return false;
  }
}
