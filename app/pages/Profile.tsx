/**
 * Profile Page
 * Feature: Phase 0 POC - User Profiles
 *
 * User profile view page with bio, avatar, and edit button
 */

import { useLoaderData, Link } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';

interface ProfileData {
  profile: {
    id: string;
    username: string;
    email: string;
    bio: string | null;
    avatarUrl: string | null;
    tweetCount: number;
  };
  isOwnProfile: boolean;
  currentUserId: string | null;
}

/**
 * Profile loader - fetches profile data by username
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  const { username } = params;

  if (!username) {
    throw new Response('Username is required', { status: 400 });
  }

  // Extract cookies to check if user is authenticated
  const cookie = request.headers.get('Cookie') || '';

  try {
    // Fetch profile data
    const response = await fetch(`http://localhost:3000/api/profiles/${username}`, {
      headers: {
        'Cookie': cookie,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Response('Profile not found', { status: 404 });
      }
      throw new Response('Failed to fetch profile', { status: 500 });
    }

    const data = await response.json();

    // Try to get current user info to check if this is their own profile
    let currentUserId: string | null = null;
    let isOwnProfile = false;

    try {
      const meResponse = await fetch('http://localhost:3000/api/auth/me', {
        headers: {
          'Cookie': cookie,
        },
      });

      if (meResponse.ok) {
        const meData = await meResponse.json();
        currentUserId = meData.user?.id || null;
        isOwnProfile = currentUserId === data.profile.id;
      }
    } catch {
      // User not authenticated, that's fine
    }

    return {
      profile: data.profile,
      isOwnProfile,
      currentUserId,
    };
  } catch (error) {
    console.error('Profile loader error:', error);
    throw new Response('Failed to load profile', { status: 500 });
  }
}

export default function Profile() {
  const { profile, isOwnProfile } = useLoaderData<ProfileData>();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header Background */}
          <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600"></div>

          {/* Profile Content */}
          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="relative -mt-16 mb-4">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={`${profile.username}'s avatar`}
                  className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gray-300 flex items-center justify-center">
                  <span className="text-4xl text-gray-600 font-bold">
                    {profile.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                @{profile.username}
              </h1>
              <p className="text-gray-600">{profile.email}</p>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="mb-4">
                <p className="text-gray-800 whitespace-pre-wrap">{profile.bio}</p>
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center space-x-6 mb-6">
              <div>
                <span className="text-2xl font-bold text-gray-900">
                  {profile.tweetCount}
                </span>
                <span className="text-gray-600 ml-2">Tweets</span>
              </div>
            </div>

            {/* Edit Button (only for own profile) */}
            {isOwnProfile && (
              <div>
                <Link
                  to={`/profile/${profile.username}/edit`}
                  className="inline-block px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Edit Profile
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Back to Feed Link */}
        <div className="mt-6">
          <Link
            to="/feed"
            className="text-blue-600 hover:text-blue-700 hover:underline"
          >
            ← Back to Feed
          </Link>
        </div>
      </div>
    </div>
  );
}

export function meta({ data }: { data: ProfileData }) {
  return [
    { title: `@${data.profile.username} - Tweeter` },
    { name: 'description', content: `Profile page for @${data.profile.username}` },
  ];
}
