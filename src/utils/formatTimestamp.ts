/**
 * Timestamp Formatting Utilities
 * Feature: 002-tweet-posting-and-feed-system
 *
 * Pure functions for formatting timestamps
 */

/**
 * Format timestamp as relative time (recent) or absolute date (older)
 *
 * @param date - Date to format
 * @returns Formatted string ("2 minutes ago", "3 hours ago", or "Jan 15, 2025")
 */
export function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  // Recent tweets (< 1 day): Relative format
  if (diffDays < 1) {
    if (diffSeconds < 60) {
      return diffSeconds === 1 ? '1 second ago' : `${diffSeconds} seconds ago`;
    }
    if (diffMinutes < 60) {
      return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
    }
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  }

  // Older tweets (>= 1 day): Absolute format
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  return date.toLocaleDateString('en-US', options);
}

/**
 * Format timestamp as full date and time
 * Used for tooltips/title attributes
 *
 * @param date - Date to format
 * @returns Formatted string ("January 15, 2025 at 3:45 PM")
 */
export function formatTimestampFull(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  };

  return date.toLocaleDateString('en-US', options);
}
