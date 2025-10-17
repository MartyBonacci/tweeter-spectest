/**
 * Zod validation schemas for password reset feature
 * Feature: 915-password-reset-flow-with-email-token-verification
 *
 * Used on both frontend (UX) and backend (security)
 */

import { z } from 'zod';

/**
 * Schema for forgot password request
 * Validates email format and normalizes to lowercase
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .toLowerCase()
    .trim()
    .max(255, 'Email too long'),
});

/**
 * Schema for reset password request
 * Validates token format and password strength
 */
export const resetPasswordSchema = z.object({
  token: z.string().uuid('Invalid token format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

/**
 * Schema for token validation response
 */
export const tokenValidationSchema = z.object({
  valid: z.boolean(),
  email: z.string().email().optional(),
});

/**
 * Schema for forgot password response
 */
export const forgotPasswordResponseSchema = z.object({
  message: z.string(),
});

/**
 * Schema for reset password response
 */
export const resetPasswordResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

/**
 * Type inference from schemas (for TypeScript)
 */
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type TokenValidationOutput = z.infer<typeof tokenValidationSchema>;
