import { Form, useActionData, useNavigation } from 'react-router';
import { useState, type ChangeEvent } from 'react';

/**
 * Signup form component with real-time validation
 * Uses React Router Form for progressive enhancement
 */
export function SignupForm() {
  const actionData = useActionData<{ error?: string; field?: string }>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  // Form state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Client-side validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validate username (3-20 chars, alphanumeric + hyphen/underscore)
  const validateUsername = (value: string): string | null => {
    if (value.length < 3) return 'Username must be at least 3 characters';
    if (value.length > 20) return 'Username must be at most 20 characters';
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      return 'Username can only contain letters, numbers, hyphens, and underscores';
    }
    return null;
  };

  // Validate email
  const validateEmail = (value: string): string | null => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Invalid email address';
    }
    return null;
  };

  // Validate password
  const validatePassword = (value: string): string | null => {
    if (value.length < 8) return 'Password must be at least 8 characters';
    return null;
  };

  // Handle field changes with validation
  const handleUsernameChange = (value: string) => {
    setUsername(value);
    const error = validateUsername(value);
    setErrors((prev) => ({ ...prev, username: error || '' }));
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    const error = validateEmail(value);
    setErrors((prev) => ({ ...prev, email: error || '' }));
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    const error = validatePassword(value);
    setErrors((prev) => ({ ...prev, password: error || '' }));
  };

  // Check if form is valid
  const hasErrors =
    Object.values(errors).some((e) => e) ||
    !username ||
    !email ||
    !password;

  return (
    <div className="max-w-md w-full space-y-8">
      <div>
        <h2 className="text-center text-3xl font-bold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Join Tweeter today
        </p>
      </div>

      <Form method="post" className="mt-8 space-y-6">
        {/* Server-side error */}
        {actionData?.error && !actionData?.field && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{actionData.error}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Username field */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={username}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleUsernameChange(e.currentTarget.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="username"
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username}</p>
            )}
            {actionData?.field === 'username' && actionData?.error && (
              <p className="mt-1 text-sm text-red-600">{actionData.error}</p>
            )}
          </div>

          {/* Email field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleEmailChange(e.currentTarget.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="you@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
            {actionData?.field === 'email' && actionData?.error && (
              <p className="mt-1 text-sm text-red-600">{actionData.error}</p>
            )}
          </div>

          {/* Password field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => {
                const value = (e.target as HTMLInputElement).value;
                handlePasswordChange(value);
              }}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
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
            {isSubmitting ? 'Creating account...' : 'Sign up'}
          </button>
        </div>

        {/* Sign in link */}
        <div className="text-center text-sm">
          <span className="text-gray-600">Already have an account? </span>
          <a href="/signin" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </a>
        </div>
      </Form>
    </div>
  );
}
