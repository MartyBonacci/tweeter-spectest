import { z } from 'zod';

/**
 * Environment variable schema validation
 */
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  COOKIE_DOMAIN: z.string().min(1),
  PORT: z.string().transform(Number).pipe(z.number().int().positive()).default('3000'),
  // Mailgun configuration for password reset emails
  MAILGUN_API_KEY: z.string().min(1, 'MAILGUN_API_KEY is required'),
  MAILGUN_DOMAIN: z.string().min(1, 'MAILGUN_DOMAIN is required'),
  MAILGUN_FROM_EMAIL: z.string().email('MAILGUN_FROM_EMAIL must be valid email').default('noreply@tweeter.com'),
  MAILGUN_FROM_NAME: z.string().default('Tweeter'),
  // Application base URL for email links
  APP_BASE_URL: z.string().url('APP_BASE_URL must be valid URL').default('http://localhost:5173'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Load and validate environment variables
 * @throws {ZodError} If environment variables are invalid or missing
 */
export function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.format());
    throw new Error('Environment validation failed');
  }

  return result.data;
}

/**
 * Get validated environment variables
 * Memoized to avoid repeated validation
 */
let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (!cachedEnv) {
    cachedEnv = loadEnv();
  }
  return cachedEnv;
}
