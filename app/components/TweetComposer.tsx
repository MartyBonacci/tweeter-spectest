import { Form, useActionData, useNavigation } from 'react-router';
import { useState, type ChangeEvent } from 'react';

/**
 * Tweet composition component with real-time character counter
 * Uses React Router Form for progressive enhancement
 */
export function TweetComposer() {
  const actionData = useActionData<{ error?: string }>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  // Form state
  const [content, setContent] = useState('');

  // Calculate remaining characters
  const remainingChars = 140 - content.length;
  const isOverLimit = remainingChars < 0;
  const isEmpty = content.trim().length === 0;
  const isInvalid = isEmpty || isOverLimit;

  // Handle content change
  const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.currentTarget.value);
  };

  // Clear form after successful submission
  if (navigation.state === 'loading' && !actionData?.error && content) {
    setContent('');
  }

  return (
    <div className="max-w-2xl w-full mb-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">What's happening?</h2>

        <Form method="post" className="space-y-4">
          {/* Server-side error */}
          {actionData?.error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{actionData.error}</p>
            </div>
          )}

          {/* Tweet textarea */}
          <div>
            <textarea
              id="content"
              name="content"
              value={content}
              onChange={handleContentChange}
              placeholder="Share your thoughts..."
              rows={4}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              aria-label="Compose tweet"
            />
          </div>

          {/* Character counter and submit button */}
          <div className="flex items-center justify-between">
            {/* Character counter */}
            <div
              className={`text-sm font-medium ${
                isOverLimit ? 'text-red-600' : 'text-gray-600'
              }`}
              role="status"
              aria-live="polite"
            >
              {remainingChars} characters remaining
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isInvalid || isSubmitting}
              className="px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Posting...' : 'Post Tweet'}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}
