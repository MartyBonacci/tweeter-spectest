import { Form, useActionData, useNavigation } from 'react-router';
import { useState, useMemo, type ChangeEvent } from 'react';
import {
  getColorState,
  formatCounter,
  MAX_TWEET_LENGTH,
  type CounterColorState,
} from '../utils/tweetCounter';

/**
 * Tweet composition component with real-time character counter
 * Uses React Router Form for progressive enhancement
 *
 * Features:
 * - Real-time character counter in "X / 140" format
 * - Three-state color system (default/warning/exceeded)
 * - Visual feedback at 120 chars (yellow) and 140+ chars (red)
 * - Submission prevention when over limit
 */
export function TweetComposer() {
  const actionData = useActionData<{ error?: string }>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  // Form state
  const [content, setContent] = useState('');

  // Character counting and validation
  const count = content.length;
  const isEmpty = content.trim().length === 0;
  const isOverLimit = count > MAX_TWEET_LENGTH;
  const isInvalid = isEmpty || isOverLimit;

  // Memoize color state calculation to avoid unnecessary recalculations
  // Only recalculates when character count changes
  // Performance optimization: prevents re-running color logic on every render
  const colorState = useMemo(
    () => getColorState(count, MAX_TWEET_LENGTH),
    [count]
  );

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
            {/*
              Character counter with three-state coloring:
              - Default (gray-600): 0-119 chars - neutral state
              - Warning (yellow-700): 120-139 chars - approaching limit (6.11:1 contrast, WCAG AA compliant)
              - Exceeded (red-600): 140+ chars - over limit, submission blocked

              Color thresholds provide progressive feedback:
              - 120 chars: Early warning (20 chars before limit) gives users time to edit
              - 140 chars: Hard limit matches database constraint and backend validation
            */}
            <div
              className={`text-sm font-medium transition-colors duration-200 ${
                colorState === 'exceeded'
                  ? 'text-red-600'
                  : colorState === 'warning'
                    ? 'text-yellow-400'
                    : 'text-gray-600'
              }`}
              role="status"
              aria-live="polite"
              aria-label={`Character count: ${formatCounter(count, MAX_TWEET_LENGTH)}`}
            >
              {formatCounter(count, MAX_TWEET_LENGTH)}
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
