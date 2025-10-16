/**
 * Profile Edit Page
 * Feature: Phase 0 POC - User Profiles
 *
 * Edit user profile (bio and avatar)
 */

import { useLoaderData, Form, useActionData, useNavigation, Link } from 'react-router';
import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { redirect } from 'react-router';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { getApiUrl } from '../utils/api';
import ImageUploadField from '../components/ImageUploadField';
import { validateImageFile } from '../utils/fileValidation';
import { createImagePreview, revokeImagePreview } from '../utils/imagePreview';

interface ProfileEditData {
  profile: {
    id: string;
    username: string;
    bio: string | null;
    avatarUrl: string | null;
  };
}

interface ActionData {
  error?: string;
  fieldErrors?: {
    bio?: string[];
    avatarUrl?: string[];
  };
}

/**
 * Profile edit validation schema
 */
const profileEditSchema = z.object({
  bio: z.string().max(160, 'Bio must be 160 characters or less').optional(),
  avatarUrl: z.string().url('Invalid URL').or(z.literal('')).optional(),
});

/**
 * Profile edit loader - fetches current profile data
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  const { username } = params;

  if (!username) {
    throw new Response('Username is required', { status: 400 });
  }

  const cookie = request.headers.get('Cookie') || '';

  try {
    // Fetch profile data
    const response = await fetch(getApiUrl(`/api/profiles/${username}`), {
      headers: {
        'Cookie': cookie,
      },
    });

    if (!response.ok) {
      throw new Response('Failed to fetch profile', { status: response.status });
    }

    const data = await response.json();

    // Verify user is editing their own profile
    try {
      const meResponse = await fetch(getApiUrl('/api/auth/me'), {
        headers: {
          'Cookie': cookie,
        },
      });

      if (meResponse.ok) {
        const meData = await meResponse.json();
        if (meData.user?.id !== data.profile.id) {
          throw new Response('You can only edit your own profile', { status: 403 });
        }
      } else {
        throw new Response('Authentication required', { status: 401 });
      }
    } catch (error) {
      throw new Response('Authentication required', { status: 401 });
    }

    return {
      profile: data.profile,
    };
  } catch (error) {
    console.error('Profile edit loader error:', error);
    throw error;
  }
}

/**
 * Profile edit action - handles profile updates
 */
export async function action({ request, params }: ActionFunctionArgs) {
  const { username } = params;

  if (!username) {
    return { error: 'Username is required' };
  }

  const formData = await request.formData();
  const contentType = request.headers.get('Content-Type') || '';
  const cookie = request.headers.get('Cookie') || '';

  // Check if this is a file upload (multipart/form-data)
  if (contentType.includes('multipart/form-data')) {
    try {
      // Submit to avatar upload endpoint
      const response = await fetch(getApiUrl('/api/profiles/avatar'), {
        method: 'POST',
        headers: {
          'Cookie': cookie,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.error || 'Failed to upload avatar' };
      }

      // Redirect on success
      return redirect(`/profile/${username}`);
    } catch (error) {
      console.error('Avatar upload error:', error);
      return { error: 'Network error. Please try again.' };
    }
  }

  // Original URL/bio update flow
  const bio = formData.get('bio') as string;
  const avatarUrl = formData.get('avatarUrl') as string;

  // Validate with Zod
  const result = profileEditSchema.safeParse({ bio, avatarUrl });

  if (!result.success) {
    return {
      error: 'Validation failed',
      fieldErrors: result.error.flatten().fieldErrors,
    };
  }

  try {
    // Update profile
    const response = await fetch(getApiUrl(`/api/profiles/${username}`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookie,
      },
      body: JSON.stringify({ bio: bio || '' }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { error: errorData.error || 'Failed to update profile' };
    }

    // Redirect to profile page on success
    return redirect(`/profile/${username}`);
  } catch (error) {
    console.error('Profile update error:', error);
    return { error: 'Network error. Please try again.' };
  }
}

export default function ProfileEdit() {
  const { profile } = useLoaderData<ProfileEditData>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  const [bioLength, setBioLength] = useState((profile.bio || '').length);

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('url');
  const [fileError, setFileError] = useState<string | null>(null);

  // Handle file selection
  const handleFileSelect = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setFileError(null);
      return;
    }

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setFileError(validation.error || 'Invalid file');
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    // Generate preview
    const preview = createImagePreview(file);
    setPreviewUrl(preview);
    setSelectedFile(file);
    setFileError(null);
    setUploadMethod('file');
  };

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        revokeImagePreview(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
          <p className="mt-2 text-sm text-gray-600">
            Update your profile information
          </p>
        </div>

        {/* Edit Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <Form method="post" encType={uploadMethod === 'file' ? 'multipart/form-data' : undefined}>
            {/* Error Message */}
            {actionData?.error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{actionData.error}</p>
              </div>
            )}

            {/* File Upload Field */}
            <div className="mb-6">
              <ImageUploadField
                currentAvatarUrl={profile.avatarUrl}
                onFileSelect={handleFileSelect}
                previewUrl={previewUrl}
                error={fileError}
              />
            </div>

            {/* OR Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">OR</span>
              </div>
            </div>

            {/* Bio Field */}
            <div className="mb-6">
              <label
                htmlFor="bio"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={4}
                maxLength={160}
                defaultValue={profile.bio || ''}
                onChange={(e) => setBioLength(e.target.value.length)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tell us about yourself..."
              />
              <div className="mt-1 flex justify-between items-center">
                <p className="text-xs text-gray-500">
                  {actionData?.fieldErrors?.bio && (
                    <span className="text-red-600">
                      {actionData.fieldErrors.bio[0]}
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  {bioLength} / 160 characters
                </p>
              </div>
            </div>

            {/* Avatar URL Field */}
            <div className="mb-6">
              <label
                htmlFor="avatarUrl"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Avatar URL
              </label>
              <input
                type="text"
                id="avatarUrl"
                name="avatarUrl"
                defaultValue={profile.avatarUrl || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/avatar.jpg"
              />
              {actionData?.fieldErrors?.avatarUrl && (
                <p className="mt-1 text-xs text-red-600">
                  {actionData.fieldErrors.avatarUrl[0]}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Enter a URL to an image you want to use as your avatar
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-4">
              <button
                type="submit"
                disabled={isSubmitting || !!fileError}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⏳</span>
                    {uploadMethod === 'file' ? 'Uploading...' : 'Saving...'}
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>

              <Link
                to={`/profile/${profile.username}`}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
            </div>

            {/* Screen reader announcement */}
            {isSubmitting && (
              <div aria-live="polite" className="sr-only">
                {uploadMethod === 'file' ? 'Uploading avatar image...' : 'Saving profile changes...'}
              </div>
            )}
          </Form>
        </div>
      </div>
    </div>
  );
}

export function meta({ data }: { data: ProfileEditData }) {
  return [
    { title: `Edit Profile - @${data.profile.username}` },
    { name: 'description', content: 'Edit your profile information' },
  ];
}
