/**
 * Tweet Character Counter Helper Functions
 * Feature: 908-tweet-character-counter
 *
 * Pure functions for character counting logic, visual state determination,
 * and submission validation. All functions are side-effect free and fully testable.
 */

/**
 * Character counter visual color state enumeration
 * Used to determine CSS classes for the counter display
 */
export type CounterColorState = 'default' | 'warning' | 'exceeded';

/**
 * Maximum allowed characters for a tweet
 * Matches database VARCHAR(140) constraint and backend validation
 */
export const MAX_TWEET_LENGTH = 140;

/**
 * Character count threshold for warning state (yellow)
 * Warning appears 20 characters before limit (120 chars)
 * Provides users enough time to rethink wording before hitting hard limit
 */
export const WARNING_THRESHOLD = 120;

/**
 * Determines the visual color state based on character count thresholds
 *
 * Pure function with no side effects. Returns one of three states:
 * - 'default': 0-119 characters (neutral gray)
 * - 'warning': 120-139 characters (yellow/amber)
 * - 'exceeded': 140+ characters (red error state)
 *
 * @param count - Current character count
 * @param maxLength - Maximum allowed characters (typically 140)
 * @returns Color state: 'default', 'warning', or 'exceeded'
 *
 * @example
 * getColorState(50, 140)   // Returns 'default'
 * getColorState(120, 140)  // Returns 'warning'
 * getColorState(141, 140)  // Returns 'exceeded'
 */
export function getColorState(count: number, maxLength: number): CounterColorState {
  if (count >= maxLength) {
    return 'exceeded';
  }

  if (count >= maxLength - 20) {
    return 'warning';
  }

  return 'default';
}

/**
 * Formats the character counter display text
 *
 * Pure function that returns formatted string in "X / 140" format.
 * This format provides clear progress indicator showing both current
 * count and maximum limit simultaneously.
 *
 * @param count - Current character count
 * @param maxLength - Maximum allowed characters (typically 140)
 * @returns Formatted string in "count / maxLength" format
 *
 * @example
 * formatCounter(0, 140)    // Returns "0 / 140"
 * formatCounter(120, 140)  // Returns "120 / 140"
 * formatCounter(150, 140)  // Returns "150 / 140"
 */
export function formatCounter(count: number, maxLength: number): string {
  return `${count} / ${maxLength}`;
}

/**
 * Determines if tweet submission should be allowed based on character count
 *
 * Pure function that returns boolean indicating submission eligibility.
 * Returns true only if count is within the allowed limit (≤ maxLength).
 *
 * Note: This is a helper function. Actual submission logic should also
 * check for empty content. Server-side validation is the security boundary.
 *
 * @param count - Current character count
 * @param maxLength - Maximum allowed characters (typically 140)
 * @returns true if count <= maxLength, false otherwise
 *
 * @example
 * isSubmitAllowed(140, 140)  // Returns true
 * isSubmitAllowed(141, 140)  // Returns false
 */
export function isSubmitAllowed(count: number, maxLength: number): boolean {
  return count <= maxLength;
}
