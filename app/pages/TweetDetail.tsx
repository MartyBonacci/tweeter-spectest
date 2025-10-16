/**
 * Tweet Detail page - displays single tweet with full context
 * Feature: 002-tweet-posting-and-feed-system
 */

import { useLoaderData } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';
import { TweetCard } from '../components/TweetCard';
import type { TweetWithAuthorAndLikes } from '../../src/types/tweet';

/**
 * Tweet detail loader - fetches single tweet by ID
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  const { id } = params;

  if (!id) {
    throw new Response('Tweet ID required', { status: 400 });
  }

  // Extract cookies to get like status
  const cookie = request.headers.get('Cookie') || '';

  try {
    const response = await fetch(`/api/tweets/${id}`, {
      headers: {
        'Cookie': cookie,
      },
    });

    if (response.status === 404) {
      throw new Response('Tweet not found', { status: 404 });
    }

    if (!response.ok) {
      throw new Error('Failed to fetch tweet');
    }

    const data = (await response.json()) as { tweet: TweetWithAuthorAndLikes };

    // Convert date string to Date object
    const tweet = {
      ...data.tweet,
      createdAt: new Date(data.tweet.createdAt),
    };

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

    return { tweet, currentUserId };
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    console.error('Tweet detail loader error:', error);
    throw new Response('Failed to load tweet', { status: 500 });
  }
}

export default function TweetDetail() {
  const { tweet, currentUserId } = useLoaderData<{
    tweet: TweetWithAuthorAndLikes;
    currentUserId: string | null;
  }>();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Back to feed link */}
        <div className="mb-6">
          <a
            href="/feed"
            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            ← Back to Feed
          </a>
        </div>

        {/* Tweet detail - Feature: 910 - Pass currentUserId for delete button */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Tweet</h1>
          <TweetCard tweet={tweet} currentUserId={currentUserId || undefined} />
        </div>

        {/* Future: Reply thread, like count, etc. */}
      </div>
    </div>
  );
}

export function meta({ data }: { data?: { tweet?: TweetWithAuthorAndLikes } }) {
  const tweetContent = data?.tweet?.content || 'Tweet';
  const truncated = tweetContent.length > 60 ? tweetContent.substring(0, 60) + '...' : tweetContent;

  return [
    { title: `${truncated} - Tweeter` },
    { name: 'description', content: tweetContent },
  ];
}
