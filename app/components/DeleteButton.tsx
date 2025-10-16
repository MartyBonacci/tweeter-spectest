/**
 * DeleteButton Component
 * Feature: 910-allow-the-logged-in-user-to-delete-their-own-tweets
 *
 * Delete button with confirmation modal and optimistic UI updates
 */

import { useState } from 'react';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

interface DeleteButtonProps {
  tweetId: string;
  tweetContent: string;
  onDeleteSuccess?: () => void;
}

/**
 * Delete button component with trash icon
 * Opens confirmation modal, handles optimistic UI updates
 * Uses native fetch to DELETE /api/tweets/:id
 * Bug 911: Fixed to use native fetch instead of useFetcher for direct API calls
 */
export function DeleteButton({ tweetId, tweetContent, onDeleteSuccess }: DeleteButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/tweets/${tweetId}`, {
        method: 'DELETE',
        credentials: 'include', // Include cookies for JWT auth
      });

      if (response.ok) {
        // Success (204 No Content)
        setIsModalOpen(false);
        setIsDeleting(false);
        onDeleteSuccess?.();
      } else {
        // Error response
        const errorData = await response.json().catch(() => ({
          error: 'Failed to delete tweet'
        }));
        console.error('Delete failed:', errorData.error);
        setIsDeleting(false);
        // TODO T019: Add toast notification for errors
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      setIsDeleting(false);
      // TODO T019: Add toast notification for errors
      alert('Network error. Please try again.');
    }
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
