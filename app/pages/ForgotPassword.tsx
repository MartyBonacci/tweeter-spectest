/**
 * Forgot Password page - password reset request
 * Feature: 915-password-reset-flow-with-email-token-verification
 */
import type { ActionFunctionArgs } from 'react-router';
import { ForgotPasswordForm } from '../components/ForgotPasswordForm';
import { getApiUrl } from '../utils/api';

/**
 * Forgot password action - handles password reset request
 * Calls POST /api/auth/forgot-password
 */
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get('email') as string;

  // Validate email
  if (!email) {
    return { error: 'Email is required' };
  }

  try {
    // Send forgot password request to backend API
    const response = await fetch(getApiUrl('/api/auth/forgot-password'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle rate limiting
      if (response.status === 429) {
        return {
          error: 'Too many password reset requests. Please try again later.',
        };
      }

      // Handle validation errors
      if (response.status === 400 && data.details) {
        return { error: 'Invalid email address', details: data.details };
      }

      // Generic error
      return { error: data.error || 'Failed to send reset email' };
    }

    // Success - return generic message (prevents email enumeration)
    return { message: data.message };
  } catch (error) {
    console.error('Forgot password error:', error);
    return { error: 'Network error. Please try again.' };
  }
}

export default function ForgotPassword() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <ForgotPasswordForm />
    </div>
  );
}

export function meta() {
  return [
    { title: 'Forgot Password - Tweeter' },
    { name: 'description', content: 'Reset your Tweeter password' },
  ];
}
