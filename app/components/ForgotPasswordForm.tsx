import { Form, useActionData, useNavigation } from 'react-router';
import { useState, type ChangeEvent } from 'react';

/**
 * Forgot password form component
 * Feature: 915-password-reset-flow-with-email-token-verification
 *
 * Principle 1: Functional component with hooks
 * Principle 5: Modern React patterns (Form, hooks, controlled components)
 */

interface ForgotPasswordActionData {
  message?: string;
  error?: string;
  details?: Record<string, string[]>;
}

export function ForgotPasswordForm() {
  const actionData = useActionData<ForgotPasswordActionData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  // Form state
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Client-side validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validate email
  const validateEmail = (value: string): string | null => {
    if (!value) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Invalid email address';
    }
    return null;
  };

  // Handle email change with validation
  const handleEmailChange = (value: string) => {
    setEmail(value);
    const error = validateEmail(value);
    setErrors((prev) => ({ ...prev, email: error || '' }));
  };

  // Check if form is valid
  const hasErrors = Object.values(errors).some((e) => e) || !email;

  // Show success message after submission
  const showSuccess = actionData?.message && !actionData?.error;

  return (
    <div className="max-w-md w-full space-y-8">
      <div>
        <h2 className="text-center text-3xl font-bold text-gray-900">
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your email address and we'll send you a link to reset your password
        </p>
      </div>

      <Form method="post" className="mt-8 space-y-6">
        {/* Success message (generic to prevent enumeration) */}
        {showSuccess && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">{actionData.message}</p>
                <p className="mt-2 text-xs text-green-700">
                  Please check your email inbox (and spam folder) for the reset link
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Server-side error */}
        {actionData?.error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{actionData.error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Email field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleEmailChange(e.currentTarget.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="you@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>
        </div>

        {/* Submit button */}
        <div>
          <button
            type="submit"
            disabled={hasErrors || isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Sending reset link...' : 'Send reset link'}
          </button>
        </div>

        {/* Back to sign in link */}
        <div className="text-center text-sm">
          <a href="/signin" className="font-medium text-blue-600 hover:text-blue-500">
            ← Back to sign in
          </a>
        </div>
      </Form>
    </div>
  );
}
