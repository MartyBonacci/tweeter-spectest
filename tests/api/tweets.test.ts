/**
 * Tweet API Client Tests
 * Feature: 909-user-profile-tweets-feed
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fetchTweetsByUsername } from '../../app/api/tweets';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('fetchTweetsByUsername', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch and return tweets for a given username', async () => {
    const mockTweets = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        content: 'Test tweet 1',
        createdAt: new Date('2025-10-15T10:00:00Z'),
        author: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          username: 'testuser',
        },
        likeCount: 5,
        isLikedByUser: true,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        content: 'Test tweet 2',
        createdAt: new Date('2025-10-14T09:00:00Z'),
        author: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          username: 'testuser',
        },
        likeCount: 3,
        isLikedByUser: false,
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ tweets: mockTweets }),
    });

    const result = await fetchTweetsByUsername('testuser');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/tweets/user/testuser',
      { credentials: 'include' }
    );
    expect(result).toHaveLength(2);
    expect(result[0].content).toBe('Test tweet 1');
    expect(result[1].content).toBe('Test tweet 2');
  });

  it('should return empty array when user has no tweets (404)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    const result = await fetchTweetsByUsername('emptyuser');

    expect(result).toEqual([]);
  });

  it('should throw error on server error (500)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(fetchTweetsByUsername('testuser')).rejects.toThrow(
      'Failed to fetch tweets: Internal Server Error'
    );
  });

  it('should throw error on network failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(fetchTweetsByUsername('testuser')).rejects.toThrow('Network error');
  });

  it('should validate response with Zod schema and throw on invalid data', async () => {
    // Invalid data - missing required fields
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        tweets: [
          {
            id: 'invalid-id', // Not a UUID
            content: 'Test',
            // Missing other required fields
          },
        ],
      }),
    });

    await expect(fetchTweetsByUsername('testuser')).rejects.toThrow();
  });

  it('should coerce date strings to Date objects', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        tweets: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            content: 'Test tweet',
            createdAt: '2025-10-15T10:00:00Z', // String instead of Date
            author: {
              id: '550e8400-e29b-41d4-a716-446655440001',
              username: 'testuser',
            },
            likeCount: 0,
            isLikedByUser: false,
          },
        ],
      }),
    });

    const result = await fetchTweetsByUsername('testuser');

    expect(result[0].createdAt).toBeInstanceOf(Date);
  });

  it('should include credentials for authentication', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ tweets: [] }),
    });

    await fetchTweetsByUsername('testuser');

    const callArgs = mockFetch.mock.calls[0];
    expect(callArgs[1]).toEqual({ credentials: 'include' });
  });
});
