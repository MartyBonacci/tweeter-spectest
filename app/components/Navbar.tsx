/**
 * Navbar Component
 * Feature: Phase 0 POC - Navigation
 *
 * Site-wide navigation bar with user info and links
 */

import { Link, Form, useLocation } from 'react-router';

interface NavbarProps {
  currentUser?: {
    id: string;
    username: string;
  } | null;
}

/**
 * Navigation bar component
 * Shows logo, navigation links, current user, and sign out button
 */
export function Navbar({ currentUser }: NavbarProps) {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex-shrink-0">
            <Link to="/feed" className="text-2xl font-bold text-blue-600 hover:text-blue-700">
              Tweeter
            </Link>
          </div>

          {/* Navigation Links */}
          {currentUser && (
            <div className="flex items-center space-x-8">
              {/* Home Link */}
              <Link
                to="/feed"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/feed')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                Home
              </Link>

              {/* Profile Link */}
              <Link
                to={`/profile/${currentUser.username}`}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname.startsWith(`/profile/${currentUser.username}`)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                Profile
              </Link>

              {/* Current User Display */}
              <div className="text-sm text-gray-600 border-l border-gray-300 pl-4">
                <span className="font-medium">@{currentUser.username}</span>
              </div>

              {/* Sign Out Button */}
              <Form method="post" action="/signout">
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                >
                  Sign Out
                </button>
              </Form>
            </div>
          )}

          {/* Guest Links */}
          {!currentUser && (
            <div className="flex items-center space-x-4">
              <Link
                to="/signin"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
