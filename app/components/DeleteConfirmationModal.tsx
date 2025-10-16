/**
 * DeleteConfirmationModal Component
 * Feature: 910-allow-the-logged-in-user-to-delete-their-own-tweets
 *
 * Confirmation dialog for tweet deletion with tweet preview
 */

import { Modal, Button } from 'flowbite-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  tweetContent: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

export function DeleteConfirmationModal({
  isOpen,
  tweetContent,
  onConfirm,
  onCancel,
  isDeleting,
}: DeleteConfirmationModalProps) {
  return (
    <Modal show={isOpen} onClose={onCancel} size="md">
      <Modal.Header>Delete Tweet</Modal.Header>
      <Modal.Body>
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete this tweet?
          </p>
          <div className="bg-gray-100 p-4 rounded-md">
            <p className="text-gray-900 italic">"{tweetContent}"</p>
          </div>
          <p className="text-sm text-gray-600">
            This action cannot be undone.
          </p>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button
          color="failure"
          onClick={onConfirm}
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
        <Button color="gray" onClick={onCancel} disabled={isDeleting}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
