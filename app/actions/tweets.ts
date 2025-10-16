/**
 * Tweet Actions
 * Feature: 002-tweet-posting-and-feed-system
 *
 * React Router actions for tweet operations
 */

import { redirect } from 'react-router';
import type { ActionFunctionArgs } from 'react-router';
import { getApiUrl } from '../utils/api';

/**
 * Create tweet action
 * Handles form submission from TweetComposer
 */
export async function createTweetAction({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const content = formData.get('content');

  // Validate content exists
  if (!content || typeof content !== 'string') {
    return {
      error: 'Tweet content is required',
    };
  }

  // Client-side validation (server does final validation)
  const trimmed = content.trim();
  if (trimmed.length === 0) {
    return {
      error: 'Tweet cannot be empty',
    };
  }

  if (content.length > 140) {
    return {
      error: 'Tweet cannot exceed 140 characters',
    };
  }

  try {
    // Call backend API
    const response = await fetch(getApiUrl('/api/tweets'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
      credentials: 'include', // Include cookies for authentication
    });

    const data = (await response.json()) as { error?: string; tweet?: unknown };

    if (!response.ok) {
      // Return error to form
      return {
        error: data.error || 'Failed to post tweet',
      };
    }

    // Success - redirect to feed (will show new tweet)
    return redirect('/feed');
  } catch (error) {
    console.error('Tweet posting error:', error);
    return {
      error: 'Network error. Please try again.',
    };
  }
}
