import { Link, useNavigate } from 'react-router';
import { formatTimestamp, formatTimestampFull } from '../../src/utils/formatTimestamp';
import type { TweetWithAuthorAndLikes } from '../../src/types/tweet';
import { LikeButton } from './LikeButton';

/**
 * Single tweet display card
 * Shows tweet content, author, timestamp, and like button
 * Uses onClick for card navigation to avoid nested anchor tags
 */
export function TweetCard({ tweet }: { tweet: TweetWithAuthorAndLikes }) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/tweets/${tweet.id}`);
  };

  const handleUsernameClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click from firing
    // Link will handle navigation
  };

  return (
    <article
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Tweet header */}
      <div className="flex items-center justify-between mb-3">
        {/* Author info */}
        <Link
          to={`/profile/${tweet.author.username}`}
          className="font-semibold text-gray-900 hover:text-blue-600 hover:underline"
          onClick={handleUsernameClick}
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
      <p className="text-gray-800 text-base whitespace-pre-wrap break-words mb-3">
        {tweet.content}
      </p>

      {/* Like button */}
      <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
        <LikeButton
          tweetId={tweet.id}
          initialLikeCount={tweet.likeCount}
          initialIsLiked={tweet.isLikedByUser}
        />
      </div>
    </article>
  );
}
