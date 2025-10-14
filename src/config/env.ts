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
