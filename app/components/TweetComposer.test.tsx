/**
 * TweetComposer Component Tests
 * Feature: 908-tweet-character-counter
 *
 * Tests for the enhanced TweetComposer with character counter.
 * Covers counter display, color states, submission prevention, and accessibility.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { TweetComposer } from './TweetComposer';

// Mock React Router hooks
vi.mock('react-router', () => ({
  Form: ({ children, ...props }: any) => <form {...props}>{children}</form>,
  useActionData: () => undefined,
  useNavigation: () => ({ state: 'idle' }),
}));

describe('TweetComposer', () => {
  describe('Initial Render', () => {
    it('should render with "0 / 140" counter initially', () => {
      render(<TweetComposer />);

      const counter = screen.getByText('0 / 140');
      expect(counter).toBeInTheDocument();
    });

    it('should have default gray color initially', () => {
      render(<TweetComposer />);

      const counter = screen.getByText('0 / 140');
      expect(counter).toHaveClass('text-gray-600');
    });

    it('should have submit button disabled when empty', () => {
      render(<TweetComposer />);

      const button = screen.getByRole('button', { name: /post tweet/i });
      expect(button).toBeDisabled();
    });
  });

  describe('Counter Updates', () => {
    it('should update counter as user types', async () => {
      const user = userEvent.setup();
      render(<TweetComposer />);

      const textarea = screen.getByRole('textbox', { name: /compose tweet/i });

      await user.type(textarea, 'Hello');

      expect(screen.getByText('5 / 140')).toBeInTheDocument();
    });

    it('should update counter for different character counts', async () => {
      const user = userEvent.setup();
      render(<TweetComposer />);

      const textarea = screen.getByRole('textbox', { name: /compose tweet/i });

      // Type different amounts
      await user.type(textarea, 'A'.repeat(50));
      expect(screen.getByText('50 / 140')).toBeInTheDocument();
    });

    it('should handle rapid typing correctly', async () => {
      const user = userEvent.setup();
      render(<TweetComposer />);

      const textarea = screen.getByRole('textbox', { name: /compose tweet/i });

      await user.type(textarea, 'Testing rapid typing');

      const counter = screen.getByText('20 / 140');
      expect(counter).toBeInTheDocument();
    });
  });

  describe('Color States', () => {
    it('should show default gray color for counts under 120', async () => {
      const user = userEvent.setup();
      render(<TweetComposer />);

      const textarea = screen.getByRole('textbox', { name: /compose tweet/i });

      await user.type(textarea, 'A'.repeat(50));

      const counter = screen.getByText('50 / 140');
      expect(counter).toHaveClass('text-gray-600');
      expect(counter).not.toHaveClass('text-yellow-400');
      expect(counter).not.toHaveClass('text-red-600');
    });

    it('should show warning yellow color at exactly 120 characters', async () => {
      const user = userEvent.setup();
      render(<TweetComposer />);

      const textarea = screen.getByRole('textbox', { name: /compose tweet/i });

      await user.type(textarea, 'A'.repeat(120));

      const counter = screen.getByText('120 / 140');
      expect(counter).toHaveClass('text-yellow-400');
      expect(counter).not.toHaveClass('text-gray-600');
      expect(counter).not.toHaveClass('text-red-600');
    });

    it('should show warning yellow color between 120-139 characters', async () => {
      const user = userEvent.setup();
      render(<TweetComposer />);

      const textarea = screen.getByRole('textbox', { name: /compose tweet/i });

      await user.type(textarea, 'A'.repeat(135));

      const counter = screen.getByText('135 / 140');
      expect(counter).toHaveClass('text-yellow-400');
    });

    it('should show exceeded red color at exactly 140 characters', async () => {
      const user = userEvent.setup();
      render(<TweetComposer />);

      const textarea = screen.getByRole('textbox', { name: /compose tweet/i });

      await user.type(textarea, 'A'.repeat(140));

      const counter = screen.getByText('140 / 140');
      expect(counter).toHaveClass('text-red-600');
      expect(counter).not.toHaveClass('text-gray-600');
      expect(counter).not.toHaveClass('text-yellow-400');
    });

    it('should show exceeded red color over 140 characters', async () => {
      const user = userEvent.setup();
      render(<TweetComposer />);

      const textarea = screen.getByRole('textbox', { name: /compose tweet/i });

      await user.type(textarea, 'A'.repeat(150));

      const counter = screen.getByText('150 / 140');
      expect(counter).toHaveClass('text-red-600');
    });

    it('should have smooth transition class', () => {
      render(<TweetComposer />);

      const counter = screen.getByText('0 / 140');
      expect(counter).toHaveClass('transition-colors');
      expect(counter).toHaveClass('duration-200');
    });
  });

  describe('Submit Button State', () => {
    it('should enable button when content is valid (not empty, <= 140)', async () => {
      const user = userEvent.setup();
      render(<TweetComposer />);

      const textarea = screen.getByRole('textbox', { name: /compose tweet/i });
      const button = screen.getByRole('button', { name: /post tweet/i });

      await user.type(textarea, 'Valid tweet content');

      expect(button).not.toBeDisabled();
    });

    it('should disable button when count exceeds 140', async () => {
      const user = userEvent.setup();
      render(<TweetComposer />);

      const textarea = screen.getByRole('textbox', { name: /compose tweet/i });
      const button = screen.getByRole('button', { name: /post tweet/i });

      await user.type(textarea, 'A'.repeat(141));

      expect(button).toBeDisabled();
    });

    it('should re-enable button when edited back to <= 140', async () => {
      const user = userEvent.setup();
      render(<TweetComposer />);

      const textarea = screen.getByRole('textbox', { name: /compose tweet/i });
      const button = screen.getByRole('button', { name: /post tweet/i });

      // Type over limit
      await user.type(textarea, 'A'.repeat(141));
      expect(button).toBeDisabled();

      // Delete one character
      await user.clear(textarea);
      await user.type(textarea, 'A'.repeat(140));

      expect(button).not.toBeDisabled();
    });

    it('should keep button disabled when empty', async () => {
      const user = userEvent.setup();
      render(<TweetComposer />);

      const textarea = screen.getByRole('textbox', { name: /compose tweet/i });
      const button = screen.getByRole('button', { name: /post tweet/i });

      // Type and then clear
      await user.type(textarea, 'Test');
      await user.clear(textarea);

      expect(button).toBeDisabled();
    });

    it('should be enabled at exactly 140 characters', async () => {
      const user = userEvent.setup();
      render(<TweetComposer />);

      const textarea = screen.getByRole('textbox', { name: /compose tweet/i });
      const button = screen.getByRole('button', { name: /post tweet/i });

      await user.type(textarea, 'A'.repeat(140));

      // 140 is the limit, still valid
      expect(button).not.toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-live="polite" on counter', () => {
      render(<TweetComposer />);

      const counter = screen.getByText('0 / 140');
      expect(counter).toHaveAttribute('aria-live', 'polite');
    });

    it('should have role="status" on counter', () => {
      render(<TweetComposer />);

      const counter = screen.getByText('0 / 140');
      expect(counter).toHaveAttribute('role', 'status');
    });

    it('should have aria-label with character count', () => {
      render(<TweetComposer />);

      const counter = screen.getByText('0 / 140');
      expect(counter).toHaveAttribute('aria-label', 'Character count: 0 / 140');
    });

    it('should update aria-label when count changes', async () => {
      const user = userEvent.setup();
      render(<TweetComposer />);

      const textarea = screen.getByRole('textbox', { name: /compose tweet/i });

      await user.type(textarea, 'Hello');

      const counter = screen.getByText('5 / 140');
      expect(counter).toHaveAttribute('aria-label', 'Character count: 5 / 140');
    });

    it('should have disabled attribute on button when invalid', async () => {
      const user = userEvent.setup();
      render(<TweetComposer />);

      const textarea = screen.getByRole('textbox', { name: /compose tweet/i });
      const button = screen.getByRole('button', { name: /post tweet/i });

      await user.type(textarea, 'A'.repeat(141));

      expect(button).toHaveAttribute('disabled');
    });
  });

  describe('Edge Cases', () => {
    it('should handle exactly 119 characters (threshold before warning)', async () => {
      const user = userEvent.setup();
      render(<TweetComposer />);

      const textarea = screen.getByRole('textbox', { name: /compose tweet/i });

      await user.type(textarea, 'A'.repeat(119));

      const counter = screen.getByText('119 / 140');
      expect(counter).toHaveClass('text-gray-600'); // Still default
    });

    it('should handle exactly 139 characters (threshold before exceeded)', async () => {
      const user = userEvent.setup();
      render(<TweetComposer />);

      const textarea = screen.getByRole('textbox', { name: /compose tweet/i });

      await user.type(textarea, 'A'.repeat(139));

      const counter = screen.getByText('139 / 140');
      expect(counter).toHaveClass('text-yellow-400'); // Warning
    });

    it('should handle very long text (200+ characters)', async () => {
      const user = userEvent.setup();
      render(<TweetComposer />);

      const textarea = screen.getByRole('textbox', { name: /compose tweet/i });

      await user.type(textarea, 'A'.repeat(200));

      const counter = screen.getByText('200 / 140');
      expect(counter).toHaveClass('text-red-600');

      const button = screen.getByRole('button', { name: /post tweet/i });
      expect(button).toBeDisabled();
    });

    it('should handle whitespace-only content', async () => {
      const user = userEvent.setup();
      render(<TweetComposer />);

      const textarea = screen.getByRole('textbox', { name: /compose tweet/i });
      const button = screen.getByRole('button', { name: /post tweet/i });

      await user.type(textarea, '     '); // Only spaces

      // Counter should show character count
      expect(screen.getByText('5 / 140')).toBeInTheDocument();

      // But button should be disabled (trimmed content is empty)
      expect(button).toBeDisabled();
    });
  });

  describe('Integration', () => {
    it('should maintain consistent state through user journey', async () => {
      const user = userEvent.setup();
      render(<TweetComposer />);

      const textarea = screen.getByRole('textbox', { name: /compose tweet/i });
      const button = screen.getByRole('button', { name: /post tweet/i });

      // Start: 0 chars, gray, disabled
      expect(screen.getByText('0 / 140')).toHaveClass('text-gray-600');
      expect(button).toBeDisabled();

      // Type 50 chars: gray, enabled
      await user.type(textarea, 'A'.repeat(50));
      expect(screen.getByText('50 / 140')).toHaveClass('text-gray-600');
      expect(button).not.toBeDisabled();

      // Type to 120: yellow, enabled
      await user.clear(textarea);
      await user.type(textarea, 'A'.repeat(120));
      expect(screen.getByText('120 / 140')).toHaveClass('text-yellow-400');
      expect(button).not.toBeDisabled();

      // Type to 140: red, enabled
      await user.clear(textarea);
      await user.type(textarea, 'A'.repeat(140));
      expect(screen.getByText('140 / 140')).toHaveClass('text-red-600');
      expect(button).not.toBeDisabled();

      // Type to 141: red, disabled
      await user.clear(textarea);
      await user.type(textarea, 'A'.repeat(141));
      expect(screen.getByText('141 / 140')).toHaveClass('text-red-600');
      expect(button).toBeDisabled();
    });
  });
});
