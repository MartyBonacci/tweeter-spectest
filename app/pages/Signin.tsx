/**
 * Signin page - user authentication
 * Feature: 001-user-authentication-system
 */
import { redirect } from 'react-router';
import type { ActionFunctionArgs } from 'react-router';
import { SigninForm } from '../components/SigninForm';

/**
 * Signin action - handles signin form submissions
 */
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // Validate fields
  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  try {
    // Send signin request to backend API
    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // CRITICAL: Allow cookies to be set
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Return generic error to prevent user enumeration
      return { error: data.error || 'Invalid credentials' };
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
    console.error('Signin error:', error);
    return { error: 'Network error. Please try again.' };
  }
}

export default function Signin() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <SigninForm />
    </div>
  );
}

export function meta() {
  return [
    { title: 'Sign In - Tweeter' },
    { name: 'description', content: 'Sign in to your Tweeter account' },
  ];
}
