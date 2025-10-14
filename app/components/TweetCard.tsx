import { Link } from 'react-router';
import { formatTimestamp, formatTimestampFull } from '../../src/utils/formatTimestamp';
import type { TweetWithAuthor } from '../../src/types/tweet';

/**
 * Single tweet display card
 * Shows tweet content, author, and timestamp
 */
export function TweetCard({ tweet }: { tweet: TweetWithAuthor }) {
  return (
    <article className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <Link to={`/tweets/${tweet.id}`} className="block">
        {/* Tweet header */}
        <div className="flex items-center justify-between mb-3">
          {/* Author info */}
          <Link
            to={`/profile/${tweet.author.username}`}
            className="font-semibold text-gray-900 hover:text-blue-600 hover:underline"
            onClick={(e) => e.stopPropagation()}
            aria-label={`View ${tweet.author.username}'s profile`}
          >
            @{tweet.author.username}
          </Link>

          {/* Timestamp */}
          <time
            dateTime={tweet.createdAt.toISOString()}
            title={formatTimestampFull(tweet.createdAt)}
            className="text-sm text-gray-500"
          >
            {formatTimestamp(tweet.createdAt)}
          </time>
        </div>

        {/* Tweet content */}
        <p className="text-gray-800 text-base whitespace-pre-wrap break-words">
          {tweet.content}
        </p>
      </Link>
    </article>
  );
}
