/**
 * Like Actions
 * Feature: Phase 0 POC - Like Functionality
 *
 * React Router actions for like/unlike operations
 */

import type { ActionFunctionArgs } from 'react-router';
import { redirect } from 'react-router';
import { getApiUrl } from '../utils/api';

/**
 * Toggle like action - handles both like and unlike
 * Uses React Router server actions pattern
 * Runs server-side, so must forward cookies from browser to API
 */
export async function toggleLikeAction({ request, params }: ActionFunctionArgs) {
  console.log('=== toggleLikeAction called ===');
  console.log('URL:', request.url);
  console.log('Method:', request.method);

  const formData = await request.formData();
  const tweetId = formData.get('tweetId') as string;
  const action = formData.get('action') as string;

  console.log('tweetId:', tweetId);
  console.log('action:', action);

  // Validate inputs
  if (!tweetId) {
    console.log('ERROR: No tweetId provided');
    return { error: 'Tweet ID is required' };
  }

  // Get cookie from incoming browser request to forward to API
  const cookie = request.headers.get('Cookie');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (cookie) {
    headers['Cookie'] = cookie;
  }

  try {
    if (action === 'like') {
      // Create like
      console.log('Calling API: POST /api/likes with tweetId:', tweetId);
      const response = await fetch(getApiUrl('/api/likes'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ tweetId }),
      });

      console.log('API Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('API Error:', errorData);
        // Still redirect on error to avoid blank page
        const referrer = request.headers.get('Referer');
        if (referrer) {
          try {
            return redirect(new URL(referrer).pathname);
          } catch {
            return redirect('/feed');
          }
        }
        return redirect('/feed');
      }
      console.log('Like created successfully');
    } else {
      // Delete like
      console.log('Calling API: DELETE /api/likes with tweetId:', tweetId);
      const response = await fetch(getApiUrl('/api/likes'), {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ tweetId }),
      });

      console.log('API Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('API Error:', errorData);
        // Still redirect on error to avoid blank page
        const referrer = request.headers.get('Referer');
        if (referrer) {
          try {
            return redirect(new URL(referrer).pathname);
          } catch {
            return redirect('/feed');
          }
        }
        return redirect('/feed');
      }
      console.log('Like removed successfully');
    }

    // Success - return null to let fetcher revalidate without navigation
    console.log('Like action completed successfully');
    return null;
  } catch (error) {
    console.error('Like action error:', error);
    return { error: 'Network error. Please try again.' };
  }
}
