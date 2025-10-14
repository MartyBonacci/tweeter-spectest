import type { RouteConfig } from '@react-router/dev/routes';
import { index, route } from '@react-router/dev/routes';

/**
 * Programmatic routing configuration for React Router v7
 * All routes defined here (NOT file-based)
 */
export default [
  // Root route - will be implemented with actual pages
  index('pages/Landing.tsx'),

  // Authentication routes
  route('/signup', 'pages/Signup.tsx'),
  route('/signin', 'pages/Signin.tsx'),

  // Protected routes (require authentication)
  route('/feed', 'pages/Feed.tsx'),

  // Tweet routes
  route('/tweets/:id', 'pages/TweetDetail.tsx'),
] satisfies RouteConfig;
