/**
 * API Base URL Helper
 * Feature: 913-server-side-loader-fetch-failure
 *
 * Provides environment-aware API base URL for fetch calls.
 * Solves the problem where relative URLs work client-side (Vite proxy)
 * but fail server-side (Node.js SSR requires absolute URLs).
 */

/**
 * Get the API base URL based on execution context
 *
 * Server-side (Node.js SSR):
 *   - Development: http://localhost:3000
 *   - Production: process.env.API_BASE_URL or fallback
 *
 * Client-side (Browser):
 *   - Always returns empty string (uses relative URLs + Vite proxy)
 *
 * @returns API base URL string (empty for client-side)
 */
export function getApiBaseUrl(): string {
  // Client-side: Use relative URLs (Vite proxy handles routing)
  if (typeof window !== 'undefined') {
    return '';
  }

  // Server-side: Use absolute URL to backend
  // Production: Use environment variable
  // Development: Use localhost:3000
  return process.env.API_BASE_URL || 'http://localhost:3000';
}

/**
 * Create full API URL for fetch calls
 *
 * Automatically detects environment and returns correct URL format:
 * - Server-side: Absolute URL (e.g., 'http://localhost:3000/api/tweets')
 * - Client-side: Relative URL (e.g., '/api/tweets')
 *
 * @param path - API path (must start with /, e.g., '/api/auth/me')
 * @returns Full URL for fetch
 *
 * @example
 * ```typescript
 * // Server-side loader
 * const url = getApiUrl('/api/auth/me');
 * // Returns: 'http://localhost:3000/api/auth/me'
 *
 * // Client-side code
 * const url = getApiUrl('/api/tweets');
 * // Returns: '/api/tweets' (Vite proxy handles routing)
 * ```
 */
export function getApiUrl(path: string): string {
  const base = getApiBaseUrl();
  return `${base}${path}`;
}
