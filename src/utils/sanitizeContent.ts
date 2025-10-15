/**
 * Content Sanitization Utilities
 * Feature: 002-tweet-posting-and-feed-system
 *
 * Pure functions for sanitizing user-generated content (XSS prevention)
 */

/**
 * HTML entity map for escaping
 */
const htmlEntityMap: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
};

/**
 * Sanitize content by escaping HTML special characters
 * Prevents XSS attacks while preserving line breaks and whitespace
 *
 * @param content - Raw user input
 * @returns Sanitized content safe for database storage
 */
export function sanitizeContent(content: string): string {
  // Trim leading/trailing whitespace
  let sanitized = content.trim();

  // Escape HTML special characters
  sanitized = sanitized.replace(/[&<>"'\/]/g, (char) => htmlEntityMap[char] || char);

  return sanitized;
}

/**
 * Additional validation: Check if content is safe
 * (Currently redundant with Zod validation, but provides defense-in-depth)
 *
 * @param content - Content to validate
 * @returns True if content is safe
 */
export function isContentSafe(content: string): boolean {
  const trimmed = content.trim();

  // Check length constraints
  if (trimmed.length === 0 || content.length > 140) {
    return false;
  }

  // Check for suspicious patterns (optional additional security)
  // This is defense-in-depth; Zod validation is primary
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers like onclick=
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(content)) {
      return false;
    }
  }

  return true;
}
