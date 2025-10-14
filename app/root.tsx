import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';
import type { LinksFunction } from 'react-router';

/**
 * Root component for React Router v7 application
 * Wraps all routes with common layout and scripts
 */
export default function Root() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-gray-50 min-h-screen">
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
