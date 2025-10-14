/**
 * Feed page - displays tweet composer and chronological feed
 * Feature: 002-tweet-posting-and-feed-system
 */

import { useLoaderData } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';
import { TweetComposer } from '../components/TweetComposer';
import { TweetList } from '../components/TweetList';
import type { TweetWithAuthor } from '../../src/types/tweet';

/**
 * Feed loader - fetches all tweets for display
 */
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const response = await fetch('http://localhost:3000/api/tweets', {
      credentials: 'include', // Include cookies
    });

    if (!response.ok) {
      throw new Error('Failed to fetch tweets');
    }

    const data = (await response.json()) as { tweets: TweetWithAuthor[] };

    // Convert date strings to Date objects
    const tweets = data.tweets.map((tweet) => ({
      ...tweet,
      createdAt: new Date(tweet.createdAt),
    }));

    return { tweets };
  } catch (error) {
    console.error('Feed loader error:', error);
    return { tweets: [] };
  }
}

export default function Feed() {
  const { tweets } = useLoaderData<{ tweets: TweetWithAuthor[] }>();

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

        {/* Tweet feed */}
        <TweetList tweets={tweets} />
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
