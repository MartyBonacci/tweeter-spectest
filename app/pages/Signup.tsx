import { redirect } from 'react-router';
import type { ActionFunctionArgs } from 'react-router';
import { SignupForm } from '../components/SignupForm';

/**
 * Signup page component
 * Displays signup form for new users
 */
export default function Signup() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <SignupForm />
    </div>
  );
}

/**
 * Signup action
 * Handles form submission and creates new user account
 */
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const username = formData.get('username');
  const email = formData.get('email');
  const password = formData.get('password');

  // Validate form data exists
  if (!username || !email || !password) {
    return {
      error: 'All fields are required',
    };
  }

  try {
    // Call backend API
    const response = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // CRITICAL: Allow cookies to be set cross-origin
      body: JSON.stringify({
        username: username.toString(),
        email: email.toString(),
        password: password.toString(),
      }),
    });

    const data = await response.json() as { error?: string; field?: string; user?: unknown };

    if (!response.ok) {
      // Return error to form
      return {
        error: data.error || 'Signup failed',
        field: data.field,
      };
    }

    // SUCCESS: Forward the Set-Cookie header from API to browser
    // React Router actions run server-side, so we need to forward cookies manually
    const setCookie = response.headers.get('set-cookie');

    // Create a redirect response with Set-Cookie header
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/feed',
        ...(setCookie ? { 'Set-Cookie': setCookie } : {}),
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return {
      error: 'Network error. Please try again.',
    };
  }
}

/**
 * Page metadata
 */
export function meta() {
  return [
    { title: 'Sign Up - Tweeter' },
    { name: 'description', content: 'Create a new Tweeter account' },
  ];
}
