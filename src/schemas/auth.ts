import { z } from 'zod';

/**
 * Username validation rules
 * - 3-20 characters
 * - Alphanumeric, hyphen, and underscore only
 * - No spaces
 */
const usernameRegex = /^[a-zA-Z0-9_-]+$/;

export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be at most 20 characters')
  .regex(usernameRegex, 'Username can only contain letters, numbers, hyphens, and underscores');

/**
 * Email validation
 * Uses Zod's built-in email validation
 */
export const emailSchema = z
  .string()
  .email('Invalid email address');

/**
 * Password validation rules
 * - Minimum 8 characters for signup
 * - Minimum 1 character for signin (just to ensure not empty)
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters');

export const signinPasswordSchema = z
  .string()
  .min(1, 'Password is required');

/**
 * Signup request schema
 * Validates new user registration data
 */
export const signupSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export type SignupData = z.infer<typeof signupSchema>;

/**
 * Signin request schema
 * Validates existing user login data
 */
export const signinSchema = z.object({
  email: emailSchema,
  password: signinPasswordSchema,
});

export type SigninData = z.infer<typeof signinSchema>;

/**
 * Public user schema
 * Safe user data for API responses (no sensitive fields)
 */
export const publicUserSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  email: z.string().email(),
  createdAt: z.date(),
});

export type PublicUser = z.infer<typeof publicUserSchema>;

/**
 * Authentication response schema
 * Returned after successful signup or signin
 */
export const authResponseSchema = z.object({
  user: publicUserSchema,
});

export type AuthResponse = z.infer<typeof authResponseSchema>;

/**
 * Error response schema
 * Consistent error format for all API endpoints
 */
export const errorResponseSchema = z.object({
  error: z.string(),
  field: z.string().optional(),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;
