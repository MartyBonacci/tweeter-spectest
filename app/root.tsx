import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from 'react-router';
import type { LinksFunction, LoaderFunctionArgs } from 'react-router';
import stylesheetUrl from './globals.css?url';
import { Navbar } from './components/Navbar';
import { getApiUrl } from './utils/api';

/**
 * Export stylesheet links for React Router
 * This ensures styles are included in both SSR and CSR
 */
export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: stylesheetUrl },
];

/**
 * Root loader - fetches current user info for navbar
 * Runs server-side, so must forward cookies from browser → API → browser
 */
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Get cookie from incoming browser request
    const cookie = request.headers.get('Cookie');

    console.log('=== Root Loader Debug ===');
    console.log('Request URL:', request.url);
    console.log('Cookie header from browser:', cookie);

    // Forward cookie to API
    const headers: HeadersInit = {};
    if (cookie) {
      headers['Cookie'] = cookie;
    }

    const response = await fetch(getApiUrl('/api/auth/me'), {
      headers,
    });

    console.log('API /auth/me response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('Current user from API:', data.user ? data.user.username : 'null');
      return {
        currentUser: data.user || null,
      };
    } else {
      console.log('API /auth/me failed, returning null user');
    }
  } catch (error) {
    // User not authenticated
    console.log('Root loader error:', error);
  }

  return { currentUser: null };
}

/**
 * Root component for React Router v7 application
 * Wraps all routes with common layout and scripts
 */
export default function Root() {
  const { currentUser } = useLoaderData<{ currentUser: { id: string; username: string } | null }>();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-gray-50 min-h-screen">
        <Navbar currentUser={currentUser} />
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

/**
 * Error boundary for root-level errors
 */
export function ErrorBoundary() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Error - Tweeter</title>
      </head>
      <body className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Oops! Something went wrong
          </h1>
          <p className="text-gray-600">Please try refreshing the page.</p>
        </div>
      </body>
    </html>
  );
}
