/**
 * TypeScript interfaces for password reset feature
 * Feature: 915-password-reset-flow-with-email-token-verification
 *
 * All interfaces use camelCase (application layer)
 * Database uses snake_case - postgres package handles mapping
 */

/**
 * Password reset token entity (from database)
 */
export interface PasswordResetToken {
  id: string;
  profileId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

/**
 * Rate limit tracking entity (from database)
 */
export interface PasswordResetRateLimit {
  id: string;
  email: string;
  requestedAt: Date;
}

/**
 * Request to initiate password reset (API request)
 */
export interface ForgotPasswordRequest {
  email: string;
}

/**
 * Response for forgot password request (API response)
 */
export interface ForgotPasswordResponse {
  message: string;
}

/**
 * Request to reset password with token (API request)
 */
export interface ResetPasswordRequest {
  token: string; // Original token (not hashed)
  password: string;
}

/**
 * Response for reset password request (API response)
 */
export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

/**
 * Token validation result
 */
export interface TokenValidationResult {
  valid: boolean;
  profileId?: string; // Included if valid
  email?: string; // Included if valid (for display)
  error?: 'expired' | 'used' | 'not_found' | 'invalid';
}

/**
 * Verification response for GET /api/auth/verify-reset-token/:token
 */
export interface VerifyTokenResponse {
  valid: boolean;
  email?: string; // Only included if valid
}
