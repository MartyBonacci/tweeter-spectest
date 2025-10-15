/**
 * Profile Page Loader Tests
 * Feature: 909-user-profile-tweets-feed
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loader } from '../../app/pages/Profile';
import * as tweetsApi from '../../app/api/tweets';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

// Mock the tweets API module
vi.mock('../../app/api/tweets', () => ({
  fetchTweetsByUsername: vi.fn(),
}));

describe('Profile Loader - Feature 909', () => {
  const mockUsername = 'testuser';
  const mockCookie = 'auth_token=test-jwt';

  beforeEach(() => {
    mockFetch.mockClear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch profile data and tweets together', async () => {
    const mockProfile = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      username: mockUsername,
      email: 'test@example.com',
      bio: 'Test bio',
      avatarUrl: 'https://example.com/avatar.jpg',
      tweetCount: 2,
    };

    const mockTweets = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        content: 'First tweet',
        createdAt: new Date('2025-10-15T10:00:00Z'),
        author: {
          id: mockProfile.id,
          username: mockUsername,
        },
        likeCount: 5,
        isLikedByUser: true,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        content: 'Second tweet',
        createdAt: new Date('2025-10-14T09:00:00Z'),
        author: {
          id: mockProfile.id,
          username: mockUsername,
        },
        likeCount: 3,
        isLikedByUser: false,
      },
    ];

    // Mock profile fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ profile: mockProfile }),
    });

    // Mock /api/auth/me fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        user: { id: mockProfile.id },
      }),
    });

    // Mock tweets fetch
    vi.mocked(tweetsApi.fetchTweetsByUsername).mockResolvedValueOnce(mockTweets);

    const request = new Request(`http://localhost:3000/profile/${mockUsername}`, {
      headers: { Cookie: mockCookie },
    });

    const result = await loader({
      request,
      params: { username: mockUsername },
      context: {},
    });

    // Verify loader returns both profile and tweets
    expect(result).toHaveProperty('profile');
    expect(result).toHaveProperty('tweets');
    expect(result.profile).toEqual(mockProfile);
    expect(result.tweets).toEqual(mockTweets);
    expect(result.tweets).toHaveLength(2);
  });

  it('should return empty tweets array when user has no tweets', async () => {
    const mockProfile = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      username: mockUsername,
      email: 'test@example.com',
      bio: null,
      avatarUrl: null,
      tweetCount: 0,
    };

    // Mock profile fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ profile: mockProfile }),
    });

    // Mock /api/auth/me fetch
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
    });

    // Mock tweets fetch returning empty array
    vi.mocked(tweetsApi.fetchTweetsByUsername).mockResolvedValueOnce([]);

    const request = new Request(`http://localhost:3000/profile/${mockUsername}`, {
      headers: { Cookie: mockCookie },
    });

    const result = await loader({
      request,
      params: { username: mockUsername },
      context: {},
    });

    expect(result.tweets).toEqual([]);
    expect(result.tweets).toHaveLength(0);
  });

  it('should set isOwnProfile to true when viewing own profile', async () => {
    const mockProfile = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      username: mockUsername,
      email: 'test@example.com',
      bio: null,
      avatarUrl: null,
      tweetCount: 0,
    };

    // Mock profile fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ profile: mockProfile }),
    });

    // Mock /api/auth/me fetch - same user ID
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        user: { id: mockProfile.id },
      }),
    });

    // Mock tweets fetch
    vi.mocked(tweetsApi.fetchTweetsByUsername).mockResolvedValueOnce([]);

    const request = new Request(`http://localhost:3000/profile/${mockUsername}`, {
      headers: { Cookie: mockCookie },
    });

    const result = await loader({
      request,
      params: { username: mockUsername },
      context: {},
    });

    expect(result.isOwnProfile).toBe(true);
    expect(result.currentUserId).toBe(mockProfile.id);
  });

  it('should set isOwnProfile to false when viewing another user profile', async () => {
    const mockProfile = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      username: mockUsername,
      email: 'test@example.com',
      bio: null,
      avatarUrl: null,
      tweetCount: 0,
    };

    const differentUserId = '550e8400-e29b-41d4-a716-446655440999';

    // Mock profile fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ profile: mockProfile }),
    });

    // Mock /api/auth/me fetch - different user ID
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        user: { id: differentUserId },
      }),
    });

    // Mock tweets fetch
    vi.mocked(tweetsApi.fetchTweetsByUsername).mockResolvedValueOnce([]);

    const request = new Request(`http://localhost:3000/profile/${mockUsername}`, {
      headers: { Cookie: mockCookie },
    });

    const result = await loader({
      request,
      params: { username: mockUsername },
      context: {},
    });

    expect(result.isOwnProfile).toBe(false);
    expect(result.currentUserId).toBe(differentUserId);
  });

  it('should throw 404 when profile not found', async () => {
    // Mock profile fetch returning 404
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const request = new Request(`http://localhost:3000/profile/nonexistent`, {
      headers: { Cookie: mockCookie },
    });

    // React Router Response objects aren't standard Error objects
    // Just verify it throws and has the right status
    try {
      await loader({
        request,
        params: { username: 'nonexistent' },
        context: {},
      });
      expect.fail('Should have thrown a Response');
    } catch (error: any) {
      expect(error.status).toBe(404);
    }
  });

  it('should throw 400 when username is missing', async () => {
    const request = new Request('http://localhost:3000/profile/', {
      headers: { Cookie: mockCookie },
    });

    // React Router Response objects aren't standard Error objects
    // Just verify it throws and has the right status
    try {
      await loader({
        request,
        params: {}, // No username
        context: {},
      });
      expect.fail('Should have thrown a Response');
    } catch (error: any) {
      expect(error.status).toBe(400);
    }
  });
});
