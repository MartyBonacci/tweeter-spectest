/**
 * Empty State Tests
 * Feature: 909-user-profile-tweets-feed
 * Tests the empty state display when a user has no tweets
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Profile from '../../app/pages/Profile';
import { MemoryRouter } from 'react-router';

// Mock useLoaderData and useNavigation
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useLoaderData: vi.fn(),
    useNavigation: vi.fn(() => ({ state: 'idle' })),
  };
});

import { useLoaderData, useNavigation } from 'react-router';

describe('Profile Empty State - Feature 909', () => {
  const mockProfile = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    username: 'testuser',
    email: 'test@example.com',
    bio: 'Test bio',
    avatarUrl: null,
    tweetCount: 0,
  };

  it('should render empty state when user has no tweets', () => {
    vi.mocked(useLoaderData).mockReturnValue({
      profile: mockProfile,
      isOwnProfile: false,
      currentUserId: 'different-user-id',
      tweets: [],
    });

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    // Should display "No tweets yet" heading
    expect(screen.getByText('No tweets yet')).toBeInTheDocument();
  });

  it('should show personalized message for own profile with no tweets', () => {
    vi.mocked(useLoaderData).mockReturnValue({
      profile: mockProfile,
      isOwnProfile: true,
      currentUserId: mockProfile.id,
      tweets: [],
    });

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    // Should display encouragement message for own profile
    expect(
      screen.getByText(/You haven't posted any tweets yet/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Share your first thought with the world!/i)
    ).toBeInTheDocument();
  });

  it('should show username-specific message for other users with no tweets', () => {
    vi.mocked(useLoaderData).mockReturnValue({
      profile: mockProfile,
      isOwnProfile: false,
      currentUserId: 'different-user-id',
      tweets: [],
    });

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    // Should display username in message
    expect(
      screen.getByText(/@testuser hasn't posted any tweets yet/i)
    ).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    vi.mocked(useLoaderData).mockReturnValue({
      profile: mockProfile,
      isOwnProfile: false,
      currentUserId: null,
      tweets: [],
    });

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    // Empty state should have role="status" for screen readers
    const emptyState = screen.getByRole('status');
    expect(emptyState).toBeInTheDocument();
    expect(emptyState).toHaveAttribute('aria-live', 'polite');
  });

  it('should display decorative icon with proper accessibility', () => {
    vi.mocked(useLoaderData).mockReturnValue({
      profile: mockProfile,
      isOwnProfile: false,
      currentUserId: null,
      tweets: [],
    });

    const { container } = render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    // Icon should be present but hidden from screen readers
    const icon = container.querySelector('svg[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
  });

  // Note: Tests for tweet rendering and loading states are covered
  // in integration tests. These empty state tests focus specifically
  // on the empty state UI and messaging.
});
