/**
 * Regression Test for Bug 906: Nested Anchor Tags in TweetCard Component
 *
 * Tests that TweetCard does not have nested <a> tags, which is invalid HTML
 * and causes React warnings.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import { TweetCard } from '../../app/components/TweetCard';
import type { TweetWithAuthor } from '../../src/types/tweet';

describe('Bug 906: No Nested Anchor Tags in TweetCard', () => {
  const mockTweet: TweetWithAuthor = {
    id: 'test-tweet-id',
    content: 'Test tweet content for regression test',
    createdAt: new Date('2025-01-01T12:00:00Z'),
    author: {
      username: 'testuser'
    },
    likeCount: 0
  };

  it('should not have nested anchor tags', () => {
    const { container } = render(
      <BrowserRouter>
        <TweetCard tweet={mockTweet} />
      </BrowserRouter>
    );

    // Get all anchor elements
    const anchors = container.querySelectorAll('a');

    // Check each anchor for nested anchors
    anchors.forEach((anchor) => {
      const nestedAnchors = anchor.querySelectorAll('a');
      expect(nestedAnchors.length).toBe(0); // No nested <a> tags
    });
  });

  it('should render username as a link', () => {
    render(
      <BrowserRouter>
        <TweetCard tweet={mockTweet} />
      </BrowserRouter>
    );

    // Find username link
    const usernameLink = screen.getByText('@testuser');
    expect(usernameLink).toBeDefined();
    expect(usernameLink.tagName).toBe('A');
    expect(usernameLink.getAttribute('href')).toBe('/profile/testuser');
  });

  it('should make card clickable', () => {
    const { container } = render(
      <BrowserRouter>
        <TweetCard tweet={mockTweet} />
      </BrowserRouter>
    );

    const article = container.querySelector('article');
    expect(article).toBeDefined();

    // After fix: article should have onClick or cursor-pointer
    // This ensures card is still clickable without nested links
    const hasClickHandler = article?.onclick !== null;
    const hasCursorPointer = article?.classList.contains('cursor-pointer');

    expect(hasClickHandler || hasCursorPointer).toBe(true);
  });
});
