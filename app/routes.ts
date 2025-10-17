import type { RouteConfig } from '@react-router/dev/routes';
import { index, route, layout } from '@react-router/dev/routes';

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
  route('/signout', 'pages/Signout.tsx'),
  route('/forgot-password', 'pages/ForgotPassword.tsx'),
  route('/reset-password/:token', 'pages/ResetPassword.tsx'),

  // Protected routes (require authentication)
  route('/feed', 'pages/Feed.tsx'),

  // Tweet routes
  route('/tweets/:id', 'pages/TweetDetail.tsx'),
  route('/tweets/:id/like', 'pages/LikeAction.tsx'),

  // Profile routes
  route('/profile/:username', 'pages/Profile.tsx'),
  route('/profile/:username/edit', 'pages/ProfileEdit.tsx'),
] satisfies RouteConfig;
