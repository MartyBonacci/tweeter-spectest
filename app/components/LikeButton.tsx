/**
 * LikeButton Component
 * Feature: Phase 0 POC - Like Functionality
 *
 * Like/unlike button with optimistic UI updates
 */

import { useFetcher } from 'react-router';
import { useState, useEffect } from 'react';

interface LikeButtonProps {
  tweetId: string;
  initialLikeCount: number;
  initialIsLiked: boolean;
}

/**
 * Like button component with heart icon
 * Supports optimistic UI updates for better UX
 * Uses fetcher to avoid page navigation and scroll jumps
 */
export function LikeButton({ tweetId, initialLikeCount, initialIsLiked }: LikeButtonProps) {
  const fetcher = useFetcher();
  const [optimisticLiked, setOptimisticLiked] = useState(initialIsLiked);
  const [optimisticCount, setOptimisticCount] = useState(initialLikeCount);

  // Reset optimistic state when props change (after server response)
  useEffect(() => {
    setOptimisticLiked(initialIsLiked);
    setOptimisticCount(initialLikeCount);
  }, [initialIsLiked, initialLikeCount]);

  const isSubmitting = fetcher.state === 'submitting';

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent tweet card click

    // Optimistic update
    if (!isSubmitting) {
      const newLiked = !optimisticLiked;
      setOptimisticLiked(newLiked);
      setOptimisticCount(optimisticLiked ? optimisticCount - 1 : optimisticCount + 1);

      // Submit using fetcher (no navigation, preserves scroll)
      const formData = new FormData();
      formData.append('tweetId', tweetId);
      formData.append('action', newLiked ? 'like' : 'unlike');

      fetcher.submit(formData, {
        method: 'post',
        action: `/tweets/${tweetId}/like`,
      });
    }
  };

  return (
    <div onClick={handleClick}>
      <button
        type="button"
        disabled={isSubmitting}
        className={`flex items-center space-x-2 px-3 py-1.5 rounded-full transition-all ${
          optimisticLiked
            ? 'text-red-600 hover:bg-red-50'
            : 'text-gray-600 hover:bg-gray-100'
        } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label={optimisticLiked ? 'Unlike tweet' : 'Like tweet'}
      >
        {/* Heart Icon */}
        <svg
          className={`w-5 h-5 ${optimisticLiked ? 'fill-current' : 'stroke-current fill-none'}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>

        {/* Like Count */}
        <span className="text-sm font-medium">
          {optimisticCount}
        </span>
      </button>
    </div>
  );
}
