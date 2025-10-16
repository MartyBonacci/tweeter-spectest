/**
 * DeleteButton Component
 * Feature: 910-allow-the-logged-in-user-to-delete-their-own-tweets
 *
 * Delete button with confirmation modal and optimistic UI updates
 */

import { useState, useEffect } from 'react';
import { useFetcher } from 'react-router';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

interface DeleteButtonProps {
  tweetId: string;
  tweetContent: string;
  onDeleteSuccess?: () => void;
}

/**
 * Delete button component with trash icon
 * Opens confirmation modal, handles optimistic UI updates
 * Uses fetcher to DELETE /api/tweets/:id
 */
export function DeleteButton({ tweetId, tweetContent, onDeleteSuccess }: DeleteButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fetcher = useFetcher();

  const isDeleting = fetcher.state === 'submitting';

  // Handle success/error responses
  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data !== undefined) {
      // Check if there was an error
      if (fetcher.data && typeof fetcher.data === 'object' && 'error' in fetcher.data) {
        // Error occurred - show error message (you'd use a toast here)
        console.error('Delete failed:', fetcher.data.error);
        // TODO T019: Add toast notification for errors
      } else {
        // Success - close modal and notify parent
        setIsModalOpen(false);
        onDeleteSuccess?.();
      }
    }
  }, [fetcher.state, fetcher.data, onDeleteSuccess]);

  const handleDelete = () => {
    // Submit DELETE request
    fetcher.submit(null, {
      method: 'DELETE',
      action: `/api/tweets/${tweetId}`,
    });
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="text-red-600 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
        aria-label="Delete tweet"
        title="Delete tweet"
        type="button"
      >
        {/* Trash Icon */}
        <svg
          className="w-5 h-5"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      </button>

      <DeleteConfirmationModal
        isOpen={isModalOpen}
        tweetContent={tweetContent}
        onConfirm={handleDelete}
        onCancel={() => setIsModalOpen(false)}
        isDeleting={isDeleting}
      />
    </>
  );
}
