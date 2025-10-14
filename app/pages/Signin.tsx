/**
 * Signin page - placeholder
 * Will be implemented in Phase 4 (US2 - Signin)
 */
export default function Signin() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Signin feature coming in Phase 4
          </p>
        </div>
      </div>
    </div>
  );
}

export function meta() {
  return [
    { title: 'Sign In - Tweeter' },
    { name: 'description', content: 'Sign in to your Tweeter account' },
  ];
}
