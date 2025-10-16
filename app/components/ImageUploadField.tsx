/**
 * Image Upload Field Component
 *
 * Reusable functional component for file selection and preview.
 * Handles avatar image uploads with accessibility features.
 */

import type { ChangeEvent } from 'react';

interface ImageUploadFieldProps {
  currentAvatarUrl: string | null;
  onFileSelect: (file: File | null) => void;
  previewUrl: string | null;
  error: string | null;
}

export default function ImageUploadField({
  currentAvatarUrl,
  onFileSelect,
  previewUrl,
  error,
}: ImageUploadFieldProps) {
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onFileSelect(file);
  };

  const displayUrl = previewUrl || currentAvatarUrl;

  return (
    <div className="space-y-4">
      <label htmlFor="avatar-upload" className="block text-sm font-medium text-gray-700">
        Profile Image
      </label>

      {/* File Input */}
      <input
        type="file"
        id="avatar-upload"
        name="avatar"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        aria-describedby={error ? 'avatar-error' : undefined}
        className="block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-md file:border-0
          file:text-sm file:font-semibold
          file:bg-blue-50 file:text-blue-700
          hover:file:bg-blue-100
          cursor-pointer"
      />

      <p className="text-xs text-gray-500">
        Accepted formats: JPEG, PNG, GIF, WebP (max 5MB)
      </p>

      {/* Image Preview */}
      {displayUrl && (
        <div className="flex items-center space-x-4">
          <img
            src={displayUrl}
            alt="Profile preview"
            className="w-32 h-32 rounded-full object-cover border-2 border-gray-200"
          />
          {previewUrl && (
            <p className="text-sm text-gray-600">Preview of selected image</p>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p id="avatar-error" className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
