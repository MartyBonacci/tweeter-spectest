/**
 * Reset Password page - complete password reset with new password
 * Feature: 915-password-reset-flow-with-email-token-verification
 */
import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { useLoaderData, redirect } from 'react-router';
import { ResetPasswordForm } from '../components/ResetPasswordForm';
import { getApiUrl } from '../utils/api';

/**
 * Token validation result from loader
 */
interface TokenValidationData {
  valid: boolean;
  email?: string;
  error?: string;
  expired?: boolean;
  used?: boolean;
}

/**
 * Reset password loader - verify token validity
 * Calls GET /api/auth/verify-reset-token/:token
 */
export async function loader({ params }: LoaderFunctionArgs) {
  const { token } = params;

  if (!token) {
    return {
      valid: false,
      error: 'Invalid reset link',
    };
  }

  try {
    // Verify token with backend API
    const response = await fetch(getApiUrl(`/api/auth/verify-reset-token/${token}`), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    const data: TokenValidationData = await response.json();

    if (!response.ok) {
      // Token is invalid, expired, or used
      return {
        valid: false,
        error: data.error || 'Invalid or expired reset link',
        expired: data.expired,
        used: data.used,
      };
    }

    // Token is valid
    return {
      valid: true,
      email: data.email,
      token,
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return {
      valid: false,
      error: 'Network error. Please try again.',
    };
  }
}

/**
 * Reset password action - submit new password
 * Calls POST /api/auth/reset-password
 */
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const token = formData.get('token') as string;
  const password = formData.get('password') as string;

  // Validate fields
  if (!token || !password) {
    return { error: 'Token and password are required' };
  }

  try {
    // Submit password reset to backend API
    const response = await fetch(getApiUrl('/api/auth/reset-password'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ token, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 410) {
        return {
          error: data.error || 'This reset link has expired or been used',
          expired: true,
        };
      }

      if (response.status === 400 && data.details) {
        // Password validation errors
        const passwordErrors = data.details.password;
        return {
          error: passwordErrors ? passwordErrors[0] : 'Invalid password',
          details: data.details,
        };
      }

      return { error: data.error || 'Failed to reset password' };
    }

    // Success - user is now signed in, redirect to feed
    return redirect('/feed');
  } catch (error) {
    console.error('Reset password error:', error);
    return { error: 'Network error. Please try again.' };
  }
}

export default function ResetPassword() {
  const loaderData = useLoaderData<TokenValidationData & { token?: string }>();

  // Show error state if token is invalid
  if (!loaderData.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="text-center text-3xl font-bold text-gray-900">
              Invalid Reset Link
            </h2>
          </div>

          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  {loaderData.expired ? 'Reset Link Expired' : loaderData.used ? 'Reset Link Already Used' : 'Invalid Reset Link'}
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{loaderData.error}</p>
                  {loaderData.expired && (
                    <p className="mt-2">
                      Password reset links expire after 1 hour for security reasons.
                    </p>
                  )}
                  {loaderData.used && (
                    <p className="mt-2">
                      This reset link has already been used to change your password.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <a
              href="/forgot-password"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Request New Reset Link
            </a>
          </div>

          <div className="text-center text-sm">
            <a href="/signin" className="font-medium text-blue-600 hover:text-blue-500">
              ← Back to sign in
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Show reset password form if token is valid
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <ResetPasswordForm token={loaderData.token!} email={loaderData.email!} />
    </div>
  );
}

export function meta() {
  return [
    { title: 'Reset Password - Tweeter' },
    { name: 'description', content: 'Set a new password for your Tweeter account' },
  ];
}
