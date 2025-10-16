import { TweetCard } from './TweetCard';
import type { TweetWithAuthorAndLikes } from '../../src/types/tweet';

/**
 * List of tweets with empty state
 * Displays tweets in chronological order
 * Feature: 910 - Passes currentUserId to TweetCard for delete button
 */
export function TweetList({
  tweets,
  currentUserId
}: {
  tweets: TweetWithAuthorAndLikes[];
  currentUserId?: string;
}) {
  // Empty state
  if (tweets.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <p className="text-gray-500 text-lg">No tweets yet.</p>
        <p className="text-gray-400 text-sm mt-2">Be the first to post!</p>
      </div>
    );
  }

  // List of tweets
  return (
    <div className="space-y-4">
      {tweets.map((tweet) => (
        <TweetCard key={tweet.id} tweet={tweet} currentUserId={currentUserId} />
      ))}
    </div>
  );
}
