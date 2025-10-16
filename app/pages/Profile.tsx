/**
 * Profile Page
 * Feature: Phase 0 POC - User Profiles
 * Feature: 909-user-profile-tweets-feed - Extended to show user tweets
 *
 * User profile view page with bio, avatar, edit button, and tweets feed
 */

import { useLoaderData, Link, useNavigation } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';
import type { TweetWithAuthorAndLikes } from '../../src/types/tweet';
import { fetchTweetsByUsername } from '../api/tweets';
import { TweetCard } from '../components/TweetCard';

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
  tweets: TweetWithAuthorAndLikes[]; // NEW: User's tweets
}

/**
 * Profile loader - fetches profile data and tweets by username
 * Feature: 909-user-profile-tweets-feed - Extended to fetch user tweets
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

    // NEW: Fetch user's tweets
    // Note: fetchTweetsByUsername uses fetch internally, which doesn't automatically
    // forward cookies from the loader request. We rely on the API being public.
    const tweets = await fetchTweetsByUsername(username);

    return {
      profile: data.profile,
      isOwnProfile,
      currentUserId,
      tweets, // NEW: Include tweets in loader data
    };
  } catch (error) {
    // Don't catch Response objects - they should be thrown to React Router
    if (error instanceof Response) {
      throw error;
    }
    console.error('Profile loader error:', error);
    throw new Response('Failed to load profile', { status: 500 });
  }
}

export default function Profile() {
  const { profile, isOwnProfile, currentUserId, tweets } = useLoaderData<ProfileData>();
  const navigation = useNavigation();

  // Check if we're navigating (loading state)
  const isLoading = navigation.state === 'loading';

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

        {/* Tweets Section - Feature: 909-user-profile-tweets-feed */}
        <section className="mt-8" aria-labelledby="user-tweets-heading">
          <h2 id="user-tweets-heading" className="text-2xl font-bold text-gray-900 mb-4">
            Tweets
          </h2>

          {isLoading ? (
            // Loading state
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : tweets.length === 0 ? (
            // Empty state - Enhanced for Feature 909
            <div
              className="bg-white rounded-lg shadow-md p-12 text-center"
              role="status"
              aria-live="polite"
            >
              {/* Icon */}
              <div className="mb-4 flex justify-center">
                <svg
                  className="w-16 h-16 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>

              {/* Message */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No tweets yet
              </h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                {isOwnProfile
                  ? "You haven't posted any tweets yet. Share your first thought with the world!"
                  : `@${profile.username} hasn't posted any tweets yet.`}
              </p>
            </div>
          ) : (
            // Tweets list - Feature: 910 - Pass currentUserId for delete button
            <div className="space-y-4">
              {tweets.map((tweet) => (
                <TweetCard key={tweet.id} tweet={tweet} currentUserId={currentUserId || undefined} />
              ))}
            </div>
          )}
        </section>

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
