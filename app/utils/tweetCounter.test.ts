/**
 * Tweet Character Counter Helper Functions Tests
 * Feature: 908-tweet-character-counter
 *
 * Unit tests for pure helper functions using Vitest.
 * Tests cover all edge cases and threshold boundaries.
 */

import { describe, it, expect } from 'vitest';
import {
  getColorState,
  formatCounter,
  isSubmitAllowed,
  MAX_TWEET_LENGTH,
  WARNING_THRESHOLD,
  type CounterColorState,
} from './tweetCounter';

describe('tweetCounter helper functions', () => {
  describe('getColorState', () => {
    it('should return "default" for 0 characters', () => {
      const result = getColorState(0, 140);
      expect(result).toBe('default');
    });

    it('should return "default" for counts under 120', () => {
      expect(getColorState(1, 140)).toBe('default');
      expect(getColorState(50, 140)).toBe('default');
      expect(getColorState(100, 140)).toBe('default');
      expect(getColorState(119, 140)).toBe('default');
    });

    it('should return "warning" for exactly 120 characters', () => {
      const result = getColorState(120, 140);
      expect(result).toBe('warning');
    });

    it('should return "warning" for counts between 120-139', () => {
      expect(getColorState(121, 140)).toBe('warning');
      expect(getColorState(130, 140)).toBe('warning');
      expect(getColorState(135, 140)).toBe('warning');
      expect(getColorState(139, 140)).toBe('warning');
    });

    it('should return "exceeded" for exactly 140 characters', () => {
      const result = getColorState(140, 140);
      expect(result).toBe('exceeded');
    });

    it('should return "exceeded" for counts over 140', () => {
      expect(getColorState(141, 140)).toBe('exceeded');
      expect(getColorState(150, 140)).toBe('exceeded');
      expect(getColorState(200, 140)).toBe('exceeded');
      expect(getColorState(999, 140)).toBe('exceeded');
    });

    it('should handle different maxLength values', () => {
      expect(getColorState(50, 100)).toBe('default');
      expect(getColorState(80, 100)).toBe('warning'); // 100 - 20 = 80
      expect(getColorState(100, 100)).toBe('exceeded');
    });

    it('should return consistent type', () => {
      const result: CounterColorState = getColorState(50, 140);
      expect(typeof result).toBe('string');
      expect(['default', 'warning', 'exceeded']).toContain(result);
    });
  });

  describe('formatCounter', () => {
    it('should format 0 characters correctly', () => {
      const result = formatCounter(0, 140);
      expect(result).toBe('0 / 140');
    });

    it('should format counts under 140 correctly', () => {
      expect(formatCounter(5, 140)).toBe('5 / 140');
      expect(formatCounter(50, 140)).toBe('50 / 140');
      expect(formatCounter(100, 140)).toBe('100 / 140');
      expect(formatCounter(120, 140)).toBe('120 / 140');
    });

    it('should format exactly 140 characters correctly', () => {
      const result = formatCounter(140, 140);
      expect(result).toBe('140 / 140');
    });

    it('should format counts over 140 correctly', () => {
      expect(formatCounter(141, 140)).toBe('141 / 140');
      expect(formatCounter(150, 140)).toBe('150 / 140');
      expect(formatCounter(200, 140)).toBe('200 / 140');
    });

    it('should handle different maxLength values', () => {
      expect(formatCounter(50, 100)).toBe('50 / 100');
      expect(formatCounter(75, 200)).toBe('75 / 200');
    });

    it('should return a string', () => {
      const result = formatCounter(50, 140);
      expect(typeof result).toBe('string');
    });

    it('should always contain " / " separator', () => {
      expect(formatCounter(0, 140)).toContain(' / ');
      expect(formatCounter(50, 140)).toContain(' / ');
      expect(formatCounter(140, 140)).toContain(' / ');
      expect(formatCounter(200, 140)).toContain(' / ');
    });
  });

  describe('isSubmitAllowed', () => {
    it('should return true for counts under the limit', () => {
      expect(isSubmitAllowed(0, 140)).toBe(true);
      expect(isSubmitAllowed(50, 140)).toBe(true);
      expect(isSubmitAllowed(100, 140)).toBe(true);
      expect(isSubmitAllowed(120, 140)).toBe(true);
      expect(isSubmitAllowed(139, 140)).toBe(true);
    });

    it('should return true for exactly the limit', () => {
      const result = isSubmitAllowed(140, 140);
      expect(result).toBe(true);
    });

    it('should return false for counts over the limit', () => {
      expect(isSubmitAllowed(141, 140)).toBe(false);
      expect(isSubmitAllowed(150, 140)).toBe(false);
      expect(isSubmitAllowed(200, 140)).toBe(false);
      expect(isSubmitAllowed(999, 140)).toBe(false);
    });

    it('should handle different maxLength values', () => {
      expect(isSubmitAllowed(100, 100)).toBe(true);
      expect(isSubmitAllowed(101, 100)).toBe(false);
      expect(isSubmitAllowed(200, 200)).toBe(true);
      expect(isSubmitAllowed(201, 200)).toBe(false);
    });

    it('should return a boolean', () => {
      const result = isSubmitAllowed(50, 140);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Constants', () => {
    it('should export MAX_TWEET_LENGTH constant', () => {
      expect(MAX_TWEET_LENGTH).toBe(140);
      expect(typeof MAX_TWEET_LENGTH).toBe('number');
    });

    it('should export WARNING_THRESHOLD constant', () => {
      expect(WARNING_THRESHOLD).toBe(120);
      expect(typeof WARNING_THRESHOLD).toBe('number');
    });

    it('should have WARNING_THRESHOLD 20 less than MAX_TWEET_LENGTH', () => {
      expect(WARNING_THRESHOLD).toBe(MAX_TWEET_LENGTH - 20);
    });
  });

  describe('Integration: Functions work together correctly', () => {
    it('should have consistent behavior at 120-char threshold', () => {
      const count = 120;
      const state = getColorState(count, MAX_TWEET_LENGTH);
      const formatted = formatCounter(count, MAX_TWEET_LENGTH);
      const allowed = isSubmitAllowed(count, MAX_TWEET_LENGTH);

      expect(state).toBe('warning');
      expect(formatted).toBe('120 / 140');
      expect(allowed).toBe(true); // 120 is still allowed
    });

    it('should have consistent behavior at 140-char threshold', () => {
      const count = 140;
      const state = getColorState(count, MAX_TWEET_LENGTH);
      const formatted = formatCounter(count, MAX_TWEET_LENGTH);
      const allowed = isSubmitAllowed(count, MAX_TWEET_LENGTH);

      expect(state).toBe('exceeded');
      expect(formatted).toBe('140 / 140');
      expect(allowed).toBe(true); // Exactly 140 is still allowed
    });

    it('should have consistent behavior at 141-char threshold', () => {
      const count = 141;
      const state = getColorState(count, MAX_TWEET_LENGTH);
      const formatted = formatCounter(count, MAX_TWEET_LENGTH);
      const allowed = isSubmitAllowed(count, MAX_TWEET_LENGTH);

      expect(state).toBe('exceeded');
      expect(formatted).toBe('141 / 140');
      expect(allowed).toBe(false); // Over limit, not allowed
    });

    it('should handle typical user journey from 0 to over limit', () => {
      // Start: Empty tweet
      expect(getColorState(0, 140)).toBe('default');
      expect(formatCounter(0, 140)).toBe('0 / 140');
      expect(isSubmitAllowed(0, 140)).toBe(true);

      // Middle: Normal tweet
      expect(getColorState(50, 140)).toBe('default');
      expect(formatCounter(50, 140)).toBe('50 / 140');
      expect(isSubmitAllowed(50, 140)).toBe(true);

      // Approaching limit: Warning
      expect(getColorState(120, 140)).toBe('warning');
      expect(formatCounter(120, 140)).toBe('120 / 140');
      expect(isSubmitAllowed(120, 140)).toBe(true);

      // At limit: Exceeded but still valid
      expect(getColorState(140, 140)).toBe('exceeded');
      expect(formatCounter(140, 140)).toBe('140 / 140');
      expect(isSubmitAllowed(140, 140)).toBe(true);

      // Over limit: Invalid
      expect(getColorState(141, 140)).toBe('exceeded');
      expect(formatCounter(141, 140)).toBe('141 / 140');
      expect(isSubmitAllowed(141, 140)).toBe(false);
    });
  });
});
