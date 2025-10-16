/**
 * Feed page - displays tweet composer and chronological feed
 * Feature: 002-tweet-posting-and-feed-system
 */

import { useLoaderData } from 'react-router';
import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { TweetComposer } from '../components/TweetComposer';
import { TweetList } from '../components/TweetList';
import type { TweetWithAuthorAndLikes } from '../../src/types/tweet';

/**
 * Feed loader - fetches all tweets for display
 */
export async function loader({ request }: LoaderFunctionArgs) {
  // Extract cookies from incoming request to forward to backend
  const cookie = request.headers.get('Cookie') || '';

  try {
    const response = await fetch('/api/tweets', {
      headers: {
        'Cookie': cookie, // Forward authentication cookies to backend
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch tweets');
    }

    const data = (await response.json()) as { tweets: TweetWithAuthorAndLikes[] };

    // Convert date strings to Date objects
    const tweets = data.tweets.map((tweet) => ({
      ...tweet,
      createdAt: new Date(tweet.createdAt),
    }));

    // Feature: 910 - Get current user ID for delete button
    let currentUserId: string | null = null;
    try {
      const meResponse = await fetch('/api/auth/me', {
        headers: { 'Cookie': cookie },
      });
      if (meResponse.ok) {
        const meData = await meResponse.json();
        currentUserId = meData.user?.id || null;
      }
    } catch {
      // User not authenticated, that's fine
    }

    return { tweets, currentUserId };
  } catch (error) {
    console.error('Feed loader error:', error);
    return { tweets: [], currentUserId: null };
  }
}

/**
 * Feed action - handles tweet posting form submissions
 */
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const content = formData.get('content') as string;

  // Validate content
  if (!content || content.trim().length === 0) {
    return { error: 'Tweet content is required' };
  }

  if (content.length > 140) {
    return { error: 'Tweet must be 140 characters or less' };
  }

  // Extract cookies from incoming request to forward to backend
  // React Router actions run server-side, so we need to manually forward cookies
  const cookie = request.headers.get('Cookie') || '';
  console.log('=== Feed Action Debug ===');
  console.log('Cookies from request:', cookie);
  console.log('All request headers:', Array.from(request.headers.entries()));

  try {
    const url = '/api/tweets';
    console.log('Posting to URL:', url);
    console.log('Request body:', JSON.stringify({ content }));

    // Post tweet to backend API
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookie, // Forward authentication cookies to backend
      },
      body: JSON.stringify({ content }),
    });

    console.log('Tweet post response status:', response.status, response.ok);
    console.log('Tweet post response headers:', Array.from(response.headers.entries()));

    if (!response.ok) {
      const errorData = await response.json();
      console.log('Tweet post error data:', errorData);
      // Backend returns { error: 'message' }, not { message: 'message' }
      return { error: errorData.error || 'Failed to post tweet' };
    }

    const data = await response.json();
    console.log('Tweet post success data:', data);

    // Success - redirect will revalidate loader
    return { success: true };
  } catch (error) {
    console.error('Tweet post error:', error);
    return { error: 'Network error. Please try again.' };
  }
}

export default function Feed() {
  const { tweets, currentUserId } = useLoaderData<{
    tweets: TweetWithAuthorAndLikes[];
    currentUserId: string | null;
  }>();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Feed</h1>
          <p className="mt-2 text-sm text-gray-600">See what everyone is talking about</p>
        </div>

        {/* Tweet composer (authenticated users only) */}
        <TweetComposer />

        {/* Tweet feed - Feature: 910 - Pass currentUserId for delete button */}
        <TweetList tweets={tweets} currentUserId={currentUserId || undefined} />
      </div>
    </div>
  );
}

export function meta() {
  return [
    { title: 'Feed - Tweeter' },
    { name: 'description', content: 'Your personalized tweet feed' },
  ];
}
