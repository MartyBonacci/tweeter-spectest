import { Link } from 'react-router';

/**
 * Landing page for unauthenticated users
 */
export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full text-center space-y-8">
        <div>
          <h1 className="text-6xl font-bold text-blue-600 mb-4">Tweeter</h1>
          <p className="text-2xl text-gray-700 mb-8">
            Join the conversation
          </p>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Share your thoughts, follow interesting people, and discover what's
            happening in the world right now.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/signup"
            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Sign up
          </Link>
          <Link
            to="/signin"
            className="inline-flex items-center justify-center px-8 py-3 border border-blue-600 text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export function meta() {
  return [
    { title: 'Tweeter - Join the conversation' },
    { name: 'description', content: 'Share your thoughts with the world' },
  ];
}
