/**
 * Signout Action Page
 * Feature: Phase 0 POC - Navigation
 *
 * Handles sign out action and redirects to signin
 */

import type { ActionFunctionArgs } from 'react-router';
import { redirect } from 'react-router';

/**
 * Signout action - calls backend to destroy session
 */
export async function action({ request }: ActionFunctionArgs) {
  const cookie = request.headers.get('Cookie') || '';

  try {
    const response = await fetch('/api/auth/signout', {
      method: 'POST',
      headers: {
        'Cookie': cookie,
      },
    });

    // Forward the Set-Cookie header to clear the auth cookie
    const setCookie = response.headers.get('set-cookie');

    // Create redirect response with Set-Cookie header
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/signin',
        ...(setCookie ? { 'Set-Cookie': setCookie } : {}),
      },
    });
  } catch (error) {
    console.error('Signout error:', error);
    // Still redirect even on error
    return redirect('/signin');
  }
}

// This page doesn't render, it's action-only
export default function Signout() {
  return null;
}
